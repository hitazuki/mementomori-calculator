function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function numericCandidates(value) {
  if (Number.isFinite(value)) return [value]
  if (Array.isArray(value)) return value.flatMap(numericCandidates)
  if (!value || typeof value !== 'object') return []

  const candidates = []
  for (const key of ['values', 'whenTrue', 'whenFalse', 'base', 'max']) {
    if (key in value) candidates.push(...numericCandidates(value[key]))
  }
  return candidates
}

function valueRange(value) {
  const values = [...new Set(numericCandidates(value))].sort((left, right) => left - right)
  if (!values.length) return { min: null, max: null, dynamic: true }
  return { min: values[0], max: values.at(-1), dynamic: typeof value !== 'number' }
}

function collectEffectNameKeys(effects = []) {
  const keys = []
  for (const effect of effects) {
    if (!effect || typeof effect !== 'object') continue
    if (effect.nameKey) keys.push(effect.nameKey)
    for (const modifier of effect.modifiers ?? []) {
      if (modifier.nameKey) keys.push(modifier.nameKey)
    }
    keys.push(...collectEffectNameKeys(effect.effects))
  }
  return keys
}

function effectFallbackKey(effect) {
  if (effect.type === 'removeStatus') return 'raidStatusSnapshot'
  if (effect.type === 'cooldownReduction') return 'raidCharacterCooldownReductionEffect'
  if (effect.type === 'setCooldown') return 'raidCharacterCooldownResetEffect'
  if (effect.type === 'changeCounter') return 'raidCharacterCounterChangeEffect'
  if (effect.type === 'emitEvent' && effect.event === 'selfDamage') return 'raidCharacterSelfDamageEffect'
  if (effect.type === 'emitEvent' && effect.event === 'activeSkillHeal') return 'raidCharacterHealingEffect'
  return null
}

function compactConditions(conditions = []) {
  return conditions.flat(Infinity).filter(condition => condition && typeof condition === 'object' && !Array.isArray(condition))
}

function effectTarget(effect) {
  if (effect.target) return effect.target
  if (effect.type === 'bossStatus') return 'boss'
  if (effect.type === 'changeCounter') return 'internal'
  if (effect.type === 'emitEvent') return 'event'
  return null
}

function effectContext(context = {}, effect = {}) {
  return {
    trigger: context.trigger ?? null,
    event: context.event ?? null,
    every: context.every ?? null,
    offset: context.offset ?? null,
    everyRounds: context.everyRounds ?? null,
    roundOffset: context.roundOffset ?? null,
    once: Boolean(context.onceKey),
    conditions: compactConditions([...(context.conditions ?? []), effect.condition]),
  }
}

function collectEffectItems(effects = [], context = {}) {
  const items = []
  for (const effect of effects) {
    if (!effect || typeof effect !== 'object') continue
    const nameKey = effect.nameKey ?? effectFallbackKey(effect)
    const resolvedContext = effectContext(context, effect)
    if (nameKey) {
      items.push({
        nameKey,
        definition: effect,
        type: effect.type,
        target: effectTarget(effect),
        targetCount: effect.targetCount ?? null,
        targetElement: effect.targetElement ?? null,
        sourceTarget: effect.sourceTarget ?? null,
        targetConditions: compactConditions([effect.targetCondition]),
        ...resolvedContext,
        duration: effect.duration ?? null,
        durationRounds: effect.durationRounds ?? null,
        maxStacks: effect.maxStacks ?? null,
        amount: effect.amount ?? null,
        value: effect.value ?? null,
        modifiers: (effect.modifiers ?? []).map(modifier => ({ channel: modifier.channel, rate: valueRange(modifier.rate), valueSpec: modifier.rate })),
        bossRates: [
          ['damageRate', effect.damageRatePerStack],
          ['defenseRate', effect.defenseRatePerStack],
          ['physicalDefenseRate', effect.physicalDefenseRatePerStack],
          ['magicDefenseRate', effect.magicDefenseRatePerStack],
        ].filter(([, rate]) => rate != null && rate !== 0).map(([channel, rate]) => ({ channel, rate: valueRange(rate), valueSpec: rate })),
      })
    }
    items.push(...collectEffectItems(effect.effects, resolvedContext))
  }
  return items
}

function collectHookNameKeys(hooks = []) {
  return hooks.flatMap(hook => collectEffectNameKeys(hook.effects))
}

