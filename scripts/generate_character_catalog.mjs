import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { characterExclusiveEffects } from './lib/characterExclusive.mjs'
import { requireMasterDirectory } from './lib/masterDirectory.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const master = requireMasterDirectory(process.argv[2], 'npm run generate:catalog -- <master-directory> [output-directory]')
const output = path.resolve(process.argv[3] || path.join(root, 'public/data/character-catalog'))
const read = name => JSON.parse(fs.readFileSync(path.join(master, `${name}MB.json`), 'utf8'))
const characters = read('Character').filter(character => !character.IsIgnore).sort((a, b) => a.Id - b.Id)
const active = new Map(read('ActiveSkill').map(skill => [skill.Id, skill]))
const passive = new Map(read('PassiveSkill').map(skill => [skill.Id, skill]))
const effects = read('EquipmentExclusiveEffect')
const equipment = read('Equipment')
const descriptions = new Map(read('EquipmentExclusiveSkillDescription').map(item => [item.Id, item]))
const exclusiveByCharacter = new Map(characters.map(character => {
  const ids = new Set(effects.filter(effect => effect.CharacterId === character.Id).map(effect => effect.Id))
  const item = equipment.find(item => ids.has(item.ExclusiveEffectId) && item.EquipmentExclusiveSkillDescriptionId)
  return [character.Id, descriptions.get(item?.EquipmentExclusiveSkillDescriptionId)]
}))
const battleNames = {
  1: '[BattleParameterTypeHp]',
  2: '[BattleParameterTypeAttackPower]',
  3: '[BattleParameterTypePhysicalDamageRelax]',
  4: '[BattleParameterTypeMagicDamageRelax]',
  5: '[BattleParameterTypeHit]',
  6: '[BattleParameterTypeAvoidance]',
  7: '[BattleParameterTypeCritical]',
  8: '[BattleParameterTypeCriticalResist]',
  9: '[BattleParameterTypeCriticalDamageEnhance]',
  10: '[BattleParameterTypePhysicalCriticalDamageRelax]',
  11: '[BattleParameterTypeMagicCriticalDamageRelax]',
  12: '[BattleParameterTypeDefensePenetration]',
  13: '[BattleParameterTypeDefense]',
  14: '[BattleParameterTypeDamageEnhance]',
  15: '[BattleParameterTypeDebuffHit]',
  16: '[BattleParameterTypeDebuffResist]',
  17: '[BattleParameterTypeDamageReflect]',
  18: '[BattleParameterTypeHpDrain]',
  19: '[BattleParameterTypeSpeed]'
}
const baseNames = { 1: '[BaseParameterTypeMuscle]', 2: '[BaseParameterTypeEnergy]', 3: '[BaseParameterTypeIntelligence]', 4: '[BaseParameterTypeHealth]' }
const rarityName = flags => ({ 1: 'N', 2: 'R', 4: 'R+', 8: 'SR', 16: 'SR+', 32: 'SSR', 64: 'SSR+', 128: 'UR', 256: 'UR+', 512: 'LR' })[flags] ?? (flags >= 1024 ? `LR+${Math.log2(flags / 512)}` : String(flags))
const collections = read('CharacterCollection').filter(item => !item.IsIgnore)
const collectionLevels = read('CharacterCollectionLevel').filter(item => !item.IsIgnore)
const DETAIL_SHARD_SIZE = 20
const summaryFields = ['id', 'name', 'title', 'element', 'job', 'rarity', 'speed']
const characterSummary = character => Object.fromEntries(summaryFields.map(key => [key, character[key]]))
fs.mkdirSync(output, { recursive: true })
for (const [locale, file] of Object.entries({ 'zh-CN': 'ZhCn', 'zh-TW': 'ZhTw', en: 'EnUs', ja: 'JaJp', ko: 'KoKr' })) {
  const texts = new Map(read(`TextResource${file}`).map(item => [item.StringKey, item.Text]))
  const text = key => (texts.get(key) ?? '').replace(/<br\s*\/?\s*>/gi, '\n')
  const parameters = (battle = [], base = []) => [
    ...(battle ?? []).map(info => ({ ...info, nameKey: battleNames[info.BattleParameterType], percent: info.ChangeParameterType === 2 || [9, 10, 11, 17, 18].includes(info.BattleParameterType) })),
    ...(base ?? []).map(info => ({ ...info, nameKey: baseNames[info.BaseParameterType], percent: info.ChangeParameterType === 2 })),
  ].map(info => {
    const name = text(info.nameKey)
    if (!name) throw new Error(`Missing parameter name: ${info.nameKey}`)
    if (![1, 2, 3].includes(info.ChangeParameterType)) throw new Error(`Unsupported parameter change: ${info.ChangeParameterType}`)
    return { name, growth: info.ChangeParameterType === 3, value: info.percent ? info.Value / 100 : info.Value, percent: info.percent }
  })
  const records = characters.map(character => {
    const exclusive = exclusiveByCharacter.get(character.Id)
    const buildSkill = (id, slot, source) => {
      const skill = (source === 'active' ? active : passive).get(id)
      if (!skill || !text(skill.NameKey) || skill.NameKey === '*') return null
      const levels = (skill.ActiveSkillInfos ?? skill.PassiveSkillInfos ?? []).filter(info => !info.EquipmentRarityFlags).map(info => {
        return { type: 'level', level: info.OrderNumber, unlockLevel: info.CharacterLevel, text: text(info.DescriptionKey) }
      }).filter(level => level.text)
      if (!levels.length) return null
      return { id, slot, name: text(skill.NameKey), cooldown: skill.SkillMaxCoolTime ?? null, levels }
    }
    const name = text(character.NameKey)
    if (!name) throw new Error(`Missing ${locale} character name: ${character.Id}`)
    return {
      id: character.Id, name, title: text(character.Name2Key), element: character.ElementType,
      job: character.JobFlags, rarity: ({ 1: 'N', 2: 'R', 8: 'SR' })[character.RarityFlags] ?? String(character.RarityFlags),
      speed: character.InitialBattleParameter?.Speed ?? null,
      exclusivePassives: effects.filter(effect => effect.CharacterId === character.Id && !effect.IsIgnore).flatMap(effect => {
        const items = equipment.filter(item => item.ExclusiveEffectId === effect.Id && !item.IsIgnore).sort((a, b) => a.RarityFlags - b.RarityFlags || a.EquipmentLv - b.EquipmentLv)
        if (!items.length) return []
        const item = items[0]
        return [{ id: effect.Id, name: text(item.NameKey), rarity: ({ 128: 'SSR', 256: 'UR', 512: 'LR' })[item.RarityFlags] ?? String(item.RarityFlags), rarityFlags: item.RarityFlags, level: item.EquipmentLv, parameters: parameters(effect.BattleParameterChangeInfoList, effect.BaseParameterChangeInfoList) }]
      }).sort((a, b) => a.rarityFlags - b.rarityFlags || a.level - b.level),
      collections: collections.filter(item => item.RequiredCharacterIds?.includes(character.Id)).map(item => ({
        id: item.Id, name: text(item.NameKey),
        members: item.RequiredCharacterIds.map(id => {
          const member = characters.find(candidate => candidate.Id === id)
          return { id, name: member ? [text(member.Name2Key), text(member.NameKey)].filter(Boolean).join(' · ') : `#${id}` }
        }),
        levels: collectionLevels.filter(level => level.CollectionId === item.Id).sort((a, b) => a.CollectionLevel - b.CollectionLevel).map(level => ({
          level: level.CollectionLevel, rarity: rarityName(level.CharacterRarityFlags),
          parameters: parameters(level.BattleParameterChangeInfos, level.BaseParameterChangeInfos),
          rarityBonus: level.CharacterRarityBonus, maxLevelIncrease: level.MaxLevelIncreaseValue,
        })),
      })),
      exclusiveEffects: characterExclusiveEffects(character, active, passive, exclusive, text),
      skills: [
        ...(character.ActiveSkillIds ?? []).map((id, index) => buildSkill(id, `S${index + 1}`, 'active')),
        ...(character.PassiveSkillIds ?? []).map((id, index) => buildSkill(id, `P${index + 1}`, 'passive')),
      ].filter(Boolean),
    }
  })
  const localeOutput = path.join(output, locale)
  const detailOutput = path.join(localeOutput, 'details')
  fs.rmSync(localeOutput, { recursive: true, force: true })
  fs.mkdirSync(detailOutput, { recursive: true })
  const shards = new Map()
  for (const record of records) {
    const shard = Math.floor((record.id - 1) / DETAIL_SHARD_SIZE)
    if (!shards.has(shard)) shards.set(shard, [])
    shards.get(shard).push(record)
  }
  fs.writeFileSync(path.join(localeOutput, 'index.json'), JSON.stringify({
    schemaVersion: 2,
    source: 'moonheart/mementomori-masterbook',
    shardSize: DETAIL_SHARD_SIZE,
    characters: records.map(characterSummary),
  }) + '\n')
  for (const [shard, characters] of shards) {
    fs.writeFileSync(path.join(detailOutput, `${shard}.json`), JSON.stringify({ schemaVersion: 2, characters }) + '\n')
  }
}
for (const locale of ['zh-CN', 'zh-TW', 'en', 'ja', 'ko']) fs.rmSync(path.join(output, `${locale}.json`), { force: true })
console.log(`Generated sharded character catalog: ${characters.length} characters, 5 locales.`)
