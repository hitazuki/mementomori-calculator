#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function findRepoRoot(start) {
  let current = path.resolve(start)
  while (true) {
    if (fs.existsSync(path.join(current, 'package.json')) && fs.existsSync(path.join(current, 'src', 'engine', 'raid'))) return current
    const parent = path.dirname(current)
    if (parent === current) throw new Error('Cannot find the mmt-calculator repository root')
    current = parent
  }
}

const root = findRepoRoot(process.cwd())
const importFromRoot = relative => import(pathToFileURL(path.join(root, relative)).href)
const [{ RAID_TABLE_CHARACTERS, RAID_TABLE_ROSTER, RAID_STATUS_CLASSES, createDefaultRaidTableConfig }, { DEFAULT_RAID_MECHANICS }, { compileRaidProgram }, { raidTranslations }] = await Promise.all([
  importFromRoot('src/constants/raidTableCharacters.js'),
  importFromRoot('src/engine/raid/mechanics.js'),
  importFromRoot('src/engine/raid/compiler.js'),
  importFromRoot('src/locales/raid.js'),
])

const errors = []
const warnings = []
const knownChannels = new Set(['attackRate', 'damageRate', 'criticalDamageBonus', 'speedRate'])
const localeNames = Object.keys(raidTranslations)
const defaultConfig = createDefaultRaidTableConfig()
const seenCharacterIds = new Set()
const statusDefinitions = new Map()
const groupDefinitions = new Map()

function error(message) { errors.push(message) }
function warning(message) { warnings.push(message) }
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b) }

function checkLocaleKey(key, location) {
  if (!key) return
  const missing = localeNames.filter(locale => !(key in raidTranslations[locale]))
  if (missing.length) error(`${location}: locale key '${key}' missing from ${missing.join(', ')}`)
}

function checkCondition(condition, location) {
  if (!condition) return
  if (!DEFAULT_RAID_MECHANICS.conditionHandlers[condition.type]) error(`${location}: unregistered condition '${condition.type}'`)
  if (condition.type === 'probabilityEnabled' && !(condition.key in defaultConfig.probabilityOverrides)) {
    error(`${location}: probability key '${condition.key}' has no default in createDefaultRaidTableConfig()`)
  }
}

function checkValue(value, location, character) {
  if (typeof value === 'number') return
  if (!value || !DEFAULT_RAID_MECHANICS.valueResolvers[value.type]) {
    error(`${location}: unregistered or invalid value resolver '${value?.type}'`)
    return
  }
  if (value.counter && !(value.counter in (character.runtime?.counters ?? {}))) error(`${location}: unknown counter '${value.counter}'`)
  if (value.type === 'conditional') checkCondition(value.condition, `${location}.condition`)
}

function recordDefinition(map, key, semantic, location, kind) {
  const previous = map.get(key)
  if (previous && !same(previous.semantic, semantic)) error(`${location}: ${kind} '${key}' conflicts with ${previous.location}`)
  else if (!previous) map.set(key, { semantic, location })
}

