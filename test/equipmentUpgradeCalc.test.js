import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_UPGRADE_PANEL as defaults, EQUIPMENT_UPGRADE_DATA as data, EQUIPMENT_SLOTS, EQUAL_REFORGE,
  upgradeLevels, buildEquipmentUpgrade as build, upgradeMaterials, equivalentUpgradeLevels,
  cordiePanel, adjustReforge,
} from '../src/engine/equipmentUpgradeCalc.js'
const plan = { stat: 'def', seriesId: 12, start: 0, outsideBonus: 0 }
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} != ${expected}`)

test('Cordie LR+5 preset updates by level and applies stamina before HP bonuses', () => {
  const base = cordiePanel(500, 0, 0)
  const next = cordiePanel(501, 0, 0)
  const boosted = cordiePanel(500, 20, 30)
  assert.deepEqual(base, { str: 4301936, mag: 3776144, dex: 4779929, sta: 3298151, def: 7, pdef: 4301936, mdef: 3776144, hp: 32981510 })
  for (const key of ['str', 'mag', 'dex', 'sta', 'pdef', 'mdef', 'hp']) assert.ok(next[key] > base[key])
  assert.equal(next.def, 7)
  near(boosted.sta, base.sta * 1.2)
  near(boosted.hp, base.hp * 1.2 * 1.3)
  assert.equal(boosted.pdef, base.pdef)
  assert.equal(boosted.mdef, base.mdef)
  assert.equal(cordiePanel(500.5, 0, 0), null)
})

test('reforge keeps the edited share and redistributes within 0% to 60%', () => {
  const maximum = adjustReforge(EQUAL_REFORGE, 3, 60)
  assert.equal(maximum[3], 60)
  for (const share of maximum.slice(0, 3)) near(share, 40 / 3)
  const suppressed = adjustReforge([60, 0, 40, 0], 0, 0)
  assert.deepEqual(suppressed, [0, 20, 60, 20])
  const proportional = adjustReforge([15, 35, 25, 25], 3, 0)
  assert.equal(proportional[3], 0)
  near(proportional.reduce((sum, share) => sum + share, 0), 100)
  near(proportional[1] / proportional[2], 35 / 25)
})

test('slot analysis composes stamina gains without multiplying existing HP', () => {
  const baseline = { ...defaults, hp: 30000000, staminaBonus: 20, hpBonus: 30 }
  const gear = { slot: 'hands', seriesId: 10, start: 0, applyBase: false, shares: [0, 40, 0, 60] }
  const result = build(baseline, gear, 'phys')
  assert.equal(result.valid, true)
  const first = result.firstEquip
  assert.equal(first.totals.mag + first.totals.sta, 65573)
  assert.equal(first.totals.sta, 39344)
  near(first.totals.hp, first.totals.sta * 15.6)
  near(first.totals.critRes, first.totals.sta * 0.6)
  near(first.hp, baseline.hp + first.totals.hp)
  near(first.cumulative.ehp, first.totals.hp / baseline.hp * 100)
  assert.equal(first.cumulative.reduction, 0)
  assert.ok(build(baseline, gear, 'mag').firstEquip.cumulative.reduction > 0)
  const disabled = build(baseline, { ...gear, applyFourStats: false }, 'phys').firstEquip
  assert.equal(disabled.hp, baseline.hp)
  assert.equal(disabled.cumulative.ehp, 0)
  assert.ok(Object.values(disabled.totals).every(value => value === 0))
})

test('six ordinary slots use their own base effects, reforge points, and evolution costs', () => {
  const baseline = { ...defaults, hp: 30000000 }
  for (const series of data.series) {
    for (const slot of Object.keys(EQUIPMENT_SLOTS)) {
      const options = { slot, seriesId: series.id, start: 0 }
      const actual = build(baseline, options, 'phys')
      const { rows, costs } = series.slots[slot]
      assert.equal(actual.valid, true)
      const { totals } = actual.firstEquip
      assert.equal(totals.str + totals.mag + totals.dex + totals.sta, rows[0][3])
      assert.equal(actual.next.fragmentCost, costs[0][2])
    }
  }
  const accessory = { slot: 'accessory', seriesId: 10, start: 0, applyFourStats: false }
  assert.ok(build(baseline, accessory).firstEquip.totals.debuffRes > 0)
  assert.equal(build(baseline, { ...accessory, applyBase: false }).firstEquip.totals.debuffRes, 0)
  assert.ok(upgradeMaterials(240, 250, 'weapon').totals.potion > upgradeMaterials(240, 250, 'head').totals.potion)
  for (const [slot, stat] of [['hands', 'def'], ['feet', 'def'], ['head', 'pdef'], ['body', 'mdef']]) {
    const legacy = build(baseline, { ...plan, stat }, 'mag')
    const current = build(baseline, { ...plan, stat: undefined, slot, applyFourStats: false }, 'mag')
    assert.deepEqual(current, legacy)
  }
})

test('fragment efficiency uses each real tier cost and excludes first equip', () => {
  for (const series of data.series) {
    for (const stat of ['def', 'pdef', 'mdef']) {
      const result = build({ ...defaults, level: 900, enemyLevel: 900 }, { ...plan, seriesId: series.id, stat })
      assert.equal(result.firstEquip.efficiency.ehp, null)
      for (const point of result.points.filter(p => !p.firstEquip)) {
        assert.ok(point.fragmentCost > 0)
        near(point.efficiency.ehp, point.adjacent.ehp / point.fragmentCost)
      }
      assert.equal(series.costs[stat].length, series.stats[stat].length - 1)
      if ([12, 13, 14].includes(series.id)) {
        assert.equal(result.points.find(p => p.level === 520).fragmentCost, 30)
        assert.equal(result.points.find(p => p.level === 530).fragmentCost, 40)
        assert.ok(result.points.find(p => p.level === 530).efficiency.ehp < result.points.find(p => p.level === 520).efficiency.ehp)
      }
    }
  }
})

test('LR5 permanent Arcana defaults are DEF 1%, P.DEF and M.DEF 0%, inside 0%', () => {
  const { outsideBonus, ...withoutBonus } = plan
  for (const [stat, bonus] of [['def', 1], ['pdef', 0], ['mdef', 0]]) {
    assert.deepEqual(build(defaults, { ...withoutBonus, stat }), build(defaults, { ...plan, stat, outsideBonus: bonus, insideBonus: 0 }))
  }
})

test('in-battle bonus multiplies both unequipped and equipment stats at all tiers', () => {
  for (const stat of ['def', 'pdef', 'mdef']) {
    const baseline = { ...defaults, def: 2000000 }
    const actual = build(baseline, { ...plan, stat, outsideBonus: 10, insideBonus: 20 })
    // (B + E * 1.1) * 1.2 = B * 1.2 + E * 1.32, including the no-gear baseline.
    const expected = build({ ...baseline, [stat]: baseline[stat] * 1.2 }, { ...plan, stat, outsideBonus: 32, insideBonus: 0 })
    actual.points.forEach((point, index) => {
      near(point.totalIncrement, expected.points[index].totalIncrement)
      near(point.adjacent.ehp, expected.points[index].adjacent.ehp)
      near(point.cumulative.ehp, expected.points[index].cumulative.ehp)
      near(point.cumulative.reduction, expected.points[index].cumulative.reduction)
    })
  }
  for (const key of ['outsideBonus', 'insideBonus']) {
    for (const value of ['', null, NaN, Infinity, -Infinity, Number.MAX_VALUE, -Number.MAX_VALUE]) assert.equal(build(defaults, { ...plan, [key]: value }).valid, false)
  }
  assert.equal(build(defaults, { ...plan, outsideBonus: -1 }).valid, false)
})

test('negative in-battle bonuses reduce both the baseline and equipment contribution', () => {
  for (const stat of ['def', 'pdef', 'mdef']) {
    for (const insideBonus of [-80, -99.9]) {
      const baseline = { ...defaults, def: 2000000 }
      const factor = 1 + insideBonus / 100
      const scaled = structuredClone(data)
      scaled.coefficients = scaled.coefficients.map(value => value * factor)
      for (const start of [0, 380]) {
        const actual = build(baseline, { ...plan, stat, start, outsideBonus: 10, insideBonus })
        const expected = build({ ...baseline, [stat]: baseline[stat] * factor }, { ...plan, stat, start, outsideBonus: 10 }, 'auto', scaled)
        assert.equal(actual.valid, true)
        actual.points.forEach((point, index) => {
          const other = expected.points[index]
          near(point.increment, other.increment)
          near(point.totalIncrement, other.totalIncrement)
          near(point.adjacent.ehp, other.adjacent.ehp)
          near(point.cumulative.ehp, other.cumulative.ehp)
          near(point.cumulative.reduction, other.cumulative.reduction)
          if (point.fragmentCost) near(point.efficiency.ehp, other.efficiency.ehp)
        })
      }
    }
  }
})

test('in-battle reductions of 100 percent or more floor the affected stat at zero', () => {
  for (const stat of ['def', 'pdef', 'mdef']) {
    for (const insideBonus of [-100, -120, -1000]) {
      for (const start of [0, 380]) {
        const result = build({ ...defaults, def: 2000000 }, { ...plan, stat, start, outsideBonus: 10, insideBonus })
        assert.equal(result.valid, true)
        for (const point of result.points) {
          assert.equal(point.increment, 0)
          assert.equal(point.totalIncrement, 0)
          assert.deepEqual(point.adjacent, { ehp: 0, reduction: 0 })
          assert.deepEqual(point.cumulative, { ehp: 0, reduction: 0 })
          assert.equal(point.efficiency.ehp, point.fragmentCost > 0 ? 0 : null)
        }
      }
    }
  }
})

test('automatic damage routing gives both defense types meaningful benefits', () => {
  for (const [stat, type] of [['pdef', 'phys'], ['mdef', 'mag'], ['def', 'phys']]) {
    const auto = build(defaults, { ...plan, stat })
    assert.ok(auto.next.adjacent.ehp > 0)
    assert.deepEqual(auto.points, build(defaults, { ...plan, stat }, type).points)
  }
})

test('character level caps actual equipment nodes and starting level', () => {
  assert.equal(build({ ...defaults, level: 475 }, plan).points.at(-1).level, 470)
  assert.deepEqual(build({ ...defaults, level: 200 }, plan).points, [])
  assert.equal(build(defaults, { ...plan, start: 510 }).valid, false)
  assert.equal(build({ ...defaults, level: 900 }, plan).points.at(-1).level, 900)
})

test('equal gain comparison keeps estimated crossings separate from legal tiers', () => {
  const points = [240, 250, 260, 270].map((level, i) => ({ level, firstEquip: i === 0, adjacent: { ehp: [8, 1, 3, 1][i] }, cumulative: { ehp: [8, 9, 12, 13][i] } }))
  assert.deepEqual(equivalentUpgradeLevels(points, 'adjacent', 2), { intersections: [255, 265], firstReached: 260 })
  assert.deepEqual(equivalentUpgradeLevels(points, 'cumulative', 8), { intersections: [240], firstReached: 240 })
  assert.deepEqual(equivalentUpgradeLevels(points, 'adjacent', 8), { intersections: [], firstReached: null })
  assert.deepEqual(equivalentUpgradeLevels([], 'adjacent', 1), { intersections: [], firstReached: null })
  const efficiencyPoints = points.map((point, i) => ({ ...point, efficiency: { ehp: [null, 1, null, 3][i] } }))
  assert.deepEqual(equivalentUpgradeLevels(efficiencyPoints, 'efficiency', 2), { intersections: [], firstReached: 270 })
})

test('upgrade default excludes first equip from next upgrade comparison', () => {
  const result = build(defaults, plan)
  assert.equal(result.valid, true)
  assert.equal(result.firstEquip.from, 0)
  assert.equal(result.firstEquip.level, 240) // Lower SSR sets are different series, not Satan.
  assert.equal(result.next.from, 240)
  assert.equal(result.next.level, 250)
  assert.equal(result.points.at(-1).level, 500)
  assert.ok(!upgradeLevels(12, 'def').includes(180))
  assert.equal(result.firstEquip.increment, data.series.find(s => s.id === 12).stats.def[0][1] * data.coefficients[240])
})

test('upgrade reproduces level 470 head and hand comparison', () => {
  const panel = { ...defaults, level: 470, enemyLevel: 470, def: 3286996, pdef: 4477977, mdef: 5218753 }
  // Convert equipped screenshot stats to the baseline for each independently tested slot.
  const contribution = (stat, level) => data.series.find(s => s.id === 12).stats[stat].find(r => r[0] === level)[1] * data.coefficients[level]
  panel.pdef -= contribution('pdef', 380)
  panel.def -= contribution('def', 420)
  const head = build(panel, { ...plan, stat: 'pdef', start: 380 }).next
  const hands = build(panel, { ...plan, start: 420 }).next
  near(head.increment, 73165.6608)
  near(hands.increment, 85893.4266)
  near(head.adjacent.ehp, 0.6881476914)
  near(hands.adjacent.ehp, 0.9402097956)
  near(hands.adjacent.reduction, 0.9314521909)
  assert.equal(build(panel, { ...plan, stat: 'pdef', start: 380 }, 'mag').next.adjacent.ehp, 0)
  assert.equal(build(panel, { ...plan, stat: 'mdef', start: 380 }, 'phys').next.adjacent.ehp, 0)
  near(build(panel, { ...plan, start: 420 }, 'mag').next.adjacent.ehp, hands.adjacent.ehp)
})

test('upgrade cumulative and adjacent factors agree without double counting baseline', () => {
  const result = build(defaults, { ...plan, start: 380, outsideBonus: 20 })
  near(result.next.increment, (data.series.find(s => s.id === 12).stats.def.find(r => r[0] === 390)[1] * data.coefficients[390] - data.series.find(s => s.id === 12).stats.def.find(r => r[0] === 380)[1] * data.coefficients[380]) * 1.2)
  const origin = build(defaults, { ...plan, outsideBonus: 20 }).points.find(p => p.level === 380)
  let factor = 1 + origin.cumulative.ehp / 100
  let sum = origin.totalIncrement
  for (const point of result.points) {
    factor *= 1 + point.adjacent.ehp / 100
    sum += point.increment
    near((factor - 1) * 100, point.cumulative.ehp)
    near(sum, point.totalIncrement)
  }
  const extra = build({ ...defaults, enemyLevel: 100 }, plan)
  assert.notEqual(extra.next.adjacent.ehp, build(defaults, plan).next.adjacent.ehp)
})

test('upgrade follows actual links including 20-level gaps and never invents nodes', () => {
  const fixture = { coefficients: data.coefficients, series: [{ id: 12, stats: { def: [[180, 10000, 200], [200, 12000, 220], [220, 14000, 240], [240, 16000, 250], [250, 17000, null]] } }] }
  const result = build(defaults, plan, 'phys', fixture)
  assert.equal(result.next.span, 20)
  assert.deepEqual(result.points.map(p => p.level), [180, 200, 220, 240, 250])
  assert.equal(build(defaults, { ...plan, start: 190 }, 'phys', fixture).valid, false)
  fixture.series[0].stats.def[0][2] = 190
  assert.equal(build(defaults, plan, 'phys', fixture).error, 'data')
})

test('upgrade validates input, missing coefficients and maximum level', () => {
  for (const start of ['', -1, 10, 1001, 240.5]) assert.equal(build(defaults, { ...plan, start }).valid, false)
  for (const value of ['', null, NaN, -1, Infinity]) assert.equal(build({ ...defaults, def: value }, plan).valid, false)
  assert.equal(build({ ...defaults, level: 0 }, plan).valid, false)
  assert.equal(build(defaults, { ...plan, seriesId: 999 }).error, 'data')
  const missing = structuredClone(data)
  missing.coefficients[240] = null
  assert.equal(build(defaults, plan, 'phys', missing).error, 'data')
  assert.deepEqual(build({ ...defaults, level: 900 }, { ...plan, start: 900 }).points, [])
  assert.equal(upgradeMaterials(60, 61).tickets, 5)
})

 test('nonzero starts include full equipment at every intermediate node', () => {
  for (const stat of ['def', 'pdef', 'mdef']) {
    const full = build(defaults, { ...plan, stat, outsideBonus: 20 })
    const partial = build(defaults, { ...plan, stat, start: 380, outsideBonus: 20 })
    const origin = full.points.find(p => p.level === 380)
    for (const point of partial.points) {
      const same = full.points.find(p => p.level === point.level)
      near(point.adjacent.ehp, same.adjacent.ehp)
      near(point.cumulative.ehp, same.cumulative.ehp)
      near(point.totalIncrement, same.totalIncrement)
    }
  }
})
