import test from 'node:test'
import assert from 'node:assert/strict'

import {
  __testables,
  buildUltraSalePlanOptions,
  planUltraSalePurchases,
} from '../src/engine/ultraSalePlanner.js'
import zhCN from '../src/locales/zh-CN.js'

const {
  buildPlanningContext,
  createEmptyState,
  expandState,
  comparePlan,
  pruneStates,
  findHeuristicTopUpCombination,
  findPermanentTopUpOption,
} = __testables

function makePack(trigger, price, originalValue, overrides = {}) {
  return {
    id: `${overrides.cat || 'tower'}:${overrides.tower || 'origin_tower_infinite'}:${trigger}:${price}`,
    name: `Pack ${trigger} ${price}`,
    cat: overrides.cat || 'tower',
    tower: overrides.tower || 'origin_tower_infinite',
    trigger,
    price,
    originalValue,
    value: originalValue,
    ce: price > 0 ? originalValue / (price / 2) : 0,
    items: [],
    ...overrides,
  }
}

function baseSettings(overrides = {}) {
  return {
    currentPrice: 160,
    preferenceLevel: 'balanced',
    freeDiamondScore: 0,
    executionWeight: 0,
    maxStates: 50,
    lanes: [{
      id: 'tower:infinite',
      cat: 'tower',
      tower: 'origin_tower_infinite',
      label: 'Tower',
      startProgress: 0,
      endProgress: 10,
      batchSize: 1,
    }],
    ...overrides,
  }
}

function makePermanentPack(name, price, paidDiamonds, originalValue = 100000) {
  return {
    id: `perm:${paidDiamonds}`,
    name,
    price,
    paidDiamonds,
    originalValue,
    value: originalValue,
    items: [],
  }
}

test('legacy planUltraSalePurchases API awaits async search and returns a result', async () => {
  const packs = [
    makePack(1, 160, 400),
  ]

  const pending = planUltraSalePurchases(packs, baseSettings())

  assert.equal(typeof pending?.then, 'function')

  const result = await pending

  assert.equal(result.purchases, 1)
  assert.equal(result.spent, 160)
  assert.ok(result.decisionValue >= result.moneySurplus)
})

test('empty retention baseline includes future opportunity value', () => {
  const packs = [
    makePack(1, 160, 10),
    makePack(1, 650, 3000),
  ]
  const context = buildPlanningContext(packs, baseSettings())
  const empty = createEmptyState(context)

  assert.ok(empty.remainingStateValue > 0)
  assert.ok(empty.searchPriority > 0)
})

test('consumed opportunities are not counted again as retained future value', () => {
  const packs = [
    makePack(1, 160, 400),
    makePack(2, 160, 560),
  ]
  const context = buildPlanningContext(packs, baseSettings())
  const empty = createEmptyState(context)
  const boughtFirst = expandState(empty, context)
    .find(state => state.purchases === 1 && state.triggerCount === 1)

  assert.ok(boughtFirst, 'expected a state that bought the first trigger')
  assert.equal(boughtFirst.remainingStateValue, 320)
  assert.ok(boughtFirst.remainingStateValue < empty.remainingStateValue)
})

test('retention option wins when using the current opportunity is below retained value baseline', async () => {
  const packs = [
    makePack(1, 160, 10),
    makePack(1, 650, 3000),
  ]

  const [option] = await buildUltraSalePlanOptions(packs, baseSettings())

  assert.equal(option.id, 'retention')
  assert.equal(option.purchases, 0)
  assert.ok(option.decisionValue > 0)
})

test('search pruning keeps higher decision value before higher immediate score', () => {
  const context = buildPlanningContext([makePack(1, 160, 400)], baseSettings({
    maxStates: 1,
    minBucketSurvivors: 0,
  }))
  const lowFutureHighImmediate = {
    ...createEmptyState(context),
    signature: 'real-score',
    realScore: 100,
    moneySurplus: 100,
    searchPriority: 100,
    limitedSpentYen: 160,
    totalSpentYen: 160,
  }
  const highFutureLowImmediate = {
    ...createEmptyState(context),
    signature: 'decision-value',
    realScore: 10,
    moneySurplus: 10,
    searchPriority: 500,
    limitedSpentYen: 650,
    totalSpentYen: 650,
  }

  assert.equal(comparePlan(highFutureLowImmediate, lowFutureHighImmediate) < 0, true)

  const [survivor] = pruneStates([lowFutureHighImmediate, highFutureLowImmediate], context)

  assert.equal(survivor.signature, 'decision-value')
})