function checkEffect(effect, location, character) {
  if (!effect || !DEFAULT_RAID_MECHANICS.effectHandlers[effect.type]) {
    error(`${location}: unregistered or invalid effect '${effect?.type}'`)
    return
  }
  if (effect.target && !DEFAULT_RAID_MECHANICS.targetSelectors[effect.target]) error(`${location}: unregistered target '${effect.target}'`)
  checkCondition(effect.condition, `${location}.condition`)
  checkLocaleKey(effect.nameKey, `${location}.nameKey`)

  if (effect.type === 'status') {
    if (!Number.isInteger(effect.effectGroupId)) error(`${location}: actor status requires an integer effectGroupId`)
    if (!Object.prototype.hasOwnProperty.call(effect, 'duration')) error(`${location}: actor status must explicitly use duration`)
    if (Object.prototype.hasOwnProperty.call(effect, 'durationRounds')) error(`${location}: actor status cannot use durationRounds`)
    if (!Array.isArray(effect.modifiers)) error(`${location}: status must explicitly resolve modifiers to an array (use [])`)
    if (!Array.isArray(effect.symbolicModifiers)) error(`${location}: status must explicitly resolve symbolicModifiers to an array (use [])`)
    for (const [index, modifier] of (effect.modifiers ?? []).entries()) {
      if (!knownChannels.has(modifier.channel)) error(`${location}.modifiers[${index}]: unsupported channel '${modifier.channel}'`)
      checkValue(modifier.rate, `${location}.modifiers[${index}].rate`, character)
      checkLocaleKey(modifier.nameKey, `${location}.modifiers[${index}].nameKey`)
    }
    recordDefinition(statusDefinitions, effect.id, {
      effectGroupId: effect.effectGroupId, nameKey: effect.nameKey, statusClass: effect.statusClass,
    }, location, 'status id')
    recordDefinition(groupDefinitions, effect.effectGroupId, {
      nameKey: effect.nameKey, statusClass: effect.statusClass,
    }, location, 'EffectGroup')
  }

  if (effect.type === 'bossStatus') {
    if (!Number.isInteger(effect.effectGroupId)) error(`${location}: boss status requires an integer effectGroupId`)
    if (!Object.prototype.hasOwnProperty.call(effect, 'durationRounds')) error(`${location}: boss status must explicitly use durationRounds`)
    if (Object.prototype.hasOwnProperty.call(effect, 'duration')) error(`${location}: boss status cannot use actor duration`)
    recordDefinition(statusDefinitions, effect.id, {
      effectGroupId: effect.effectGroupId, nameKey: effect.nameKey, statusClass: effect.statusClass,
    }, location, 'status id')
    recordDefinition(groupDefinitions, effect.effectGroupId, {
      nameKey: effect.nameKey, statusClass: effect.statusClass,
    }, location, 'EffectGroup')
  }

  if (effect.type === 'changeCounter' && !(effect.counter in (character.runtime?.counters ?? {}))) {
    error(`${location}: unknown counter '${effect.counter}'`)
  }
}

function checkHook(hook, location, character) {
  checkCondition(hook.condition, `${location}.condition`)
  for (const [index, effect] of (hook.effects ?? []).entries()) checkEffect(effect, `${location}.effects[${index}]`, character)
}

function checkAction(action, location, character) {
  if (!action) return error(`${location}: missing action definition`)
  checkLocaleKey(action.nameKey, `${location}.nameKey`)
  for (const [index, step] of (action.damageSteps ?? []).entries()) {
    checkValue(step.percent, `${location}.damageSteps[${index}].percent`, character)
    checkValue(step.hits ?? 1, `${location}.damageSteps[${index}].hits`, character)
    checkLocaleKey(step.conditionKey, `${location}.damageSteps[${index}].conditionKey`)
  }
  for (const [index, hook] of (action.hooks ?? []).entries()) checkHook(hook, `${location}.hooks[${index}]`, character)
  for (const [index, key] of (action.ignoredKeys ?? []).entries()) checkLocaleKey(key, `${location}.ignoredKeys[${index}]`)
}

if (localeNames.length !== 5) error(`expected five raid locales, found ${localeNames.length}: ${localeNames.join(', ')}`)
const baselineKeys = Object.keys(raidTranslations[localeNames[0]] ?? {})
for (const locale of localeNames.slice(1)) {
  const missing = baselineKeys.filter(key => !(key in raidTranslations[locale]))
  const extra = Object.keys(raidTranslations[locale]).filter(key => !(key in raidTranslations[localeNames[0]]))
  if (missing.length) error(`${locale}: missing ${missing.length} raid locale keys (${missing.slice(0, 8).join(', ')})`)
  if (extra.length) error(`${locale}: has ${extra.length} keys absent from ${localeNames[0]} (${extra.slice(0, 8).join(', ')})`)
}

