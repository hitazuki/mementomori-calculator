import fs from 'node:fs'
import path from 'node:path'
import { requireMasterDirectory } from './lib/masterDirectory.mjs'

const directory = requireMasterDirectory(process.argv[2], 'node scripts/generate_equipment_upgrade.mjs <master-directory> [--check]')
const read = name => JSON.parse(fs.readFileSync(path.join(directory, `${name}MB.json`), 'utf8'))
const equipment = read('Equipment').filter(row => !row.IsIgnore)
const coefficients = [1]
for (const row of read('EquipmentReinforcementParameter').sort((a, b) => a.Id - b.Id)) {
  if (row.Id !== coefficients.length || !(row.ReinforcementCoefficient > 0)) throw new Error('Invalid reinforcement coefficients')
  coefficients.push(row.ReinforcementCoefficient)
}
const locales = { 'zh-CN': 'ZhCn', 'zh-TW': 'ZhTw', en: 'EnUs', ja: 'JaJp', ko: 'KoKr' }
const texts = Object.fromEntries(Object.entries(locales).map(([locale, code]) => [locale, new Map(read(`TextResource${code}`).map(row => [row.StringKey, row.Text]))]))
const sets = read('EquipmentSet')
const series = [10, 11, 12, 13, 14].map(id => {
  const set = sets.find(row => row.Id === id)
  const names = Object.fromEntries(Object.entries(texts).map(([locale, map]) => {
    const name = map.get(set?.NameKey)
    if (!name) throw new Error(`Missing equipment series name: ${id}/${locale}`)
    return [locale, name]
  }))
  const slots = {}
  for (const [slot, stat, type] of [[3, 'def', 13], [4, 'pdef', 3], [5, 'mdef', 4], [6, 'def', 13]]) {
    const rows = equipment.filter(row => row.EquipmentSetId === id && row.SlotType === slot && row.EquipmentLv <= 1000).sort((a, b) => a.EquipmentLv - b.EquipmentLv)
    if (!rows.length || new Set(rows.map(row => row.EquipmentLv)).size !== rows.length) throw new Error('Missing or duplicate levels')
    slots[slot] = { stat, rows: rows.map(row => {
      const parameter = row.BattleParameterChangeInfo
      const next = equipment.find(candidate => candidate.Id === row.AfterLevelEvolutionEquipmentId)
      if (parameter.BattleParameterType !== type || parameter.ChangeParameterType !== 1 || !Number.isSafeInteger(parameter.Value) || !coefficients[row.EquipmentLv]) throw new Error('Invalid equipment parameters')
      if (row.AfterLevelEvolutionEquipmentId && (!next || next.EquipmentSetId !== id || next.SlotType !== slot || next.EquipmentLv <= row.EquipmentLv)) throw new Error('Invalid level evolution')
      return [row.EquipmentLv, parameter.Value, next && next.EquipmentLv <= 1000 ? next.EquipmentLv : null]
    }) }
  }
  if (JSON.stringify(slots[3]) !== JSON.stringify(slots[6])) throw new Error('Hands and feet are not equivalent')
  return { id, names, stats: Object.fromEntries([3, 4, 5].map(slot => [slots[slot].stat, slots[slot].rows])) }
})
const output = JSON.stringify({ version: 1, coefficients, series }) + '\n'
const destination = new URL('../src/constants/equipmentUpgrade.json', import.meta.url)
if (process.argv.includes('--check')) {
  if (fs.readFileSync(destination, 'utf8').replace(/\r\n/g, '\n') !== output) throw new Error('Equipment upgrade data needs regeneration')
} else fs.writeFileSync(destination, output)
