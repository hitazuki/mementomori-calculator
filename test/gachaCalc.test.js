import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildGachaAnalysis,
  calcAtLeastOne,
  DESTINY_FOUR_ELEMENTS_SIDE_DROPS,
  DESTINY_LIGHT_DARK_SIDE_DROPS,
  PICKUP_CHARACTER_SIDE_DROPS,
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

test('gacha pull costs follow ticket scores with banner defaults as fallback', () => {
  assert.equal(getGachaConfig('destiny', 'lightDark').costPerPull, 500)
  assert.equal(getGachaConfig('pickup', 'lightDark').costPerPull, 300)

  const scores = {
    '[16,4]': { score: 550, batch: 1 },
    '[16,510]': { score: 360, batch: 1 },
  }
  const destinyConfig = getGachaConfig('destiny', 'lightDark', scores)
  const pickupAnalysis = buildGachaAnalysis('pickup', 'lightDark', scores)

  assert.equal(destinyConfig.costPerPull, 550)
  assert.equal(pickupAnalysis.config.costPerPull, 360)
  assert.equal(pickupAnalysis.pulls[0].diamonds, 360)
})

test('pickup side returns include rarity conversion and cyclic pull rewards', () => {
  const scores = {
    '[16,510]': { score: 300, batch: 1 },
    '[17,5]': { score: 16, batch: 1 },
    '[17,17]': { score: 80, batch: 1 },
    '[17,21]': { score: 720, batch: 1 },
    '[17,26]': { score: 720, batch: 1 },
    '[17,28]': { score: 800, batch: 60 },
  }

  const analysis = buildGachaAnalysis('pickup', 'fourElements', scores)
  const otherSr = analysis.sideDrops.find(drop => drop.key === 'pickupOtherSr')
  const permanentLightDark = analysis.sideDrops.find(drop => drop.key === 'pickupPermanentLightDark')
  const nRole = analysis.sideDrops.find(drop => drop.key === 'pickupN')
  const at50 = analysis.getSideSummaryAtPulls(50)
  const at100 = analysis.getSideSummaryAtPulls(100)
  const at300 = analysis.getSideSummaryAtPulls(300)

  assert.equal(analysis.config.label, '精选召唤')
  assert.equal(PICKUP_CHARACTER_SIDE_DROPS.length, 4)
  assert.equal(otherSr.rate.toFixed(4), '0.0295')
  assert.equal(permanentLightDark.isPriced, true)
  assert.equal(permanentLightDark.unitScore, 720)
  assert.equal(nRole.qty, 0.5)
  assert.equal(at50.sideQuantities.pickupRuneLv3, 2)
  assert.equal(at50.sideQuantities.pickupRuneLv5, 1)
  assert.equal(at100.sideQuantities.pickupHeartSr80, 80)
  assert.equal(at300.sideQuantities.pickupHeartSr80, 160)
  assert.equal(at300.sideQuantities.pickupInvitation, 1)
  assert.ok(analysis.expectedNetCost < analysis.expectedGrossCost)
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
    '[16,6]': { score: 60, batch: 1 },
    '[16,7]': { score: 300, batch: 1 },
    '[17,17]': { score: 80, batch: 1 },
    '[17,21]': { score: 720, batch: 1 },
    '[19,1]': { score: 50, batch: 1 },
    '[20,1]': { score: 100, batch: 1 },
  }

  const analysis = buildGachaAnalysis('destiny', 'fourElements', scores)

  assert.equal(analysis.sideDrops.length, DESTINY_FOUR_ELEMENTS_SIDE_DROPS.length)
  assert.equal(analysis.exclusiveSideDrops.length, 0)
  assert.ok(analysis.lightWeaponReference > 0)
  assert.ok(analysis.forbiddenWeaponReference > 0)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'sandalphonScroll').referenceLabel.includes('天光武具'), true)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'sandalphonGrimoire').isPriced, true)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'astarothScroll').referenceLabel.includes('禁忌武具'), true)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'astarothGrimoire').isPriced, true)
  assert.ok(analysis.sideValuePerPull > 50)
  assert.ok(analysis.expectedSideValue > analysis.expectedDiamondPrize)
  assert.ok(analysis.expectedNetCost < analysis.expectedGrossCost)
  assert.ok(analysis.sideAtCeiling.sideQuantities.sandalphonScroll > 5)
})

test('destiny light-dark side drops use zeroed rates with the water100 override', () => {
  const analysis = buildGachaAnalysis('destiny', 'lightDark', {
    '[1,1]': { score: 1, batch: 1 },
    '[16,6]': { score: 60, batch: 1 },
    '[16,7]': { score: 300, batch: 1 },
  })

  assert.equal(analysis.sideDrops.length, DESTINY_LIGHT_DARK_SIDE_DROPS.length)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'water300').rate, 0.0281)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'water100').rate, 0.0374)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'gold6h5').rate, 0.0936)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'sandalphonScroll').isPriced, true)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'astarothScroll').isPriced, true)
  assert.equal(analysis.sideProbabilityCheck.sideRate.toFixed(6), '0.980000')
  assert.equal(analysis.sideProbabilityCheck.totalRate.toFixed(6), '1.000000')
  assert.equal(analysis.sideProbabilityCheck.isClosed, true)
})
