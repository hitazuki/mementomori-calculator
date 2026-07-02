import { buildForbiddenWeaponGachaAnalysis } from './forbiddenWeaponGachaCalc.js'
import { getItemInfo, getScore } from './packCalc.js'

const FREE_DIAMOND_KEY = '[1,1]'
const PAID_DIAMOND_KEY = '[2,1]'
const MAGIC_CRYSTAL_KEY = '[13,1]'
const RELIC_KEYS = ['[13,6]', '[13,7]', '[13,8]', '[13,9]']
export const GUILD_RAID_UNIQUE_WEAPON_FRAGMENT_KEY = 'guild-raid-unique-weapon-fragment'

const SEALED_CHEST_KEY_RATIO = 0.5
const SEALED_CHEST_KEYS = {
  bronzeChest: '[17,35]',
  silverChest: '[17,36]',
  goldChest: '[17,37]',
  bronzeKey: '[18,1]',
  silverKey: '[18,2]',
  goldKey: '[18,3]',
}

function cloneScores(scores) {
  return Object.fromEntries(Object.entries(scores || {}).map(([key, value]) => [key, { ...value }]))
}

function setScore(scores, key, score, reason) {
  if (!scores[key]) return
  scores[key] = {
    ...scores[key],
    score,
    batch: 1,
    isReadonlyDerived: true,
    readonlyReason: reason,
  }
}

function setVirtualScore(scores, key, item) {
  scores[key] = {
    ...item,
    batch: item.batch || 1,
    isReadonlyDerived: true,
  }
}

const DERIVED_CORE_ROWS = [
  {
    key: 'derived:sandalphonCore',
    name: '圣德芬的卷轴/魔书',
    nameZh: '圣德芬的卷轴/魔书',
    nameTw: '聖德芬的卷軸/魔書',
    nameEn: 'Sandalphon’s Scroll/Tome',
    nameJa: 'サンダルフォンの巻物/魔書',
    nameKo: '산달폰의 두루마리/마서',
    iconId: 61,
    reference: 'lightWeapon',
    reasonKey: 'scoreReasonLightWeapon',
  },
  {
    key: 'derived:astarothCore',
    name: '亚斯塔禄的卷轴/魔书',
    nameZh: '亚斯塔禄的卷轴/魔书',
    nameTw: '亞斯塔錄的卷軸/魔書',
    nameEn: 'Astaroth’s Scroll/Tome',
    nameJa: 'アスタロトの巻物/魔書',
    nameKo: '아스타로트의 두루마리/마서',
    iconId: 63,
    reference: 'forbiddenWeapon',
    reasonKey: 'scoreReasonForbiddenWeapon',
  },
]

