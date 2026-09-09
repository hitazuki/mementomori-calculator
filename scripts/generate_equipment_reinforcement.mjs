import fs from 'node:fs'

const source = new URL('../data/Master/EquipmentReinforcementMaterialMB.json', import.meta.url)
const destination = new URL('../src/constants/equipmentReinforcement.json', import.meta.url)
const rows = JSON.parse(fs.readFileSync(source, 'utf8')).sort((a, b) => a.ReinforcementLevel - b.ReinforcementLevel)
const keys = ['3:1', '12:1', '12:2']
function amounts(items) {
  const result = [0, 0, 0]
  for (const item of items) {
    const index = keys.indexOf(`${item.ItemType}:${item.ItemId}`)
    if (index < 0 || !Number.isSafeInteger(item.ItemCount) || item.ItemCount < 0) throw new Error('Invalid reinforcement material')
    result[index] += item.ItemCount
  }
  return result
}
const data = rows.map((row, index) => {
  if (row.ReinforcementLevel !== index + 1) throw new Error('Non-contiguous reinforcement levels')
  return [amounts(row.WeaponRequiredItemList), amounts(row.OthersRequiredItemList)]
})
if (data.length !== 1000) throw new Error('Expected levels 1–1000')
const output = `[\n${data.map(row => `  ${JSON.stringify(row)}`).join(',\n')}\n]\n`
if (process.argv.includes('--check')) {
  if (fs.readFileSync(destination, 'utf8') !== output) throw new Error('Reinforcement constants need regeneration')
} else fs.writeFileSync(destination, output)
