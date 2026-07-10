import test from 'node:test'
import assert from 'node:assert/strict'

import { shopItems } from '../src/constants/shopItems.js'
import { calculateShopCE, calculateShopProduct, sortShopProducts } from '../src/engine/shopCalc.js'
import { normalizeScores } from '../src/engine/packCalc.js'
import { GUILD_RAID_UNIQUE_WEAPON_FRAGMENT_KEY } from '../src/engine/derivedScores.js'

const scores = normalizeScores({
  '[1,1]': { name: 'Free Diamond', score: 1, batch: 1, iconId: 1 },
  '[10,1]': { name: 'Gold 1h', score: 5, batch: 1, iconId: 1 },
  '[10,6]': { name: 'EXP Orb 1h', score: 1, batch: 1, iconId: 15 },
  '[10,11]': { name: 'Kindle 1h', score: 15, batch: 1, iconId: 11 },
  '[12,1]': { name: 'Upgrade Water', score: 1, batch: 1000, iconId: 17 },
  '[12,2]': { name: 'Panacea', score: 20, batch: 1, iconId: 18 },
  '[18,1]': { name: 'Basic Key', score: 1, batch: 1, iconId: 1 },
  '[18,2]': { name: 'Middle Key', score: 4, batch: 1, iconId: 2 },
  '[18,3]': { name: 'Advanced Key', score: 8, batch: 1, iconId: 3 },
  '[13,2]': { name: 'Fragment', score: 10, batch: 1000, iconId: 37 },
  '[13,3]': { name: 'Holy Fragment', score: 100, batch: 1000, iconId: 38 },
  '[13,4]': { name: 'Rune Ticket', score: 10, batch: 1, iconId: 39 },
  '[15,1]': { name: 'Dark Perfume', score: 1, batch: 1, iconId: 19 },
  '[17,5]': { name: 'Mystery Rune Lv 2', score: 8, batch: 1, iconId: 58 },
  '[20,1]': { name: 'Tower Ticket', score: 100, batch: 1, iconId: 1 },
  '[24,1]': { name: 'Tree of Life Dew', score: 400, batch: 1, iconId: 1 },
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

test('calculateShopProduct scales CE to the configured shop-currency unit', () => {
  const product = calculateShopProduct({
    id: 'scaled-ce',
    name: 'Scaled CE',
    reward: { itemType: 12, itemId: 2, quantity: 5 },
    cost: 4000,
  }, scores, 1000)

  assert.equal(product.rewardValue, 100)
  assert.equal(product.ceCurrencyUnit, 1000)
  assert.equal(product.ce, 25)
})

test('calculateShopProduct values virtual score-key items', () => {
  const product = calculateShopProduct({
    id: 'guild-raid-004',
    name: 'Unique Weapon Fragment',
    reward: { scoreKey: GUILD_RAID_UNIQUE_WEAPON_FRAGMENT_KEY, quantity: 10 },
    cost: 185,
    limitTotal: 10,
  }, scores)

  assert.equal(product.rewardValue, 540)
  assert.equal(product.ce, 540 / 185)
  assert.equal(product.limitTotal, 10)
  assert.equal(product.contentDetails[0].scoreKey, GUILD_RAID_UNIQUE_WEAPON_FRAGMENT_KEY)
  assert.equal(product.contentDetails[0].nameZh, '专属武器碎片')
  assert.equal(product.contentDetails[0].iconId, 201)
  assert.equal(product.missingScoreItems.length, 0)
})

test('guild raid shop data includes all documented rows and confirmed limits', () => {
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
      ['guild-raid-004', 10],
      ['guild-raid-030', Infinity],
      ['guild-raid-031', Infinity],
      ['guild-raid-032', Infinity],
    ],
  )
})