const SEALED_CHEST_BASE_DROPS = {
  gold: [
    { itemType: 12, itemId: 1, quantity: 100, rate: 0.15 },
    { itemType: 12, itemId: 1, quantity: 200, rate: 0.05 },
    { itemType: 15, itemId: 1, quantity: 3, rate: 0.15 },
    { itemType: 17, itemId: 7, quantity: 1, rate: 0.10 },
    { itemType: 17, itemId: 8, quantity: 1, rate: 0.03 },
    { itemType: 17, itemId: 9, quantity: 1, rate: 0.01 },
    { itemType: 13, itemId: 4, quantity: 20, rate: 0.10 },
    { itemType: 13, itemId: 4, quantity: 30, rate: 0.05 },
    { itemType: 19, itemId: 1, quantity: 1, rate: 0.07 },
    { itemType: 20, itemId: 1, quantity: 1, rate: 0.10 },
    { itemType: 3, itemId: 1, quantity: 100000, rate: 0.08 },
    { itemType: 3, itemId: 1, quantity: 200000, rate: 0.05 },
    { itemType: 10, itemId: 6, quantity: 1, rate: 0.05 },
    { itemType: 10, itemId: 7, quantity: 1, rate: 0.01 },
  ],
  silver: [
    { itemType: 12, itemId: 1, quantity: 60, rate: 0.10 },
    { itemType: 12, itemId: 1, quantity: 100, rate: 0.04 },
    { itemType: 15, itemId: 1, quantity: 2, rate: 0.15 },
    { itemType: 17, itemId: 5, quantity: 1, rate: 0.06 },
    { itemType: 17, itemId: 6, quantity: 1, rate: 0.07 },
    { itemType: 17, itemId: 7, quantity: 1, rate: 0.03 },
    { itemType: 13, itemId: 4, quantity: 10, rate: 0.10 },
    { itemType: 13, itemId: 4, quantity: 15, rate: 0.05 },
    { itemType: 19, itemId: 1, quantity: 1, rate: 0.06 },
    { itemType: 20, itemId: 1, quantity: 1, rate: 0.08 },
    { itemType: 3, itemId: 1, quantity: 20000, rate: 0.10 },
    { itemType: 3, itemId: 1, quantity: 40000, rate: 0.05 },
    { itemType: 10, itemId: 6, quantity: 1, rate: 0.05 },
  ],
  bronze: [
    { itemType: 12, itemId: 1, quantity: 20, rate: 0.10 },
    { itemType: 12, itemId: 1, quantity: 40, rate: 0.10 },
    { itemType: 15, itemId: 1, quantity: 1, rate: 0.15 },
    { itemType: 17, itemId: 4, quantity: 1, rate: 0.08 },
    { itemType: 17, itemId: 5, quantity: 1, rate: 0.10 },
    { itemType: 17, itemId: 6, quantity: 1, rate: 0.05 },
    { itemType: 19, itemId: 1, quantity: 1, rate: 0.05 },
    { itemType: 3, itemId: 1, quantity: 10000, rate: 0.14 },
    { itemType: 3, itemId: 1, quantity: 20000, rate: 0.09 },
    { itemType: 10, itemId: 6, quantity: 1, rate: 0.04 },
  ],
}

function expectedBaseDropValue(scores, drops) {
  return drops.reduce((sum, drop) => (
    sum + getScore(scores, drop.itemType, drop.itemId) * drop.quantity * drop.rate
  ), 0)
}

function roundDerivedScore(value) {
  return Number(value.toFixed(6))
}

function itemScoreKey(itemType, itemId) {
  return `[${itemType},${itemId}]`
}

function withShares(rows, totalValue) {
  return rows.map(row => ({
    ...row,
    share: totalValue > 0 ? row.value / totalValue : 0,
  }))
}

function createDropDetail(scores, drop, overrideUnitScore = null) {
  const entry = getItemInfo(scores, drop.itemType, drop.itemId)
  const unitScore = overrideUnitScore ?? getScore(scores, drop.itemType, drop.itemId)
  const value = unitScore * drop.quantity * drop.rate
  return {
    ...entry,
    itemType: drop.itemType,
    itemId: drop.itemId,
    quantity: drop.quantity,
    rate: drop.rate,
    unitScore,
    value,
  }
}

function calculateSealedChestScores(scores) {
  const goldChest = expectedBaseDropValue(scores, SEALED_CHEST_BASE_DROPS.gold)
  const goldKey = goldChest * SEALED_CHEST_KEY_RATIO

  const silverChest = expectedBaseDropValue(scores, SEALED_CHEST_BASE_DROPS.silver)
    + 0.03 * goldChest
    + 0.03 * goldKey
  const silverKey = silverChest * SEALED_CHEST_KEY_RATIO

  const bronzeChest = expectedBaseDropValue(scores, SEALED_CHEST_BASE_DROPS.bronze)
    + 0.05 * silverChest
    + 0.05 * silverKey
  const bronzeKey = bronzeChest * SEALED_CHEST_KEY_RATIO

  return {
    [SEALED_CHEST_KEYS.goldChest]: roundDerivedScore(goldChest),
    [SEALED_CHEST_KEYS.goldKey]: roundDerivedScore(goldKey),
    [SEALED_CHEST_KEYS.silverChest]: roundDerivedScore(silverChest),
    [SEALED_CHEST_KEYS.silverKey]: roundDerivedScore(silverKey),
    [SEALED_CHEST_KEYS.bronzeChest]: roundDerivedScore(bronzeChest),
    [SEALED_CHEST_KEYS.bronzeKey]: roundDerivedScore(bronzeKey),
  }
}