function collectHookEffectItems(hooks = []) {
  return hooks.flatMap(hook => collectEffectItems(hook.effects, {
    trigger: hook.trigger,
    every: hook.every,
    offset: hook.offset,
    everyRounds: hook.everyRounds,
    roundOffset: hook.roundOffset,
    onceKey: hook.onceKey,
    conditions: compactConditions([hook.condition]),
  }))
}

function buildDamageStep(step) {
  return {
    stat: step.stat,
    definition: step,
    damageType: step.damageType,
    percent: valueRange(step.percent),
    hits: valueRange(step.hits),
    originalTargetCount: step.originalTargetCount ?? null,
    conditionKey: step.conditionKey ?? null,
  }
}

function buildSkillDetail(skillKey, skill) {
  const damageSteps = (skill.damageSteps ?? []).map(buildDamageStep)
  const afterStepEffectKeys = (skill.damageSteps ?? []).flatMap(step => collectEffectNameKeys(step.afterEffects))
  const afterStepEffectItems = (skill.damageSteps ?? []).flatMap(step => collectEffectItems(step.afterEffects, {
    trigger: 'afterDamageStep',
    conditions: compactConditions([skill.condition, step.condition]),
  }))
  return {
    key: skillKey,
    nameKey: skill.nameKey,
    cooldown: skill.cooldown,
    damageType: skill.damageType,
    damageSteps,
    effectNameKeys: unique([...collectHookNameKeys(skill.hooks), ...afterStepEffectKeys]),
    effectItems: [
      ...collectHookEffectItems((skill.hooks ?? []).map(hook => ({
        ...hook,
        condition: compactConditions([skill.condition, hook.condition]),
      }))),
      ...afterStepEffectItems,
    ],
    conditions: compactConditions([skill.condition]),
    conditionKeys: unique(damageSteps.map(step => step.conditionKey)),
    ignoredKeys: unique(skill.ignoredKeys ?? []),
  }
}

export function buildRaidCharacterDetail(character) {
  const passiveNameKeys = unique([
    ...(character.permanentModifiers ?? []).map(modifier => modifier.nameKey),
    ...(character.derivedModifiers ?? []).map(modifier => modifier.nameKey),
    ...collectHookNameKeys(character.hooks),
    ...(character.eventHooks ?? []).flatMap(hook => collectEffectNameKeys(hook.effects)),
  ])
  const passiveItems = [
    ...(character.permanentModifiers ?? []).filter(modifier => modifier.nameKey).map(modifier => ({
      nameKey: modifier.nameKey, type: 'modifier', target: 'self', targetCount: null, targetElement: null, sourceTarget: null,
      targetConditions: [], trigger: 'permanent', event: null, every: null, offset: null, everyRounds: null, roundOffset: null, once: false, conditions: [],
      duration: null, durationRounds: null, maxStacks: null, amount: null, value: null,
      modifiers: [{ channel: modifier.channel, rate: valueRange(modifier.rate), valueSpec: modifier.rate }], bossRates: [],
    })),
    ...(character.derivedModifiers ?? []).filter(modifier => modifier.nameKey).map(modifier => ({
      nameKey: modifier.nameKey, type: 'modifier', target: 'self', targetCount: null, targetElement: null, sourceTarget: null,
      targetConditions: [], trigger: 'permanent', event: null, every: null, offset: null, everyRounds: null, roundOffset: null, once: false, conditions: [],
      duration: null, durationRounds: null, maxStacks: null, amount: null, value: null,
      modifiers: [{ channel: modifier.channel, rate: valueRange(modifier.rate), valueSpec: modifier.rate }], bossRates: [],
    })),
    ...collectHookEffectItems(character.hooks),
    ...(character.eventHooks ?? []).flatMap(hook => collectEffectItems(hook.effects, {
      trigger: 'event', event: hook.event, conditions: compactConditions([hook.condition]),
    })),
  ]

  return {
    id: character.id,
    nameKey: character.nameKey,
    speed: character.speed,
    element: character.element,
    jobFlags: character.jobFlags,
    skills: Object.entries(character.skills ?? {}).map(([key, skill]) => buildSkillDetail(key, skill)),
    normal: character.normal ? buildSkillDetail('normal', character.normal) : null,
    passiveNameKeys,
    passiveItems,
  }
}
