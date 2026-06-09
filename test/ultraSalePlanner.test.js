import test from 'node:test'
import assert from 'node:assert/strict'

import { cumulativeFreeDiamonds, marginalFreeDiamonds } from '../src/engine/dailyRechargeBonus.js'
import { mainQuestStageCount, parseMainQuestProgress } from '../src/engine/mainQuestProgress.js'
import { __testables, buildUltraSalePlanOptions, compressUltraSalePlanSteps, planUltraSalePurchases } from '../src/engine/ultraSalePlanner.js'

function pack(trigger, price, value) {
  return {
    cat: 'tower',
    tower: 'origin_tower_infinite',
    trigger,
    sortKey: Number(trigger),
    price,
    value,
    ce: value / Math.max(1, price / 2),
    items: [],
  }
}

function questPack(trigger, price, value) {
  return {
    ...pack(trigger, price, value),
    cat: 'quest',
    tower: null,
    sortKey: Number(String(trigger).split('-')[0]),
  }
}

function towerPack(tower, trigger, price, value) {
  return {
    ...pack(trigger, price, value),
    tower,
  }
}

function permanentDiamondPack(name, price, originalValue) {
  return {
    name,
    price,
    originalValue,
    paidDiamonds: price / 2,
    value: originalValue,
    ce: originalValue / (price / 2),
    items: [],
  }
}

test('daily recharge bonus accumulates unlocked tier rewards', () => {
  assert.equal(cumulativeFreeDiamonds(5900), 2400)
  assert.equal(cumulativeFreeDiamonds(6000), 7200)
  assert.equal(marginalFreeDiamonds(5900, 160), 4800)
  assert.equal(marginalFreeDiamonds(12000, 6000), 4200)
})

test('buying one pack in a batch raises the tier for the next batch', () => {
  const packs = [
    pack('10', 160, 100),
    pack('20', 650, 1000),
  ]

  const plan = planUltraSalePurchases(packs, {
    source: 'tower',
    tower: 'origin_tower_infinite',
    startProgress: 0,
    endProgress: 30,
    currentPrice: 160,
    budget: 970,
    batchSize: 1,
  })

  assert.equal(plan.spent, 810)
  assert.equal(plan.purchases, 2)
  assert.equal(plan.steps[0].nextTierPrice, 650)
  assert.equal(plan.steps[1].tierPrice, 650)
})

test('buying part of a batch raises only one tier and skips low-value offers', () => {
  const packs = [
    pack('10', 160, 900),
    pack('20', 160, 100),
    pack('30', 650, 1000),
  ]

  const plan = planUltraSalePurchases(packs, {
    source: 'tower',
    tower: 'origin_tower_infinite',
    startProgress: 0,
    endProgress: 40,
    currentPrice: 160,
    budget: 810,
    batchSize: 2,
  })

  const partialBatch = plan.steps.find(step => step.opportunities.length === 2)
  assert.equal(partialBatch.purchases.length, 1)
  assert.equal(partialBatch.purchases[0].trigger, '30')
  assert.deepEqual(partialBatch.opportunities.map(opportunity => ({
    trigger: opportunity.trigger,
    purchased: opportunity.purchased,
  })), [
    { trigger: '20', purchased: false },
    { trigger: '30', purchased: true },
  ])
  assert.equal(partialBatch.skippedOpportunities.length, 1)
  assert.equal(partialBatch.tierPrice, 650)
  assert.equal(partialBatch.nextTierPrice, 650)
})

test('planner can hold an untriggered node for a later higher tier batch', () => {
  const packs = [
    questPack('7-28', 160, 100),
    pack('10', 160, 10),
    pack('10', 650, 1000),
  ]

  const plan = planUltraSalePurchases(packs, {
    currentPrice: 160,
    budget: 810,
    lanes: [
      { id: 'quest', cat: 'quest', label: '主线', enabled: true, startProgress: '0-0', endProgress: '8-28', batchSize: 1 },
      { id: 'tower', cat: 'tower', tower: 'origin_tower_infinite', label: '无穷塔', enabled: true, startProgress: 0, endProgress: 10, batchSize: 1 },
    ],
  })

  assert.match(plan.steps[0].triggerRange, /主线/)
  assert.equal(plan.steps[0].tierPrice, 160)
  assert.equal(plan.steps[0].nextTierPrice, 650)
  const towerStep = plan.steps.find(step => step.triggerRange.includes('无穷塔: 10'))
  assert.equal(towerStep.tierPrice, 650)
  assert.equal(towerStep.purchases[0].price, 650)
})

