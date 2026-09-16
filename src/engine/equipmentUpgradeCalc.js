import source from '../constants/equipmentUpgrade.json?raw'
import { calcDamageRate } from './damageCalc.js'
import { LEVEL_TABLE, getCoeffByLevel } from '../constants/levelTable.js'
import { calculateEquipmentReinforcement } from './equipmentReinforcementCalc.js'

export const EQUIPMENT_UPGRADE_DATA = JSON.parse(source)
export const DEFAULT_UPGRADE_BONUSES = { outsideBonus: 1, insideBonus: 0 }
export const UPGRADE_STATS = ['def', 'pdef', 'mdef']
export const CHARACTER_LEVEL_RANGE = [LEVEL_TABLE[0].level, LEVEL_TABLE.at(-1).level]
export const DEFAULT_UPGRADE_PANEL = { def: 0, pdef: 4000000, mdef: 4000000, level: 500, enemyLevel: 500, pen: 11950, pmPen: 65700 }
const nonnegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER

export function upgradeLevels(seriesId, stat, data = EQUIPMENT_UPGRADE_DATA) {
  return [0, ...(data.series.find(series => series.id === seriesId)?.stats[stat] ?? []).map(row => row[0])]
}

export function buildEquipmentUpgrade(panel, plan, damageType = 'auto', data = EQUIPMENT_UPGRADE_DATA) {
  const { outsideBonus = DEFAULT_UPGRADE_BONUSES.outsideBonus, insideBonus = DEFAULT_UPGRADE_BONUSES.insideBonus } = plan
  if (damageType === 'auto') damageType = plan.stat === 'mdef' ? 'mag' : 'phys'
  if (![panel.def, panel.pdef, panel.mdef, panel.pen, panel.pmPen, outsideBonus, insideBonus].every(nonnegative)
    || ![panel.level, panel.enemyLevel].every(level => Number.isInteger(level) && level >= CHARACTER_LEVEL_RANGE[0] && level <= CHARACTER_LEVEL_RANGE[1])
    || !UPGRADE_STATS.includes(plan.stat) || !['phys', 'mag'].includes(damageType)) return { valid: false, error: 'input' }
  const rows = data.series.find(series => series.id === plan.seriesId)?.stats[plan.stat]
  if (!rows?.length) return { valid: false, error: 'data' }
  const levels = upgradeLevels(plan.seriesId, plan.stat, data)
  if (!levels.includes(plan.start) || plan.start > panel.level) return { valid: false, error: 'input' }
  const byLevel = new Map(rows.map(row => [row[0], row]))
  const valueAt = level => {
    if (level === 0) return 0
    const row = byLevel.get(level)
    const coefficient = data.coefficients[level]
    if (!row || !Number.isFinite(coefficient) || coefficient <= 0 || !nonnegative(row[1])) throw new Error('data')
    return row[1] * coefficient
  }
  const attacker = getCoeffByLevel(panel.enemyLevel)
  const defender = getCoeffByLevel(panel.level)
  const rate = equipmentValue => {
    const adjusted = { def: panel.def, pdef: panel.pdef, mdef: panel.mdef }
    adjusted[plan.stat] = panel[plan.stat] * (1 + insideBonus / 100) + equipmentValue
    return calcDamageRate(adjusted.def, panel.pen, defender.cDef, attacker.cPen)
      * calcDamageRate(adjusted[damageType === 'phys' ? 'pdef' : 'mdef'], panel.pmPen, damageType === 'phys' ? defender.cPdef : defender.cMdef, attacker.cPmPen)
  }
  const measure = (before, after) => ({ ehp: (before / after - 1) * 100, reduction: (1 - after / before) * 100 })
  try {
    const multiplier = (1 + outsideBonus / 100) * (1 + insideBonus / 100)
    const origin = valueAt(plan.start) * multiplier
    const baseRate = rate(0)
    const points = []
    const visited = new Set()
    let previous = plan.start
    let previousDelta = 0
    let previousRate = rate(origin)
    let next = previous === 0 ? rows[0][0] : byLevel.get(previous)[2]
    while (next !== null) {
      if (!Number.isInteger(next) || next <= previous || next > 1000 || visited.has(next)) throw new Error('data')
      if (next > panel.level) break
      visited.add(next)
      const equipmentValue = valueAt(next) * multiplier
      const delta = equipmentValue - origin
      const nextRate = rate(equipmentValue)
      if (!nonnegative(delta) || !(nextRate > 0) || !(baseRate > 0)) throw new Error('data')
      points.push({ level: next, from: previous, span: next - previous, firstEquip: previous === 0,
        increment: delta - previousDelta, totalIncrement: equipmentValue,
        adjacent: measure(previousRate, nextRate), cumulative: measure(baseRate, nextRate) })
      previous = next
      previousDelta = delta
      previousRate = nextRate
      next = byLevel.get(next)[2]
    }
    return { valid: true, points, firstEquip: points.find(point => point.firstEquip) ?? null, next: points.find(point => !point.firstEquip) ?? null }
  } catch { return { valid: false, error: 'data' } }
}

export function upgradeMaterials(initialLevel, targetLevel) {
  return calculateEquipmentReinforcement({ initialLevel, targetLevel, weaponCount: 0, otherCount: 1 })
}

// Intersections describe the drawn polyline, not additional legal equipment levels.
export function equivalentUpgradeLevels(points, mode, target) {
  const rows = points.filter(point => mode === 'cumulative' || !point.firstEquip)
  const intersections = []
  const add = level => { if (!intersections.some(value => Math.abs(value - level) < 1e-7)) intersections.push(level) }
  rows.forEach((point, index) => {
    const y = point[mode].ehp
    if (Math.abs(y - target) < 1e-9) add(point.level)
    const previous = rows[index - 1]
    if (previous && (previous[mode].ehp - target) * (y - target) < 0) {
      add(previous.level + (point.level - previous.level) * (target - previous[mode].ehp) / (y - previous[mode].ehp))
    }
  })
  return { intersections, firstReached: rows.find(point => point[mode].ehp >= target - 1e-9)?.level ?? null }
}
