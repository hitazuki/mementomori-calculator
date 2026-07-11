function linearValue(spec, current) {
  return Math.min(spec.max ?? Infinity, (spec.base ?? 0) + current * (spec.perStack ?? spec.increment ?? 1))
}

export const DEFAULT_RAID_MECHANICS = Object.freeze({
  targetSelectors: Object.freeze({
    self: ({ ownerId }) => [ownerId],
    all: ({ config }) => [...config.lineup],
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
    bossStacksAtLeast: (condition, { boss }) => (
      (boss.statuses.find(status => status.id === condition.statusId)?.stacks ?? 0) >= condition.count
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
    conditional: (spec, context) => (
      context.api.evaluateCondition(spec.condition, context) ? spec.whenTrue : spec.whenFalse
    ),
  }),

  effectHandlers: Object.freeze({
    status: (effect, context) => context.api.applyActorStatusEffect(effect, context),
    bossStatus: (effect, context) => context.api.applyBossStatusEffect(effect, context),
    cooldownReduction: (effect, context) => context.api.applyCooldownReductionEffect(effect, context),
    changeCounter: (effect, context) => context.api.applyCounterEffect(effect, context),
    setCooldown: (effect, context) => context.api.applySetCooldownEffect(effect, context),
    emitEvent: (effect, context) => context.api.emitBattleEvent(effect.event, context.ownerId, context),
  }),
})
