function linearValue(spec, current) {
  return Math.min(spec.max ?? Infinity, (spec.base ?? 0) + current * (spec.perStack ?? spec.increment ?? 1))
}

export const DEFAULT_RAID_MECHANICS = Object.freeze({
  targetSelectors: Object.freeze({
    self: ({ ownerId }) => [ownerId],
    all: ({ config }) => [...config.lineup],
    topAttackOther: ({ ownerId, config }) => config.attackPriority.filter(id => id !== ownerId),
    adjacent: ({ ownerId, config }) => {
      const index = config.lineup.indexOf(ownerId)
      return [config.lineup[index - 1], config.lineup[index + 1]].filter(Boolean)
    },
    topAttack: ({ config }) => [...config.attackPriority],
    lowestSpeedOther: ({ ownerId, config }) => {
      const candidates = config.lineup.filter(id => id !== ownerId)
      if (!candidates.length) return []
      const minimum = Math.min(...candidates.map(id => config.speeds[id]))
      return candidates.filter(id => config.speeds[id] === minimum)
    },
    highestBuffCount: ({ config, actors, api }) => {
      const counts = Object.fromEntries(config.lineup.map(id => [id, api.removableBuffCount(actors.get(id))]))
      const maximum = Math.max(...Object.values(counts))
      return config.lineup.filter(id => counts[id] === maximum)
    },
    highestBuffCountOther: ({ ownerId, config, actors, api }) => {
      const candidates = config.lineup.filter(id => id !== ownerId)
      if (!candidates.length) return []
      const counts = Object.fromEntries(candidates.map(id => [id, api.removableBuffCount(actors.get(id))]))
      const maximum = Math.max(...Object.values(counts))
      return candidates.filter(id => counts[id] === maximum)
    },
  }),

  conditionHandlers: Object.freeze({
    anyRemovableBuffCountAtLeast: (condition, { config, actors, api }) => (
      config.lineup.some(id => api.removableBuffCount(actors.get(id)) >= condition.count)
    ),
    actorRemovableBuffCountAtLeast: (condition, { actor, ownerId, actors, api }) => (
      api.removableBuffCount(actor ?? actors.get(ownerId)) >= condition.count
    ),
    bossStacksAtLeast: (condition, { boss }) => (
      (boss.statuses.find(status => status.id === condition.statusId)?.stacks ?? 0) >= condition.count
    ),
    bossStatusCountAtLeast: (condition, { boss }) => boss.statuses.length >= condition.count,
    skillUsesAtLeast: (condition, { actor, actors, ownerId }) => ((actor ?? actors.get(ownerId)).runtime.skillUses[condition.skillKey] ?? 0) >= condition.count,
    skillUsesAtMost: (condition, { actor, actors, ownerId }) => ((actor ?? actors.get(ownerId)).runtime.skillUses[condition.skillKey] ?? 0) <= condition.count,
    otherLineupElementCountAtLeast: (condition, { actor, ownerId, config, actors }) => {
      const sourceId = actor?.id ?? ownerId
      return config.lineup.filter(id => id !== sourceId && actors.get(id).definition.element === condition.element).length >= condition.count
    },
    roundAtMost: (condition, { round }) => round <= condition.round,
    actorHasStatus: (condition, { actors, ownerId }) => (
      actors.get(ownerId).statuses.some(status => status.id === condition.statusId)
    ),
    guaranteedCritical: (_condition, { config }) => config.guaranteedCritical,
    probabilityEnabled: (condition, { config }) => config.probabilityOverrides[condition.key] !== false,
  }),

  valueResolvers: Object.freeze({
    fixed: spec => spec.value,
    counterLinear: (spec, { actor }) => linearValue(spec, actor.runtime.counters[spec.counter] ?? 0),
    skillUsesLinear: (spec, { actor }) => linearValue(spec, actor.runtime.skillUses[spec.skillKey] ?? 0),
    otherLineupElementCountLinear: (spec, { actor, config, actors }) => {
      const count = config.lineup.filter(id => id !== actor.id).filter(id => (
        spec.element === undefined || spec.element === null || actors.get(id).definition.element === spec.element
      )).length
      return linearValue(spec, count)
    },
    bossStatusThresholds: (spec, { boss }) => {
      const values = spec.values ?? []
      return values[Math.min(boss.statuses.length, values.length - 1)]
    },
    bossStatusCountLinear: (spec, { boss }) => linearValue(spec, boss.statuses.length),
    counterThresholds: (spec, { actor }) => {
      const values = spec.values ?? []
      return values[Math.min(actor.runtime.counters[spec.counter] ?? 0, values.length - 1)]
    },
    skillUsesThresholds: (spec, { actor }) => {
      const values = spec.values ?? []
      return values[Math.min(actor.runtime.skillUses[spec.skillKey] ?? 0, values.length - 1)]
    },
    conditional: (spec, context) => (
      context.api.evaluateCondition(spec.condition, context) ? spec.whenTrue : spec.whenFalse
    ),
  }),

  effectHandlers: Object.freeze({
    status: (effect, context) => context.api.applyActorStatusEffect(effect, context),
    copyStatuses: (effect, context) => context.api.copyActorStatuses(effect, context),
    bossStatus: (effect, context) => context.api.applyBossStatusEffect(effect, context),
    cooldownReduction: (effect, context) => context.api.applyCooldownReductionEffect(effect, context),
    changeCounter: (effect, context) => context.api.applyCounterEffect(effect, context),
    setCooldown: (effect, context) => context.api.applySetCooldownEffect(effect, context),
    emitEvent: (effect, context) => context.api.emitBattleEvent(effect.event, context.ownerId, context),
  }),
})