test('buildUltraSalePlanOptions exposes value and policy plans', () => {
  const packs = [
    pack('10', 160, 400),
    pack('20', 160, 100),
    pack('30', 650, 900),
    pack('40', 1000, 1600),
  ]

  const options = buildUltraSalePlanOptions(packs, {
    source: 'tower',
    tower: 'origin_tower_infinite',
    startProgress: 0,
    endProgress: 50,
    currentPrice: 160,
    budget: 1810,
    batchSize: 1,
  })

  assert.deepEqual(options.map(option => option.id), ['bestValue', 'smallPack', 'maxPack'])
  assert.ok(options[0].value >= 0)
  assert.equal(options[1].label, '只买小包')
  assert.equal(options[2].label, '冲最大包')
})

test('planner appends non-first permanent diamond packs to top up daily recharge tiers', () => {
  const packs = [
    pack('10', 11800, 5900),
  ]
  const permanentPacks = [
    permanentDiamondPack('钻石组合包 80', 160, 148),
    permanentDiamondPack('钻石组合包 80 (首次双倍)', 160, 228),
    permanentDiamondPack('钻石组合包 325', 650, 518),
  ]

  const plan = planUltraSalePurchases(packs, {
    source: 'tower',
    tower: 'origin_tower_infinite',
    startProgress: 0,
    endProgress: 10,
    currentPrice: 11800,
    budget: 12120,
    batchSize: 1,
    topUpBudgetRatio: 5,
    permanentPacks,
    freeDiamondScore: 1,
  })

  const topUpStep = plan.steps[0]
  assert.equal(topUpStep.cost, 12120)
  assert.equal(topUpStep.topUpCost, 320)
  assert.equal(topUpStep.topUpRechargeFreeDiamonds, 4800)
  assert.deepEqual(topUpStep.topUpUnlockedRechargeTiers, [6000])
  assert.equal(plan.topUpPurchaseCount, 2)
  assert.equal(plan.topUpBatchCount, 1)
  assert.equal(plan.topUpPackSummary, '第 1 批：钻石组合包 80 ×2')
  assert.equal(plan.topUpBatches[0].index, 1)
  assert.equal(plan.topUpBatches[0].cost, 320)
  assert.equal(plan.topUpPacks[0].displayTrigger, '钻石组合包 80 ×2')
  assert.equal(topUpStep.topUpPacks[0].displayTrigger, '钻石组合包 80 ×2')
  assert.equal(topUpStep.topUpPacks.some(p => p.displayTrigger.includes('首次')), false)
})

test('planner stops permanent top-up once the next recharge tier is reached', () => {
  const packs = [
    pack('10', 11800, 5900),
  ]
  const permanentPacks = [
    permanentDiamondPack('钻石组合包 80', 160, 148),
    permanentDiamondPack('钻石组合包 325', 650, 518),
  ]

  const plan = planUltraSalePurchases(packs, {
    source: 'tower',
    tower: 'origin_tower_infinite',
    startProgress: 0,
    endProgress: 10,
    currentPrice: 11800,
    budget: 12280,
    batchSize: 1,
    topUpBudgetRatio: 5,
    permanentPacks,
    freeDiamondScore: 1,
  })

  assert.equal(plan.spent, 12120)
  assert.equal(plan.remaining, 480)
  assert.equal(plan.topUpRemaining, 294)
  assert.equal(plan.topUpPurchaseCount, 2)
  assert.equal(plan.topUpPackSummary, '第 1 批：钻石组合包 80 ×2')
  assert.equal(plan.steps[0].topUpCost, 320)
  assert.deepEqual(plan.steps[0].topUpUnlockedRechargeTiers, [6000])
})

