import source from '../constants/equipmentUpgrade.json?raw'
import { calcDamageRate } from './damageCalc.js'
import { LEVEL_TABLE, getCoeffByLevel } from '../constants/levelTable.js'
import { calculateEquipmentReinforcement } from './equipmentReinforcementCalc.js'

export const EQUIPMENT_UPGRADE_DATA = JSON.parse(source)
export const EQUIPMENT_SLOTS = { weapon: 'atk', accessory: 'debuffRes', hands: 'def', head: 'pdef', body: 'mdef', feet: 'def' }
export const FOUR_STATS = ['str', 'mag', 'dex', 'sta']
export const EQUAL_REFORGE = [25, 25, 25, 25]
const legacySlots = { def: 'hands', pdef: 'head', mdef: 'body' }
for (const series of EQUIPMENT_UPGRADE_DATA.series) {
  series.stats = Object.fromEntries(Object.entries(legacySlots).map(([stat, slot]) => [stat, series.slots[slot].rows]))
  series.costs = Object.fromEntries(Object.entries(legacySlots).map(([stat, slot]) => [stat, series.slots[slot].costs]))
}
// Permanent-character Arcana at LR+5: collection 3 gives DEF +1%; no P.DEF/M.DEF percent bonus.
export const DEFAULT_UPGRADE_BONUSES = {
  def: { outsideBonus: 1, insideBonus: 0 },
  pdef: { outsideBonus: 0, insideBonus: 0 },
  mdef: { outsideBonus: 0, insideBonus: 0 },
}
export const UPGRADE_STATS = ['def', 'pdef', 'mdef']
export const CHARACTER_LEVEL_RANGE = [LEVEL_TABLE[0].level, LEVEL_TABLE.at(-1).level]
export const DEFAULT_UPGRADE_PANEL = { def: 0, pdef: 4000000, mdef: 4000000, level: 500, enemyLevel: 500, pen: 11950, pmPen: 65700 }
const nonnegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER
const factor = bonus => 1 + bonus / 100

export function cordiePanel(level, staminaBonus, hpBonus) {
  const preset = EQUIPMENT_UPGRADE_DATA.cordiePreset
  const potential = preset.potentialByLevel[level]
  if (!Number.isInteger(level) || !potential || ![staminaBonus, hpBonus].every(nonnegative)) return null
  const total = potential * preset.m + preset.b
  const [str, mag, dex, sta] = preset.weights.map(weight => Math.floor(total * weight / preset.weightTotal))
  const stamina = sta * factor(staminaBonus)
  return {
    str, mag, dex, sta: stamina,
    def: preset.defense, pdef: str, mdef: mag, hp: stamina * 10 * factor(hpBonus),
  }
}

export const reforgeMinimum = mode => mode === 'locked' ? 0 : 40 / 3

export function adjustReforge(shares, mode, index = -1, value = 0) {
  const min = reforgeMinimum(mode)
  const max = 60
  const clamp = share => Math.max(min, Math.min(max, share))
  const next = shares.map((share, i) => clamp(i === index ? value : share))
  const free = next.map((_, i) => i).filter(i => i !== index)
  let remaining = 100 - next.reduce((sum, share) => sum + share, 0)
  for (let pass = 0; pass < shares.length && Math.abs(remaining) > 1e-8; pass++) {
    const adjustable = free.filter(i => remaining > 0 ? next[i] < max : next[i] > min)
    if (!adjustable.length) break
    const weight = adjustable.reduce((sum, i) => sum + shares[i], 0)
    for (const i of adjustable) {
      next[i] = clamp(next[i] + remaining * (weight ? shares[i] / weight : 1 / adjustable.length))
    }
    remaining = 100 - next.reduce((sum, share) => sum + share, 0)
  }
  return next
}

function allocateReforge(total, shares) {
  const raw = shares.map(share => total * share / 100)
  const whole = raw.map(Math.floor)
  const remainder = total - whole.reduce((sum, value) => sum + value, 0)
  const order = raw.map((value, index) => ({ index, fraction: value - whole[index] })).sort((a, b) => b.fraction - a.fraction)
  for (const { index } of order.slice(0, remainder)) whole[index]++
  return whole
}