function buildSealedChestDetailRows(scores) {
  const goldChest = scores[SEALED_CHEST_KEYS.goldChest]?.score || 0
  const goldKey = scores[SEALED_CHEST_KEYS.goldKey]?.score || 0
  const silverChest = scores[SEALED_CHEST_KEYS.silverChest]?.score || 0
  const silverKey = scores[SEALED_CHEST_KEYS.silverKey]?.score || 0
  const bronzeChest = scores[SEALED_CHEST_KEYS.bronzeChest]?.score || 0
  const bronzeKey = scores[SEALED_CHEST_KEYS.bronzeKey]?.score || 0

  const goldRows = SEALED_CHEST_BASE_DROPS.gold.map(drop => createDropDetail(scores, drop))
  const silverRows = [
    ...SEALED_CHEST_BASE_DROPS.silver.map(drop => createDropDetail(scores, drop)),
    createDropDetail(scores, { itemType: 17, itemId: 37, quantity: 1, rate: 0.03 }, goldChest),
    createDropDetail(scores, { itemType: 18, itemId: 3, quantity: 1, rate: 0.03 }, goldKey),
  ]
  const bronzeRows = [
    ...SEALED_CHEST_BASE_DROPS.bronze.map(drop => createDropDetail(scores, drop)),
    createDropDetail(scores, { itemType: 17, itemId: 36, quantity: 1, rate: 0.05 }, silverChest),
    createDropDetail(scores, { itemType: 18, itemId: 2, quantity: 1, rate: 0.05 }, silverKey),
  ]

  return {
    [SEALED_CHEST_KEYS.goldChest]: withShares(goldRows, goldChest),
    [SEALED_CHEST_KEYS.goldKey]: [],
    [SEALED_CHEST_KEYS.silverChest]: withShares(silverRows, silverChest),
    [SEALED_CHEST_KEYS.silverKey]: [],
    [SEALED_CHEST_KEYS.bronzeChest]: withShares(bronzeRows, bronzeChest),
    [SEALED_CHEST_KEYS.bronzeKey]: [],
  }
}

