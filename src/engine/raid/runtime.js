import { RAID_STATUS_CLASSES } from '../../constants/raidTableCharacters.js'

const MODIFIER_CHANNELS = ['attackRate', 'damageRate', 'criticalDamageBonus', 'speedRate', 'cooldownRecoveryBonus']

function statusKey(status) {
  return `${status.effectGroupId}:${status.sourceId}:${status.appliedSequence}`
}

function cloneStatus(status) {
  return {
    ...status,
    modifiers: status.modifiers.map(modifier => ({ ...modifier })),
    symbolicModifiers: status.symbolicModifiers.map(modifier => ({ ...modifier })),
  }
}

function snapshotRuntime(actor) {
  return {
    counters: { ...actor.runtime.counters },
    flags: { ...actor.runtime.flags },
    skillUses: { ...actor.runtime.skillUses },
    actionCount: actor.runtime.actionCount,
  }
}

function snapshotBoss(boss) {
  return boss.statuses.map(status => ({ ...status }))
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

function selectAction(actor) {
  if (actor.cooldowns.s1 === 0) return actor.definition.skills.s1
  if (actor.cooldowns.s2 === 0) return actor.definition.skills.s2
  return actor.definition.normal
}

export function runRaidProgram(program) {
  const { config, characters, mechanics } = program
  const actors = new Map(config.lineup.map(id => {
    const definition = characters[id]
    return [id, {
      id,
      definition,
      cooldowns: { s1: 0, s2: 0 },
      statuses: [],
      runtime: {
        counters: { ...(definition.runtime?.counters ?? {}) },
        flags: { ...(definition.runtime?.flags ?? {}) },
        skillUses: { s1: 0, s2: 0 },
        actionCount: 0,
      },
    }]
  }))
  const boss = { statuses: [] }

  function removableBuffCount(actor) {
    return actor.statuses.filter(status => status.statusClass === RAID_STATUS_CLASSES.REMOVABLE_BUFF).length
  }

  function removableBuffCounts() {
    return Object.fromEntries(config.lineup.map(id => [id, removableBuffCount(actors.get(id))]))
  }

  function snapshotStatuses() {
    return Object.fromEntries(config.lineup.map(id => [id, {
      removableBuffCount: removableBuffCount(actors.get(id)),
      statuses: actors.get(id).statuses.map(cloneStatus),
    }]))
  }

  function evaluateCondition(condition, context) {
    if (!condition) return true
    const handler = mechanics.conditionHandlers[condition.type]
    if (!handler) throw new Error(`Unregistered raid condition '${condition.type}' at runtime`)
    return handler(condition, { ...context, config, actors, boss, api })
  }

  function resolveValue(compiledValue, actor, context) {
    return compiledValue.handler(compiledValue.definition, { ...context, actor, config, actors, boss, api })
  }

  function resolveTargets(effect, ownerId, targetKey = effect.target, targetCount = effect.targetCount) {
    const selector = mechanics.targetSelectors[targetKey]
    if (!selector) return []
    let ids = selector({ effect, ownerId, config, actors, boss, api })
    if (effect.targetElement != null) ids = ids.filter(id => actors.get(id).definition.element === effect.targetElement)
    return ids.slice(0, targetCount ?? ids.length)
  }

  function applyStatus(target, effect, ownerId, context) {
    const index = target.statuses.findIndex(status => status.effectGroupId === effect.effectGroupId && status.sourceId === ownerId)
    const sourceActor = actors.get(ownerId)
    const status = {
      id: effect.id, effectGroupId: effect.effectGroupId, sourceId: ownerId, nameKey: effect.nameKey,
      statusClass: effect.statusClass, countsTowardBuffCount: effect.statusClass === RAID_STATUS_CLASSES.REMOVABLE_BUFF,
      copyable: effect.copyable !== false,
      duration: effect.duration, remainingActions: effect.duration,
      modifiers: (effect.modifiers ?? []).map(modifier => ({
        ...modifier,
        copyRate: modifier.compiledRate ? resolveValue(modifier.compiledRate, sourceActor, context) : modifier.rate,
      })),
      symbolicModifiers: (effect.symbolicModifiers ?? []).map(modifier => ({
        ...modifier,
        copyCoefficient: modifier.compiledCoefficient ? resolveValue(modifier.compiledCoefficient, sourceActor, context) : modifier.coefficient,
      })),
      appliedSequence: context.sequence,
    }
    if (index >= 0) target.statuses.splice(index, 1, status)
    else target.statuses.push(status)
    return status
  }

  function applyCopiedStatus(target, sourceStatus, copiedFromId, context, { copyAttackRateAsSourceAttack = false } = {}) {
    const sourceActor = actors.get(sourceStatus.sourceId)
    const freezeModifier = modifier => {
      const { compiledRate, copyRate, ...plainModifier } = modifier
      return { ...plainModifier, rate: copyRate ?? (compiledRate ? resolveValue(compiledRate, sourceActor, context) : modifier.rate) }
    }
    const freezeSymbolicModifier = modifier => {
      const { compiledCoefficient, copyCoefficient, ...plainModifier } = modifier
      return { ...plainModifier, coefficient: copyCoefficient ?? (compiledCoefficient ? resolveValue(compiledCoefficient, sourceActor, context) : modifier.coefficient) }
    }
    const modifiers = sourceStatus.modifiers.map(freezeModifier)
    const symbolicModifiers = sourceStatus.symbolicModifiers.map(freezeSymbolicModifier)
    if (copyAttackRateAsSourceAttack) {
      const copiedAttackModifiers = modifiers.filter(modifier => modifier.channel === 'attackRate')
      modifiers.splice(0, modifiers.length, ...modifiers.filter(modifier => modifier.channel !== 'attackRate'))
      symbolicModifiers.push(...copiedAttackModifiers.map(modifier => ({
        kind: 'sourceAttackOverTargetAttack', coefficient: modifier.rate, sourceId: copiedFromId,
      })))
    }
    const status = {
      id: sourceStatus.id, effectGroupId: sourceStatus.effectGroupId, sourceId: sourceStatus.sourceId, nameKey: sourceStatus.nameKey,
      statusClass: sourceStatus.statusClass, countsTowardBuffCount: sourceStatus.countsTowardBuffCount,
      copyable: sourceStatus.copyable !== false, duration: sourceStatus.remainingActions, remainingActions: sourceStatus.remainingActions,
      modifiers, symbolicModifiers,
      appliedSequence: context.sequence, copiedFromId,
    }
    const index = target.statuses.findIndex(existing => existing.effectGroupId === status.effectGroupId && existing.sourceId === status.sourceId)
    if (index >= 0) target.statuses.splice(index, 1, status)
    else target.statuses.push(status)
    return status
  }

  function applyBossStatus(effect, round) {
    const before = snapshotBoss(boss)
    const index = boss.statuses.findIndex(status => status.id === effect.id)
    const existing = index >= 0 ? boss.statuses[index] : null
    const status = {
      id: effect.id, effectGroupId: effect.effectGroupId, nameKey: effect.nameKey, statusClass: effect.statusClass,
      stacks: Math.min(effect.maxStacks ?? 1, (existing?.stacks ?? 0) + (effect.addStacks ?? 1)),
      maxStacks: effect.maxStacks ?? 1, damageRatePerStack: effect.damageRatePerStack ?? 0,
      durationRounds: effect.durationRounds, remainingRounds: effect.durationRounds, appliedRound: round,
    }
    if (index >= 0) boss.statuses.splice(index, 1, status)
    else boss.statuses.push(status)
    return { before, after: snapshotBoss(boss), status }
  }

  function effectSourceId(context) {
    return context.eventSourceId ?? context.ownerId
  }

  function applyActorStatusEffect(effect, context) {
    const targets = resolveTargets(effect, context.ownerId)
    const selectionCounts = effect.target?.includes('BuffCount') ? removableBuffCounts() : null
    for (const targetId of targets) {
      const target = actors.get(targetId)
      if (effect.compiledTargetCondition && !effect.compiledTargetCondition.handler(effect.compiledTargetCondition.definition, {
        ...context, config, actors, boss, api, target, targetId,
      })) {
        if (effect.recordSkipped) context.effectsApplied.push({
          type: effect.type, phase: context.phase, sourceId: context.ownerId, targetId,
          id: effect.id, effectGroupId: effect.effectGroupId, nameKey: effect.nameKey, skipped: true,
        })
        continue
      }
      const status = applyStatus(target, effect, context.ownerId, context)
      context.effectsApplied.push({
        type: 'status', phase: context.phase, sourceId: context.ownerId, targetId,
        id: effect.id, effectGroupId: effect.effectGroupId, nameKey: effect.nameKey,
        statusClass: effect.statusClass, countsTowardBuffCount: status.countsTowardBuffCount,
        duration: effect.duration, modifiers: status.modifiers.map(modifier => ({ ...modifier })),
        symbolicModifiers: status.symbolicModifiers.map(modifier => ({ ...modifier })), selectionCounts,
      })
    }
  }

  function copyActorStatuses(effect, context) {
    const sourceId = resolveTargets(effect, context.ownerId, effect.sourceTarget, 1)[0]
    if (sourceId == null) return
    const source = actors.get(sourceId)
    const sourceStatuses = source.statuses.filter(status => (
      status.statusClass === RAID_STATUS_CLASSES.REMOVABLE_BUFF
      && status.copyable !== false
      && (status.remainingActions == null || status.remainingActions > 0)
    ))
    for (const targetId of resolveTargets(effect, context.ownerId)) {
      const target = actors.get(targetId)
      for (const sourceStatus of sourceStatuses) {
        const status = applyCopiedStatus(target, sourceStatus, sourceId, context, effect)
        context.effectsApplied.push({
          type: 'status', phase: context.phase, sourceId: status.sourceId, targetId,
          copiedFromId: sourceId, copiedById: context.ownerId,
          id: status.id, effectGroupId: status.effectGroupId, nameKey: status.nameKey,
          statusClass: status.statusClass, countsTowardBuffCount: status.countsTowardBuffCount,
          duration: status.duration, modifiers: status.modifiers.map(modifier => ({ ...modifier })),
          symbolicModifiers: status.symbolicModifiers.map(modifier => ({ ...modifier })),
        })
      }
    }
  }

  function removeActorStatuses(effect, context) {
    for (const targetId of resolveTargets(effect, context.ownerId)) {
      const target = actors.get(targetId)
      const removed = []
      target.statuses = target.statuses.filter(status => {
        if (removed.length >= effect.count || status.statusClass !== effect.statusClass) return true
        removed.push(cloneStatus(status))
        return false
      })
      context.effectsApplied.push({
        type: 'removeStatuses', phase: context.phase, sourceId: context.ownerId, targetId,
        id: effect.id, nameKey: effect.nameKey, statusClass: effect.statusClass, count: effect.count,
        removed,
      })
    }
  }

  function applyBossStatusEffect(effect, context) {
    const applied = applyBossStatus(effect, context.round)
    context.effectsApplied.push({
      type: 'bossStatus', id: effect.id, effectGroupId: effect.effectGroupId, nameKey: effect.nameKey,
      phase: context.phase, sourceId: context.ownerId, statusClass: effect.statusClass,
      addStacks: effect.addStacks, durationRounds: effect.durationRounds,
      before: applied.before, after: applied.after, stacks: applied.status.stacks,
    })
  }

  function applyCooldownReductionEffect(effect, context) {
    for (const targetId of resolveTargets(effect, context.ownerId)) {
      const target = actors.get(targetId)
      const before = { ...target.cooldowns }
      for (const key of ['s1', 's2']) target.cooldowns[key] = Math.max(0, target.cooldowns[key] - effect.amount)
      context.effectsApplied.push({
        type: 'cooldownReduction', id: effect.id, nameKey: effect.nameKey,
        phase: context.phase, sourceId: context.ownerId, targetId, amount: effect.amount,
        cooldownsBefore: before, cooldownsAfter: { ...target.cooldowns },
      })
    }
  }

  function applyCounterEffect(effect, context) {
    const target = actors.get(context.ownerId)
    const before = target.runtime.counters[effect.counter] ?? 0
    const after = Math.min(effect.max ?? Infinity, Math.max(effect.min ?? -Infinity, before + effect.amount))
    target.runtime.counters[effect.counter] = after
    context.effectsApplied.push({
      type: effect.eventType ?? 'counter', phase: context.phase, id: effect.id, nameKey: effect.nameKey,
      sourceId: effectSourceId(context), targetId: context.ownerId, counter: effect.counter, before, after,
    })
  }

  function applySetCooldownEffect(effect, context) {
    for (const targetId of resolveTargets(effect, context.ownerId)) {
      const target = actors.get(targetId)
      const before = { ...target.cooldowns }
      for (const key of effect.skills ?? ['s1', 's2']) target.cooldowns[key] = Math.max(0, effect.value)
      context.effectsApplied.push({
        type: effect.eventType ?? 'setCooldown', phase: context.phase, sourceId: context.ownerId, targetId,
        cooldownsBefore: before, cooldownsAfter: { ...target.cooldowns }, onceKey: context.onceKey,
      })
    }
  }

  function applyEffect(effect, context) {
    if (effect.compiledCondition && !effect.compiledCondition.handler(effect.compiledCondition.definition, { ...context, config, actors, boss, api })) {
      if (effect.recordSkipped) context.effectsApplied.push({
        type: effect.type, id: effect.id, nameKey: effect.nameKey, phase: context.phase,
        sourceId: context.ownerId, skipped: true,
      })
      return
    }
    effect.handler(effect, { ...context, config, actors, boss, api })
  }

  function hookIsScheduled(hook, actor, context) {
    if (hook.everyRounds) {
      const offset = hook.roundOffset ?? hook.everyRounds
      if (context.round < offset || (context.round - offset) % hook.everyRounds !== 0) return false
    }
    if (!hook.every) return true
    const offset = hook.offset ?? hook.every
    return actor.runtime.actionCount >= offset && (actor.runtime.actionCount - offset) % hook.every === 0
  }

  function runHooks(actor, hooks, context, phase = context.phase) {
    for (const hook of hooks ?? []) {
      if (!hookIsScheduled(hook, actor, context)) continue
      const hookContext = { ...context, ownerId: actor.id, phase, onceKey: hook.onceKey }
      if (hook.onceKey && actor.runtime.flags[hook.onceKey]) continue
      if (hook.compiledCondition && !hook.compiledCondition.handler(hook.compiledCondition.definition, { ...hookContext, config, actors, boss, api })) continue
      for (const effect of hook.effects) applyEffect(effect, hookContext)
      if (hook.onceKey) actor.runtime.flags[hook.onceKey] = true
    }
  }

  function emitBattleEvent(event, sourceId, context) {
    for (const listener of program.eventListeners[event] ?? []) {
      const actor = actors.get(listener.actorId)
      const listenerContext = {
        ...context, ownerId: listener.actorId, eventSourceId: sourceId, phase: context.phase,
      }
      for (const effect of listener.hook.effects) applyEffect(effect, listenerContext)
      if (!actor) throw new Error(`Missing raid event listener actor: ${listener.actorId}`)
    }
  }

  const api = {
    removableBuffCount, evaluateCondition, resolveTargets,
    applyActorStatusEffect, copyActorStatuses, removeActorStatuses, applyBossStatusEffect, applyCooldownReductionEffect,
    applyCounterEffect, applySetCooldownEffect, emitBattleEvent,
  }

  function modifierSnapshot(actor, context) {
    const sources = actor.definition.permanentModifiers.map(modifier => ({
      ...modifier, sourceId: actor.id, permanent: true, remainingActions: null,
      statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    }))
    for (const modifier of actor.definition.derivedModifiers) {
      const rate = resolveValue(modifier.compiledRate, actor, context)
      if (rate !== 0) sources.push({
        ...modifier, rate, sourceId: actor.id, permanent: true, remainingActions: null,
        statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      })
    }
    const symbolicSources = []
    for (const status of actor.statuses) {
      const sourceActor = actors.get(status.sourceId)
      for (const modifier of status.modifiers) sources.push({
        ...modifier, rate: modifier.compiledRate ? resolveValue(modifier.compiledRate, sourceActor, context) : modifier.rate,
        id: modifier.id ?? status.id, nameKey: modifier.nameKey ?? status.nameKey,
        sourceId: status.sourceId, copiedFromId: status.copiedFromId, effectGroupId: status.effectGroupId, statusClass: status.statusClass,
        permanent: status.remainingActions == null, remainingActions: status.remainingActions, appliedSequence: status.appliedSequence,
      })
      for (const modifier of status.symbolicModifiers) {
        const key = modifier.kind === 'sourceAttackOverTargetAttack'
          ? `ATK_${modifier.sourceId}/ATK_${actor.id}`
          : `DEF0_${actor.id}/ATK_${actor.id}`
        symbolicSources.push({
          ...modifier, coefficient: modifier.compiledCoefficient ? resolveValue(modifier.compiledCoefficient, sourceActor, context) : modifier.coefficient,
          key, targetId: actor.id, sourceId: modifier.sourceId ?? status.sourceId, copiedFromId: status.copiedFromId,
          nameKey: status.nameKey, effectGroupId: status.effectGroupId, remainingActions: status.remainingActions,
        })
      }
    }
    const totals = Object.fromEntries(MODIFIER_CHANNELS.map(channel => [channel, 0]))
    for (const source of sources) if (source.channel in totals) totals[source.channel] += source.rate
    return { sources, symbolicSources, totals }
  }

  function effectiveSpeed(actor) {
    const snapshot = modifierSnapshot(actor, { phase: 'roundStart' })
    const baseSpeed = config.speeds[actor.id]
    return {
      actorId: actor.id, baseSpeed, speedRate: snapshot.totals.speedRate,
      effectiveSpeed: baseSpeed * (1 + snapshot.totals.speedRate),
      sources: snapshot.sources.filter(source => source.channel === 'speedRate'),
    }
  }

  function roundOrder() {
    const speedSnapshot = Object.fromEntries(config.lineup.map(id => [id, effectiveSpeed(actors.get(id))]))
    const actionOrder = [...config.lineup].sort((a, b) => (
      speedSnapshot[b].effectiveSpeed - speedSnapshot[a].effectiveSpeed || config.lineup.indexOf(a) - config.lineup.indexOf(b)
    ))
    return { actionOrder, speedSnapshot }
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

  function expireBossStatuses() {
    const expired = []
    for (const status of boss.statuses) {
      if (status.remainingRounds != null) status.remainingRounds -= 1
      if (status.remainingRounds != null && status.remainingRounds <= 0) expired.push({ ...status })
    }
    boss.statuses = boss.statuses.filter(status => status.remainingRounds == null || status.remainingRounds > 0)
    return expired
  }

  function bossDamageRate() {
    return boss.statuses.reduce((total, status) => total + status.stacks * status.damageRatePerStack, 0)
  }

  function executeDamageSteps(actor, action, context) {
    const damageSteps = []
    const actionScaling = {}
    const symbolicTotals = {}
    let baseAtkPercent = 0
    let effectiveAtkPercent = 0
    let hitSequence = 0

    for (const rawStep of action.damageSteps) {
      const percent = resolveValue(rawStep.compiledPercent, actor, context)
      const hits = resolveValue(rawStep.compiledHits, actor, context)
      for (let hit = 1; hit <= hits; hit += 1) {
        hitSequence += 1
        const modifiers = modifierSnapshot(actor, context)
        const bossBefore = snapshotBoss(boss)
        const incomingRate = bossDamageRate()
        const damageRate = modifiers.totals.damageRate + incomingRate
        const critical = config.guaranteedCritical
        const criticalMultiplier = critical ? 1 + config.baseCriticalDamageBonus + modifiers.totals.criticalDamageBonus : 1
        const attackScale = rawStep.stat === 'ATK' ? 1 + modifiers.totals.attackRate : 1
        const effectivePercent = percent * attackScale * (1 + damageRate) * criticalMultiplier
        const scalingTerms = rawStep.stat === 'ATK'
          ? modifiers.symbolicSources.map(source => ({
            ...source, coefficient: percent * source.coefficient * (1 + damageRate) * criticalMultiplier,
          }))
          : []

        if (rawStep.stat === 'ATK') {
          baseAtkPercent += percent
          effectiveAtkPercent += effectivePercent
          mergeScaling(actionScaling, scalingTerms)
        } else {
          symbolicTotals[rawStep.stat] = (symbolicTotals[rawStep.stat] ?? 0) + effectivePercent
        }

        runHooks(actor, actor.definition.hooksByTrigger.afterHit, context, 'afterHit')
        if (critical) runHooks(actor, actor.definition.hooksByTrigger.afterCriticalHit, context, 'afterHit')
        const bossAfter = snapshotBoss(boss)

        damageSteps.push({
          index: hitSequence, stat: rawStep.stat, damageType: rawStep.damageType, percent,
          hit, hits, originalTargetCount: rawStep.originalTargetCount, conditionKey: rawStep.conditionKey,
          critical, criticalMultiplier, attackRate: modifiers.totals.attackRate,
          actorDamageRate: modifiers.totals.damageRate, bossDamageRate: incomingRate, damageRate,
          effectivePercent, scalingTerms, modifierSources: modifiers.sources,
          bossStatusBefore: bossBefore, bossStatusAfter: bossAfter,
        })
      }
    }
    return { damageSteps, baseAtkPercent, effectiveAtkPercent, symbolicTotals, scalingTotals: actionScaling }
  }

  const rounds = []
  const characterTotals = Object.fromEntries(config.lineup.map(id => [id, { atkPercent: 0, symbolicTotals: {}, scalingTotals: {} }]))
  const symbolicTotals = {}
  const scalingTotals = {}
  const battleStartEffects = []
  let teamAtkPercent = 0
  let sequence = 0

  for (const actorId of config.lineup) {
    const actor = actors.get(actorId)
    runHooks(actor, actor.definition.hooksByTrigger.battleStart, {
      config, actors, boss, sequence: 0, round: 0, effectsApplied: battleStartEffects, phase: 'battleStart', ownerId: actorId,
    })
  }

  for (let turn = 1; turn <= config.turns; turn += 1) {
    const roundStartEffects = []
    for (const actorId of config.lineup) {
      const actor = actors.get(actorId)
      runHooks(actor, actor.definition.hooksByTrigger.roundStart, {
        config, actors, boss, sequence, round: turn, effectsApplied: roundStartEffects, phase: 'roundStart', ownerId: actorId,
      }, 'roundStart')
    }
    const order = roundOrder()
    const round = {
      turn, actionOrder: order.actionOrder, speedSnapshot: order.speedSnapshot,
      actions: [], roundStartEffects, atkPercent: 0, symbolicTotals: {}, scalingTotals: {}, expiredBossEffects: [],
    }

    for (const actorId of order.actionOrder) {
      sequence += 1
      const actor = actors.get(actorId)
      const runtimeBefore = snapshotRuntime(actor)
      actor.runtime.actionCount += 1
      const cooldownsBefore = { ...actor.cooldowns }
      const statusSnapshotBeforeAction = snapshotStatuses()
      const activeStatusKeys = new Set(actor.statuses.map(statusKey))
      const effectsApplied = []
      const context = { config, actors, boss, sequence, round: turn, effectsApplied, phase: 'actionStart', ownerId: actorId }

      runHooks(actor, actor.definition.hooksByTrigger.actionStart, context, 'actionStart')
      const action = selectAction(actor)
      if (action.key !== 'normal') actor.cooldowns[action.key] = action.cooldown

      runHooks(actor, action.hooksByTrigger.beforeDamage, context, 'beforeDamage')
      runHooks(actor, actor.definition.hooksByTrigger.beforeDamage, context, 'beforeDamage')
      const statusSnapshotAtDamage = snapshotStatuses()
      const removableBuffCountsAtDamage = removableBuffCounts()
      const damage = executeDamageSteps(actor, action, { ...context, phase: 'damage' })
      runHooks(actor, action.hooksByTrigger.afterDamage, context, 'afterDamage')
      runHooks(actor, actor.definition.hooksByTrigger.afterDamage, context, 'afterDamage')

      const cooldownRecovery = Math.max(0, 1 + modifierSnapshot(actor, { ...context, phase: 'actionEnd' }).totals.cooldownRecoveryBonus)
      for (const key of ['s1', 's2']) actor.cooldowns[key] = Math.max(0, actor.cooldowns[key] - cooldownRecovery)
      const expiredEffects = consumeStatuses(actor, activeStatusKeys)
      if (action.key !== 'normal') actor.runtime.skillUses[action.key] += 1
      runHooks(actor, actor.definition.hooksByTrigger.actionEnd, context, 'actionEnd')
      runHooks(actor, action.hooksByTrigger.actionEnd, context, 'actionEnd')

      const runtimeAfter = snapshotRuntime(actor)
      const statusSnapshotAfterAction = snapshotStatuses()
      const removableBuffCountsAfterAction = Object.fromEntries(Object.entries(statusSnapshotAfterAction).map(([id, snapshot]) => [id, snapshot.removableBuffCount]))
      const event = {
        sequence, turn, actorId, actionKey: action.key, skillNameKey: action.nameKey, damageType: action.damageType,
        damageSteps: damage.damageSteps, baseAtkPercent: damage.baseAtkPercent,
        effectiveAtkPercent: damage.effectiveAtkPercent, symbolicTotals: damage.symbolicTotals,
        scalingTotals: damage.scalingTotals, cooldownsBefore, cooldownsAfter: { ...actor.cooldowns },
        effectsApplied, expiredEffects, ignoredKeys: [...(action.ignoredKeys ?? [])], runtimeBefore, runtimeAfter,
        statusSnapshotBeforeAction, statusSnapshotAtDamage, statusSnapshotAfterAction,
        removableBuffCountsAtActionStart: Object.fromEntries(Object.entries(statusSnapshotBeforeAction).map(([id, snapshot]) => [id, snapshot.removableBuffCount])),
        removableBuffCountsAtDamage, removableBuffCountsAfterAction,
        removableBuffCounts: removableBuffCountsAfterAction, bossStatusAfterAction: snapshotBoss(boss),
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
    round.expiredBossEffects = expireBossStatuses()
    round.bossStatusAfterRound = snapshotBoss(boss)
    rounds.push(round)
  }

  return {
    config, rounds, characterTotals, teamAtkPercent, symbolicTotals, scalingTotals,
    battleStartEffects, bossStatusFinal: snapshotBoss(boss),
    warnings: ['raidWarningNormalizedAttack', 'raidWarningCriticalAssumption', 'raidWarningSymbolicScaling', 'raidWarningFixedDummy'],
  }
}
