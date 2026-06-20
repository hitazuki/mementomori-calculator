import { buildForbiddenWeaponGachaAnalysis } from './forbiddenWeaponGachaCalc.js'

const FREE_DIAMOND_KEY = '[1,1]'
const PAID_DIAMOND_KEY = '[2,1]'
const MAGIC_CRYSTAL_KEY = '[13,1]'

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

const DERIVED_CORE_ITEMS = [
  {
    key: 'derived:sandalphonScroll',
    name: '圣德芬的卷轴',
    nameZh: '圣德芬的卷轴',
    nameTw: '聖德芬的卷軸',
    nameEn: 'Sandalphon’s Scroll',
    nameJa: 'サンダルフォンの巻物',
    nameKo: '산달폰의 두루마리',
    iconId: 61,
    reference: 'lightWeapon',
    reasonKey: 'scoreReasonLightWeapon',
  },
  {
    key: 'derived:sandalphonTome',
    name: '圣德芬的魔书',
    nameZh: '圣德芬的魔书',
    nameTw: '聖德芬的魔書',
    nameEn: 'Sandalphon’s Tome',
    nameJa: 'サンダルフォンの魔書',
    nameKo: '산달폰의 마서',
    iconId: 62,
    reference: 'lightWeapon',
    reasonKey: 'scoreReasonLightWeapon',
  },
  {
    key: 'derived:astarothScroll',
    name: '亚斯塔禄的卷轴',
    nameZh: '亚斯塔禄的卷轴',
    nameTw: '亞斯塔錄的卷軸',
    nameEn: 'Astaroth’s Scroll',
    nameJa: 'アスタロトの巻物',
    nameKo: '아스타로트의 두루마리',
    iconId: 63,
    reference: 'forbiddenWeapon',
    reasonKey: 'scoreReasonForbiddenWeapon',
  },
  {
    key: 'derived:astarothTome',
    name: '亚斯塔禄的魔书',
    nameZh: '亚斯塔禄的魔书',
    nameTw: '亞斯塔錄的魔書',
    nameEn: 'Astaroth’s Tome',
    nameJa: 'アスタロトの魔書',
    nameKo: '아스타로트의 마서',
    iconId: 64,
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
    ...DERIVED_CORE_ITEMS.map(item => ({
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
  ].filter(row => row.score > 0)

  return {
    scores,
    readonlyRows,
    references: {
      lightWeapon,
      forbiddenWeapon,
      witchSecret,
    },
  }
}

export function applyDerivedScores(baseScores) {
  return buildDerivedScoreState(baseScores).scores
}
