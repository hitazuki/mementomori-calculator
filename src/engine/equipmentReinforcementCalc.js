import materialSource from '../constants/equipmentReinforcement.json?raw'

const materials = JSON.parse(materialSource)

// Generated rows: [weapon, other], each containing [gold, water, potion].
export const MAX_REINFORCEMENT_LEVEL = materials.length
export const POTIONS_PER_TICKET = 4.5
export const MATERIAL_KEYS = ['gold', 'water', 'potion']

export function calculateEquipmentReinforcement({ initialLevel, targetLevel, weaponCount, otherCount }) {
  const values = [initialLevel, targetLevel, weaponCount, otherCount]
  if (!values.every(value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
    || initialLevel > targetLevel || targetLevel > MAX_REINFORCEMENT_LEVEL) {
    return { valid: false }
  }
  const cumulative = [{ level: 0, gold: 0, water: 0, potion: 0 }]
  for (const [index, row] of materials.entries()) {
    const previous = cumulative[index]
    const next = { level: index + 1 }
    MATERIAL_KEYS.forEach((key, materialIndex) => {
      next[key] = previous[key] + row[0][materialIndex] * weaponCount + row[1][materialIndex] * otherCount
    })
    if (!MATERIAL_KEYS.every(key => Number.isSafeInteger(next[key]))) return { valid: false }
    cumulative.push(next)
  }
  const totals = Object.fromEntries(MATERIAL_KEYS.map(key => [key, cumulative[targetLevel][key] - cumulative[initialLevel][key]]))
  return { valid: true, totals, tickets: Math.ceil(totals.potion / POTIONS_PER_TICKET), cumulative }
}
