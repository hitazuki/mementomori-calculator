import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { calculateEquipmentReinforcement as calculate, MATERIAL_KEYS } from '../src/engine/equipmentReinforcementCalc.js'

const calc = (overrides = {}) => calculate({ initialLevel: 0, targetLevel: 240, weaponCount: 1, otherCount: 0, ...overrides })

test('reinforcement data matches all master levels and both equipment categories', () => {
  const master = JSON.parse(fs.readFileSync(new URL('../data/Master/EquipmentReinforcementMaterialMB.json', import.meta.url), 'utf8'))
  assert.equal(master.length, 1000)
  for (const [weaponCount, otherCount, field] of [[1, 0, 'WeaponRequiredItemList'], [0, 1, 'OthersRequiredItemList']]) {
    const result = calc({ weaponCount, otherCount })
    master.forEach((row, index) => {
      assert.equal(row.ReinforcementLevel, index + 1)
      for (const [i, identity] of [[0, [3, 1]], [1, [12, 1]], [2, [12, 2]]]) {
        const expected = row[field].filter(item => item.ItemType === identity[0] && item.ItemId === identity[1]).reduce((sum, item) => sum + item.ItemCount, 0)
        const key = MATERIAL_KEYS[i]
        assert.equal(result.cumulative[index + 1][key] - result.cumulative[index][key], expected)
      }
    })
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