test('planner uses the cheapest permanent diamond combo for the next recharge tier', () => {
  const packs = [
    pack('10', 11350, 5675),
  ]
  const permanentPacks = [
    permanentDiamondPack('钻石组合包 80', 160, 148),
    permanentDiamondPack('钻石组合包 325', 650, 518),
  ]

  const plan = planUltraSalePurchases(packs, {
    source: 'tower',
    tower: 'origin_tower_infinite',
    startProgress: 0,
    endProgress: 10,
    currentPrice: 11350,
    budget: 12000,
    batchSize: 1,
    topUpBudgetRatio: 6,
    permanentPacks,
    freeDiamondScore: 1,
  })

  assert.equal(plan.spent, 12000)
  assert.equal(plan.topUpPurchaseCount, 1)
  assert.equal(plan.topUpPackSummary, '第 1 批：钻石组合包 325')
  assert.equal(plan.steps[0].topUpCost, 650)
  assert.deepEqual(plan.steps[0].topUpUnlockedRechargeTiers, [6000])
})

test('planner skips permanent top-up when the recharge gap is too large', () => {
  const packs = [
    pack('10', 12000, 6000),
  ]
  const permanentPacks = [
    permanentDiamondPack('钻石组合包 80', 160, 148),
    permanentDiamondPack('钻石组合包 3000', 6000, 5095),
  ]

  const plan = planUltraSalePurchases(packs, {
    source: 'tower',
    tower: 'origin_tower_infinite',
    startProgress: 0,
    endProgress: 10,
    currentPrice: 12000,
    budget: 24000,
    batchSize: 1,
    topUpBudgetRatio: 5,
    permanentPacks,
    freeDiamondScore: 1,
  })

  assert.equal(plan.spent, 12000)
  assert.equal(plan.topUpPurchaseCount, 0)
  assert.equal(plan.topUpPackSummary, '')
  assert.equal(plan.steps[0].topUpPacks, undefined)
})

test('planner keeps the no-top-up branch when current top-up is worse', () => {
  const packs = [
    pack('10', 11800, 5900),
  ]
  const permanentPacks = [
    permanentDiamondPack('钻石组合包 80', 160, -10000),
  ]

  const plan = planUltraSalePurchases(packs, {
    source: 'tower',
    tower: 'origin_tower_infinite',
    startProgress: 0,
    endProgress: 10,
    currentPrice: 11800,
    budget: 11800,
    batchSize: 1,
    topUpBudgetRatio: 5,
    permanentPacks,
    freeDiamondScore: 0,
  })

  assert.equal(plan.topUpPurchaseCount, 0)
  assert.equal(plan.topUpSpentYen, 0)
  assert.equal(plan.steps[0].topUpPacks, undefined)
})

test('same-day continuation does not create permanent top-up candidates', () => {
  const packs = [
    pack('10', 11800, 5900),
  ]
  const permanentPacks = [
    permanentDiamondPack('钻石组合包 80', 160, 148),
  ]
  const context = __testables.buildPlanningContext(packs, {
    source: 'tower',
    tower: 'origin_tower_infinite',
    startProgress: 0,
    endProgress: 10,
    currentPrice: 11800,
    budget: 12120,
    batchSize: 1,
    topUpBudgetRatio: 5,
    permanentPacks,
    freeDiamondScore: 1,
  })

  const states = __testables.expandState(__testables.createEmptyState(context), context)
  const sameDayBought = states.find(state => state.purchases === 1 && state.rechargeDayIndex === 0)
  const nextDayTopUp = states.find(state => state.purchases === 1 && state.rechargeDayIndex === 1 && state.topUpSpentYen > 0)

  assert.ok(sameDayBought)
  assert.equal(sameDayBought.topUpSpentYen, 0)
  assert.equal(sameDayBought.steps[0].topUpPacks, undefined)
  assert.ok(nextDayTopUp)
  assert.equal(nextDayTopUp.steps[0].topUpPacks[0].displayTrigger, '钻石组合包 80 ×2')
})

