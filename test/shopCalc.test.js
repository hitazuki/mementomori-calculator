import test from 'node:test'
import assert from 'node:assert/strict'

import { shopItems } from '../src/constants/shopItems.js'
import { calculateShopCE, calculateShopProduct, sortShopProducts } from '../src/engine/shopCalc.js'
import { normalizeScores } from '../src/engine/packCalc.js'
import { GUILD_RAID_UNIQUE_WEAPON_FRAGMENT_KEY } from '../src/engine/derivedScores.js'

const scores = normalizeScores({
  '[1,1]': { name: 'Free Diamond', score: 1, batch: 1, iconId: 1 },
  '[10,1]': { name: 'Gold 1h', score: 5, batch: 1, iconId: 1 },
  '[10,11]': { name: 'Kindle 1h', score: 15, batch: 1, iconId: 11 },
  '[12,2]': { name: 'Panacea', score: 20, batch: 1, iconId: 18 },
  '[18,1]': { name: 'Basic Key', score: 1, batch: 1, iconId: 1 },
  '[18,2]': { name: 'Middle Key', score: 4, batch: 1, iconId: 2 },
  '[18,3]': { name: 'Advanced Key', score: 8, batch: 1, iconId: 3 },
  '[20,1]': { name: 'Tower Ticket', score: 100, batch: 1, iconId: 1 },
  [GUILD_RAID_UNIQUE_WEAPON_FRAGMENT_KEY]: {
    name: 'Unique Weapon Fragment',
    nameZh: '专属武器碎片',
    score: 54,
    batch: 1,
    iconId: 201,
  },
})

test('calculateShopProduct values contents instead of the container reward', () => {
  const product = calculateShopProduct({
    id: 'premium-shop-084',
    name: 'Key Box',
    reward: { itemType: 9, itemId: 84, quantity: 1 },
    contents: [
      { itemType: 18, itemId: 1, quantity: 10 },
      { itemType: 18, itemId: 2, quantity: 20 },
      { itemType: 18, itemId: 3, quantity: 50 },
      { itemType: 20, itemId: 1, quantity: 16 },
      { itemType: 10, itemId: 11, quantity: 1 },
    ],
    cost: 1560,
    limitTotal: 3,
  }, scores)

  assert.equal(product.rewardValue, 10 + 80 + 400 + 1600 + 15)
  assert.equal(product.ce, product.rewardValue / 1560)
  assert.equal(product.missingScoreItems.length, 0)
})

test('calculateShopProduct keeps value visible when cost is missing', () => {
  const product = calculateShopProduct({
    id: 'missing-cost',
    name: 'No Cost',
    reward: { itemType: 12, itemId: 2, quantity: 5 },
    cost: null,
  }, scores)

  assert.equal(product.rewardValue, 100)
  assert.equal(product.ce, null)
})

test('calculateShopProduct reports unknown scored items as zero value', () => {
  const product = calculateShopProduct({
    id: 'missing-score',
    name: 'Unknown',
    reward: { itemType: 99, itemId: 99, quantity: 3 },
    cost: 10,
  }, scores)

  assert.equal(product.rewardValue, 0)
  assert.equal(product.ce, 0)
  assert.deepEqual(product.missingScoreItems.map(item => [item.itemType, item.itemId, item.quantity]), [
    [99, 99, 3],
  ])
})

test('calculateShopProduct values virtual score-key items', () => {
  const product = calculateShopProduct({
    id: 'guild-raid-004',
    name: 'Unique Weapon Fragment',
    reward: { scoreKey: GUILD_RAID_UNIQUE_WEAPON_FRAGMENT_KEY, quantity: 10 },
    cost: 185,
    limitTotal: null,
  }, scores)

  assert.equal(product.rewardValue, 540)
  assert.equal(product.ce, 540 / 185)
  assert.equal(product.limitTotal, null)
  assert.equal(product.contentDetails[0].scoreKey, GUILD_RAID_UNIQUE_WEAPON_FRAGMENT_KEY)
  assert.equal(product.contentDetails[0].nameZh, '专属武器碎片')
  assert.equal(product.contentDetails[0].iconId, 201)
  assert.equal(product.missingScoreItems.length, 0)
})

test('guild raid shop data includes all documented rows and preserves unknown limits', () => {
  const [guildRaidShop] = calculateShopCE(
    shopItems.filter(shop => shop.shopKey === 'guild-raid'),
    scores,
  )

  assert.equal(guildRaidShop.products.length, 32)
  assert.equal(guildRaidShop.products.find(product => product.id === 'guild-raid-003').displayName, undefined)
  assert.equal(guildRaidShop.products.find(product => product.id === 'guild-raid-004').rewardValue, 540)
  assert.deepEqual(
    guildRaidShop.products
      .filter(product => ['guild-raid-004', 'guild-raid-030', 'guild-raid-031', 'guild-raid-032'].includes(product.id))
      .map(product => [product.id, product.limitTotal]),
    [
      ['guild-raid-004', null],
      ['guild-raid-030', null],
      ['guild-raid-031', null],
      ['guild-raid-032', null],
    ],
  )
})

test('sortShopProducts sorts by CE and pushes null CE to the end', () => {
  const rows = [
    { name: 'A', ce: null, cost: null, rewardValue: 100 },
    { name: 'B', ce: 2, cost: 50, rewardValue: 100 },
    { name: 'C', ce: 5, cost: 20, rewardValue: 100 },
  ]

  assert.deepEqual(sortShopProducts(rows).map(row => row.name), ['C', 'B', 'A'])
})
