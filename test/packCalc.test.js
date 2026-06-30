import test from 'node:test'
import assert from 'node:assert/strict'

import { calculatePackCE, getBaseItemKey, normalizeScores } from '../src/engine/packCalc.js'
import { buildDerivedScoreState } from '../src/engine/derivedScores.js'

const scores = normalizeScores({
  '[2,1]': { name: 'Paid Diamond', score: 1, batch: 1, iconId: 1 },
  '[10,1]': { name: 'Gold 1h', score: 5, batch: 1, iconId: 1 },
  '[10,6]': { name: 'Exp 1h', score: 10, batch: 1, iconId: 6 },
  '[10,11]': { name: 'Kindle 1h', score: 15, batch: 1, iconId: 11 },
  '[15,1]': { name: 'Oil', score: 50, batch: 1, iconId: 1 },
  '[17,5]': { name: 'Rune Lv2', score: 100, batch: 1, iconId: 5 },
  '[17,21]': { name: 'Letter SR Blue', score: 200, batch: 1, iconId: 21 },
})

test('calculatePackCE applies derived item scores and recharge value', () => {
  const [pack] = calculatePackCE([
    {
      name: 'Sample',
      price: 11_800,
      items: [
        { ItemType: 2, ItemId: 1, ItemCount: 5_900 },
        { ItemType: 10, ItemId: 20, ItemCount: 20 },
        { ItemType: 15, ItemId: 2, ItemCount: 9 },
        { ItemType: 17, ItemId: 10, ItemCount: 2 },
      ],
    },
  ], scores)

  const originalValue = 5_900 + ((5 + 10 + 15) * 24 * 20) + (50 * 3 * 9) + (100 * 32 * 2)
  const rechargeValue = 5_900 * 1.2

  assert.equal(pack.originalValue, originalValue)
  assert.equal(pack.rechargeValue, Math.round(rechargeValue))
  assert.equal(pack.value, originalValue + Math.round(rechargeValue))
  assert.equal(pack.ce, pack.value / 5_900)
})

test('zero-price packs use contained paid diamonds as denominator', () => {
  const [pack] = calculatePackCE([
    {
      name: 'Free',
      price: 0,
      items: [
        { ItemType: 2, ItemId: 1, ItemCount: 100 },
        { ItemType: 10, ItemId: 2, ItemCount: 1 },
      ],
    },
  ], scores)

  assert.equal(pack.diamondCount, 100)
  assert.equal(pack.ce, pack.value / 100)
})

test('getBaseItemKey maps homogeneous derived items to their editable bases', () => {
  assert.equal(getBaseItemKey(10, 4), '[10,1]')
  assert.equal(getBaseItemKey(10, 20), '[10,20]')
  assert.equal(getBaseItemKey(15, 2), '[15,1]')
  assert.equal(getBaseItemKey(17, 10), '[17,5]')
  assert.equal(getBaseItemKey(17, 24), '[17,21]')
})

test('derived score panel merges scroll and tome rows and keeps zero values visible', () => {
  const state = buildDerivedScoreState(normalizeScores({
    '[1,1]': { name: 'Free Diamond', score: 1, batch: 1, iconId: 1 },
    '[2,1]': { name: 'Paid Diamond', score: 1, batch: 1, iconId: 1 },
    '[13,1]': { name: 'Magic Crystal', score: 1, batch: 1, iconId: 1 },
    '[12,1]': { name: 'Water', score: 100_000, batch: 1, iconId: 1 },
    '[13,4]': { name: 'Rune Ticket', score: 100_000, batch: 1, iconId: 4 },
    '[15,1]': { name: 'Perfume', score: 100_000, batch: 1, iconId: 1 },
    '[19,1]': { name: 'Boss Ticket', score: 100_000, batch: 1, iconId: 1 },
    '[20,1]': { name: 'Tower Ticket', score: 100_000, batch: 1, iconId: 1 },
  }))

  const rowKeys = state.readonlyRows.map(row => row.key)
  assert.deepEqual(rowKeys, [
    '[1,1]',
    'derived:sandalphonCore',
    'derived:astarothCore',
    '[13,1]',
    'guild-raid-unique-weapon-fragment',
    '[13,6]',
  ])
  assert.equal(state.readonlyRows.find(row => row.key === 'derived:sandalphonCore').score, 0)
  assert.equal(state.readonlyRows.find(row => row.key === 'derived:astarothCore').score, 0)
  assert.equal(state.readonlyRows.find(row => row.key === '[13,1]').score, 0)
  assert.equal(state.readonlyRows.find(row => row.key === 'guild-raid-unique-weapon-fragment').nameZh, '专属武器碎片')
  assert.equal(state.readonlyRows.find(row => row.key === 'guild-raid-unique-weapon-fragment').iconId, 201)
  assert.equal(state.readonlyRows.find(row => row.key === '[13,6]').reasonKey, 'scoreReasonRelic')
})
