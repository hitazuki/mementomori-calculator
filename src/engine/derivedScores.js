import { buildForbiddenWeaponGachaAnalysis } from './forbiddenWeaponGachaCalc.js'

const FREE_DIAMOND_KEY = '[1,1]'
const PAID_DIAMOND_KEY = '[2,1]'
const MAGIC_CRYSTAL_KEY = '[13,1]'
const RELIC_KEYS = ['[13,6]', '[13,7]', '[13,8]', '[13,9]']
export const GUILD_RAID_UNIQUE_WEAPON_FRAGMENT_KEY = 'guild-raid-unique-weapon-fragment'

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