test('battle league shop data includes every screenshot slot and Battle Coin metadata', () => {
  const [battleLeagueShop] = calculateShopCE(
    shopItems.filter(shop => shop.shopKey === 'battle-league'),
    scores,
  )

  assert.deepEqual(battleLeagueShop.currency, {
    itemType: 13,
    itemId: 10,
    iconId: 45,
    name: '古竞技币',
    nameZh: '古竞技币',
    nameTw: '古競技幣',
    nameEn: 'Battle Coins',
    nameJa: 'バトルコイン',
    nameKo: '배틀 코인',
  })
  assert.equal(battleLeagueShop.products.length, 14)
  assert.equal(battleLeagueShop.ceCurrencyUnit, 1000)
  assert.equal(battleLeagueShop.products[0].ce, 25)
  assert.equal(battleLeagueShop.products[1].ce, 25)
  assert.deepEqual(
    battleLeagueShop.products.map(product => [product.id, product.reward.quantity, product.cost, product.limitTotal]),
    [
      ['battle-league-001', 1, 16000, 1],
      ['battle-league-002', 10, 160000, 1],
      ['battle-league-003', 5, 2500, 1],
      ['battle-league-004', 5, 2500, 1],
      ['battle-league-005', 5, 5000, 1],
      ['battle-league-006', 5, 5000, 1],
      ['battle-league-007', 5, 10000, 1],
      ['battle-league-008', 5, 10000, 1],
      ['battle-league-009', 5, 1300, 1],
      ['battle-league-010', 5, 1300, 1],
      ['battle-league-011', 5, 2500, 1],
      ['battle-league-012', 5, 2500, 1],
      ['battle-league-013', 5, 5000, 1],
      ['battle-league-014', 5, 5000, 1],
    ],
  )
})

test('legend league shop data uses the 1000 Legend Coin CE unit', () => {
  const [legendLeagueShop] = calculateShopCE(
    shopItems.filter(shop => shop.shopKey === 'legend-league'),
    scores,
  )

  assert.deepEqual(legendLeagueShop.currency, {
    itemType: 13,
    itemId: 11,
    iconId: 46,
    name: '巅峰竞技币',
    nameZh: '巅峰竞技币',
    nameTw: '巔峰競技幣',
    nameEn: 'Legend Coins',
    nameJa: 'レジェンドコイン',
    nameKo: '레전드 코인',
  })
  assert.equal(legendLeagueShop.ceCurrencyUnit, 1000)
  assert.equal(legendLeagueShop.products.length, 9)
  assert.deepEqual(
    legendLeagueShop.products.map(product => [product.id, product.reward.quantity, product.cost, product.limitTotal]),
    [
      ['legend-league-001', 1, 6000, 1],
      ['legend-league-002', 1, 6000, 1],
      ['legend-league-003', 1, 12000, 1],
      ['legend-league-004', 1, 12000, 1],
      ['legend-league-005', 1, 24000, 1],
      ['legend-league-006', 1, 24000, 1],
      ['legend-league-007', 6000, 30000, 1],
      ['legend-league-008', 1, 20000, 1],
      ['legend-league-009', 1, 4000, 1],
    ],
  )
  assert.equal(legendLeagueShop.products[0].ce, 64 / 6000 * 1000)
  assert.equal(legendLeagueShop.products[6].ce, 2)
  assert.equal(legendLeagueShop.products[7].ce, 20)
  assert.equal(legendLeagueShop.products[8].ce, 0.25)
})

