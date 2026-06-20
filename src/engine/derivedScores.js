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

  const readonlyRows = [
    {
      key: FREE_DIAMOND_KEY,
      ...scores[FREE_DIAMOND_KEY],
      score: paidDiamondScore,
      label: '免费钻石',
      reason: '跟随付费钻石基准',
    },
    {
      key: 'derived:lightWeaponCore',
      name: '圣德芬卷轴/魔书',
      nameZh: '圣德芬卷轴/魔书',
      iconId: 84,
      score: lightWeapon.bestNode.implicitCoreUnit,
      batch: 1,
      reason: `天光武具最低隐含单价（${lightWeapon.bestNode.pulls}抽）`,
    },
    {
      key: 'derived:forbiddenWeaponCore',
      name: '亚斯塔禄卷轴/魔书',
      nameZh: '亚斯塔禄卷轴/魔书',
      iconId: 85,
      score: forbiddenWeapon.bestNode.implicitCoreUnit,
      batch: 1,
      reason: `禁忌武具最低隐含单价（${forbiddenWeapon.bestNode.pulls}抽）`,
    },
    {
      key: MAGIC_CRYSTAL_KEY,
      ...scores[MAGIC_CRYSTAL_KEY],
      score: magicCrystalScore,
      label: '魔水晶',
      reason: '魔女的奥秘召唤每周35抽推算',
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
