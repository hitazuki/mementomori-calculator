import fs from 'node:fs'
import path from 'node:path'
import { requireMasterDirectory } from './lib/masterDirectory.mjs'

const directory = requireMasterDirectory(process.argv[2], 'node scripts/generate_equipment_upgrade.mjs <master-directory> [--check]')
const read = name => JSON.parse(fs.readFileSync(path.join(directory, `${name}MB.json`), 'utf8'))
const equipment = read('Equipment').filter(row => !row.IsIgnore && row.Category === 2)
const equipmentById = new Map(equipment.map(row => [row.Id, row]))
const evolutions = new Map(read('EquipmentEvolution').map(row => [row.Id, row]))
const coefficients = [1]
for (const row of read('EquipmentReinforcementParameter').sort((a, b) => a.Id - b.Id)) {
  if (row.Id !== coefficients.length || !(row.ReinforcementCoefficient > 0)) throw new Error('Invalid reinforcement coefficients')
  coefficients.push(row.ReinforcementCoefficient)
}
const locales = { 'zh-CN': 'ZhCn', 'zh-TW': 'ZhTw', en: 'EnUs', ja: 'JaJp', ko: 'KoKr' }
const texts = Object.fromEntries(Object.entries(locales).map(([locale, code]) => [locale, new Map(read(`TextResource${code}`).map(row => [row.StringKey, row.Text]))]))
const sets = read('EquipmentSet')
const cordie = read('Character').find(row => row.Id === 27 && !row.IsIgnore)
const rarity = read('CharacterPotentialCoefficient').find(row => row.InitialRarityFlags === cordie.RarityFlags && row.RarityFlags === 16384)
const { Muscle, Intelligence, Energy, Health } = cordie.BaseParameterCoefficient
const potentialByLevel = [0]
for (const row of read('CharacterPotential').filter(row => !row.IsIgnore && row.CharacterSubLevel === 0).sort((a, b) => a.CharacterLevel - b.CharacterLevel)) {
  if (row.CharacterLevel !== potentialByLevel.length || !Number.isSafeInteger(row.TotalBaseParameter) || row.TotalBaseParameter <= 0) throw new Error('Invalid character potential levels')
  potentialByLevel.push(row.TotalBaseParameter)
}
const cordiePreset = {
  weights: [Muscle, Intelligence, Energy, Health],
  weightTotal: cordie.BaseParameterGrossCoefficient,
  ...rarity.RarityCoefficientInfo,
  defense: cordie.InitialBattleParameter.Defense,
  potentialByLevel,
}
if (!cordiePreset.weights.every(value => Number.isSafeInteger(value) && value > 0)
  || cordiePreset.weights.reduce((sum, value) => sum + value, 0) !== cordiePreset.weightTotal
  || !Number.isFinite(cordiePreset.m) || cordiePreset.m <= 0 || !Number.isFinite(cordiePreset.b)
  || cordiePreset.defense !== 7 || potentialByLevel.length <= 1000) throw new Error('Invalid Cordie preset')

function slotData(id, slot, type, job) {
  const rows = equipment.filter(row => row.EquipmentSetId === id && row.SlotType === slot && row.EquippedJobFlags === job && row.EquipmentLv <= 1000).sort((a, b) => a.EquipmentLv - b.EquipmentLv)
  if (!rows.length || new Set(rows.map(row => row.EquipmentLv)).size !== rows.length) throw new Error('Missing or duplicate equipment levels')
  const costs = []
  const tiers = rows.map(row => {
    const parameter = row.BattleParameterChangeInfo
    const next = equipmentById.get(row.AfterLevelEvolutionEquipmentId)
    if (parameter.BattleParameterType !== type || parameter.ChangeParameterType !== 1 || !Number.isSafeInteger(parameter.Value) || !coefficients[row.EquipmentLv]
      || !Number.isSafeInteger(row.AdditionalParameterTotal) || row.AdditionalParameterTotal <= 0) throw new Error('Invalid equipment parameters')
    if (row.AfterLevelEvolutionEquipmentId && (!next || next.EquipmentSetId !== id || next.SlotType !== slot || next.EquippedJobFlags !== job || next.EquipmentLv <= row.EquipmentLv)) throw new Error('Invalid level evolution')
    if (next && next.EquipmentLv <= 1000) {
      const step = evolutions.get(row.EquipmentEvolutionId)?.EquipmentEvolutionInfoList.find(item => item.BeforeEquipmentLv === row.EquipmentLv && item.AfterEquipmentLv === next.EquipmentLv)
      const fragments = step?.RequiredItemList.filter(item => item.ItemType === 5)
      if (fragments?.length !== 1 || !(fragments[0].ItemCount > 0)) throw new Error('Missing evolution fragment cost')
      costs.push([row.EquipmentLv, next.EquipmentLv, fragments[0].ItemCount])
    }
    return [row.EquipmentLv, parameter.Value, next && next.EquipmentLv <= 1000 ? next.EquipmentLv : null, row.AdditionalParameterTotal]
  })
  return { rows: tiers, costs }
}
const series = [10, 11, 12, 13, 14].map(id => {
  const set = sets.find(row => row.Id === id)
  const names = Object.fromEntries(Object.entries(texts).map(([locale, map]) => {
    const name = map.get(set?.NameKey)
    if (!name) throw new Error(`Missing equipment series name: ${id}/${locale}`)
    return [locale, name]
  }))
  const weapon = slotData(id, 1, 2, 1)
  for (const job of [2, 4]) {
    if (JSON.stringify(weapon) !== JSON.stringify(slotData(id, 1, 2, job))) throw new Error('Ordinary weapons differ by job')
  }
  const slots = { weapon }
  for (const [slot, name, type] of [[2, 'accessory', 16], [3, 'hands', 13], [4, 'head', 3], [5, 'body', 4], [6, 'feet', 13]]) {
    slots[name] = slotData(id, slot, type, 7)
  }
  return { id, names, slots }
})
const output = JSON.stringify({ version: 2, coefficients, series, cordiePreset }) + '\n'
const destination = new URL('../src/constants/equipmentUpgrade.json', import.meta.url)
if (process.argv.includes('--check')) {
  if (fs.readFileSync(destination, 'utf8').replace(/\r\n/g, '\n') !== output) throw new Error('Equipment upgrade data needs regeneration')
} else fs.writeFileSync(destination, output)