export function upgradeLevels(seriesId, stat, data = EQUIPMENT_UPGRADE_DATA) {
  return [0, ...(data.series.find(series => series.id === seriesId)?.stats[stat] ?? []).map(row => row[0])]
}

export function buildEquipmentUpgrade(panel, plan, damageType = 'auto', data = EQUIPMENT_UPGRADE_DATA) {
  const stat = plan.slot === undefined ? plan.stat : EQUIPMENT_SLOTS[plan.slot]
  const { outsideBonus = DEFAULT_UPGRADE_BONUSES[stat]?.outsideBonus ?? 0, insideBonus = 0, applyBase = true, applyFourStats = plan.slot !== undefined, shares = EQUAL_REFORGE } = plan
  const { hp = 1, staminaBonus = 0, hpBonus = 0 } = panel
  if (damageType === 'auto') damageType = stat === 'mdef' ? 'mag' : 'phys'
  if (![panel.def, panel.pdef, panel.mdef, panel.pen, panel.pmPen, outsideBonus, hp, staminaBonus, hpBonus].every(nonnegative) || hp <= 0
    || typeof insideBonus !== 'number' || !Number.isFinite(insideBonus) || Math.abs(insideBonus) > Number.MAX_SAFE_INTEGER
    || ![panel.level, panel.enemyLevel].every(level => Number.isInteger(level) && level >= CHARACTER_LEVEL_RANGE[0] && level <= CHARACTER_LEVEL_RANGE[1])
    || !(plan.slot === undefined ? UPGRADE_STATS.includes(stat) : Object.hasOwn(EQUIPMENT_SLOTS, plan.slot))
    || !['phys', 'mag'].includes(damageType)) return { valid: false, error: 'input' }
  if (applyFourStats && (!Array.isArray(shares) || shares.length !== FOUR_STATS.length
    || !shares.every(value => nonnegative(value) && value <= 60 + 1e-8)
    || Math.abs(shares.reduce((sum, value) => sum + value, 0) - 100) > 1e-7)) return { valid: false, error: 'input' }
  const series = data.series.find(entry => entry.id === plan.seriesId)
  const slot = series?.slots?.[plan.slot]
  const rows = plan.slot === undefined ? series?.stats?.[stat] : slot?.rows
  if (!rows?.length) return { valid: false, error: 'data' }
  const byLevel = new Map(rows.map(row => [row[0], row]))
  if (plan.start !== 0 && (!byLevel.has(plan.start) || plan.start > panel.level)) return { valid: false, error: 'input' }
  const costs = slot?.costs ?? series.costs?.[stat]
  const costByStart = new Map(costs?.map(row => [row[0], row]))
  const attacker = getCoeffByLevel(panel.enemyLevel)
  const defender = getCoeffByLevel(panel.level)
  const defenseStat = UPGRADE_STATS.includes(stat)
  const insideMultiplier = Math.max(0, 1 + insideBonus / 100)
  const staminaMultiplier = factor(staminaBonus)
  const lifeMultiplier = factor(hpBonus)
  const multiplier = defenseStat ? factor(outsideBonus) * insideMultiplier : 1
  const tierAt = level => {
    const row = byLevel.get(level)
    const coefficient = data.coefficients[level]
    if (level !== 0 && (!row || !Number.isFinite(coefficient) || coefficient <= 0 || !nonnegative(row[1])
      || (applyFourStats && (!Number.isSafeInteger(row[3]) || row[3] <= 0)))) throw new Error('data')
    const base = level && applyBase ? row[1] * coefficient * multiplier : 0
    const [str, mag, dex, sta] = level && applyFourStats ? allocateReforge(row[3], shares) : [0, 0, 0, 0]
    const stamina = sta * staminaMultiplier
    const stats = {
      str, mag, dex, sta,
      hp: stamina * 10 * lifeMultiplier,
      def: 0,
      pdef: str * (stat === 'pdef' ? multiplier : 1),
      mdef: mag * (stat === 'mdef' ? multiplier : 1),
      critRes: stamina / 2, debuffRes: 0, debuffHit: mag / 2,
      hit: str / 2, evade: dex / 2, crit: dex / 2, atk: 0,
    }
    stats[stat] += base
    const adjusted = { def: panel.def, pdef: panel.pdef, mdef: panel.mdef }
    if (defenseStat) adjusted[stat] *= insideMultiplier
    const secondary = damageType === 'phys' ? 'pdef' : 'mdef'
    const rate = calcDamageRate(adjusted.def + stats.def, panel.pen, defender.cDef, attacker.cPen)
      * calcDamageRate(adjusted[secondary] + stats[secondary], panel.pmPen, damageType === 'phys' ? defender.cPdef : defender.cMdef, attacker.cPmPen)
    const life = hp + stats.hp
    if (!(rate > 0) || !Object.values(stats).every(Number.isFinite) || !Number.isFinite(life / rate)) throw new Error('data')
    return { stats, rate, life }
  }
  const measure = (before, after) => ({
    ehp: (after.life / before.life * (before.rate / after.rate) - 1) * 100,
    reduction: (1 - after.rate / before.rate) * 100,
  })
  try {
    const baseline = tierAt(0)
    const points = []
    const visited = new Set()
    let previous = plan.start
    let previousTier = previous === 0 ? baseline : tierAt(previous)
    let next = previous === 0 ? rows[0][0] : byLevel.get(previous)[2]
    while (next !== null) {
      if (!Number.isInteger(next) || next <= previous || next > 1000 || visited.has(next)) throw new Error('data')
      if (next > panel.level) break
      visited.add(next)
      const tier = tierAt(next)
      const increments = Object.fromEntries(Object.entries(tier.stats).map(([key, value]) => [key, value - previousTier.stats[key]]))
      const cost = costByStart.get(previous)
      const fragmentCost = previous !== 0 && cost?.[1] === next ? cost[2] : null
      const adjacent = measure(previousTier, tier)
      points.push({ level: next, from: previous, span: next - previous, firstEquip: previous === 0,
        increment: increments[stat], totalIncrement: tier.stats[stat],
        increments, totals: tier.stats, hp: tier.life, effectiveHp: tier.life / tier.rate,
        fragmentCost, efficiency: { ehp: fragmentCost > 0 ? adjacent.ehp / fragmentCost : null },
        adjacent, cumulative: measure(baseline, tier) })
      previous = next
      previousTier = tier
      next = byLevel.get(next)[2]
    }
    return { valid: true, points, firstEquip: points.find(point => point.firstEquip) ?? null, next: points.find(point => !point.firstEquip) ?? null }
  } catch { return { valid: false, error: 'data' } }
}

export function upgradeMaterials(initialLevel, targetLevel, slot) {
  const weaponCount = slot === 'weapon' ? 1 : 0
  return calculateEquipmentReinforcement({ initialLevel, targetLevel, weaponCount, otherCount: 1 - weaponCount })
}

// Intersections describe the drawn polyline, not additional legal equipment levels.
export function equivalentUpgradeLevels(points, mode, target) {
  const rows = points.filter(point => mode === 'cumulative' || !point.firstEquip)
  const intersections = []
  const add = level => { if (!intersections.some(value => Math.abs(value - level) < 1e-7)) intersections.push(level) }
  rows.forEach((point, index) => {
    const y = point[mode]?.ehp
    if (!Number.isFinite(y)) return
    if (Math.abs(y - target) < 1e-9) add(point.level)
    const previous = rows[index - 1]
    if (Number.isFinite(previous?.[mode]?.ehp) && (previous[mode].ehp - target) * (y - target) < 0) {
      add(previous.level + (point.level - previous.level) * (target - previous[mode].ehp) / (y - previous[mode].ehp))
    }
  })
  return { intersections, firstReached: rows.find(point => Number.isFinite(point[mode]?.ehp) && point[mode].ehp >= target - 1e-9)?.level ?? null }
}
