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
const strictDocs = process.argv.includes('--strict-docs')
let docSummary = ''
const knownChannels = new Set(['attackRate', 'damageRate', 'criticalDamageBonus', 'speedRate', 'cooldownRecoveryBonus'])
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

const documentedModels = new Set(['implemented', 'ignored', 'unresolved', 'outOfScope'])

function collectValues(value, key, values = new Set()) {
  if (!value || typeof value !== 'object') return values
  if (Object.prototype.hasOwnProperty.call(value, key)) values.add(value[key])
  for (const child of Object.values(value)) collectValues(child, key, values)
  return values
}

function checkCharacterRecord(record, directoryName, character) {
  const location = `character record '${directoryName}'`
  const match = /^(\d+)-([a-z][a-z0-9-]*)$/.exec(directoryName)
  if (!match) return error(`${location}: directory must use '<id>-<slug>'`)
  const [directoryId, directorySlug] = [Number(match[1]), match[2]]
  if (!record || typeof record !== 'object' || Array.isArray(record)) return error(`${location}: record.json must be an object`)
  if (record.formatVersion !== 1) error(`${location}: unsupported formatVersion '${record.formatVersion}'`)
  if (record.characterId !== directoryId || record.characterId !== character.id) error(`${location}: characterId must match directory and roster character`)
  if (record.slug !== directorySlug) error(`${location}: slug must match directory name`)
  if (record.build?.level !== 240 || record.build?.exclusive !== 'EX3') error(`${location}: build must explicitly be Lv240 / EX3`)
  const master = masterCharacters.get(character.id)
  if (!master) return error(`${location}: CharacterMB entry is missing`)
  if (!same(record.sources?.activeSkillIds, master.ActiveSkillIds)) error(`${location}: activeSkillIds must match CharacterMB`)
  if (!same(record.sources?.passiveSkillIds, master.PassiveSkillIds)) error(`${location}: passiveSkillIds must match CharacterMB`)
  if (!Array.isArray(record.sources?.combatLogs)) error(`${location}: sources.combatLogs must be an array`)
  if (!Array.isArray(record.terms)) error(`${location}: terms must be an array`)
  if (!Array.isArray(record.effectGroups)) error(`${location}: effectGroups must be an array`)
  if (!Array.isArray(record.ignored)) error(`${location}: ignored must be an array`)
  if (!Array.isArray(record.unresolved)) error(`${location}: unresolved must be an array`)

  for (const [index, term] of (record.terms ?? []).entries()) {
    if (!['activeSkill', 'passiveSkill'].includes(term.kind)) error(`${location}.terms[${index}]: kind must be activeSkill or passiveSkill`)
    if (!Number.isInteger(term.sourceId)) error(`${location}.terms[${index}]: sourceId must be an integer`)
    if (!documentedModels.has(term.model)) error(`${location}.terms[${index}]: unsupported model '${term.model}'`)
    if (!term.summary?.trim()) error(`${location}.terms[${index}]: summary is required`)
  }
  for (const id of master.ActiveSkillIds) {
    if (!(record.terms ?? []).some(term => term.kind === 'activeSkill' && term.sourceId === id)) error(`${location}: ActiveSkillMB ${id} has no term record`)
  }
  for (const id of master.PassiveSkillIds) {
    if (!(record.terms ?? []).some(term => term.kind === 'passiveSkill' && term.sourceId === id)) error(`${location}: PassiveSkillMB ${id} has no term record`)
  }

  for (const [index, group] of (record.effectGroups ?? []).entries()) {
    if (!Number.isInteger(group.id)) error(`${location}.effectGroups[${index}]: id must be an integer`)
    if (!documentedModels.has(group.model)) error(`${location}.effectGroups[${index}]: unsupported model '${group.model}'`)
    if (!group.summary?.trim()) error(`${location}.effectGroups[${index}]: summary is required`)
  }
  const implementedGroups = [...collectValues(character, 'effectGroupId')].filter(Number.isInteger)
  for (const id of implementedGroups) {
    if (!(record.effectGroups ?? []).some(group => group.id === id)) error(`${location}: code EffectGroup ${id} has no record`)
  }

  for (const [index, ignored] of (record.ignored ?? []).entries()) {
    if (!ignored.key?.trim() || !ignored.summary?.trim()) error(`${location}.ignored[${index}]: key and summary are required`)
  }
  const codeIgnoredKeys = [...collectValues(character, 'ignoredKeys')].flat()
  for (const key of codeIgnoredKeys) {
    if (!(record.ignored ?? []).some(ignored => ignored.key === key)) error(`${location}: code ignored key '${key}' has no record`)
  }
}

const masterCharacters = new Map(JSON.parse(fs.readFileSync(path.join(root, 'data', 'Master', 'CharacterMB.json'), 'utf8')).map(character => [character.Id, character]))

function checkCharacterRecords() {
  const docsRoot = path.join(root, 'doc', 'raid', 'characters')
  if (!fs.existsSync(docsRoot)) return error('doc/raid/characters directory is missing')
  const directories = fs.readdirSync(docsRoot, { withFileTypes: true }).filter(entry => entry.isDirectory())
  const documentedIds = new Set()
  for (const directory of directories) {
    const location = path.join(docsRoot, directory.name)
    const evidencePath = path.join(location, 'evidence.md')
    const recordPath = path.join(location, 'record.json')
    if (!fs.existsSync(evidencePath)) error(`character record '${directory.name}': evidence.md is missing`)
    if (!fs.existsSync(recordPath)) { error(`character record '${directory.name}': record.json is missing`); continue }
    let record
    try { record = JSON.parse(fs.readFileSync(recordPath, 'utf8')) } catch (parseError) { error(`character record '${directory.name}': invalid JSON (${parseError.message})`); continue }
    const character = RAID_TABLE_CHARACTERS[record.characterId]
    if (!character) { error(`character record '${directory.name}': characterId ${record.characterId} is not in the roster`); continue }
    documentedIds.add(record.characterId)
    checkCharacterRecord(record, directory.name, character)
  }
  const missing = RAID_TABLE_ROSTER.filter(id => !documentedIds.has(id))
  if (strictDocs && missing.length) error(`strict docs: ${missing.length} roster character(s) have no record.json (${missing.join(', ')})`)
  docSummary = `${documentedIds.size}/${RAID_TABLE_ROSTER.length} character records${strictDocs ? ' (strict)' : ''}`
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

checkCharacterRecords()

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
  console.log(`Raid character validation passed: ${RAID_TABLE_ROSTER.length} characters, ${localeNames.length} locales, ${docSummary}, ${warnings.length} warning(s).`)
}