test('planner can split independent trigger lanes to buy later at higher tier', () => {
  const packs = [
    pack('10', 160, 100),
    questPack('7-28', 160, 300),
    pack('20', 650, 1000),
    questPack('8-28', 650, 500),
  ]

  const plan = planUltraSalePurchases(packs, {
    budget: 810,
    currentPrice: 160,
    lanes: [
      { id: 'tower', cat: 'tower', tower: 'origin_tower_infinite', label: '无穷塔', enabled: true, startProgress: 0, endProgress: 30, batchSize: 1 },
      { id: 'quest', cat: 'quest', label: '主线', enabled: true, startProgress: '0-0', endProgress: '9-28', batchSize: 1 },
    ],
  })

  assert.equal(plan.spent, 810)
  assert.ok(plan.steps.length >= 3)
  assert.equal(plan.steps.some(step => step.triggerRange.includes('主线') && step.bought), true)
  const towerHighTierBuy = plan.steps.find(step => step.triggerRange.includes('无穷塔: 20') && step.bought)
  assert.equal(towerHighTierBuy.tierPrice, 650)
  assert.equal(towerHighTierBuy.purchases[0].sourceLabel, '无穷塔')
})

test('main quest progress uses built-in game-like quest id conversion', () => {
  assert.equal(parseMainQuestProgress('7-28'), 168)
  assert.equal(parseMainQuestProgress('10-28'), 252)
  assert.equal(parseMainQuestProgress('13-28'), 336)
  assert.equal(parseMainQuestProgress('27-40'), 740)
  assert.equal(parseMainQuestProgress('35-60'), 1080)
  assert.equal(parseMainQuestProgress('55-60'), 2280)
  assert.equal(parseMainQuestProgress('336'), 336)
  assert.equal(mainQuestStageCount(13), 28)
  assert.equal(mainQuestStageCount(35), 60)
})

test('quest planning accepts chapter-stage progress input', () => {
  const packs = [
    questPack('13-28', 160, 100),
    questPack('14-28', 160, 300),
    questPack('15-28', 160, 500),
  ]

  const plan = planUltraSalePurchases(packs, {
    budget: 160,
    currentPrice: 160,
    lanes: [
      { id: 'quest', cat: 'quest', label: 'quest', enabled: true, startProgress: '13-28', endProgress: '14-28', batchSize: 1 },
    ],
  })

  assert.equal(plan.opportunityCount, 1)
  assert.equal(plan.steps[0].triggerRange, 'quest: 14-28')
  assert.equal(plan.steps[0].purchases[0].trigger, '14-28')
})

test('quest planning accepts numeric game quest id input', () => {
  const packs = [
    questPack('13-28', 160, 100),
    questPack('14-28', 160, 300),
    questPack('35-60', 160, 500),
  ]

  const plan = planUltraSalePurchases(packs, {
    budget: 160,
    currentPrice: 160,
    lanes: [
      { id: 'quest', cat: 'quest', label: 'quest', enabled: true, startProgress: 336, endProgress: 1080, batchSize: 3 },
    ],
  })

  assert.equal(plan.opportunityCount, 2)
  assert.match(plan.steps[0].triggerRange, /14-28/)
  assert.match(plan.steps[0].triggerRange, /35-60/)
})

test('planner derives all-tower-reached packs from four attribute towers', () => {
  const packs = [
    towerPack('origin_group_all_towers', '10', 160, 500),
  ]

  const plan = planUltraSalePurchases(packs, {
    budget: 160,
    currentPrice: 160,
    lanes: [
      { id: 'blue', cat: 'tower', tower: 'origin_tower_blue', label: '蓝塔', enabled: true, startProgress: 0, endProgress: 10, batchSize: 10 },
      { id: 'red', cat: 'tower', tower: 'origin_tower_red', label: '红塔', enabled: true, startProgress: 0, endProgress: 10, batchSize: 10 },
      { id: 'green', cat: 'tower', tower: 'origin_tower_green', label: '翠塔', enabled: true, startProgress: 0, endProgress: 10, batchSize: 10 },
      { id: 'yellow', cat: 'tower', tower: 'origin_tower_yellow', label: '黄塔', enabled: true, startProgress: 0, endProgress: 10, batchSize: 10 },
    ],
  })

  assert.equal(plan.opportunityCount, 1)
  assert.equal(plan.steps[0].triggerRange, '全属性塔抵达: 10')
  assert.equal(plan.steps[0].purchases[0].sourceLabel, '全属性塔抵达')
})

