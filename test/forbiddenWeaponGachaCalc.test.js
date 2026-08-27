import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildForbiddenWeaponGachaAnalysis,
  calculateExpectedCoreProductsAtPulls,
  findExpectedPullsForCoreProducts,
  buildCoreProductProbabilityDistributions,
  buildSeraphCrossWeekComparisonRows,
} from '../src/engine/forbiddenWeaponGachaCalc.js'

const scores = {
  '[16,1]': { score: 300, batch: 1 },
  '[16,6]': { score: 60, batch: 1 },
  '[16,7]': { score: 300, batch: 1 },
  '[16,12]': { score: 300, batch: 1 },
  '[19,1]': { score: 50, batch: 1 },
  '[20,1]': { score: 100, batch: 1 },
  '[12,1]': { score: 1, batch: 1000 },
  '[12,2]': { score: 20, batch: 1 },
  '[13,1]': { score: 180, batch: 1 },
  '[13,3]': { score: 200, batch: 1000 },
  '[13,4]': { score: 20, batch: 1 },
  '[15,1]': { score: 50, batch: 1 },
}

test('forbidden weapon gacha derives side-product recovery from item scores', () => {
  const analysis = buildForbiddenWeaponGachaAnalysis(scores, { selectedPulls: 10 })

  const expectedSideValue =
    (0.06 * 1 * 50) +
    (0.20 * 200 * 0.001) +
    (0.25 * 20 * 20) +
    (0.25 * 3 * 50)

  assert.equal(analysis.ticketValue, 300)
  assert.equal(analysis.sideValuePerPull, expectedSideValue)
  assert.equal(analysis.selected.sideValue, expectedSideValue * 10)
})

test('milestone rewards alternate every 10 pulls and do not reset', () => {
  const at9 = buildForbiddenWeaponGachaAnalysis(scores, { selectedPulls: 9 }).selected
  const at10 = buildForbiddenWeaponGachaAnalysis(scores, { selectedPulls: 10 }).selected
  const at20 = buildForbiddenWeaponGachaAnalysis(scores, { selectedPulls: 20 }).selected
  const at30 = buildForbiddenWeaponGachaAnalysis(scores, { selectedPulls: 30 }).selected
  const at40 = buildForbiddenWeaponGachaAnalysis(scores, { selectedPulls: 40 }).selected
  const at50 = buildForbiddenWeaponGachaAnalysis(scores, { selectedPulls: 50 }).selected

  assert.equal(at9.coreCounts.scroll, 9 * 0.12)
  assert.equal(at10.coreCounts.scroll, 10 * 0.12 + 1)
  assert.equal(at20.coreCounts.grimoire, 20 * 0.12 + 1)
  assert.equal(at30.coreCounts.scroll, 30 * 0.12 + 2)
  assert.equal(at30.coreCounts.grimoire, 30 * 0.12 + 1)
  assert.equal(at40.coreCounts.scroll, 40 * 0.12 + 2)
  assert.equal(at40.coreCounts.grimoire, 40 * 0.12 + 2)
  assert.equal(at50.coreCounts.scroll, 50 * 0.12 + 3)
  assert.equal(at50.milestoneRewards.length, 5)
})

test('selected pull count can exceed the chart range', () => {
  const analysis = buildForbiddenWeaponGachaAnalysis(scores, {
    selectedPulls: 250,
    maxPulls: 100,
  })

  assert.equal(analysis.rows.length, 100)
  assert.equal(analysis.selectedPulls, 250)
  assert.equal(analysis.selected.pulls, 250)
  assert.equal(analysis.selected.milestoneRewards.length, 25)
})

test('implicit core unit improves at milestone nodes', () => {
  const analysis = buildForbiddenWeaponGachaAnalysis(scores, { selectedPulls: 20 })
  const at9 = analysis.rows[8]
  const at10 = analysis.rows[9]
  const at20 = analysis.rows[19]

  assert.ok(at10.implicitCoreUnit < at9.implicitCoreUnit)
  assert.ok(at20.implicitCoreUnit < at9.implicitCoreUnit)
})

