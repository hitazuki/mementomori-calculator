import test from 'node:test'
import assert from 'node:assert/strict'

import { buildForbiddenWeaponGachaAnalysis } from '../src/engine/forbiddenWeaponGachaCalc.js'

const scores = {
  '[16,6]': { score: 60, batch: 1 },
  '[16,7]': { score: 300, batch: 1 },
  '[16,12]': { score: 300, batch: 1 },
  '[19,1]': { score: 50, batch: 1 },
  '[20,1]': { score: 100, batch: 1 },
  '[12,1]': { score: 1, batch: 1000 },
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
  assert.equal(analysis.selected.freePulls, 7)
  assert.equal(analysis.selected.paidPulls, 28)
  assert.equal(analysis.selected.totalCost, 28 * 300)
  assert.equal(analysis.selected.coreCounts.magicCrystal, 35 * 0.12)
  assert.equal(analysis.selected.coreCounts.tenPullGuarantee, 35)
  assert.equal(analysis.selected.coreCounts.weeklyBonus, 10)
  assert.equal(analysis.selected.totalCoreCount, 49.2)
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
  assert.equal(freeOnly.coreCounts.weeklyBonus, 2)
  assert.equal(freeOnly.totalCoreCount, 7 * 1.12 + 2)
  assert.equal(afterWeeklyCap.coreCounts.weeklyBonus, 10)
  assert.ok(Math.abs(afterWeeklyCap.totalCoreCount - (45 * 1.12 + 10)) < 1e-9)
})