test('planner does not derive all-tower packs without all four attribute towers', () => {
  const packs = [
    towerPack('origin_group_all_towers', '10', 160, 500),
  ]

  const plan = planUltraSalePurchases(packs, {
    budget: 160,
    currentPrice: 160,
    lanes: [
      { id: 'blue', cat: 'tower', tower: 'origin_tower_blue', label: '蓝塔', enabled: true, startProgress: 0, endProgress: 10, batchSize: 10 },
      { id: 'red', cat: 'tower', tower: 'origin_tower_red', label: '红塔', enabled: true, startProgress: 0, endProgress: 10, batchSize: 10 },
      { id: 'green', cat: 'tower', tower: 'origin_tower_green', label: '翠塔', enabled: true, startProgress: 0, endProgress: 10, batchSize: 10 },
    ],
  })

  assert.equal(plan.opportunityCount, 0)
  assert.equal(plan.steps.length, 0)
})

test('attribute tower planning keeps all-tower gate before single-tower fence', () => {
  const packs = [
    towerPack('origin_group_all_towers', '225', 160, 1000),
    towerPack('origin_tower_blue', '250', 160, 100),
    towerPack('origin_tower_red', '250', 160, 100),
    towerPack('origin_tower_green', '250', 160, 100),
    towerPack('origin_tower_yellow', '250', 160, 100),
  ]

  const plan = planUltraSalePurchases(packs, {
    budget: 800,
    currentPrice: 160,
    lanes: [
      { id: 'blue', cat: 'tower', tower: 'origin_tower_blue', label: 'blue', enabled: true, startProgress: 200, endProgress: 260, batchSize: 99 },
      { id: 'red', cat: 'tower', tower: 'origin_tower_red', label: 'red', enabled: true, startProgress: 200, endProgress: 260, batchSize: 99 },
      { id: 'green', cat: 'tower', tower: 'origin_tower_green', label: 'green', enabled: true, startProgress: 200, endProgress: 260, batchSize: 99 },
      { id: 'yellow', cat: 'tower', tower: 'origin_tower_yellow', label: 'yellow', enabled: true, startProgress: 200, endProgress: 260, batchSize: 99 },
    ],
  })

  assert.match(plan.steps[0].triggerRange, /225/)
  assert.doesNotMatch(plan.steps[0].triggerRange, /250/)
  assert.equal(plan.steps.slice(1).every(step => step.triggerRange.includes('250')), true)
})

test('same-floor different attribute towers can split without recharge reset', () => {
  const packs = [
    towerPack('origin_tower_blue', '250', 160, 100),
    towerPack('origin_tower_red', '250', 160, 1),
    towerPack('origin_tower_red', '250', 650, 1000),
  ]

  const plan = planUltraSalePurchases(packs, {
    budget: 810,
    currentPrice: 160,
    lanes: [
      { id: 'blue', cat: 'tower', tower: 'origin_tower_blue', label: 'blue', enabled: true, startProgress: 200, endProgress: 260, batchSize: 1 },
      { id: 'red', cat: 'tower', tower: 'origin_tower_red', label: 'red', enabled: true, startProgress: 200, endProgress: 260, batchSize: 1 },
    ],
  })

  assert.equal(plan.steps.length, 2)
  assert.match(plan.steps[0].triggerRange, /blue: 250/)
  assert.equal(plan.steps[0].nextTierPrice, 650)
  assert.match(plan.steps[1].triggerRange, /red: 250/)
  assert.equal(plan.steps[1].tierPrice, 650)
  assert.equal(plan.steps[1].rechargeReset, false)
  assert.equal(plan.steps[1].rechargeDayIndex, 0)
})

