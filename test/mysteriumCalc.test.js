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
