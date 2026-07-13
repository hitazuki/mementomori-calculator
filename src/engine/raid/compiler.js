import { RAID_TABLE_CHARACTERS, createDefaultRaidTableConfig } from '../../constants/raidTableCharacters.js'
import { DEFAULT_RAID_MECHANICS } from './mechanics.js'

const SUPPORTED_TRIGGERS = new Set([
  'battleStart', 'roundStart', 'actionStart', 'beforeDamage', 'afterHit', 'afterCriticalHit', 'afterDamage', 'actionEnd',
])

export const DEFAULT_RAID_ENVIRONMENT = Object.freeze({
  characters: RAID_TABLE_CHARACTERS,
  mechanics: DEFAULT_RAID_MECHANICS,
})

function validateOrder(name, values, lineup) {
  if (!Array.isArray(values) || values.length !== lineup.length) throw new Error(`${name} must contain every lineup character exactly once`)
  const unique = new Set(values)
  if (unique.size !== lineup.length || lineup.some(id => !unique.has(id))) throw new Error(`${name} must contain every lineup character exactly once`)
}

function normalizeConfig(config, characters) {
  const defaults = createDefaultRaidTableConfig()
  const lineup = [...(config.lineup ?? defaults.lineup)]
  if (lineup.length < 1 || lineup.length > 5 || new Set(lineup).size !== lineup.length) {
    throw new Error('lineup must contain one to five unique supported characters')
  }
  for (const id of lineup) if (!characters[id]) throw new Error(`Unsupported raid table character: ${id}`)
  const attackPriority = [...(config.attackPriority ?? defaults.attackPriority.filter(id => lineup.includes(id)))]
  validateOrder('attackPriority', attackPriority, lineup)
  const speeds = Object.fromEntries(lineup.map(id => {
    const value = config.speeds?.[id] ?? defaults.speeds[id] ?? characters[id].speed
    if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid speed for raid table character: ${id}`)
    return [id, value]
  }))
  const turns = config.turns ?? defaults.turns
  if (!Number.isInteger(turns) || turns < 1) throw new Error('turns must be a positive integer')
  const baseCriticalDamageBonus = config.baseCriticalDamageBonus ?? defaults.baseCriticalDamageBonus
  if (!Number.isFinite(baseCriticalDamageBonus) || baseCriticalDamageBonus < 0) throw new Error('baseCriticalDamageBonus must be non-negative')
  return {
    lineup, attackPriority, speeds, turns,
    guaranteedCritical: config.guaranteedCritical ?? defaults.guaranteedCritical,
    baseCriticalDamageBonus,
    probabilityOverrides: { ...defaults.probabilityOverrides, ...(config.probabilityOverrides ?? {}) },
  }
}

function compileCondition(condition, mechanics, path) {
  if (!condition) return null
  const handler = mechanics.conditionHandlers[condition.type]
  if (!handler) throw new Error(`Unregistered raid condition '${condition.type}' at ${path}`)
  return { definition: condition, handler }
}

function compileValue(value, mechanics, path) {
  if (typeof value === 'number') return { definition: { type: 'fixed', value }, handler: mechanics.valueResolvers.fixed }
  if (!value || typeof value !== 'object') throw new Error(`Invalid raid value at ${path}`)
  const handler = mechanics.valueResolvers[value.type]
  if (!handler) throw new Error(`Unregistered raid value resolver '${value.type}' at ${path}`)
  const compiled = { definition: value, handler }
  if (value.type === 'conditional') compiled.condition = compileCondition(value.condition, mechanics, `${path}.condition`)
  return compiled
}

function compileEffect(effect, mechanics, path, character) {
  const handler = mechanics.effectHandlers[effect.type]
  if (!handler) throw new Error(`Unregistered raid effect '${effect.type}' at ${path}`)
  if (effect.target && !mechanics.targetSelectors[effect.target]) throw new Error(`Unregistered raid target selector '${effect.target}' at ${path}`)
  if (effect.sourceTarget && !mechanics.targetSelectors[effect.sourceTarget]) throw new Error(`Unregistered raid source target selector '${effect.sourceTarget}' at ${path}`)
  if (effect.type === 'copyStatuses' && !effect.sourceTarget) throw new Error(`Raid copyStatuses effect requires sourceTarget at ${path}`)
  if (effect.type === 'removeStatuses' && (!Number.isInteger(effect.count) || effect.count < 1)) {
    throw new Error(`Raid removeStatuses effect requires a positive integer count at ${path}`)
  }
  if (effect.type === 'bossStatus' && effect.replacementKey != null && (typeof effect.replacementKey !== 'string' || !effect.replacementKey)) {
    throw new Error(`Raid bossStatus replacementKey must be a non-empty string at ${path}`)
  }
  if (effect.copyAttackRateAsSourceAttack != null && typeof effect.copyAttackRateAsSourceAttack !== 'boolean') throw new Error(`Raid copyAttackRateAsSourceAttack must be boolean at ${path}`)
  if (effect.type === 'changeCounter' && !(effect.counter in (character.runtime?.counters ?? {}))) {
    throw new Error(`Unknown raid counter '${effect.counter}' at ${path}`)
  }
  const compileModifier = (modifier, modifierPath, valueKey) => {
    const compiledValue = compileValue(modifier[valueKey], mechanics, `${modifierPath}.${valueKey}`)
    const counter = compiledValue.definition.counter
    if (counter && !(counter in (character.runtime?.counters ?? {}))) {
      throw new Error(`Unknown raid counter '${counter}' at ${modifierPath}`)
    }
    return { ...modifier, [`compiled${valueKey[0].toUpperCase()}${valueKey.slice(1)}`]: compiledValue }
  }
  return {
    ...effect,
    modifiers: (effect.modifiers ?? []).map((modifier, index) => (
      compileModifier(modifier, `${path}.modifiers[${index}]`, 'rate')
    )),
    symbolicModifiers: (effect.symbolicModifiers ?? []).map((modifier, index) => (
      compileModifier(modifier, `${path}.symbolicModifiers[${index}]`, 'coefficient')
    )),
    compiledCondition: compileCondition(effect.condition, mechanics, `${path}.condition`),
    compiledTargetCondition: compileCondition(effect.targetCondition, mechanics, `${path}.targetCondition`),
    handler,
  }
}

function compileHook(hook, mechanics, path, character) {
  if (!SUPPORTED_TRIGGERS.has(hook.trigger)) throw new Error(`Unsupported raid trigger '${hook.trigger}' at ${path}`)
  return {
    ...hook,
    compiledCondition: compileCondition(hook.condition, mechanics, `${path}.condition`),
    effects: (hook.effects ?? []).map((effect, index) => compileEffect(effect, mechanics, `${path}.effects[${index}]`, character)),
  }
}

function groupHooks(hooks) {
  const grouped = Object.fromEntries([...SUPPORTED_TRIGGERS].map(trigger => [trigger, []]))
  for (const hook of hooks) grouped[hook.trigger].push(hook)
  return grouped
}

function compileDamageStep(step, mechanics, path, character) {
  const percent = compileValue(step.percent, mechanics, `${path}.percent`)
  const hits = compileValue(step.hits ?? 1, mechanics, `${path}.hits`)
  for (const compiled of [percent, hits]) {
    const counter = compiled.definition.counter
    if (counter && !(counter in (character.runtime?.counters ?? {}))) throw new Error(`Unknown raid counter '${counter}' at ${path}`)
  }
  return { ...step, compiledPercent: percent, compiledHits: hits }
}

function compileAction(action, mechanics, path, character) {
  const hooks = (action.hooks ?? []).map((hook, index) => compileHook(hook, mechanics, `${path}.hooks[${index}]`, character))
  return {
    ...action,
    damageSteps: (action.damageSteps ?? []).map((step, index) => compileDamageStep(step, mechanics, `${path}.damageSteps[${index}]`, character)),
    hooksByTrigger: groupHooks(hooks),
  }
}

function compileCharacter(character, mechanics) {
  const path = `character[${character.id}]`
  const hooks = (character.hooks ?? []).map((hook, index) => compileHook(hook, mechanics, `${path}.hooks[${index}]`, character))
  const eventHooks = (character.eventHooks ?? []).map((eventHook, eventIndex) => ({
    ...eventHook,
    effects: (eventHook.effects ?? []).map((effect, effectIndex) => compileEffect(effect, mechanics, `${path}.eventHooks[${eventIndex}].effects[${effectIndex}]`, character)),
  }))
  const derivedModifiers = (character.derivedModifiers ?? []).map((modifier, index) => {
    const compiledRate = compileValue(modifier.rate, mechanics, `${path}.derivedModifiers[${index}].rate`)
    const counter = compiledRate.definition.counter
    if (counter && !(counter in (character.runtime?.counters ?? {}))) {
      throw new Error(`Unknown raid counter '${counter}' at ${path}.derivedModifiers[${index}]`)
    }
    return { ...modifier, compiledRate }
  })
  return {
    ...character,
    derivedModifiers,
    hooksByTrigger: groupHooks(hooks),
    eventHooks,
    normal: compileAction(character.normal, mechanics, `${path}.normal`, character),
    skills: {
      s1: compileAction(character.skills.s1, mechanics, `${path}.skills.s1`, character),
      s2: compileAction(character.skills.s2, mechanics, `${path}.skills.s2`, character),
    },
  }
}

export function compileRaidProgram(config = {}, environment = DEFAULT_RAID_ENVIRONMENT) {
  const characters = environment.characters ?? RAID_TABLE_CHARACTERS
  const mechanics = environment.mechanics ?? DEFAULT_RAID_MECHANICS
  const normalizedConfig = normalizeConfig(config, characters)
  const compiledCharacters = Object.fromEntries(normalizedConfig.lineup.map(id => [id, compileCharacter(characters[id], mechanics)]))
  const eventListeners = {}
  for (const id of normalizedConfig.lineup) {
    for (const eventHook of compiledCharacters[id].eventHooks) {
      if (!eventListeners[eventHook.event]) eventListeners[eventHook.event] = []
      eventListeners[eventHook.event].push({ actorId: id, hook: eventHook })
    }
  }
  return { config: normalizedConfig, characters: compiledCharacters, eventListeners, mechanics }
}
