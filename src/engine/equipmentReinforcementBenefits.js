import upgradeSource from '../constants/equipmentUpgrade.json?raw'
import materialSource from '../constants/equipmentReinforcement.json?raw'

const { coefficients } = JSON.parse(upgradeSource)
const materials = JSON.parse(materialSource)
const keys = ['gold', 'water', 'potion']

// Only reinforcement changes: the equipment's level and base stat stay fixed.
export function buildReinforcementBenefits(data = { coefficients, materials }) {
  const c = data.coefficients
  const m = data.materials
  if (!Array.isArray(c) || c.length !== 1001 || c[0] !== 1
    || !Array.isArray(m) || m.length !== 1000) return { valid: false, points: [] }
  for (let level = 0; level <= 1000; level++) {
    if (!Number.isFinite(c[level]) || c[level] <= 0 || (level && c[level] < c[level - 1])) return { valid: false, points: [] }
    if (level && (!Array.isArray(m[level - 1]) || m[level - 1].length !== 2
      || m[level - 1].some(row => !Array.isArray(row) || row.length !== 3
        || row.some(value => !Number.isSafeInteger(value) || value < 0)))) return { valid: false, points: [] }
  }
  const points = []
  for (let level = 10; level <= 1000; level += 10) {
    const from = level - 10
    const adjacent = 100 * (c[level] - c[from])
    const costs = {}
    const efficiency = {}
    for (const [index, kind] of ['weapon', 'other'].entries()) {
      costs[kind] = Object.fromEntries(keys.map((key, column) => [key,
        m.slice(from, level).reduce((total, row) => total + row[index][column], 0)]))
      if (!Object.values(costs[kind]).every(Number.isSafeInteger)) return { valid: false, points: [] }
      efficiency[kind] = Object.fromEntries(keys.map(key => [key,
        costs[kind][key] > 0 ? adjacent / costs[kind][key] : null]))
    }
    points.push({ from, level, before: c[from], after: c[level], adjacent,
      cumulative: 100 * (c[level] - c[0]), costs, efficiency })
  }
  return { valid: true, points }
}

// Match the displayed polyline, including gaps where a material is not consumed.
export function equivalentReinforcementLevels(rows, target) {
  const intersections = []
  if (!Number.isFinite(target)) return { intersections, firstReached: null }
  const add = level => {
    if (!intersections.some(value => Math.abs(value - level) < 1e-7)) intersections.push(level)
  }
  rows.forEach(([level, value], index) => {
    if (!Number.isFinite(value)) return
    if (value === target) add(level)
    const previous = rows[index - 1]
    if (previous && Number.isFinite(previous[1]) && (previous[1] - target) * (value - target) < 0) {
      add(previous[0] + (level - previous[0]) * (target - previous[1]) / (value - previous[1]))
    }
  })
  return { intersections, firstReached: rows.find(([, value]) => Number.isFinite(value) && value >= target)?.[0] ?? null }
}
