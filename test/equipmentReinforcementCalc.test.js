import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { calculateEquipmentReinforcement as calculate, MATERIAL_KEYS } from '../src/engine/equipmentReinforcementCalc.js'

const calc = (overrides = {}) => calculate({ initialLevel: 0, targetLevel: 240, weaponCount: 1, otherCount: 0, ...overrides })

// CI has only committed files. Compare against local Master data separately with
// node scripts/generate_equipment_reinforcement.mjs <master-directory> --check.
test('reinforcement published data covers all levels and both equipment categories', () => {
  const data = JSON.parse(fs.readFileSync(new URL('../src/constants/equipmentReinforcement.json', import.meta.url), 'utf8'))
  assert.equal(data.length, 1000)
  for (const row of data) {
    assert.equal(row.length, 2)
    for (const category of row) {
      assert.equal(category.length, 3)
      assert.ok(category.every(value => Number.isSafeInteger(value) && value >= 0))
      assert.ok(category[0] > 0)
    }
    row[0].forEach((value, index) => assert.equal(value, row[1][index] * 2))
  }
  const weapon = calc({ targetLevel: 1000 }).cumulative
  const other = calc({ targetLevel: 1000, weaponCount: 0, otherCount: 1 }).cumulative
  assert.equal(weapon.length, 1001)
  assert.equal(other.length, 1001)
  for (let level = 0; level <= 1000; level++) {
    assert.equal(weapon[level].level, level)
    assert.equal(other[level].level, level)
    for (const key of MATERIAL_KEYS) {
      assert.equal(weapon[level][key], other[level][key] * 2)
      if (level > 0) assert.ok(weapon[level][key] >= weapon[level - 1][key])
    }
  }
})

test('reinforcement first water and potion boundaries use destination level', () => {
  assert.deepEqual(calc({ initialLevel: 20, targetLevel: 21 }).totals, { gold: 1940, water: 20, potion: 0 })
  const result = calc({ initialLevel: 60, targetLevel: 61, weaponCount: 1, otherCount: 2 })
  assert.deepEqual(result.totals, { gold: 17840, water: 120, potion: 80 })
  assert.equal(result.tickets, 18) // Aggregate before rounding, not 9 + 5 + 5.
  assert.equal(calc({ targetLevel: 60 }).totals.potion, 0)
  assert.deepEqual(calc({ initialLevel: 999, targetLevel: 1000 }).totals, { gold: 27988000, water: 1920, potion: 0 })
})

test('reinforcement interval totals equal cumulative difference and quantities combine', () => {
  assert.deepEqual(calc().totals, { gold: 10084136, water: 42140, potion: 1194 })
  assert.equal(calc().tickets, 266)
  const result = calc({ initialLevel: 61, targetLevel: 240, weaponCount: 2, otherCount: 5 })
  const weapon = calc({ initialLevel: 61 })
  const other = calc({ initialLevel: 61, weaponCount: 0, otherCount: 1 })
  for (const key of MATERIAL_KEYS) {
    assert.equal(result.totals[key], result.cumulative[240][key] - result.cumulative[61][key])
    assert.equal(result.totals[key], weapon.totals[key] * 2 + other.totals[key] * 5)
  }
  assert.equal(result.tickets, Math.ceil(result.totals.potion / 4.5))
})

test('reinforcement zero intervals and quantities return zero', () => {
  for (const input of [{ initialLevel: 240 }, { targetLevel: 0 }, { weaponCount: 0 }]) {
    const result = calc(input)
    assert.equal(result.valid, true)
    assert.deepEqual(result.totals, { gold: 0, water: 0, potion: 0 })
    assert.equal(result.tickets, 0)
  }
})

test('reinforcement rejects invalid and unsafe inputs', () => {
  for (const key of ['initialLevel', 'targetLevel', 'weaponCount', 'otherCount']) {
    for (const value of ['', null, undefined, NaN, Infinity, -1, 0.5, '2', Number.MAX_SAFE_INTEGER]) {
      assert.equal(calc({ [key]: value }).valid, false, `${key}: ${value}`)
    }
  }
  assert.equal(calc({ initialLevel: 241 }).valid, false)
  assert.equal(calc({ targetLevel: 1001 }).valid, false)
})