for (const id of RAID_TABLE_ROSTER) {
  const character = RAID_TABLE_CHARACTERS[id]
  const location = `character[${id}]`
  if (!character) { error(`${location}: roster entry has no definition`); continue }
  if (seenCharacterIds.has(character.id)) error(`${location}: duplicate character id`)
  seenCharacterIds.add(character.id)
  if (character.id !== id) error(`${location}: map key and character.id differ`)
  checkLocaleKey(character.nameKey, `${location}.nameKey`)
  for (const [index, modifier] of (character.permanentModifiers ?? []).entries()) {
    if (!knownChannels.has(modifier.channel)) error(`${location}.permanentModifiers[${index}]: unsupported channel '${modifier.channel}'`)
    checkValue(modifier.rate, `${location}.permanentModifiers[${index}].rate`, character)
    checkLocaleKey(modifier.nameKey, `${location}.permanentModifiers[${index}].nameKey`)
  }
  for (const [index, modifier] of (character.derivedModifiers ?? []).entries()) {
    if (!knownChannels.has(modifier.channel)) error(`${location}.derivedModifiers[${index}]: unsupported channel '${modifier.channel}'`)
    checkValue(modifier.rate, `${location}.derivedModifiers[${index}].rate`, character)
    checkLocaleKey(modifier.nameKey, `${location}.derivedModifiers[${index}].nameKey`)
  }
  for (const [index, hook] of (character.hooks ?? []).entries()) checkHook(hook, `${location}.hooks[${index}]`, character)
  for (const [index, eventHook] of (character.eventHooks ?? []).entries()) {
    for (const [effectIndex, effect] of (eventHook.effects ?? []).entries()) checkEffect(effect, `${location}.eventHooks[${index}].effects[${effectIndex}]`, character)
  }
  checkAction(character.normal, `${location}.normal`, character)
  checkAction(character.skills?.s1, `${location}.skills.s1`, character)
  checkAction(character.skills?.s2, `${location}.skills.s2`, character)

  try {
    compileRaidProgram({ lineup: [id], attackPriority: [id], speeds: { [id]: character.speed }, turns: 1 })
  } catch (compileError) {
    error(`${location}: compiler rejected definition: ${compileError.message}`)
  }
}

for (const id of Object.keys(RAID_TABLE_CHARACTERS).map(Number)) {
  if (!RAID_TABLE_ROSTER.includes(id)) warning(`character[${id}] exists but is absent from RAID_TABLE_ROSTER`)
}

const characterDir = path.join(root, 'src', 'constants', 'raid', 'characters')
for (const file of fs.readdirSync(characterDir).filter(name => name.endsWith('.js') && name !== 'index.js')) {
  const source = fs.readFileSync(path.join(characterDir, file), 'utf8')
  if (/\bfunction\b|=>/.test(source)) error(`${file}: character modules must not define custom resolver functions`)
}

const engineDir = path.join(root, 'src', 'engine', 'raid')
const characterSlugs = fs.readdirSync(characterDir).filter(name => name.endsWith('.js') && name !== 'index.js').map(name => path.basename(name, '.js').toLowerCase())
for (const file of fs.readdirSync(engineDir).filter(name => name.endsWith('.js'))) {
  const source = fs.readFileSync(path.join(engineDir, file), 'utf8')
  for (const slug of characterSlugs) {
    if (source.toLowerCase().includes(slug)) error(`${file}: engine contains character-specific name '${slug}'`)
  }
  if (/(?:character|actor)\.id\s*={2,3}\s*\d+/.test(source)) error(`${file}: engine contains a character-id branch`)
}

for (const message of warnings) console.warn(`WARN: ${message}`)
for (const message of errors) console.error(`ERROR: ${message}`)
if (errors.length) {
  console.error(`Raid character validation failed with ${errors.length} error(s) and ${warnings.length} warning(s).`)
  process.exitCode = 1
} else {
  console.log(`Raid character validation passed: ${RAID_TABLE_ROSTER.length} characters, ${localeNames.length} locales, ${warnings.length} warning(s).`)
}
