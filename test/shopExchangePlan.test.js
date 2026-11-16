import test from 'node:test'
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { calculateShopExchangePlan } from '../src/engine/shopCalc.js'
import { shopItems } from '../src/constants/shopItems.js'

const scores = { '[1,1]': { score: 1, batch: 1 } }
const product = (id, cost, value, limitTotal = 1) => ({ id, cost, limitTotal, reward: { itemType: 1, itemId: 1, quantity: value } })
const plan = (products, budget) => calculateShopExchangePlan({ products }, scores, budget)
function check(result, budget) {
  assert.equal(result.totalCost, result.entries.reduce((s, e) => s + e.cost, 0))
  assert.equal(result.totalValue, result.entries.reduce((s, e) => s + e.value, 0))
  assert.equal(result.remainingBudget, budget - result.totalCost)
  for (const e of result.entries) assert.ok(e.count <= e.product.limitTotal)
}
test('exact combination beats CE greedy and respects finite/unlimited limits', () => {
  const r = plan([product('a', 3, 5), product('b', 2, 3, Infinity)], 4)
  assert.equal(r.totalValue, 6)
  assert.equal(r.entries[0].count, 2)
  check(r, 4)
  const limited = plan([product('a', 2, 10, 3), product('b', 1, 1, Infinity)], 20)
  assert.deepEqual(limited.entries.map(e => e.count), [3, 14])
  check(limited, 20)
})
test('zero, insufficient budget and zero scores recommend nothing', () => {
  for (const r of [plan([product('a', 3, 5)], 0), plan([product('a', 3, 5)], 2), plan([product('a', 1, 0)], 9)]) {
    assert.deepEqual(r.entries, [])
    assert.equal(r.ce, null)
  }
})
test('equal values prefer lower spend, then earlier products', () => {
  assert.equal(plan([product('a', 3, 5), product('b', 2, 5)], 3).entries[0].product.id, 'b')
  assert.equal(plan([product('a', 2, 5), product('b', 2, 5)], 2).entries[0].product.id, 'a')
})
test('unknown limits, missing scores, invalid costs and sold-out products', () => {
  const r = plan([product('unknown', 1, 100, null), { ...product('missing', 1, 4), reward: { itemType: 999, itemId: 1 } }, product('bad', 0, 4), { ...product('sold', 1, 50), soldOut: true }], 4)
  assert.equal(r.entries.length, 0)
  assert.equal(r.unknownLimitProducts.length, 1)
  assert.equal(r.missingScoreItems.length, 1)
})
test('validates budget boundaries', () => {
  for (const b of ['', null, -1, 0.5, 100001, Infinity, NaN]) assert.throws(() => plan([], b), RangeError)
  assert.equal(plan([], 100000).remainingBudget, 100000)
})
test('matches exhaustive search for small mixed shops including fractional values', () => {
  let seed = 13
  const rand = n => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n }
  for (let run = 0; run < 100; run++) {
    const products = Array.from({ length: 4 }, (_, i) => product(String(i), 1 + rand(7), (1 + rand(40)) / 4, rand(3) ? 1 + rand(4) : Infinity))
    const budget = rand(25)
    let best = 0, spend = 0
    function visit(i, cost, value) {
      if (i === products.length) {
        if (value > best || (value === best && cost < spend)) { best = value; spend = cost }
        return
      }
      const p = products[i]
      for (let n = 0; n <= Math.min(p.limitTotal, Math.floor((budget - cost) / p.cost)); n++) visit(i + 1, cost + n * p.cost, value + n * p.reward.quantity)
    }
    visit(0, 0, 0)
    const r = plan(products, budget)
    assert.equal(r.totalValue, best)
    assert.equal(r.totalCost, spend)
    check(r, budget)
  }
})
test('full shop at maximum budget completes and reconstructs valid quantities', t => {
  const start = performance.now()
  const fullScores = Object.fromEntries(shopItems[0].products.map(p => [`[${p.reward.itemType},${p.reward.itemId}]`, { score: 10, batch: 1 }]))
  const r = calculateShopExchangePlan(shopItems[0], fullScores, 100000)
  check(r, 100000)
  assert.ok(r.totalValue > 0)
  t.diagnostic(`100,000 budget: ${Math.round(performance.now() - start)} ms`)
})
