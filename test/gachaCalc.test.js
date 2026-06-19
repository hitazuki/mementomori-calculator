import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildGachaAnalysis,
  calcAtLeastOne,
  getConditionalLimitedRate,
  getGachaConfig,
} from '../src/engine/gachaCalc.js'

test('destiny gacha uses base rate before soft pity and guarantees at 70', () => {
  const config = getGachaConfig('destiny', 'lightDark')

  assert.equal(getConditionalLimitedRate(config, 1), 0.02)
  assert.equal(getConditionalLimitedRate(config, 56), 0.02)
  assert.ok(getConditionalLimitedRate(config, 57) > 0.02)
  assert.equal(getConditionalLimitedRate(config, 70), 1)

  const analysis = buildGachaAnalysis('destiny', 'lightDark')
  assert.equal(analysis.pulls.at(-1).cumulativeRate, 1)
  assert.ok(analysis.expectedPulls > 1)
  assert.ok(analysis.expectedPulls < 70)
})

test('pickup gacha keeps the normal rate until the 100-pull guarantee', () => {
  const config = getGachaConfig('pickup', 'fourElements')

  assert.equal(getConditionalLimitedRate(config, 99), 0.0137)
  assert.equal(getConditionalLimitedRate(config, 100), 1)

  const analysis = buildGachaAnalysis('pickup', 'fourElements')
  assert.equal(analysis.pulls.at(-1).cumulativeRate, 1)
  assert.equal(analysis.quantiles.p100, 100)
})

test('at least one helper calculates independent side-prize probability', () => {
  assert.equal(calcAtLeastOne(0.0001, 0), 0)
  assert.ok(calcAtLeastOne(0.0001, 70) > 0.006)
  assert.ok(calcAtLeastOne(0.0014, 300) > calcAtLeastOne(0.0014, 100))
})