test('guild shop data includes the sold-out Rune Ticket slot', () => {
  const [guildShop] = calculateShopCE(
    shopItems.filter(shop => shop.shopKey === 'guild-shop'),
    scores,
  )

  assert.deepEqual(guildShop.currency, {
    itemType: 13,
    itemId: 12,
    iconId: 47,
    name: '公会币',
    nameZh: '公会币',
    nameTw: '公會幣',
    nameEn: 'Guild Coins',
    nameJa: 'ギルドコイン',
    nameKo: '길드 코인',
  })
  assert.equal(guildShop.ceCurrencyUnit, 1000)
  assert.equal(guildShop.products.length, 12)
  assert.deepEqual(
    guildShop.products.map(product => [product.id, product.reward.quantity, product.cost, product.limitTotal]),
    [
      ['guild-shop-001', 5, 10000, 1],
      ['guild-shop-002', 30, 12000, 1],
      ['guild-shop-003', 10, 8000, 1],
      ['guild-shop-004', 10, 16000, 1],
      ['guild-shop-005', 10, 32000, 1],
      ['guild-shop-006', 20, 10000, 1],
      ['guild-shop-007', 20, 20000, 1],
      ['guild-shop-008', 20, 40000, 1],
      ['guild-shop-009', 5, 20000, 1],
      ['guild-shop-010', 400, 20000, 1],
      ['guild-shop-011', 400, 20000, 1],
      ['guild-shop-012', 20, 8000, 1],
    ],
  )
  const soldOutTicket = guildShop.products.find(product => product.id === 'guild-shop-012')
  assert.equal(soldOutTicket.soldOut, true)
  assert.equal(soldOutTicket.ce, 25)
})

test('cross-guild battle shop data uses the 100 Grand Coin CE unit', () => {
  const [crossGuildBattleShop] = calculateShopCE(
    shopItems.filter(shop => shop.shopKey === 'cross-guild-battle'),
    scores,
  )

  assert.deepEqual(crossGuildBattleShop.currency, {
    itemType: 13,
    itemId: 15,
    iconId: 50,
    name: '跨服公会币',
    nameZh: '跨服公会币',
    nameTw: '跨服公會幣',
    nameEn: 'Grand Coins',
    nameJa: 'グランドコイン',
    nameKo: '그랜드 코인',
  })
  assert.equal(crossGuildBattleShop.ceCurrencyUnit, 100)
  assert.equal(crossGuildBattleShop.products.length, 18)
  assert.deepEqual(
    crossGuildBattleShop.products
      .filter(product => ['cross-guild-battle-005', 'cross-guild-battle-006', 'cross-guild-battle-008', 'cross-guild-battle-009', 'cross-guild-battle-011', 'cross-guild-battle-012'].includes(product.id))
      .map(product => [product.id, product.reward.quantity, product.cost, product.limitTotal]),
    [
      ['cross-guild-battle-005', 4, 160, 12],
      ['cross-guild-battle-006', 20, 320, 6],
      ['cross-guild-battle-008', 400, 160, 12],
      ['cross-guild-battle-009', 2000, 320, 6],
      ['cross-guild-battle-011', 4000, 160, 12],
      ['cross-guild-battle-012', 20000, 320, 6],
    ],
  )
  assert.equal(crossGuildBattleShop.products.find(product => product.id === 'cross-guild-battle-006').ce, 62.5)
  assert.equal(crossGuildBattleShop.products.find(product => product.id === 'cross-guild-battle-009').ce, 62.5)
  assert.equal(crossGuildBattleShop.products.find(product => product.id === 'cross-guild-battle-012').ce, 62.5)
})

test('sortShopProducts sorts by CE and pushes null CE to the end', () => {
  const rows = [
    { name: 'A', ce: null, cost: null, rewardValue: 100 },
    { name: 'B', ce: 2, cost: 50, rewardValue: 100 },
    { name: 'C', ce: 5, cost: 20, rewardValue: 100 },
  ]

  assert.deepEqual(sortShopProducts(rows).map(row => row.name), ['C', 'B', 'A'])
})

test('sortShopProducts keeps the documented product order for original sorting', () => {
  const rows = [
    { id: 'guild-raid-001', name: 'First', ce: 1 },
    { id: 'guild-raid-002', name: 'Second', ce: 3 },
    { id: 'guild-raid-003', name: 'Third', ce: 2 },
  ]

  const sorted = sortShopProducts(rows, 'original', false)

  assert.deepEqual(sorted.map(row => row.id), ['guild-raid-001', 'guild-raid-002', 'guild-raid-003'])
  assert.notEqual(sorted, rows)
})
