import test from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateGearCoreProductRange,
  calculateGearCoreProducts,
  calculateGearParts,
  normalizeGearLevel,
  normalizeGearLevelForGear,
} from '../src/engine/gearCoreProductCalc.js'

test('calculates cumulative parts at the reference progression breakpoints', () => {
  assert.equal(calculateGearParts(170, 'light'), 0)
  assert.equal(calculateGearParts(179, 'light'), 45)
  assert.equal(calculateGearParts(180, 'light'), 45)
  assert.equal(calculateGearParts(240, 'light'), 90)
  assert.equal(calculateGearParts(240, 'forbidden'), 105)
  assert.equal(calculateGearParts(240, 'seraph'), 100)
  assert.equal(calculateGearParts(240, 'unique'), 275)
  assert.equal(calculateGearParts(1000, 'light'), 3005)
})

test('converts parts to complete core-product exchanges with upward rounding', () => {
  const results = Object.fromEntries(calculateGearCoreProducts(240).map(row => [row.key, row]))
  assert.deepEqual(
    Object.fromEntries(Object.entries(results).map(([key, row]) => [key, row.products])),
    { light: 6, forbidden: 7, seraph: 4, unique: 28 },
  )
})

test('normalizes manual levels to the supported range', () => {
  assert.equal(normalizeGearLevel(-1), 0)
  assert.equal(normalizeGearLevel(241), 250)
  assert.equal(normalizeGearLevel(250), 250)
  assert.equal(normalizeGearLevel(1200), 1000)
  assert.equal(normalizeGearLevel('invalid'), 0)
})

test('normalizes positive levels to each gear type minimum', () => {
  assert.equal(normalizeGearLevelForGear(0, 'light'), 0)
  assert.equal(normalizeGearLevelForGear(1, 'light'), 180)
  assert.equal(normalizeGearLevelForGear(179, 'unique'), 180)
  assert.equal(normalizeGearLevelForGear(1, 'seraph'), 240)
  assert.equal(normalizeGearLevelForGear(239, 'seraph'), 240)
  assert.equal(normalizeGearLevelForGear(241, 'seraph'), 250)
})

test('calculates only the parts needed between two rounded-up levels', () => {
  assert.deepEqual(
    calculateGearCoreProductRange(241, 331, 'light'),
    {
      key: 'light',
      parts: 255,
      products: 17,
      exchangeParts: 15,
      exchangeProducts: 1,
      currentLevel: 250,
      targetLevel: 340,
    },
  )
  assert.equal(calculateGearCoreProductRange(340, 330, 'forbidden').products, 0)
})
