import test from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateGearCoreProducts,
  calculateGearParts,
  normalizeGearLevel,
} from '../src/engine/gearCoreProductCalc.js'

test('calculates cumulative parts at the reference progression breakpoints', () => {
  assert.equal(calculateGearParts(179, 'light'), 0)
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
  assert.equal(normalizeGearLevel(245.9), 245)
  assert.equal(normalizeGearLevel(1200), 1000)
  assert.equal(normalizeGearLevel('invalid'), 0)
})
