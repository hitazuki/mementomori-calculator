import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildReinforcementBenefits, equivalentReinforcementLevels } from '../src/engine/equipmentReinforcementBenefits.js'
import { calculateEquipmentReinforcement } from '../src/engine/equipmentReinforcementCalc.js'

const analysis = buildReinforcementBenefits()
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`)
test('reinforcement gains use only fixed-base coefficients for every ten levels', () => {
  assert.equal(analysis.valid, true)
  assert.equal(analysis.points.length, 100)
  for (const [level, before, after] of [[10, 1, 1.1429], [30, 1.2886, 1.4372], [70, 1.9, 2.1373], [250, 5.9342, 6.2717], [1000, 40.2563, 40.903]]) {
    const point = analysis.points.find(point => point.level === level)
    assert.equal(point.from, level - 10)
    assert.equal(point.before, before)
    assert.equal(point.after, after)
    close(point.adjacent, 100 * (after - before))
    close(point.cumulative, 100 * (after - 1))
  }
  let previous = 0
  for (const point of analysis.points) {
    close(point.adjacent, point.cumulative - previous)
    previous = point.cumulative
  }
})

test('each tier uses exact interval costs and keeps zero denominators as gaps', () => {
  for (const point of analysis.points) {
    for (const [kind, weaponCount, otherCount] of [['weapon', 1, 0], ['other', 0, 1]]) {
      const expected = calculateEquipmentReinforcement({ initialLevel: point.from, targetLevel: point.level, weaponCount, otherCount })
      assert.deepEqual(point.costs[kind], expected.totals)
      for (const key of ['gold', 'water', 'potion']) {
        assert.equal(point.efficiency[kind][key], expected.totals[key] ? point.adjacent / expected.totals[key] : null)
        if (point.efficiency.weapon[key] !== null && kind === 'other') close(point.efficiency.other[key], point.efficiency.weapon[key] * 2)
      }
    }
  }
  assert.equal(analysis.points[0].efficiency.weapon.water, null)
  assert.equal(analysis.points[5].efficiency.weapon.potion, null)
  assert.equal(analysis.points[6].costs.weapon.potion, 40)
  assert.equal(analysis.points[24].costs.weapon.potion, 304)
  close(analysis.points[24].efficiency.weapon.potion, 33.75 / 304)
})

test('material calculator inputs cannot change the shared reinforcement baseline', () => {
  for (const [initialLevel, targetLevel, weaponCount, otherCount] of [[0, 240, 1, 0], [240, 500, 2, 3], [1000, 1000, 0, 0]]) {
    calculateEquipmentReinforcement({ initialLevel, targetLevel, weaponCount, otherCount })
    assert.deepEqual(buildReinforcementBenefits(), analysis)
  }
})

test('incomplete or invalid published data is rejected instead of extrapolated', () => {
  const load = () => ({
    coefficients: JSON.parse(fs.readFileSync(new URL('../src/constants/equipmentUpgrade.json', import.meta.url))).coefficients,
    materials: JSON.parse(fs.readFileSync(new URL('../src/constants/equipmentReinforcement.json', import.meta.url))),
  })
  for (const mutate of [data => data.coefficients.pop(), data => data.materials.pop(), data => { delete data.coefficients[70] },
    data => { data.coefficients[0] = 0 }, data => { data.materials[240][0][2] = -1 }, data => { data.materials[500] = null }]) {
    const data = load()
    mutate(data)
    assert.deepEqual(buildReinforcementBenefits(data), { valid: false, points: [] })
  }
})

test('equal-gain intersections keep precise coordinates and never cross missing tiers', () => {
  const rows = [[10, 0.01], [20, 0.02], [30, null], [40, 0.01], [50, 0.02], [60, 0.01]]
  const match = equivalentReinforcementLevels(rows, 0.01785)
  assert.equal(match.firstReached, 20)
  assert.equal(match.intersections.length, 3)
  match.intersections.forEach((value, index) => close(value, [17.85, 47.85, 52.15][index]))
  assert.deepEqual(equivalentReinforcementLevels(rows, 0.03), { intersections: [], firstReached: null })
  assert.deepEqual(equivalentReinforcementLevels([[10, 1], [20, 1], [30, 2]], 1), { intersections: [10, 20], firstReached: 10 })
})