test('light weapon gacha uses Sandalphon drops and scaled side products', () => {
  const analysis = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'light',
    selectedPulls: 20,
  })

  const expectedSideValue =
    (0.06 * 1 * 50) +
    (0.20 * 40 * 0.001) +
    (0.25 * 4 * 20) +
    (0.25 * 3 * 50)

  assert.equal(analysis.config.costItem.label, '天光武具召唤券')
  assert.equal(analysis.ticketValue, 60)
  assert.equal(analysis.sideValuePerPull, expectedSideValue)
  assert.equal(analysis.config.coreDrops.find(drop => drop.key === 'scroll').label, '圣德芬的卷轴')
  assert.equal(analysis.config.coreDrops.find(drop => drop.key === 'grimoire').label, '圣德芬的魔书')
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'water').qty, 40)
  assert.equal(analysis.sideDrops.find(drop => drop.key === 'rune').qty, 4)
  assert.equal(analysis.selected.coreCounts.scroll, 20 * 0.12 + 1)
  assert.equal(analysis.selected.coreCounts.grimoire, 20 * 0.12 + 1)
})

test('witch secret gacha values the weekly 35-pull round with seven free pulls', () => {
  const analysis = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'witchSecret',
    selectedPulls: 35,
  })

  const expectedSideValue =
    (0.20 * 1 * 50) +
    (0.08 * 1 * 150) +
    (0.17 * 3 * 100) +
    (0.20 * 3 * 50) +
    (0.18 * 15 * 20) +
    (0.09 * 9 * 20)

  assert.equal(analysis.ticketValue, 300)
  assert.equal(analysis.sideValuePerPull, expectedSideValue)
  assert.equal(analysis.selected.freePulls, 0)
  assert.equal(analysis.selected.paidPulls, 28)
  assert.equal(analysis.cumulativeSelected.freePulls, 7)
  assert.equal(analysis.cumulativeSelected.paidPulls, 28)
  assert.equal(analysis.selected.totalCost, 28 * 300)
  assert.ok(Math.abs(analysis.selected.sideValue - expectedSideValue * 28) < 1e-9)
  assert.ok(Math.abs(analysis.selected.coreCounts.magicCrystal - 28 * 0.12) < 1e-9)
  assert.equal(analysis.selected.coreCounts.tenPullGuarantee, 28)
  assert.equal(analysis.selected.coreCounts.weeklyBonus, 8)
  assert.ok(Math.abs(analysis.selected.totalCoreCount - 39.36) < 1e-9)
  assert.equal(analysis.decisionBaselinePulls, 7)
  assert.equal(analysis.decisionRows[0].pulls, 8)
  assert.equal(analysis.decisionRows[0].freePulls, 0)
  assert.equal(analysis.decisionRows[0].paidPulls, 1)
  assert.ok(Math.abs(analysis.decisionRows[0].totalCoreCount - 1.12) < 1e-9)
})

test('witch secret weekly rewards cap after 35 pulls but ten-pull value continues', () => {
  const freeOnly = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'witchSecret',
    selectedPulls: 7,
  }).selected
  const afterWeeklyCap = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'witchSecret',
    selectedPulls: 45,
  }).selected

  assert.equal(freeOnly.totalCost, 0)
  assert.equal(freeOnly.coreCounts.weeklyBonus, 0)
  assert.equal(freeOnly.totalCoreCount, 0)
  assert.equal(afterWeeklyCap.coreCounts.weeklyBonus, 8)
  assert.ok(Math.abs(afterWeeklyCap.totalCoreCount - (38 * 1.12 + 8)) < 1e-9)
})

test('witch secret selected value matches the paid-stage chart row', () => {
  const analysis = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'witchSecret',
    selectedPulls: 15,
  })
  const chartRow = analysis.rows.find(row => row.pulls === 15)

  assert.equal(analysis.selected.implicitCoreUnit, chartRow.implicitCoreUnit)
  assert.equal(analysis.selected.sideValue, chartRow.sideValue)
  assert.equal(analysis.selected.totalCoreCount, chartRow.totalCoreCount)
  assert.equal(analysis.cumulativeSelected.freePulls, 7)
  assert.equal(analysis.cumulativeSelected.paidPulls, 8)
})