test('attribute tower frontier keeps untriggered same-floor towers and next blue layer available', () => {
  const packs = [
    towerPack('origin_tower_blue', '250', 160, 100),
    towerPack('origin_tower_blue', '300', 650, 1000),
    towerPack('origin_tower_red', '250', 160, 100),
    towerPack('origin_tower_green', '250', 160, 100),
    towerPack('origin_tower_yellow', '250', 160, 100),
  ]
  const settings = {
    lanes: [
      { id: 'blue', cat: 'tower', tower: 'origin_tower_blue', label: 'blue', enabled: true, startProgress: 200, endProgress: 310, batchSize: 99 },
      { id: 'red', cat: 'tower', tower: 'origin_tower_red', label: 'red', enabled: true, startProgress: 200, endProgress: 260, batchSize: 99 },
      { id: 'green', cat: 'tower', tower: 'origin_tower_green', label: 'green', enabled: true, startProgress: 200, endProgress: 260, batchSize: 99 },
      { id: 'yellow', cat: 'tower', tower: 'origin_tower_yellow', label: 'yellow', enabled: true, startProgress: 200, endProgress: 260, batchSize: 99 },
    ],
  }
  const { sources } = __testables.buildPlanningSources(packs, settings)
  const state = {
    sourceCursors: sources.map((_, index) => index === 0 ? 1 : 0),
    currentDayAttributeTowers: ['origin_tower_blue'],
  }
  const candidates = __testables.generateBatchCandidates(state, { sources, settings })

  const singleBlue300 = candidates.find(candidate => candidate.opportunities.map(opportunity => opportunity.displayTrigger).join(',') === 'blue: 300')
  const singleRed250 = candidates.find(candidate => candidate.opportunities.map(opportunity => opportunity.displayTrigger).join(',') === 'red: 250')
  const singleGreen250 = candidates.find(candidate => candidate.opportunities.map(opportunity => opportunity.displayTrigger).join(',') === 'green: 250')
  const singleYellow250 = candidates.find(candidate => candidate.opportunities.map(opportunity => opportunity.displayTrigger).join(',') === 'yellow: 250')

  assert.ok(singleBlue300)
  assert.equal(singleBlue300.requiresRechargeReset, true)
  assert.ok(singleRed250)
  assert.equal(singleRed250.requiresRechargeReset, false)
  assert.ok(singleGreen250)
  assert.equal(singleGreen250.requiresRechargeReset, false)
  assert.ok(singleYellow250)
  assert.equal(singleYellow250.requiresRechargeReset, false)
})

test('same attribute tower cannot advance twice in one recharge day', () => {
  const packs = [
    towerPack('origin_tower_blue', '250', 160, 100),
    towerPack('origin_tower_blue', '300', 650, 1000),
    towerPack('origin_tower_red', '250', 160, 100),
  ]
  const settings = {
    lanes: [
      { id: 'blue', cat: 'tower', tower: 'origin_tower_blue', label: 'blue', enabled: true, startProgress: 200, endProgress: 310, batchSize: 99 },
      { id: 'red', cat: 'tower', tower: 'origin_tower_red', label: 'red', enabled: true, startProgress: 200, endProgress: 260, batchSize: 99 },
    ],
  }
  const { sources } = __testables.buildPlanningSources(packs, settings)
  const afterBlueSameDay = {
    sourceCursors: sources.map((_, index) => index === 0 ? 1 : 0),
    currentDayAttributeTowers: ['origin_tower_blue'],
  }
  const afterBlueNextDay = {
    sourceCursors: sources.map((_, index) => index === 0 ? 1 : 0),
    currentDayAttributeTowers: [],
  }

  const sameDayCandidates = __testables.generateBatchCandidates(afterBlueSameDay, { sources, settings })
  const nextDayCandidates = __testables.generateBatchCandidates(afterBlueNextDay, { sources, settings })
  const sameDayBlue300 = sameDayCandidates.find(candidate => candidate.opportunities.map(opportunity => opportunity.displayTrigger).join(',') === 'blue: 300')
  const nextDayBlue300 = nextDayCandidates.find(candidate => candidate.opportunities.map(opportunity => opportunity.displayTrigger).join(',') === 'blue: 300')
  const sameDayRed250 = sameDayCandidates.find(candidate => candidate.opportunities.map(opportunity => opportunity.displayTrigger).join(',') === 'red: 250')

  assert.ok(sameDayBlue300)
  assert.equal(sameDayBlue300.requiresRechargeReset, true)
  assert.ok(nextDayBlue300)
  assert.equal(nextDayBlue300.requiresRechargeReset, false)
  assert.ok(sameDayRed250)
  assert.equal(sameDayRed250.requiresRechargeReset, false)
})

