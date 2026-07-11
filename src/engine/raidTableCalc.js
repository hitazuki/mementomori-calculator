import {
  RAID_STATUS_CLASSES,
  RAID_TABLE_CHARACTERS,
  createDefaultRaidTableConfig,
} from '../constants/raidTableCharacters.js'

const MODIFIER_CHANNELS = ['attackRate', 'damageRate', 'criticalDamageBonus', 'speedRate']

function validateOrder(name, values, lineup) {
  if (!Array.isArray(values) || values.length !== lineup.length) throw new Error(`${name} must contain every lineup character exactly once`)
  const unique = new Set(values)
  if (unique.size !== lineup.length || lineup.some(id => !unique.has(id))) throw new Error(`${name} must contain every lineup character exactly once`)
}

function normalizeConfig(config = {}) {
  const defaults = createDefaultRaidTableConfig()
  const lineup = [...(config.lineup ?? defaults.lineup)]
  if (lineup.length < 1 || lineup.length > 5 || new Set(lineup).size !== lineup.length) {
    throw new Error('lineup must contain one to five unique supported characters')
  }
  for (const id of lineup) if (!RAID_TABLE_CHARACTERS[id]) throw new Error(`Unsupported raid table character: ${id}`)
  const attackPriority = [...(config.attackPriority ?? defaults.attackPriority.filter(id => lineup.includes(id)))]
  validateOrder('attackPriority', attackPriority, lineup)
  const speeds = Object.fromEntries(lineup.map(id => {
    const value = config.speeds?.[id] ?? defaults.speeds[id] ?? RAID_TABLE_CHARACTERS[id].speed
    if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid speed for raid table character: ${id}`)
    return [id, value]
  }))
  const turns = config.turns ?? defaults.turns
  if (!Number.isInteger(turns) || turns < 1) throw new Error('turns must be a positive integer')
  const baseCriticalDamageBonus = config.baseCriticalDamageBonus ?? defaults.baseCriticalDamageBonus
  if (!Number.isFinite(baseCriticalDamageBonus) || baseCriticalDamageBonus < 0) throw new Error('baseCriticalDamageBonus must be non-negative')
  return {
    lineup,
    attackPriority,
    speeds,
    turns,
    guaranteedCritical: config.guaranteedCritical ?? defaults.guaranteedCritical,
    baseCriticalDamageBonus,
    probabilityOverrides: { ...defaults.probabilityOverrides, ...(config.probabilityOverrides ?? {}) },
  }
}

function selectAction(actor) {
  if (actor.cooldowns.s1 === 0) return actor.definition.skills.s1
  if (actor.cooldowns.s2 === 0) return actor.definition.skills.s2
  return actor.definition.normal
}

function statusKey(status) {
  return `${status.effectGroupId}:${status.sourceId}:${status.appliedSequence}`
}

function removableBuffCount(actor) {
  return actor.statuses.filter(status => status.statusClass === RAID_STATUS_CLASSES.REMOVABLE_BUFF).length
}

function removableBuffCounts(actors, lineup) {
  return Object.fromEntries(lineup.map(id => [id, removableBuffCount(actors.get(id))]))
}

function cloneStatus(status) {
  return {
    ...status,
    modifiers: status.modifiers.map(modifier => ({ ...modifier })),
    symbolicModifiers: status.symbolicModifiers.map(modifier => ({ ...modifier })),
  }
}

function snapshotStatuses(actors, lineup) {
  return Object.fromEntries(lineup.map(id => [id, {
    removableBuffCount: removableBuffCount(actors.get(id)),
    statuses: actors.get(id).statuses.map(cloneStatus),
  }]))
}

function snapshotBoss(boss) {
  return boss.statuses.map(status => ({ ...status }))
}

function modifierSnapshot(actor) {
  const sources = actor.definition.permanentModifiers.map(modifier => ({
    ...modifier, sourceId: actor.id, permanent: true, remainingActions: null,
    statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  }))
  const symbolicSources = []
  for (const status of actor.statuses) {
    for (const modifier of status.modifiers) {
      sources.push({
        ...modifier, id: modifier.id ?? status.id, nameKey: modifier.nameKey ?? status.nameKey,
        sourceId: status.sourceId, effectGroupId: status.effectGroupId, statusClass: status.statusClass,
        permanent: status.remainingActions == null, remainingActions: status.remainingActions, appliedSequence: status.appliedSequence,
      })
    }
    for (const modifier of status.symbolicModifiers) {
      const key = modifier.kind === 'sourceAttackOverTargetAttack'
        ? `ATK_${modifier.sourceId}/ATK_${actor.id}`
        : `DEF0_${actor.id}/ATK_${actor.id}`
      symbolicSources.push({
        ...modifier, key, targetId: actor.id, sourceId: modifier.sourceId ?? status.sourceId,
        nameKey: status.nameKey, effectGroupId: status.effectGroupId, remainingActions: status.remainingActions,
      })
    }
  }
  if (actor.runtime.justiceStacks > 0) {
    sources.push({
      id: 'artoria-justice', nameKey: 'raidBuffArtoriaJustice', channel: 'attackRate',
      rate: actor.runtime.justiceStacks * 0.1, stacks: actor.runtime.justiceStacks,
      sourceId: actor.id, permanent: true, remainingActions: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    })
  }
  const totals = Object.fromEntries(MODIFIER_CHANNELS.map(channel => [channel, 0]))
  for (const source of sources) if (source.channel in totals) totals[source.channel] += source.rate
  return { sources, symbolicSources, totals }
}

function effectiveSpeed(actor, config) {
  const snapshot = modifierSnapshot(actor)
  const baseSpeed = config.speeds[actor.id]
  return {
    actorId: actor.id,
    baseSpeed,
    speedRate: snapshot.totals.speedRate,
    effectiveSpeed: baseSpeed * (1 + snapshot.totals.speedRate),
    sources: snapshot.sources.filter(source => source.channel === 'speedRate'),
  }
}

function roundOrder(actors, config) {
  const speedSnapshot = Object.fromEntries(config.lineup.map(id => [id, effectiveSpeed(actors.get(id), config)]))
  const actionOrder = [...config.lineup].sort((a, b) => (
    speedSnapshot[b].effectiveSpeed - speedSnapshot[a].effectiveSpeed || config.lineup.indexOf(a) - config.lineup.indexOf(b)
  ))
  return { actionOrder, speedSnapshot }
}

function resolveTargets(effect, sourceId, config, actors) {
  let ids = []
  if (effect.target === 'self') ids = [sourceId]
  else if (effect.target === 'adjacent') {
    const index = config.lineup.indexOf(sourceId)
    ids = [config.lineup[index - 1], config.lineup[index + 1]].filter(Boolean)
  } else if (effect.target === 'topAttack') ids = [...config.attackPriority]
  else if (effect.target === 'lowestSpeedOther') {
    const candidates = config.lineup.filter(id => id !== sourceId)
    if (candidates.length) {
      const minimum = Math.min(...candidates.map(id => config.speeds[id]))
      ids = candidates.filter(id => config.speeds[id] === minimum)
    }
  } else if (effect.target === 'highestBuffCount' || effect.target === 'highestBuffCountOther') {
    const candidates = effect.target === 'highestBuffCountOther' ? config.lineup.filter(id => id !== sourceId) : [...config.lineup]
    if (candidates.length) {
      const counts = removableBuffCounts(actors, config.lineup)
      const maximum = Math.max(...candidates.map(id => counts[id]))
      ids = candidates.filter(id => counts[id] === maximum)
    }
  }
  if (effect.targetElement != null) ids = ids.filter(id => actors.get(id).definition.element === effect.targetElement)
  return ids.slice(0, effect.targetCount ?? ids.length)
}

function conditionMatches(condition, actors, lineup) {
  if (!condition) return true
  if (condition.type === 'anyRemovableBuffCountAtLeast') return lineup.some(id => removableBuffCount(actors.get(id)) >= condition.count)
  return false
}

function applyStatus(target, effect, sourceId, sequence) {
  const index = target.statuses.findIndex(status => status.effectGroupId === effect.effectGroupId && status.sourceId === sourceId)
  const status = {
    id: effect.id, effectGroupId: effect.effectGroupId, sourceId, nameKey: effect.nameKey,
    statusClass: effect.statusClass, countsTowardBuffCount: effect.statusClass === RAID_STATUS_CLASSES.REMOVABLE_BUFF,
    duration: effect.duration, remainingActions: effect.duration,
    modifiers: (effect.modifiers ?? []).map(modifier => ({ ...modifier })),
    symbolicModifiers: (effect.symbolicModifiers ?? []).map(modifier => ({ ...modifier })), appliedSequence: sequence,
  }
  if (index >= 0) target.statuses.splice(index, 1, status)
  else target.statuses.push(status)
  return status
}

function applyBossStatus(boss, effect, round) {
  const before = snapshotBoss(boss)
  const index = boss.statuses.findIndex(status => status.id === effect.id)
  const existing = index >= 0 ? boss.statuses[index] : null
  const status = {
    id: effect.id, effectGroupId: effect.effectGroupId, nameKey: effect.nameKey, statusClass: effect.statusClass,
    stacks: Math.min(effect.maxStacks ?? 1, (existing?.stacks ?? 0) + (effect.addStacks ?? 1)),
    maxStacks: effect.maxStacks ?? 1, damageRatePerStack: effect.damageRatePerStack ?? 0,
    durationRounds: effect.durationRounds, remainingRounds: effect.durationRounds,
    appliedRound: round,
  }
  if (index >= 0) boss.statuses.splice(index, 1, status)
  else boss.statuses.push(status)
  return { before, after: snapshotBoss(boss), status }
}

function applyCooldownReduction(actor, amount) {
  for (const key of ['s1', 's2']) actor.cooldowns[key] = Math.max(0, actor.cooldowns[key] - amount)
}

function applyEffect(effect, sourceId, phase, context) {
  const { config, actors, boss, sequence, round, effectsApplied } = context
  if (effect.type === 'bossStatus') {
    if (effect.probabilityKey && config.probabilityOverrides[effect.probabilityKey] === false) {
      effectsApplied.push({ type: 'bossStatus', id: effect.id, nameKey: effect.nameKey, phase, sourceId, skipped: true })
      return
    }
    const applied = applyBossStatus(boss, effect, round)
    effectsApplied.push({
      type: 'bossStatus', id: effect.id, effectGroupId: effect.effectGroupId, nameKey: effect.nameKey, phase, sourceId,
      statusClass: effect.statusClass, addStacks: effect.addStacks, durationRounds: effect.durationRounds,
      before: applied.before, after: applied.after, stacks: applied.status.stacks,
    })
    return
  }
  const targets = resolveTargets(effect, sourceId, config, actors)
  const selectionCounts = effect.target?.includes('BuffCount') ? removableBuffCounts(actors, config.lineup) : null
  for (const targetId of targets) {
    if (effect.type === 'cooldownReduction') {
      const target = actors.get(targetId)
      const before = { ...target.cooldowns }
      applyCooldownReduction(target, effect.amount)
      effectsApplied.push({ type: effect.type, phase, sourceId, targetId, amount: effect.amount, cooldownsBefore: before, cooldownsAfter: { ...target.cooldowns } })
    } else if (effect.type === 'status') {
      const status = applyStatus(actors.get(targetId), effect, sourceId, sequence)
      effectsApplied.push({
        type: effect.type, phase, sourceId, targetId, id: effect.id, effectGroupId: effect.effectGroupId,
        nameKey: effect.nameKey, statusClass: effect.statusClass, countsTowardBuffCount: status.countsTowardBuffCount,
        duration: effect.duration, modifiers: status.modifiers.map(modifier => ({ ...modifier })),
        symbolicModifiers: status.symbolicModifiers.map(modifier => ({ ...modifier })), selectionCounts,
      })
    }
  }
}

function applyEffects(effects, sourceId, phase, context) {
  for (const effect of effects ?? []) if ((effect.phase ?? 'afterDamage') === phase) applyEffect(effect, sourceId, phase, context)
}

function passiveIsScheduled(passive, actor) {
  if (!passive.every) return true
  const offset = passive.offset ?? passive.every
  return actor.actionCount >= offset && (actor.actionCount - offset) % passive.every === 0
}

function applyPassives(actor, trigger, context) {
  for (const passive of actor.definition.passives ?? []) {
    if (passive.trigger !== trigger || !passiveIsScheduled(passive, actor)) continue
    if (!conditionMatches(passive.condition, context.actors, context.config.lineup)) continue
    for (const effect of passive.effects ?? []) applyEffect(effect, actor.id, trigger, context)
  }
}

function emitBattleEvent(event, sourceId, context) {
  const { actors, config, effectsApplied } = context
  for (const id of config.lineup) {
    const listener = actors.get(id)
    for (const passive of listener.definition.eventPassives ?? []) {
      if (passive.event !== event) continue
      if (passive.type === 'stackSelfAttack') {
        const before = listener.runtime.justiceStacks
        listener.runtime.justiceStacks = Math.min(passive.maxStacks, before + 1)
        effectsApplied.push({
          type: 'counter', phase: 'beforeDamage', id: passive.id, nameKey: passive.nameKey,
          sourceId, targetId: id, before, after: listener.runtime.justiceStacks,
        })
      }
    }
  }
}

function consumeStatuses(actor, activeKeys) {
  const expired = []
  for (const status of actor.statuses) {
    if (status.remainingActions != null && activeKeys.has(statusKey(status))) status.remainingActions -= 1
    if (status.remainingActions != null && status.remainingActions <= 0) expired.push(cloneStatus(status))
  }
  actor.statuses = actor.statuses.filter(status => status.remainingActions == null || status.remainingActions > 0)
  return expired
}

function expireBossStatuses(boss) {
  const expired = []
  for (const status of boss.statuses) {
    if (status.remainingRounds != null) status.remainingRounds -= 1
    if (status.remainingRounds != null && status.remainingRounds <= 0) expired.push({ ...status })
  }
  boss.statuses = boss.statuses.filter(status => status.remainingRounds == null || status.remainingRounds > 0)
  return expired
}

function bossDamageRate(boss) {
  return boss.statuses.reduce((total, status) => total + status.stacks * status.damageRatePerStack, 0)
}

function resolveStep(step, actor) {
  const usesBefore = step.hitsByUse ? actor.history.skillUses[step.hitsByUse.skillKey] ?? 0 : 0
  let hits = step.hitsByUse
    ? Math.min(step.hitsByUse.max, step.hitsByUse.base + usesBefore * (step.hitsByUse.increment ?? 1))
    : (step.hits ?? 1)
  if (step.criticalExtraHits && actor.context.config.guaranteedCritical) hits = step.criticalExtraHits.maxHits
  let percent = step.percent
  if (step.dynamicPercent?.type === 'artoriaJustice') {
    percent = Math.min(step.dynamicPercent.max, step.dynamicPercent.base + actor.runtime.justiceStacks * step.dynamicPercent.perStack)
  }
  return { ...step, percent, hits }
}

function mergeScaling(target, terms) {
  for (const term of terms) {
    if (!target[term.key]) target[term.key] = { ...term, coefficient: 0 }
    target[term.key].coefficient += term.coefficient
  }
}

function addSymbolicTotals(target, totals) {
  for (const [stat, value] of Object.entries(totals)) target[stat] = (target[stat] ?? 0) + value
}

function executeDamageSteps(actor, action, context) {
  const damageSteps = []
  const actionScaling = {}
  const symbolicTotals = {}
  let baseAtkPercent = 0
  let effectiveAtkPercent = 0
  let hitSequence = 0

  for (const rawStep of action.damageSteps ?? []) {
    const step = resolveStep(rawStep, actor)
    for (let hit = 1; hit <= step.hits; hit += 1) {
      hitSequence += 1
      const modifiers = modifierSnapshot(actor)
      const bossBefore = snapshotBoss(context.boss)
      const incomingRate = bossDamageRate(context.boss)
      const damageRate = modifiers.totals.damageRate + incomingRate
      const critical = context.config.guaranteedCritical
      const criticalMultiplier = critical
        ? 1 + context.config.baseCriticalDamageBonus + modifiers.totals.criticalDamageBonus
        : 1
      const attackScale = step.stat === 'ATK' ? 1 + modifiers.totals.attackRate : 1
      const effectivePercent = step.percent * attackScale * (1 + damageRate) * criticalMultiplier
      const scalingTerms = step.stat === 'ATK'
        ? modifiers.symbolicSources.map(source => ({
          ...source,
          coefficient: step.percent * source.coefficient * (1 + damageRate) * criticalMultiplier,
        }))
        : []

      if (step.stat === 'ATK') {
        baseAtkPercent += step.percent
        effectiveAtkPercent += effectivePercent
        mergeScaling(actionScaling, scalingTerms)
      } else {
        symbolicTotals[step.stat] = (symbolicTotals[step.stat] ?? 0) + effectivePercent
      }

      let bossAfter = bossBefore
      if (critical && actor.definition.afterCriticalHitBossStatus) {
        const applied = applyBossStatus(context.boss, actor.definition.afterCriticalHitBossStatus, context.round)
        bossAfter = applied.after
        context.effectsApplied.push({
          type: 'bossStatus', phase: 'afterHit', sourceId: actor.id,
          id: actor.definition.afterCriticalHitBossStatus.id,
          effectGroupId: actor.definition.afterCriticalHitBossStatus.effectGroupId,
          nameKey: actor.definition.afterCriticalHitBossStatus.nameKey,
          before: applied.before, after: applied.after, stacks: applied.status.stacks,
        })
      }

      damageSteps.push({
        index: hitSequence, stat: step.stat, damageType: step.damageType, percent: step.percent,
        hit, hits: step.hits, originalTargetCount: step.originalTargetCount, conditionKey: step.conditionKey,
        critical, criticalMultiplier, attackRate: modifiers.totals.attackRate,
        actorDamageRate: modifiers.totals.damageRate, bossDamageRate: incomingRate, damageRate,
        effectivePercent, scalingTerms, modifierSources: modifiers.sources,
        bossStatusBefore: bossBefore, bossStatusAfter: bossAfter,
      })
    }
  }
  return { damageSteps, baseAtkPercent, effectiveAtkPercent, symbolicTotals, scalingTotals: actionScaling }
}

function applyAfterDamageRules(actor, action, context) {
  for (const rule of action.afterDamageRules ?? []) {
    if (rule.type !== 'resetCooldownsIfBossStacks' || actor.runtime.onceFlags[rule.onceKey]) continue
    const status = context.boss.statuses.find(item => item.id === rule.bossStatusId)
    if ((status?.stacks ?? 0) < rule.requiredStacks) continue
    const before = { ...actor.cooldowns }
    actor.cooldowns.s1 = 0
    actor.cooldowns.s2 = 0
    actor.runtime.onceFlags[rule.onceKey] = true
    context.effectsApplied.push({ type: 'cooldownReset', phase: 'afterDamage', sourceId: actor.id, cooldownsBefore: before, cooldownsAfter: { ...actor.cooldowns }, onceKey: rule.onceKey })
  }
}

export function simulateRaidTable(config = {}) {
  const normalized = normalizeConfig(config)
  const actors = new Map(normalized.lineup.map(id => [id, {
    id, definition: RAID_TABLE_CHARACTERS[id], cooldowns: { s1: 0, s2: 0 }, statuses: [],
    history: { skillUses: { s1: 0, s2: 0 } }, actionCount: 0,
    runtime: { justiceStacks: 0, onceFlags: {} }, context: null,
  }]))
  const boss = { statuses: [] }
  const rounds = []
  const characterTotals = Object.fromEntries(normalized.lineup.map(id => [id, { atkPercent: 0, symbolicTotals: {}, scalingTotals: {} }]))
  const symbolicTotals = {}
  const scalingTotals = {}
  const battleStartEffects = []
  let teamAtkPercent = 0
  let sequence = 0

  const baseContext = { config: normalized, actors, boss, sequence: 0, round: 0, effectsApplied: battleStartEffects }
  for (const actor of actors.values()) actor.context = baseContext
  for (const actorId of normalized.lineup) applyEffects(actors.get(actorId).definition.battleStartEffects, actorId, 'battleStart', baseContext)

  for (let turn = 1; turn <= normalized.turns; turn += 1) {
    const order = roundOrder(actors, normalized)
    const round = {
      turn, actionOrder: order.actionOrder, speedSnapshot: order.speedSnapshot,
      actions: [], atkPercent: 0, symbolicTotals: {}, scalingTotals: {}, expiredBossEffects: [],
    }

    for (const actorId of order.actionOrder) {
      sequence += 1
      const actor = actors.get(actorId)
      actor.actionCount += 1
      const cooldownsBefore = { ...actor.cooldowns }
      const historyBefore = { skillUses: { ...actor.history.skillUses }, actionCount: actor.actionCount - 1, justiceStacks: actor.runtime.justiceStacks }
      const statusSnapshotBeforeAction = snapshotStatuses(actors, normalized.lineup)
      const effectsApplied = []
      const context = { config: normalized, actors, boss, sequence, round: turn, effectsApplied }
      actor.context = context

      applyPassives(actor, 'actionStart', context)
      const activeStatusKeys = new Set(actor.statuses.map(statusKey))
      const action = selectAction(actor)
      if (action.key !== 'normal') actor.cooldowns[action.key] = action.cooldown

      for (const event of action.beforeDamageEvents ?? []) emitBattleEvent(event, actor.id, context)
      applyEffects(action.effects, actorId, 'beforeDamage', context)
      const damage = executeDamageSteps(actor, action, context)
      applyEffects(action.effects, actorId, 'afterDamage', context)
      applyAfterDamageRules(actor, action, context)

      for (const key of ['s1', 's2']) actor.cooldowns[key] = Math.max(0, actor.cooldowns[key] - 1)
      const expiredEffects = consumeStatuses(actor, activeStatusKeys)
      if (action.key !== 'normal') actor.history.skillUses[action.key] += 1
      applyPassives(actor, 'actionEnd', context)

      const historyAfter = { skillUses: { ...actor.history.skillUses }, actionCount: actor.actionCount, justiceStacks: actor.runtime.justiceStacks }
      const event = {
        sequence, turn, actorId, actionKey: action.key, skillNameKey: action.nameKey, damageType: action.damageType,
        damageSteps: damage.damageSteps, baseAtkPercent: damage.baseAtkPercent,
        effectiveAtkPercent: damage.effectiveAtkPercent, symbolicTotals: damage.symbolicTotals,
        scalingTotals: damage.scalingTotals, cooldownsBefore, cooldownsAfter: { ...actor.cooldowns },
        effectsApplied, expiredEffects, ignoredKeys: [...(action.ignoredKeys ?? [])], historyBefore, historyAfter,
        statusSnapshotBeforeAction, statusSnapshotAtDamage: snapshotStatuses(actors, normalized.lineup),
        removableBuffCounts: removableBuffCounts(actors, normalized.lineup), bossStatusAfterAction: snapshotBoss(boss),
      }
      round.actions.push(event)
      round.atkPercent += event.effectiveAtkPercent
      addSymbolicTotals(round.symbolicTotals, event.symbolicTotals)
      mergeScaling(round.scalingTotals, Object.values(event.scalingTotals))
      characterTotals[actorId].atkPercent += event.effectiveAtkPercent
      addSymbolicTotals(characterTotals[actorId].symbolicTotals, event.symbolicTotals)
      mergeScaling(characterTotals[actorId].scalingTotals, Object.values(event.scalingTotals))
      teamAtkPercent += event.effectiveAtkPercent
      addSymbolicTotals(symbolicTotals, event.symbolicTotals)
      mergeScaling(scalingTotals, Object.values(event.scalingTotals))
    }
    round.expiredBossEffects = expireBossStatuses(boss)
    round.bossStatusAfterRound = snapshotBoss(boss)
    rounds.push(round)
  }

  return {
    config: normalized, rounds, characterTotals, teamAtkPercent, symbolicTotals, scalingTotals,
    battleStartEffects, bossStatusFinal: snapshotBoss(boss),
    warnings: ['raidWarningNormalizedAttack', 'raidWarningCriticalAssumption', 'raidWarningSymbolicScaling', 'raidWarningFixedDummy'],
  }
}