export function buildDerivedScoreState(baseScores) {
  const scores = cloneScores(baseScores)
  const paidDiamondScore = Number(scores[PAID_DIAMOND_KEY]?.score) || 1

  setScore(scores, FREE_DIAMOND_KEY, paidDiamondScore, '跟随付费钻石基准')

  const lightWeapon = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'light',
    maxPulls: 100,
    selectedPulls: 100,
  })
  const forbiddenWeapon = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'forbidden',
    maxPulls: 100,
    selectedPulls: 100,
  })
  const witchSecret = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'witchSecret',
    maxPulls: 70,
    selectedPulls: 35,
  })

  const magicCrystalScore = witchSecret.weeklyFullNode?.implicitCoreUnit || 0
  setScore(scores, MAGIC_CRYSTAL_KEY, magicCrystalScore, '魔女的奥秘召唤每周35抽推算')
  const uniqueWeaponFragmentScore = magicCrystalScore * 3 / 10
  setVirtualScore(scores, GUILD_RAID_UNIQUE_WEAPON_FRAGMENT_KEY, {
    name: '专属武器碎片',
    nameZh: '专属武器碎片',
    nameTw: '專屬武器碎片',
    nameEn: 'Unique Weapon Fragment',
    nameJa: '専用武器の欠片',
    nameKo: '전용 무기 조각',
    iconId: 201,
    score: uniqueWeaponFragmentScore,
    reason: '魔水晶商铺兑换比例：魔水晶 x3 -> 专武碎片 x10',
  })

  const seraphOracle = buildForbiddenWeaponGachaAnalysis(scores, {
    bannerKey: 'seraphOracle',
    maxPulls: 50,
    selectedPulls: 50,
  })
  const relicScore = seraphOracle.rows.find(row => row.pulls === 50)?.implicitCoreUnit || 0
  for (const key of RELIC_KEYS) {
    setScore(scores, key, relicScore, '圣天使的神谕召唤本周50抽推算')
  }

  const sealedChestScores = calculateSealedChestScores(scores)
  for (const [key, score] of Object.entries(sealedChestScores)) {
    setScore(scores, key, score, '封印宝箱截图奖池期望推算；钥匙按同级宝箱价值的1/2')
  }
  const sealedChestDetailRows = buildSealedChestDetailRows(scores)

  const referenceScores = {
    lightWeapon: lightWeapon.bestNode.implicitCoreUnit,
    forbiddenWeapon: forbiddenWeapon.bestNode.implicitCoreUnit,
  }
  const referencePulls = {
    lightWeapon: lightWeapon.bestNode.pulls,
    forbiddenWeapon: forbiddenWeapon.bestNode.pulls,
  }

  const readonlyRows = [
    {
      key: FREE_DIAMOND_KEY,
      ...scores[FREE_DIAMOND_KEY],
      score: paidDiamondScore,
      label: '免费钻石',
      reason: '跟随付费钻石基准',
      reasonKey: 'scoreReasonFreeDiamond',
    },
    ...DERIVED_CORE_ROWS.map(item => ({
      ...item,
      score: referenceScores[item.reference],
      batch: 1,
      reason: item.reasonKey,
      reasonParams: { pulls: referencePulls[item.reference] },
    })),
    {
      key: MAGIC_CRYSTAL_KEY,
      ...scores[MAGIC_CRYSTAL_KEY],
      score: magicCrystalScore,
      label: '魔水晶',
      reason: '魔女的奥秘召唤每周35抽推算',
      reasonKey: 'scoreReasonMagicCrystal',
    },
    {
      key: GUILD_RAID_UNIQUE_WEAPON_FRAGMENT_KEY,
      ...scores[GUILD_RAID_UNIQUE_WEAPON_FRAGMENT_KEY],
      score: uniqueWeaponFragmentScore,
      label: '专属武器碎片',
      reason: '魔水晶商铺兑换比例：魔水晶 x3 -> 专武碎片 x10',
      reasonKey: 'scoreReasonGuildRaidWeaponFragment',
    },
    {
      key: RELIC_KEYS[0],
      ...scores[RELIC_KEYS[0]],
      score: relicScore,
      label: '圣遗物',
      name: '圣遗物',
      nameZh: '圣遗物',
      nameTw: '聖遺物',
      nameEn: 'Relics',
      nameJa: '聖遺物',
      nameKo: '성유물',
      reason: '圣天使的神谕召唤本周50抽推算',
      reasonKey: 'scoreReasonRelic',
    },
    ...Object.values(SEALED_CHEST_KEYS).filter(key => scores[key]).map(key => {
      return {
        key,
        ...scores[key],
        label: scores[key]?.nameZh || scores[key]?.name || key,
        reason: '封印宝箱截图奖池期望推算；钥匙按同级宝箱价值的1/2',
        reasonKey: 'scoreReasonSealedChest',
        detailRows: sealedChestDetailRows[key] || [],
      }
    }),
  ]

  return {
    scores,
    readonlyRows,
    references: {
      lightWeapon,
      forbiddenWeapon,
      witchSecret,
      seraphOracle,
    },
  }
}

export function applyDerivedScores(baseScores) {
  return buildDerivedScoreState(baseScores).scores
}
