import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateMysteriumRankings } from '../src/engine/mysteriumCalc.js'

const characters = Object.fromEntries([1, 2, 3, 4].map(id => [id, {
  id, isLimited: id !== 4, elementType: 1,
}]))
const template = [{ key: 'power', ctype: 1, baseVal: 1, score: 1 }]
const collection = (id, reqCids, score = 10) => ({
  id, reqCids, params: [{ nameKey: 'power', ctype: 1, val: score }], baseParams: [],
})
const rank = collections => calculateMysteriumRankings(characters, collections, template, 3).rankings
const key = plan => plan.chars.map(c => c.id).sort().join(',')
const addedKey = plan => {
  const baseline = new Set(plan.bottleneck.map(c => c.id))
  return key({ chars: plan.chars.filter(c => !baseline.has(c.id)) })
}

test('merge routes after removing prerequisites that only earn baseline rewards', () => {
  const plans = rank([
    collection(1, [1], 100), collection(2, [2], 100),
    collection(3, [1, 2], 20), collection(4, [2, 3], 5),
    collection(5, [1, 3], 0),
  ])
  const routes = plans.filter(plan => addedKey(plan) === '3' && plan.marginalCe === 5)
  assert.equal(routes.length, 1)
  const [route] = routes
  assert.equal(key(route), '2,3')
  assert.equal(key({ chars: route.bottleneck }), '2')
  assert.equal(route.cost, 2)
  assert.equal(route.score, 105)
  assert.equal(route.ce, 52.5)
  assert.equal(route.marginalCe, 5)
  assert.deepEqual(route.activated.map(col => col.id), [2, 4])
})

test('equal marginal efficiency does not merge different contributing prerequisites', () => {
  const plans = rank([
    collection(1, [1], 100), collection(2, [2], 100),
    collection(3, [1, 3], 10), collection(4, [2, 3], 10),
  ])
  const routes = plans.filter(plan => addedKey(plan) === '3')
  assert.equal(routes.length, 3)
  assert.ok(routes.some(plan => key({ chars: plan.bottleneck }) === '1' && plan.marginalCe === 10))
  assert.ok(routes.some(plan => key({ chars: plan.bottleneck }) === '2' && plan.marginalCe === 10))
  assert.ok(routes.some(plan => key({ chars: plan.bottleneck }) === '1,2' && plan.marginalCe === 20))
})

test('omit independent plans when their connecting character is absent', () => {
  const plans = rank([
    collection(1, [1, 4]), collection(2, [2, 4]),
    collection(3, [1, 3]), collection(4, [2, 3]),
  ])
  const keys = plans.map(key)
  assert.ok(keys.includes('1'))
  assert.ok(keys.includes('2'))
  assert.ok(!keys.includes('1,2'))
  assert.ok(keys.includes('1,2,3'))
})

test('an incomplete collection cannot connect a plan even through direct adjacency', () => {
  const keys = rank([
    collection(1, [1]), collection(2, [2]), collection(3, [1, 2, 3]),
  ]).map(key)
  assert.ok(!keys.includes('1,2'))
  assert.ok(keys.includes('1,2,3'))
})

test('retain disconnected subsets as baselines for marginal efficiency', () => {
  const plans = rank([
    collection(1, [1], 100), collection(2, [2], 100),
    collection(3, [1, 3], 1), collection(4, [2, 3], 1),
  ])
  const full = plans.find(plan => key(plan) === '1,2,3')
  assert.equal(full.score, 202)
  assert.equal(full.cost, 3)
  assert.equal(full.marginalCe, 2)
  assert.equal(key({ chars: full.bottleneck }), '1,2')
})

test('retain connected plans with their score, cost and activated collections', () => {
  const plans = rank([collection(1, [1, 2], 30), collection(2, [2, 3], 20)])
  const full = plans.find(plan => key(plan) === '1,2,3')
  assert.equal(full.score, 50)
  assert.equal(full.cost, 3)
  assert.equal(full.ce, 50 / 3)
  assert.equal(full.marginalCe, 50 / 3)
  assert.deepEqual(full.activated.map(col => col.id), [1, 2])
})
