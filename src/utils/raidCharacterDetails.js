import { RAID_CHARACTER_MB_TEXTS } from '../constants/raid/characterMbTexts.js'

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
  const values = unique(numericCandidates(value)).sort((left, right) => left - right)
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
  if (effect.type === 'cooldownReduction') return 'raidCharacterCooldownReductionEffect'
  if (effect.type === 'setCooldown') return 'raidCharacterCooldownResetEffect'
  if (effect.type === 'changeCounter') return 'raidCharacterCounterChangeEffect'
  if (effect.type === 'emitEvent' && effect.event === 'selfDamage') return 'raidCharacterSelfDamageEffect'
  if (effect.type === 'emitEvent' && effect.event === 'activeSkillHeal') return 'raidCharacterHealingEffect'
  return null
}

function collectEffectItems(effects = []) {
  const items = []
  for (const effect of effects) {
    if (!effect || typeof effect !== 'object') continue
    const nameKey = effect.nameKey ?? effectFallbackKey(effect)
    if (nameKey) {
      items.push({
        nameKey,
        type: effect.type,
        duration: effect.duration ?? null,
        durationRounds: effect.durationRounds ?? null,
        maxStacks: effect.maxStacks ?? null,
        amount: effect.amount ?? null,
        value: effect.value ?? null,
        modifiers: (effect.modifiers ?? []).map(modifier => ({ channel: modifier.channel, rate: valueRange(modifier.rate) })),
        bossRates: [
          ['damageRate', effect.damageRatePerStack],
          ['defenseRate', effect.defenseRatePerStack],
          ['physicalDefenseRate', effect.physicalDefenseRatePerStack],
          ['magicDefenseRate', effect.magicDefenseRatePerStack],
        ].filter(([, rate]) => rate != null && rate !== 0).map(([channel, rate]) => ({ channel, rate: valueRange(rate) })),
      })
    }
    items.push(...collectEffectItems(effect.effects))
  }
  return items
}

function collectHookNameKeys(hooks = []) {
  return hooks.flatMap(hook => collectEffectNameKeys(hook.effects))
}

function collectHookEffectItems(hooks = []) {
  return hooks.flatMap(hook => collectEffectItems(hook.effects))
}

function buildDamageStep(step) {
  return {
    stat: step.stat,
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
  const afterStepEffectItems = (skill.damageSteps ?? []).flatMap(step => collectEffectItems(step.afterEffects))
  return {
    key: skillKey,
    nameKey: skill.nameKey,
    cooldown: skill.cooldown,
    damageType: skill.damageType,
    damageSteps,
    effectNameKeys: unique([...collectHookNameKeys(skill.hooks), ...afterStepEffectKeys]),
    effectItems: [...collectHookEffectItems(skill.hooks), ...afterStepEffectItems],
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
      nameKey: modifier.nameKey, type: 'modifier', duration: null, durationRounds: null, maxStacks: null, amount: null, value: null,
      modifiers: [{ channel: modifier.channel, rate: valueRange(modifier.rate) }], bossRates: [],
    })),
    ...(character.derivedModifiers ?? []).filter(modifier => modifier.nameKey).map(modifier => ({
      nameKey: modifier.nameKey, type: 'modifier', duration: null, durationRounds: null, maxStacks: null, amount: null, value: null,
      modifiers: [{ channel: modifier.channel, rate: valueRange(modifier.rate) }], bossRates: [],
    })),
    ...collectHookEffectItems(character.hooks),
    ...(character.eventHooks ?? []).flatMap(hook => collectEffectItems(hook.effects)),
  ]

  return {
    id: character.id,
    nameKey: character.nameKey,
    speed: character.speed,
    element: character.element,
    jobFlags: character.jobFlags,
    skills: Object.entries(character.skills ?? {}).map(([key, skill]) => buildSkillDetail(key, skill)),
    passiveNameKeys,
    passiveItems,
    mbTexts: RAID_CHARACTER_MB_TEXTS[character.id] ?? [],
  }
}