test('seraph oracle gacha repeats weekly milestone rounds without extra free pulls', () => {
  const fullAnalysis = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'seraphOracle',
    selectedPulls: 100,
  })
  const at50 = fullAnalysis.rows.find(row => row.pulls === 50)
  const at100 = fullAnalysis.selected
  const noFreeCycle = fullAnalysis.noFreeCycleNode

  const baseSideValue =
    (0.20 * 200 * 0.001) +
    (0.10 * 3 * 20) +
    (0.15 * 3 * 50) +
    (0.15 * 1 * 100) +
    (0.15 * 20 * 20) +
    (0.10 * 1 * 150) +
    (0.15 * 1 * 50)
  const milestoneSideValue = (1000 + 1500 + 2500) * 0.2 + (2 + 3 + 5) * 180

  assert.equal(at50.freePulls, 0)
  assert.equal(at50.paidPulls, 43)
  assert.equal(at50.milestoneRewards.length, 9)
  assert.equal(at50.coreCounts.relic, 1.6)
  assert.ok(Math.abs(at50.sideValue - (baseSideValue * 43 + milestoneSideValue)) < 1e-9)
  assert.equal(at100.freePulls, 0)
  assert.equal(at100.paidPulls, 93)
  assert.equal(at100.milestoneRewards.length, 18)
  assert.equal(at100.coreCounts.relic, 3.2)
  assert.equal(fullAnalysis.cumulativeSelected.freePulls, 7)
  assert.equal(fullAnalysis.cumulativeSelected.paidPulls, 93)
  assert.equal(noFreeCycle.freePulls, 0)
  assert.equal(noFreeCycle.paidPulls, 50)
  assert.equal(noFreeCycle.coreCounts.relic, 1.6)
  assert.equal(fullAnalysis.noFreeCycleRows.length, 50)
  assert.equal(fullAnalysis.noFreeCycleRows[9].paidPulls, 10)
  assert.ok(Math.abs(fullAnalysis.noFreeCycleRows[24].coreCounts.relic - 0.6) < 1e-9)
  assert.equal(fullAnalysis.noFreeCycleRows[49].coreCounts.relic, 1.6)
  assert.equal(fullAnalysis.rows.length, 143)
  assert.equal(fullAnalysis.cumulativeRows.length, 150)
  assert.equal(fullAnalysis.cumulativeRows[6].freePulls, 7)
  assert.equal(fullAnalysis.cumulativeRows[9].paidPulls, 3)
  assert.equal(fullAnalysis.decisionBaselinePulls, 7)
  assert.equal(fullAnalysis.decisionRows[0].pulls, 8)
  assert.equal(fullAnalysis.decisionRows[2].pulls, 10)
  assert.equal(fullAnalysis.decisionRows[2].paidPulls, 3)
  assert.equal(fullAnalysis.decisionRows[2].coreCounts.relic, 0.2)
})

test('seraph oracle can ignore the initial three-pull top-up and analyze from pull 11', () => {
  const analysis = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'seraphOracle',
    selectedPulls: 25,
    ignoreFirstTopUp3: true,
  })

  assert.equal(analysis.baselinePulls, 10)
  assert.equal(analysis.decisionBaselinePulls, 10)
  assert.equal(analysis.decisionRows[0].pulls, 11)
  assert.equal(analysis.rows.length, 140)
  assert.equal(analysis.rows[0].pulls, 11)
  assert.equal(analysis.rows[0].freePulls, 0)
  assert.equal(analysis.rows[0].paidPulls, 1)
  assert.equal(analysis.selected.freePulls, 0)
  assert.equal(analysis.selected.paidPulls, 15)
  assert.equal(analysis.selected.totalCost, 15 * 300)
  assert.ok(Math.abs(analysis.selected.coreCounts.relic - 0.4) < 1e-9)
  assert.equal(analysis.selected.milestoneRewards.length, 3)
  assert.equal(analysis.noFreeCycleNode.paidPulls, 50)
})

