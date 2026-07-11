import {
  RAID_STATUS_CLASSES,
  RAID_TABLE_CHARACTERS,
  createDefaultRaidTableConfig,
} from '../constants/raidTableCharacters.js'

const MODIFIER_CHANNELS = ['attackRate', 'damageDealtRate', 'targetDamageTakenRate']

function validateOrder(name, values, lineup) {
  if (!Array.isArray(values) || values.length !== lineup.length) {
    throw new Error(`${name} must contain every lineup character exactly once`)
  }
  const unique = new Set(values)
  if (unique.size !== lineup.length || lineup.some(id => !unique.has(id))) {
    throw new Error(`${name} must contain every lineup character exactly once`)
  }
}

function normalizeConfig(config = {}) {
  const defaults = createDefaultRaidTableConfig()
  const normalized = {
    lineup: [...(config.lineup ?? defaults.lineup)],
    actionOrder: [...(config.actionOrder ?? defaults.actionOrder)],
    attackPriority: [...(config.attackPriority ?? defaults.attackPriority)],
    turns: config.turns ?? defaults.turns,
  }

  if (normalized.lineup.length !== 5 || new Set(normalized.lineup).size !== normalized.lineup.length) {
    throw new Error('lineup must contain exactly five unique supported characters')
  }
  for (const id of normalized.lineup) {
    if (!RAID_TABLE_CHARACTERS[id]) throw new Error(`Unsupported raid table character: ${id}`)
  }
  validateOrder('actionOrder', normalized.actionOrder, normalized.lineup)
  validateOrder('attackPriority', normalized.attackPriority, normalized.lineup)
  if (!Number.isInteger(normalized.turns) || normalized.turns < 1) {
    throw new Error('turns must be a positive integer')
  }
  return normalized
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

function snapshotStatuses(actors, lineup) {
  return Object.fromEntries(lineup.map(id => [id, {
    removableBuffCount: removableBuffCount(actors.get(id)),
    statuses: actors.get(id).statuses.map(status => ({
      ...status,
      modifiers: status.modifiers.map(modifier => ({ ...modifier })),
    })),
  }]))
}

function resolveTargets(effect, sourceId, config, actors) {
  let targetIds = []
  if (effect.target === 'self') {
    targetIds = [sourceId]
  } else if (effect.target === 'adjacent') {
    const index = config.lineup.indexOf(sourceId)
    targetIds = [config.lineup[index - 1], config.lineup[index + 1]].filter(Boolean)
  } else if (effect.target === 'topAttack') {
    targetIds = [...config.attackPriority]
  } else if (effect.target === 'highestBuffCount' || effect.target === 'highestBuffCountOther') {
    const candidates = effect.target === 'highestBuffCountOther'
      ? config.lineup.filter(id => id !== sourceId)
      : [...config.lineup]
    const counts = removableBuffCounts(actors, config.lineup)
    const maximum = Math.max(...candidates.map(id => counts[id]))
    targetIds = candidates.filter(id => counts[id] === maximum)
  }
  return targetIds.slice(0, effect.targetCount ?? targetIds.length)
}

function conditionMatches(condition, actors, lineup) {
  if (!condition) return true
  if (condition.type === 'anyRemovableBuffCountAtLeast') {
    return lineup.some(id => removableBuffCount(actors.get(id)) >= condition.count)
  }
  return false
}

function buildModifierSnapshot(actor) {
  const sources = actor.definition.permanentModifiers.map(modifier => ({
    ...modifier,
    sourceId: actor.id,
    permanent: true,
    remainingActions: null,
    statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  }))

  for (const status of actor.statuses) {
    for (const modifier of status.modifiers) {
      sources.push({
        ...modifier,
        id: modifier.id ?? status.id,
        nameKey: modifier.nameKey ?? status.nameKey,
        sourceId: status.sourceId,
        effectGroupId: status.effectGroupId,
        statusClass: status.statusClass,
        permanent: false,
        remainingActions: status.remainingActions,
        appliedSequence: status.appliedSequence,
      })
    }
  }

  const totals = Object.fromEntries(MODIFIER_CHANNELS.map(channel => [channel, 0]))
  for (const source of sources) {
    if (source.channel in totals) totals[source.channel] += source.rate
  }
  return { sources, totals }
}

function resolveAttackTerms(terms = [], actor) {
  return terms.map(term => {
    if (!term.hitsByUse) return { ...term }
    const usesBefore = actor.history.skillUses[term.hitsByUse.skillKey] ?? 0
    const hits = Math.min(
      term.hitsByUse.max,
      term.hitsByUse.base + usesBefore * (term.hitsByUse.increment ?? 1),
    )
    const { hitsByUse, ...base } = term
    return { ...base, hits, dynamicHits: true }
  })
}

function sumAttackTerms(terms = []) {
  return terms
    .filter(term => term.stat === 'ATK')
    .reduce((total, term) => total + term.percent * (term.hits ?? 1), 0)
}

function copyTerms(terms = []) {
  return terms.map(term => ({ ...term }))
}

function applyCooldownReduction(target, amount) {
  for (const key of ['s1', 's2']) {
    target.cooldowns[key] = Math.max(0, target.cooldowns[key] - amount)
  }
}

function applyStatus(target, effect, sourceId, sequence) {
  const existingIndex = target.statuses.findIndex(status => (
    status.effectGroupId === effect.effectGroupId && status.sourceId === sourceId
  ))
  const status = {
    id: effect.id,
    effectGroupId: effect.effectGroupId,
    sourceId,
    nameKey: effect.nameKey,
    statusClass: effect.statusClass,
    countsTowardBuffCount: effect.statusClass === RAID_STATUS_CLASSES.REMOVABLE_BUFF,
    duration: effect.duration,
    remainingActions: effect.duration,
    modifiers: (effect.modifiers ?? []).map(modifier => ({ ...modifier })),
    appliedSequence: sequence,
  }
  if (existingIndex >= 0) target.statuses.splice(existingIndex, 1, status)
  else target.statuses.push(status)
  return status
}

function applyEffect(effect, sourceId, phase, context) {
  const { config, actors, sequence, effectsApplied } = context
  const targetIds = resolveTargets(effect, sourceId, config, actors)
  const selectionCounts = effect.target?.includes('BuffCount')
    ? removableBuffCounts(actors, config.lineup)
    : null

  if (effect.type === 'cooldownReduction') {
    for (const targetId of targetIds) {
      const target = actors.get(targetId)
      const before = { ...target.cooldowns }
      applyCooldownReduction(target, effect.amount)
      effectsApplied.push({
        type: effect.type,
        phase,
        sourceId,
        targetId,
        amount: effect.amount,
        cooldownsBefore: before,
        cooldownsAfter: { ...target.cooldowns },
      })
    }
  } else if (effect.type === 'status') {
    for (const targetId of targetIds) {
      const applied = applyStatus(actors.get(targetId), effect, sourceId, sequence)
      effectsApplied.push({
        type: effect.type,
        phase,
        sourceId,
        targetId,
        id: effect.id,
        effectGroupId: effect.effectGroupId,
        nameKey: effect.nameKey,
        statusClass: effect.statusClass,
        countsTowardBuffCount: applied.countsTowardBuffCount,
        duration: effect.duration,
        remainingActions: applied.remainingActions,
        modifiers: applied.modifiers.map(modifier => ({ ...modifier })),
        selectionCounts,
      })
    }
  }
}

function applyEffects(effects, sourceId, phase, context) {
  for (const effect of effects ?? []) {
    if ((effect.phase ?? 'afterDamage') === phase) applyEffect(effect, sourceId, phase, context)
  }
}

function passiveIsScheduled(passive, actor) {
  if (!passive.every) return true
  const offset = passive.offset ?? passive.every
  return actor.actionCount >= offset && (actor.actionCount - offset) % passive.every === 0
}

function applyPassives(actor, trigger, context) {
  for (const passive of actor.definition.passives ?? []) {
    if (passive.trigger !== trigger) continue
    if (!passiveIsScheduled(passive, actor)) continue
    if (!conditionMatches(passive.condition, context.actors, context.config.lineup)) continue
    for (const effect of passive.effects ?? []) applyEffect(effect, actor.id, trigger, context)
  }
}

function consumeStatuses(actor, activeStatusKeys) {
  const expired = []
  for (const status of actor.statuses) {
    if (activeStatusKeys.has(statusKey(status))) status.remainingActions -= 1
    if (status.remainingActions <= 0) expired.push({
      ...status,
      modifiers: status.modifiers.map(modifier => ({ ...modifier })),
    })
  }
  actor.statuses = actor.statuses.filter(status => status.remainingActions > 0)
  return expired
}

function addSymbolicTotals(target, terms) {
  for (const term of terms) {
    target[term.stat] = (target[term.stat] ?? 0) + term.percent * (term.hits ?? 1)
  }
}

export function simulateRaidTable(config = {}) {
  const normalized = normalizeConfig(config)
  const actors = new Map(normalized.lineup.map(id => [id, {
    id,
    definition: RAID_TABLE_CHARACTERS[id],
    cooldowns: { s1: 0, s2: 0 },
    statuses: [],
    history: { skillUses: { s1: 0, s2: 0 } },
    actionCount: 0,
  }]))

  const rounds = []
  const characterTotals = Object.fromEntries(normalized.lineup.map(id => [id, {
    atkPercent: 0,
    symbolicTotals: {},
  }]))
  const symbolicTotals = {}
  const battleStartEffects = []
  let teamAtkPercent = 0
  let sequence = 0

  for (const actorId of normalized.actionOrder) {
    const actor = actors.get(actorId)
    applyEffects(actor.definition.battleStartEffects, actorId, 'battleStart', {
      config: normalized,
      actors,
      sequence: 0,
      effectsApplied: battleStartEffects,
    })
  }

  for (let turn = 1; turn <= normalized.turns; turn += 1) {
    const round = { turn, actions: [], atkPercent: 0, symbolicTotals: {} }

    for (const actorId of normalized.actionOrder) {
      sequence += 1
      const actor = actors.get(actorId)
      actor.actionCount += 1
      const cooldownsBefore = { ...actor.cooldowns }
      const historyBefore = { skillUses: { ...actor.history.skillUses }, actionCount: actor.actionCount - 1 }
      const statusSnapshotBeforeAction = snapshotStatuses(actors, normalized.lineup)
      const effectsApplied = []
      const context = { config: normalized, actors, sequence, effectsApplied }

      applyPassives(actor, 'actionStart', context)
      const activeStatusKeys = new Set(actor.statuses.map(statusKey))
      const action = selectAction(actor)
      const attackTerms = resolveAttackTerms(action.attackTerms, actor)
      const symbolicTerms = copyTerms(action.symbolicTerms)

      if (action.key !== 'normal') actor.cooldowns[action.key] = action.cooldown
      applyEffects(action.effects, actorId, 'beforeDamage', context)

      const modifierSnapshot = buildModifierSnapshot(actor)
      const baseAtkPercent = sumAttackTerms(attackTerms)
      const { attackRate, damageDealtRate, targetDamageTakenRate } = modifierSnapshot.totals
      const effectiveAtkPercent = baseAtkPercent
        * (1 + attackRate)
        * (1 + damageDealtRate)
        * (1 + targetDamageTakenRate)
      const statusSnapshotAtDamage = snapshotStatuses(actors, normalized.lineup)

      applyEffects(action.effects, actorId, 'afterDamage', context)

      for (const key of ['s1', 's2']) {
        actor.cooldowns[key] = Math.max(0, actor.cooldowns[key] - 1)
      }
      const expiredEffects = consumeStatuses(actor, activeStatusKeys)

      if (action.key !== 'normal') actor.history.skillUses[action.key] += 1
      applyPassives(actor, 'actionEnd', context)

      const historyAfter = { skillUses: { ...actor.history.skillUses }, actionCount: actor.actionCount }
      const event = {
        sequence,
        turn,
        actorId,
        actionKey: action.key,
        skillNameKey: action.nameKey,
        damageType: action.damageType,
        attackTerms,
        baseAtkPercent,
        modifierSources: modifierSnapshot.sources,
        modifierTotals: { ...modifierSnapshot.totals },
        effectiveAtkPercent,
        symbolicTerms,
        cooldownsBefore,
        cooldownsAfter: { ...actor.cooldowns },
        effectsApplied,
        expiredEffects,
        ignoredKeys: [...(action.ignoredKeys ?? [])],
        historyBefore,
        historyAfter,
        statusSnapshotBeforeAction,
        statusSnapshotAtDamage,
        removableBuffCounts: Object.fromEntries(
          Object.entries(statusSnapshotAtDamage).map(([id, snapshot]) => [id, snapshot.removableBuffCount]),
        ),
      }
      round.actions.push(event)
      round.atkPercent += effectiveAtkPercent
      addSymbolicTotals(round.symbolicTotals, symbolicTerms)
      characterTotals[actorId].atkPercent += effectiveAtkPercent
      addSymbolicTotals(characterTotals[actorId].symbolicTotals, symbolicTerms)
      teamAtkPercent += effectiveAtkPercent
      addSymbolicTotals(symbolicTotals, symbolicTerms)
    }

    rounds.push(round)
  }

  return {
    config: normalized,
    rounds,
    characterTotals,
    teamAtkPercent,
    symbolicTotals,
    battleStartEffects,
    warnings: [
      'raidWarningNormalizedAttack',
      'raidWarningIgnoredMechanics',
      'raidWarningFixedDummy',
    ],
  }
}
