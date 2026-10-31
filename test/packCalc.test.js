import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { calculatePackCE, getBaseItemKey, getScore, normalizeScores } from '../src/engine/packCalc.js'
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

test('anniversary packs use the local gift box icon and follow the derived relic value', () => {
  const packs = JSON.parse(readFileSync(new URL('../src/constants/eventPacks.json', import.meta.url), 'utf8'))
  const base = JSON.parse(readFileSync(new URL('../src/constants/itemScores.json', import.meta.url), 'utf8'))
  assert.deepEqual(packs.filter(p => p.nameKey.startsWith('origin_anniversary_')).map(p => [p.nameKey, p.price, p.items]), [
    ['origin_anniversary_pack_1', 6000, [
      { ItemType: 2, ItemId: 1, ItemCount: 3000 },
      { ItemType: 99, ItemId: 4, ItemCount: 1 },
      { ItemType: 16, ItemId: 4, ItemCount: 5 },
    ]],
    ['origin_anniversary_pack_2', 11800, [
      { ItemType: 2, ItemId: 1, ItemCount: 5900 },
      { ItemType: 99, ItemId: 4, ItemCount: 1 },
      { ItemType: 16, ItemId: 12, ItemCount: 20 },
    ]],
  ])
  const values = [200, 400].map(ticketScore => {
    const state = buildDerivedScoreState(normalizeScores({
      ...base,
      '[16,1]': { ...base['[16,1]'], score: ticketScore, batch: 1 },
    }))
    const relicValue = getScore(state.scores, 13, 6)
    assert.ok(relicValue > 0)
    assert.equal(getScore(state.scores, 99, 4), relicValue)
    assert.equal(state.scores['[99,4]'].isReadonlyDerived, true)
    assert.deepEqual(
      ['nameZh', 'nameTw', 'nameEn', 'nameJa', 'nameKo'].map(field => state.scores['[99,4]'][field]),
      ['圣天使宝箱', '聖天使寶箱', 'Chest of the Seraph', '聖天使の宝箱', '성천사의 보물상자'],
    )
    for (const pack of calculatePackCE(packs.filter(p => p.nameKey.startsWith('origin_anniversary_')), state.scores)) {
      const box = pack.items.find(item => item.itype === 99 && item.iid === 4)
      assert.equal(box.iconId, 195)
      assert.equal(box.value, relicValue)
      const ticket = pack.items.find(item => item.itype === 16)
      assert.equal(pack.originalValue, Math.round(pack.diamondCount + relicValue + ticket.value))
      assert.equal(pack.rechargeValue, Math.round(pack.paidDiamonds * 1.2))
    }
    return relicValue
  })
  assert.ok(values[1] > values[0], 'gift box value must respond to score changes')
  assert.ok(readFileSync(new URL('../public/images/items/Item_0195.png', import.meta.url)).length > 0)
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

test('monthly card includes 30 days of diamonds, sweeps, and recharge value', () => {
  const monthlyScores = normalizeScores({
    ...scores,
    '[1,1]': { name: 'Free Diamond', score: 1, batch: 1, iconId: 9 },
    '[99,1]': { name: 'Daily Free Sweep', score: 30, batch: 1, iconId: 9 },
  })
  const [pack] = calculatePackCE([{
    name: 'Monthly Card',
    price: 1_000,
    items: [
      { ItemType: 2, ItemId: 1, ItemCount: 500 },
      { ItemType: 1, ItemId: 1, ItemCount: 4_500 },
      { ItemType: 99, ItemId: 1, ItemCount: 30 },
    ],
  }], monthlyScores)

  assert.equal(pack.originalValue, 5_900)
  assert.equal(pack.rechargeValue, 600)
  assert.equal(pack.value, 6_500)
})

test('contract privilege uses equivalent benefits without recharge value', () => {
  const contractScores = normalizeScores({
    ...scores,
    '[13,4]': { name: 'Rune Ticket', score: 10, batch: 1, iconId: 39 },
    '[99,2]': { name: 'Team Quest Bonus', score: 26, batch: 1, iconId: 9 },
    '[99,3]': { name: 'Space-Time Coin Bonus', score: 4_000 / 180_000, batch: 1, iconId: 48 },
  })
  const [pack] = calculatePackCE([{
    name: 'Contract Privilege',
    price: 360,
    rechargeEligible: false,
    items: [
      { ItemType: 99, ItemId: 2, ItemCount: 30 },
      { ItemType: 13, ItemId: 4, ItemCount: 103.5 },
      { ItemType: 99, ItemId: 3, ItemCount: 20_000 },
    ],
  }], contractScores)

  assert.equal(pack.originalValue, 2_259)
  assert.equal(pack.rechargeValue, 0)
  assert.equal(pack.value, 2_259)
  assert.equal(pack.paidDiamonds, 180)
})

test('getBaseItemKey maps homogeneous derived items to their editable bases', () => {
  assert.equal(getBaseItemKey(10, 4), '[10,1]')
  assert.equal(getBaseItemKey(10, 20), '[10,20]')
  assert.equal(getBaseItemKey(15, 2), '[15,1]')
  assert.equal(getBaseItemKey(17, 4), '[17,5]')
  assert.equal(getBaseItemKey(17, 10), '[17,5]')
  assert.equal(getBaseItemKey(17, 24), '[17,21]')
})

test('mystery rune Lv1 is derived from the Lv2 base score', () => {
  assert.equal(getScore(scores, 17, 4), 50)
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

test('sealed chest and key scores are derived from screenshot odds', () => {
  const state = buildDerivedScoreState(normalizeScores({
    '[1,1]': { name: 'Free Diamond', score: 1, batch: 1, iconId: 1 },
    '[2,1]': { name: 'Paid Diamond', score: 1, batch: 1, iconId: 1 },
    '[3,1]': { name: 'Gold', nameZh: '金币', score: 0, batch: 1, iconId: 10 },
    '[10,6]': { name: 'Exp 1h', score: 1, batch: 1, iconId: 6 },
    '[12,1]': { name: 'Water', score: 1, batch: 1000, iconId: 1 },
    '[13,1]': { name: 'Magic Crystal', score: 1, batch: 1, iconId: 1 },
    '[13,4]': { name: 'Rune Ticket', score: 20, batch: 1, iconId: 4 },
    '[15,1]': { name: 'Perfume', score: 1, batch: 1, iconId: 1 },
    '[17,5]': { name: 'Rune Lv2', score: 16, batch: 1, iconId: 5 },
    '[17,35]': { name: 'Bronze Chest', nameZh: '初级封印宝箱', score: 0, batch: 1, iconId: 78 },
    '[17,36]': { name: 'Silver Chest', nameZh: '中级封印宝箱', score: 0, batch: 1, iconId: 79 },
    '[17,37]': { name: 'Gold Chest', nameZh: '上级封印宝箱', score: 0, batch: 1, iconId: 80 },
    '[18,1]': { name: 'Bronze Key', nameZh: '初级封印钥匙', score: 0, batch: 1, iconId: 55 },
    '[18,2]': { name: 'Silver Key', nameZh: '中级封印钥匙', score: 0, batch: 1, iconId: 56 },
    '[18,3]': { name: 'Gold Key', nameZh: '上级封印钥匙', score: 0, batch: 1, iconId: 57 },
    '[19,1]': { name: 'Boss Ticket', score: 50, batch: 1, iconId: 1 },
    '[20,1]': { name: 'Tower Ticket', score: 100, batch: 1, iconId: 1 },
  }))

  const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.000001)
  closeTo(state.scores['[17,37]'].score, 96.845)
  closeTo(state.scores['[18,3]'].score, 48.4225)
  closeTo(state.scores['[17,36]'].score, 55.838025)
  closeTo(state.scores['[18,2]'].score, 27.9190125)
  closeTo(state.scores['[17,35]'].score, 10.723851875)
  closeTo(state.scores['[18,1]'].score, 5.3619259375)
  const bronzeChestRow = state.readonlyRows.find(row => row.key === '[17,35]')
  const bronzeKeyRow = state.readonlyRows.find(row => row.key === '[18,1]')
  assert.equal(bronzeChestRow.reasonKey, 'scoreReasonSealedChest')
  assert.equal(bronzeChestRow.detailRows.length, 12)
  closeTo(bronzeChestRow.detailRows.reduce((sum, row) => sum + row.value, 0), state.scores['[17,35]'].score)
  assert.equal(bronzeChestRow.detailRows.find(row => row.itemType === 3 && row.itemId === 1).nameZh, '金币')
  assert.equal(bronzeChestRow.detailRows.find(row => row.itemType === 17 && row.itemId === 4).nameZh, '未鉴定符石Lv1')
  assert.equal(bronzeKeyRow.detailRows.length, 0)

  const goldChestRow = state.readonlyRows.find(row => row.key === '[17,37]')
  assert.equal(goldChestRow.detailRows.find(row => row.itemType === 10 && row.itemId === 7).nameZh, '经验珠(2小时)')
})

test('unity mission chest selects the highest full reward value and ignores tickets', () => {
  const packs = JSON.parse(readFileSync(new URL('../src/constants/eventPacks.json', import.meta.url), 'utf8'))
  const pack = packs.find(p => p.nameKey === 'origin_unity_mission_pack')
  assert.equal(pack.price, 650)
  assert.deepEqual(pack.items.map(i => i.ItemCount), [325, 4, 1])
  const base = JSON.parse(readFileSync(new URL('../src/constants/itemScores.json', import.meta.url), 'utf8'))
  const localized = buildDerivedScoreState(normalizeScores(base)).scores
  for (const [key, icon, names] of [
    ['[99,5]', 279, ['团结宝箱', '團結寶箱', 'United Missions Chest', '団結の箱', '단합의 상자']],
    ['[99,6]', 278, ['团结任务券', '團結任務券', 'United Missions Ticket', '団結ミッションチケット', '단합 미션 티켓']],
  ]) {
    assert.deepEqual(['nameZh', 'nameTw', 'nameEn', 'nameJa', 'nameKo'].map(field => localized[key][field]), names)
    assert.equal(localized[key].iconId, icon)
    const png = readFileSync(new URL('../public/images/items/Item_' + String(icon).padStart(4, '0') + '.png', import.meta.url))
    assert.equal(png.subarray(1, 4).toString(), 'PNG')
  }
  const options = [[17, 6, 20], [13, 3, 1300], [19, 1, 8], [20, 1, 8], [18, 3, 10]]
  // Drive each directly editable reward above the others, including batch conversion.
  for (const [key, batch, winner] of [['[17,5]', 1, 0], ['[13,3]', 1000, 1], ['[19,1]', 1, 2], ['[20,1]', 1, 3]]) {
    const state = buildDerivedScoreState(normalizeScores({ ...base, [key]: { ...base[key], score: 1e12, batch } }))
    const values = options.map(([type, id, count]) => getScore(state.scores, type, id) * count)
    assert.equal(values.indexOf(Math.max(...values)), winner)
    assert.deepEqual(state.scores['[99,5]'].highestValueChoices.map(c => [c.itemType, c.itemId, c.quantity]), [options[winner]])
    assert.equal(getScore(state.scores, 99, 5), Math.max(...values))
    assert.equal(getScore(state.scores, 99, 6), 0)
    const [result] = calculatePackCE([pack], state.scores)
    assert.equal(result.originalValue, Math.round(325 + Math.max(...values)))
    assert.equal(result.items[1].value, 0)
    assert.equal(result.rechargeValue, 390)
  }
  // A costly rune ticket raises the recursively derived gold key above other choices.
  const state = buildDerivedScoreState(normalizeScores({ ...base, '[13,4]': { score: 1e12, batch: 1 } }))
  const values = options.map(([type, id, count]) => getScore(state.scores, type, id) * count)
  assert.equal(values.indexOf(Math.max(...values)), 4)
  assert.deepEqual(state.scores['[99,5]'].highestValueChoices.map(c => [c.itemType, c.itemId, c.quantity]), [options[4]])
  const zero = buildDerivedScoreState({}).scores['[99,5]']
  assert.equal(zero.highestValueChoices.length, 5, 'all options are shown when tied')
  assert.equal(getScore(state.scores, 99, 5), Math.max(...values))
})
