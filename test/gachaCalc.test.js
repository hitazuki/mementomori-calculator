import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildGachaAnalysis,
  calcAtLeastOne,
  DESTINY_FOUR_ELEMENTS_SIDE_DROPS,
  DESTINY_LIGHT_DARK_SIDE_DROPS,
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

test('destiny four-elements side drops are included in return analysis', () => {
  const scores = {
    '[1,1]': { score: 1, batch: 1 },
    '[10,1]': { score: 1, batch: 1 },
    '[10,6]': { score: 2, batch: 1 },
    '[10,11]': { score: 10, batch: 1 },
    '[12,1]': { score: 100, batch: 1000 },
    '[12,2]': { score: 50, batch: 1 },
    '[13,1]': { score: 180, batch: 1 },
    '[13,4]': { score: 1, batch: 1 },
    '[15,1]': { score: 1, batch: 1 },
    '[16,7]': { score: 300, batch: 1 },
    '[17,17]': { score: 80, batch: 1 },
    '[17,21]': { score: 720, batch: 1 },
    '[19,1]': { score: 50, batch: 1 },
    '[20,1]': { score: 100, batch: 1 },
  }

  const analysis = buildGachaAnalysis('destiny', 'fourElements', scores)

  assert.equal(analysis.sideDrops.length, DESTINY_FOUR_ELEMENTS_SIDE_DROPS.length)
  assert.equal(analysis.exclusiveSideDrops.length, 2)
  assert.ok(analysis.forbiddenWeaponReference > 0)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'astarothScroll').referenceLabel.includes('禁忌召唤'), true)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'astarothGrimoire').isPriced, true)
  assert.ok(analysis.sideValuePerPull > 50)
  assert.ok(analysis.expectedSideValue > analysis.expectedDiamondPrize)
  assert.ok(analysis.expectedNetCost < analysis.expectedGrossCost)
  assert.ok(analysis.sideAtCeiling.sideQuantities.sandalphonScroll > 5)
})

test('destiny light-dark side drops use zeroed rates with the water100 override', () => {
  const analysis = buildGachaAnalysis('destiny', 'lightDark', {
    '[1,1]': { score: 1, batch: 1 },
    '[16,7]': { score: 300, batch: 1 },
  })

  assert.equal(analysis.sideDrops.length, DESTINY_LIGHT_DARK_SIDE_DROPS.length)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'water300').rate, 0.0281)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'water100').rate, 0.0374)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'gold6h5').rate, 0.0936)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'astarothScroll').isPriced, true)
  assert.equal(analysis.sideProbabilityCheck.sideRate.toFixed(6), '0.980000')
  assert.equal(analysis.sideProbabilityCheck.totalRate.toFixed(6), '1.000000')
  assert.equal(analysis.sideProbabilityCheck.isClosed, true)
})
