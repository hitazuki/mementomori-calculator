import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const master = path.resolve(process.argv[2] || path.join(root, 'data/Master'))
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
fs.mkdirSync(output, { recursive: true })
for (const [locale, file] of Object.entries({ 'zh-CN': 'ZhCn', 'zh-TW': 'ZhTw', en: 'EnUs', ja: 'JaJp', ko: 'KoKr' })) {
  const texts = new Map(read(`TextResource${file}`).map(item => [item.StringKey, item.Text]))
  const text = key => (texts.get(key) ?? '').replace(/<br\s*\/?\s*>/gi, '\n')
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
      exclusiveEffects: [1, 2, 3].flatMap(level => {
        const key = exclusive?.[`Description${level}Key`]
        if (!key || key === '*') return []
        const description = text(key)
        if (!description) throw new Error(`Missing ${locale} exclusive description: ${character.Id}/${level}`)
        return [{ level, text: description }]
      }),
      skills: [
        ...(character.ActiveSkillIds ?? []).map((id, index) => buildSkill(id, `S${index + 1}`, 'active')),
        ...(character.PassiveSkillIds ?? []).map((id, index) => buildSkill(id, `P${index + 1}`, 'passive')),
      ].filter(Boolean),
    }
  })
  fs.writeFileSync(path.join(output, `${locale}.json`), JSON.stringify({ schemaVersion: 1, source: 'moonheart/mementomori-masterbook', characters: records }) + '\n')
}
console.log(`Generated character catalog: ${characters.length} characters, 5 locales.`)