test('seraph cross-week comparison uses equal paid pulls and exposes expected relic loss', () => {
  const analysis = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'seraphOracle',
    selectedPulls: 50,
  })
  const rows = buildSeraphCrossWeekComparisonRows(analysis)

  assert.equal(rows.length, 5)
  assert.deepEqual(rows.map(row => row.requestedPulls), [200, 400, 600, 800, 1000])
  assert.deepEqual(rows.map(row => row.singleWeekStages), [4, 8, 12, 16, 20])
  assert.deepEqual(rows.map(row => row.splitWeekStages), [5, 10, 15, 20, 25])
  assert.ok(rows.every(row => row.continuous.paidPulls === row.splitWeeks.paidPulls))
  assert.ok(rows.every(row => row.continuous.implicitCoreUnit > row.splitWeeks.implicitCoreUnit))
  assert.ok(rows.every(row => row.expectedRelicLoss > 0))
  assert.ok(rows.slice(1).every((row, index) =>
    row.expectedRelicLoss > rows[index].expectedRelicLoss
  ))
  assert.ok(Math.abs(rows[0].expectedRelicLoss - 0.6) < 1e-9)
  assert.ok(Math.abs(rows[4].expectedRelicLoss - 3) < 1e-9)
  assert.ok(rows.every(row => row.continuous.totalCost === row.splitWeeks.totalCost))
})

test('core product distributions match configured random drops and milestones', () => {
  const forbidden = buildForbiddenWeaponGachaAnalysis(scores, { selectedPulls: 10 })
  const forbiddenDistributions = buildCoreProductProbabilityDistributions(forbidden)
  assert.equal(forbiddenDistributions.length, 2)
  assert.ok(Math.abs(forbiddenDistributions[0].expected - 2.2) < 1e-9)
  assert.ok(Math.abs(forbiddenDistributions[1].expected - 1.2) < 1e-9)

  const witch = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'witchSecret',
    selectedPulls: 15,
  })
  const [magicCrystal] = buildCoreProductProbabilityDistributions(witch)
  assert.ok(Math.abs(magicCrystal.expected - witch.selected.totalCoreCount) < 1e-9)

  const seraph = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'seraphOracle',
    selectedPulls: 50,
  })
  const [relic] = buildCoreProductProbabilityDistributions(seraph)
  assert.equal(relic.decisionPulls, 40)
  assert.deepEqual(relic.points.map(point => point.quantity), [1, 2])
  assert.ok(Math.abs(relic.points[0].probability - 0.60) < 1e-9)
  assert.ok(Math.abs(relic.points[1].probability - 0.40) < 1e-9)
  assert.ok(Math.abs(relic.expected - 1.4) < 1e-9)
})

test('weekly-round distributions repeat weekly rewards and exclude free and stage-one pulls', () => {
  const witch = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'witchSecret',
    selectedPulls: 63,
  })
  const [witchSingleWeek] = buildCoreProductProbabilityDistributions(witch)
  const [witchWeeklyRounds] = buildCoreProductProbabilityDistributions(witch, { periodMode: 'weeklyRound' })
  assert.equal(witchSingleWeek.decisionPulls, 56)
  assert.equal(witchWeeklyRounds.decisionPulls, 56)
  assert.ok(Math.abs(witchWeeklyRounds.expected - witchSingleWeek.expected - 8) < 1e-9)

  const seraph = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'seraphOracle',
    selectedPulls: 90,
  })
  const [seraphSingleWeek] = buildCoreProductProbabilityDistributions(seraph)
  const [seraphWeeklyRounds] = buildCoreProductProbabilityDistributions(seraph, { periodMode: 'weeklyRound' })
  assert.equal(seraphSingleWeek.decisionPulls, 80)
  assert.equal(seraphWeeklyRounds.decisionPulls, 80)
  assert.ok(Math.abs(seraphSingleWeek.expected - 2) < 1e-9)
  assert.ok(Math.abs(seraphWeeklyRounds.expected - 2.8) < 1e-9)
})

test('expected pull lookup reaches the requested core-product expectation', () => {
  assert.ok(Math.abs(calculateExpectedCoreProductsAtPulls('forbidden', 10) - 3.4) < 1e-9)
  assert.equal(findExpectedPullsForCoreProducts('forbidden', 5), 17)
  assert.equal(findExpectedPullsForCoreProducts('witchSecret', 10), 8)
  assert.equal(findExpectedPullsForCoreProducts('seraphOracle', 2), 75)
  assert.equal(findExpectedPullsForCoreProducts('light', 0), 0)
})