test('all-tower reached cannot batch with the slowest tower next single node', () => {
  const packs = [
    towerPack('origin_group_all_towers', '275', 160, 1000),
    towerPack('origin_tower_blue', '250', 160, 100),
    towerPack('origin_tower_blue', '300', 160, 100),
    towerPack('origin_tower_red', '250', 160, 100),
    towerPack('origin_tower_red', '300', 160, 100),
    towerPack('origin_tower_green', '250', 160, 100),
    towerPack('origin_tower_green', '300', 160, 100),
    towerPack('origin_tower_yellow', '250', 160, 100),
    towerPack('origin_tower_yellow', '300', 160, 100),
  ]
  const settings = {
    lanes: [
      { id: 'blue', cat: 'tower', tower: 'origin_tower_blue', label: 'blue', enabled: true, startProgress: 240, endProgress: 310, batchSize: 50 },
      { id: 'red', cat: 'tower', tower: 'origin_tower_red', label: 'red', enabled: true, startProgress: 240, endProgress: 310, batchSize: 50 },
      { id: 'green', cat: 'tower', tower: 'origin_tower_green', label: 'green', enabled: true, startProgress: 240, endProgress: 310, batchSize: 50 },
      { id: 'yellow', cat: 'tower', tower: 'origin_tower_yellow', label: 'yellow', enabled: true, startProgress: 240, endProgress: 310, batchSize: 50 },
    ],
  }
  const { sources } = __testables.buildPlanningSources(packs, settings)
  const state = {
    sourceCursors: sources.map(source => source.attributeTower ? 1 : 0),
    currentDayAttributeTowers: [],
  }
  const candidates = __testables.generateBatchCandidates(state, { sources, settings })
  const allTowerOnly = candidates.find(candidate => candidate.opportunities.map(opportunity => opportunity.displayTrigger).join(',') === '全属性塔抵达: 275')
  const allTowerWithSingle = candidates.find(candidate => {
    const triggers = candidate.opportunities.map(opportunity => opportunity.displayTrigger)
    return triggers.some(trigger => trigger === '全属性塔抵达: 275')
      && triggers.some(trigger => trigger.endsWith(': 300'))
  })

  assert.ok(allTowerOnly)
  assert.equal(allTowerWithSingle, undefined)
})

test('compressUltraSalePlanSteps merges only consecutive skipped batches', () => {
  const rows = compressUltraSalePlanSteps([
    { index: 1, triggerRange: 'A', bought: true, cost: 160, value: 100, purchases: [{}] },
    { index: 2, triggerRange: '主线: 10-28; 无穷塔: 100 - 150', tierPrice: 650, nextTierPrice: 160, bought: false, cost: 0, value: 0, purchases: [] },
    { index: 3, triggerRange: '主线: 11-28; 无穷塔: 200 - 250', tierPrice: 160, nextTierPrice: 160, bought: false, cost: 0, value: 0, purchases: [] },
    { index: 4, triggerRange: 'D', bought: true, cost: 160, value: 100, purchases: [{}] },
    { index: 5, triggerRange: 'E', tierPrice: 160, nextTierPrice: 160, bought: false, cost: 0, value: 0, purchases: [] },
  ])

  assert.equal(rows.length, 4)
  assert.equal(rows[1].rowKey, 'skip-2-3')
  assert.equal(rows[1].indexLabel, '2-3')
  assert.equal(rows[1].skipCount, 2)
  assert.equal(rows[1].triggerRange, '主线: 10-28; 无穷塔: 100 - 150 ... 主线: 11-28; 无穷塔: 200 - 250')
  assert.equal(rows[1].tierDropCount, 1)
  assert.equal(rows[1].skippedSteps.length, 2)
  assert.deepEqual(rows[1].skipSourceRanges, [
    { label: '主线', from: '10-28', to: '11-28', count: 2 },
    { label: '无穷塔', from: '100 - 150', to: '200 - 250', count: 2 },
  ])
  assert.equal(rows[3].rowKey, 'skip-5-5')
  assert.equal(rows[3].indexLabel, '5')
  assert.equal(rows[3].skipCount, 1)
  assert.equal(rows[3].triggerRange, 'E')
  assert.deepEqual(rows[3].skipSourceRanges, [
    { label: '触发', from: 'E', to: 'E', count: 1 },
  ])
})
