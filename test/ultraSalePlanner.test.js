import test from 'node:test'
import assert from 'node:assert/strict'

import { mainQuestStageCount, parseMainQuestProgress } from '../src/engine/mainQuestProgress.js'
import { buildUltraSalePlanOptions, compressUltraSalePlanSteps, planUltraSalePurchases } from '../src/engine/ultraSalePlanner.js'

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

test('buying any pack in a multi-trigger batch raises only one tier', () => {
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

  assert.equal(plan.steps[0].purchases.length, 1)
  assert.equal(plan.steps[0].purchases[0].trigger, '10')
  assert.equal(plan.steps[0].nextTierPrice, 650)
  assert.equal(plan.steps[1].tierPrice, 650)
})

test('buildUltraSalePlanOptions exposes ranked and policy plans', () => {
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

  assert.deepEqual(options.map(option => option.id), ['bestValue', 'secondValue', 'smallPack', 'maxPack'])
  assert.ok(options[0].value >= options[1].value)
  assert.equal(options[2].label, '只买小包')
  assert.equal(options[3].label, '冲最大包')
})

test('planner combines independent trigger lanes in the same batch round', () => {
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

  assert.equal(plan.steps.length, 2)
  assert.equal(plan.steps[0].tierPrice, 160)
  assert.match(plan.steps[0].triggerRange, /主线/)
  assert.match(plan.steps[0].triggerRange, /无穷塔/)
  assert.equal(plan.steps[0].purchases[0].sourceLabel, '主线')
  assert.equal(plan.steps[1].tierPrice, 650)
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

test('attribute tower planning follows all-tower and single-tower topology order', () => {
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

  assert.equal(plan.batchCount, 2)
  assert.match(plan.steps[0].triggerRange, /225/)
  assert.doesNotMatch(plan.steps[0].triggerRange, /250/)
  assert.match(plan.steps[1].triggerRange, /250/)
})

test('attribute tower topology keeps adjacent all-tower and single-tower events in separate batches', () => {
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

  const plan = planUltraSalePurchases(packs, {
    budget: 2000,
    currentPrice: 160,
    lanes: [
      { id: 'blue', cat: 'tower', tower: 'origin_tower_blue', label: 'blue', enabled: true, startProgress: 240, endProgress: 310, batchSize: 50 },
      { id: 'red', cat: 'tower', tower: 'origin_tower_red', label: 'red', enabled: true, startProgress: 240, endProgress: 310, batchSize: 50 },
      { id: 'green', cat: 'tower', tower: 'origin_tower_green', label: 'green', enabled: true, startProgress: 240, endProgress: 310, batchSize: 50 },
      { id: 'yellow', cat: 'tower', tower: 'origin_tower_yellow', label: 'yellow', enabled: true, startProgress: 240, endProgress: 310, batchSize: 50 },
    ],
  })

  assert.equal(plan.batchCount, 3)
  assert.match(plan.steps[0].triggerRange, /250/)
  assert.match(plan.steps[1].triggerRange, /275/)
  assert.match(plan.steps[2].triggerRange, /300/)
})

test('compressUltraSalePlanSteps merges only consecutive skipped batches', () => {
  const rows = compressUltraSalePlanSteps([
    { index: 1, triggerRange: 'A', bought: true, cost: 160, value: 100, purchases: [{}] },
    { index: 2, triggerRange: 'B', bought: false, cost: 0, value: 0, purchases: [] },
    { index: 3, triggerRange: 'C', bought: false, cost: 0, value: 0, purchases: [] },
    { index: 4, triggerRange: 'D', bought: true, cost: 160, value: 100, purchases: [{}] },
    { index: 5, triggerRange: 'E', bought: false, cost: 0, value: 0, purchases: [] },
  ])

  assert.equal(rows.length, 4)
  assert.equal(rows[1].rowKey, 'skip-2-3')
  assert.equal(rows[1].indexLabel, '2-3')
  assert.equal(rows[1].skipCount, 2)
  assert.equal(rows[1].triggerRange, 'B ... C')
  assert.equal(rows[3].rowKey, 'skip-5-5')
  assert.equal(rows[3].indexLabel, '5')
  assert.equal(rows[3].skipCount, 1)
  assert.equal(rows[3].triggerRange, 'E')
})