test('top-up uses a fast bounded-overfill pack combination before reset', () => {
  const context = buildPlanningContext([makePack(1, 11800, 50000)], baseSettings({
    currentPrice: 11800,
    permanentPacks: [
      makePermanentPack('钻石组合包 80', 160, 80),
      makePermanentPack('钻石组合包 500', 1000, 500),
      makePermanentPack('钻石组合包 5900', 11800, 5900),
    ],
  }))
  const state = {
    ...createEmptyState(context),
    purchases: 1,
    dailyPaidDiamonds: 11800,
    steps: [{ rechargeDayIndex: 0, topUpCost: 0 }],
  }

  const topUp = findPermanentTopUpOption(state, context)

  assert.ok(topUp, 'expected a top-up option for the 12000 tier gap')
  assert.ok(topUp.paidDiamonds >= 200)
  assert.ok(topUp.paidDiamonds <= 280)
  assert.ok(topUp.purchases.every(pack => pack.paidDiamonds < 5900))
})

test('top-up heuristic tries each denomination once before repeating small fillers', () => {
  const packs = [
    makePermanentPack('钻石组合包 80', 160, 80),
    makePermanentPack('钻石组合包 325', 650, 325),
    makePermanentPack('钻石组合包 500', 1000, 500),
    makePermanentPack('钻石组合包 750', 1500, 750),
    makePermanentPack('钻石组合包 1500', 3000, 1500),
    makePermanentPack('钻石组合包 3000', 6000, 3000),
    makePermanentPack('钻石组合包 5900', 11800, 5900),
  ]

  const combo = findHeuristicTopUpCombination(11800, packs)

  assert.ok(combo, 'expected a heuristic top-up combination')
  assert.equal(combo.paidDiamonds, 11810)
  assert.equal(combo.purchases.filter(pack => pack.paidDiamonds === 5900).length, 1)
  assert.equal(combo.purchases.filter(pack => pack.paidDiamonds === 3000).length, 1)
  assert.equal(combo.purchases.filter(pack => pack.paidDiamonds === 1500).length, 1)
  assert.equal(combo.purchases.filter(pack => pack.paidDiamonds === 750).length, 1)
  assert.equal(combo.purchases.filter(pack => pack.paidDiamonds === 500).length, 1)
  assert.equal(combo.purchases.filter(pack => pack.paidDiamonds === 325).length, 0)
  assert.equal(combo.purchases.filter(pack => pack.paidDiamonds === 80).length, 2)
})

test('planner avoids same-day 36000-tier bursts from a multi-trigger 5900 tier batch', async () => {
  const packs = Array.from({ length: 5 }, (_, index) => (
    makePack(index + 1, 11800, 50000)
  ))

  const [option] = await buildUltraSalePlanOptions(packs, baseSettings({
    currentPrice: 11800,
    freeDiamondScore: 1,
    lanes: [{
      id: 'tower:infinite',
      cat: 'tower',
      tower: 'origin_tower_infinite',
      label: 'Tower',
      startProgress: 0,
      endProgress: 5,
      batchSize: 5,
    }],
    permanentPacks: [
      makePermanentPack('钻石组合包 80', 160, 80),
      makePermanentPack('钻石组合包 500', 1000, 500),
      makePermanentPack('钻石组合包 5900', 11800, 5900),
    ],
  }))
  const maxDisplayedPaid = Math.max(...option.steps.map(step => (
    step.topUpPacks?.length ? step.topUpRechargeAfterPaid : step.rechargeAfterPaid
  )))

  assert.ok(maxDisplayedPaid <= 12080)
  assert.ok(option.steps.every(step => step.purchases.length <= 2))
  assert.ok(option.topUpPacks.every(pack => !pack.displayTrigger.includes('5900')))
})

test('Chinese planner copy no longer describes removed budget and threshold controls', () => {
  const text = [
    zhCN.planPrefAggressive,
    zhCN.planTopUpNote,
    zhCN.planLaneTarget,
    zhCN.planNote1,
    zhCN.planEmptyInit,
    zhCN.planOptBestDesc,
  ].join('\n')

  assert.doesNotMatch(text, /预算|补累充阈值|计划推到|主预算/)
  assert.match(zhCN.planLaneTarget, /计算前瞻范围/)
})
