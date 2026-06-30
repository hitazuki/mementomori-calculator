import { buildForbiddenWeaponGachaAnalysis } from './forbiddenWeaponGachaCalc.js'
import { getScore } from './packCalc.js'

export const GACHA_TYPES = {
  lightDark: {
    key: 'lightDark',
    label: '光暗限定',
    labelKey: 'gachaTypeLightDark',
  },
  fourElements: {
    key: 'fourElements',
    label: '四属限定',
    labelKey: 'gachaTypeFourElements',
  },
}

export const DESTINY_FOUR_ELEMENTS_SIDE_DROPS = [
  { key: 'diamond30000', label: '钻石 x30000', rate: 0.0001, qty: 30000, itype: 1, iid: 1 },
  { key: 'water300', label: '强化水 x300', rate: 0.028101, qty: 300, itype: 12, iid: 1 },
  { key: 'water200', label: '强化水 x200', rate: 0.028101, qty: 200, itype: 12, iid: 1 },
  { key: 'water100', label: '强化水 x100', rate: 0.035651, qty: 100, itype: 12, iid: 1 },
  { key: 'secretPotion4', label: '强化秘药 x4', rate: 0.015001, qty: 4, itype: 12, iid: 2 },
  { key: 'secretPotion2', label: '强化秘药 x2', rate: 0.030001, qty: 2, itype: 12, iid: 2 },
  { key: 'gold6h5', label: '金币(6小时) x5', rate: 0.093604, qty: 5, itype: 10, iid: 3 },
  { key: 'exp6h2', label: '经验珠(6小时) x2', rate: 0.093604, qty: 2, itype: 10, iid: 8 },
  { key: 'kindle2h5', label: '潜能宝珠(2小时) x5', rate: 0.093604, qty: 5, itype: 10, iid: 12 },
  { key: 'gold24h2', label: '金币(24小时) x2', rate: 0.045002, qty: 2, itype: 10, iid: 5 },
  { key: 'exp24h1', label: '经验珠(24小时) x1', rate: 0.045002, qty: 1, itype: 10, iid: 10 },
  { key: 'kindle8h2', label: '潜能宝珠(8小时) x2', rate: 0.045002, qty: 2, itype: 10, iid: 14 },
  { key: 'letterRBlue', label: '魔女的来信(R・忧蓝) x1', rate: 0.022501, qty: 1, itype: 17, iid: 17 },
  { key: 'letterRRed', label: '魔女的来信(R・业红) x1', rate: 0.022501, qty: 1, itype: 17, iid: 18 },
  { key: 'letterRGreen', label: '魔女的来信(R・苍翠) x1', rate: 0.022501, qty: 1, itype: 17, iid: 19 },
  { key: 'letterRYellow', label: '魔女的来信(R・流金) x1', rate: 0.022501, qty: 1, itype: 17, iid: 20 },
  { key: 'letterSrBlue', label: '魔女的来信(SR・忧蓝) x1', rate: 0.008, qty: 1, itype: 17, iid: 21 },
  { key: 'letterSrRed', label: '魔女的来信(SR・业红) x1', rate: 0.008, qty: 1, itype: 17, iid: 22 },
  { key: 'letterSrGreen', label: '魔女的来信(SR・苍翠) x1', rate: 0.008, qty: 1, itype: 17, iid: 23 },
  { key: 'letterSrYellow', label: '魔女的来信(SR・流金) x1', rate: 0.008, qty: 1, itype: 17, iid: 24 },
  { key: 'bossTicket2', label: '首领挑战券 x2', rate: 0.019171, qty: 2, itype: 19, iid: 1 },
  { key: 'towerTicket2', label: '无穷之塔挑战券 x2', rate: 0.019171, qty: 2, itype: 20, iid: 1 },
  { key: 'magicCrystal', label: '魔水晶 x1', rate: 0.038361, qty: 1, itype: 13, iid: 1 },
  { key: 'perfume', label: '魔装香油 x1', rate: 0.020001, qty: 1, itype: 15, iid: 1 },
  { key: 'sandalphonScroll', label: '圣德芬的卷轴 x1', rate: 0.072803, qty: 1, reference: 'lightWeapon' },
  { key: 'sandalphonGrimoire', label: '圣德芬的魔书 x1', rate: 0.072803, qty: 1, reference: 'lightWeapon' },
  { key: 'astarothScroll', label: '亚斯塔禄的卷轴 x1', rate: 0.030601, qty: 1, reference: 'forbiddenWeapon' },
  { key: 'astarothGrimoire', label: '亚斯塔禄的魔书 x1', rate: 0.030601, qty: 1, reference: 'forbiddenWeapon' },
]

export const DESTINY_LIGHT_DARK_SIDE_DROPS = DESTINY_FOUR_ELEMENTS_SIDE_DROPS.map(drop => ({
  ...drop,
  rate: drop.key === 'water100' ? 0.0374 : Math.floor(drop.rate * 100000) / 100000,
}))

export const PICKUP_CHARACTER_SIDE_DROPS = [
  { key: 'pickupOtherSr', label: 'SR角色（折算魔女的来信(SR)） x1', rate: 0, qty: 1, itype: 17, iid: 21 },
  { key: 'pickupPermanentLightDark', label: '光暗常驻角色（等同魔女的邀请函） x1', rate: 0.0014, qty: 1, itype: 17, iid: 26 },
  { key: 'pickupR', label: 'R角色（折算魔女的来信(R)） x1', rate: 0.4377, qty: 1, itype: 17, iid: 17 },
  { key: 'pickupN', label: 'N角色（折算魔女的心片(SR)） x0.5', rate: 0.5177, qty: 0.5, itype: 17, iid: 28 },
]

export const PICKUP_MILESTONE_SIDE_DROPS = [
  { key: 'pickupRuneLv3', label: '未鉴定符石Lv3 x1（20/50抽）', rate: 0, qty: 1, itype: 17, iid: 6, milestoneOffsets: [20, 50], milestoneCycle: 100 },
  { key: 'pickupRuneLv5', label: '未鉴定符石Lv5 x1（50抽）', rate: 0, qty: 1, itype: 17, iid: 8, milestoneOffsets: [50], milestoneCycle: 100 },
  { key: 'pickupHeartSr80', label: '魔女的心片(SR) x80（非300整百抽）', rate: 0, qty: 80, itype: 17, iid: 28, milestoneOffsets: [100], milestoneCycle: 100, skipEvery: 300 },
  { key: 'pickupInvitation', label: '魔女的邀请函 x1（300整抽）', rate: 0, qty: 1, itype: 17, iid: 26, milestoneOffsets: [100], milestoneCycle: 100, onlyEvery: 300 },
]

export const GACHA_BANNERS = {
  destiny: {
    key: 'destiny',
    label: '命运召唤',
    labelKey: 'gachaBannerDestiny',
    costItem: { itemType: 16, itemId: 4 },
    costPerPull: 500,
    maxPulls: 70,
    baseRates: {
      lightDark: 0.02,
      fourElements: 0.021712,
    },
    softPityAfter: 56,
    hardPityAt: 70,
    diamondPrizeRate: 0.0001,
    diamondPrizeAmount: 30000,
    note: '57-70 抽采用线性软保底假设，70 抽为 100%。',
    noteKey: 'gachaNoteDestiny',
  },
  pickup: {
    key: 'pickup',
    label: '精选召唤',
    labelKey: 'gachaBannerPickup',
    costItem: { itemType: 16, itemId: 510 },
    costPerPull: 300,
    maxPulls: 100,
    baseRates: {
      lightDark: 0.0126,
      fourElements: 0.0137,
    },
    hardPityAt: 100,
    permanentRate: 0.0014,
    invitationPulls: 300,
    note: '第 100 抽指定限定概率升至 100%；累抽奖励按 100 抽循环，300 整抽为魔女的邀请函。',
    noteKey: 'gachaNotePickup',
  },
}

function resolveCostPerPull(banner, scores) {
  const { itemType, itemId } = banner.costItem || {}
  const score = itemType && itemId ? getScore(scores, itemType, itemId) : 0
  return score || banner.costPerPull
}

export function getGachaConfig(bannerKey, typeKey, scores = {}) {
  const banner = GACHA_BANNERS[bannerKey] || GACHA_BANNERS.destiny
  const characterType = GACHA_TYPES[typeKey] || GACHA_TYPES.lightDark
  return {
    ...banner,
    costPerPull: resolveCostPerPull(banner, scores),
    bannerLabel: banner.label,
    typeLabel: characterType.label,
    typeLabelKey: characterType.labelKey,
    baseRate: banner.baseRates[characterType.key],
  }
}

export function getConditionalLimitedRate(config, pullNumber) {
  if (pullNumber >= config.hardPityAt) return 1
  if (config.softPityAfter && pullNumber > config.softPityAfter) {
    const softSpan = config.hardPityAt - config.softPityAfter
    const progress = (pullNumber - config.softPityAfter) / softSpan
    return config.baseRate + (1 - config.baseRate) * progress
  }
  return config.baseRate
}

export function calcAtLeastOne(rate, pulls) {
  if (!rate || pulls <= 0) return 0
  return 1 - ((1 - rate) ** pulls)
}

function scoreKey(itype, iid) {
  return `[${itype},${iid}]`
}

function getScoreMeta(scores, itype, iid) {
  const entry = scores?.[scoreKey(itype, iid)] || {}
  return {
    score: Number(entry.score) || 0,
    batch: Number(entry.batch) || 1,
  }
}

function enrichSideDrop(drop, scores, extra = {}) {
  const unitScore = drop.exclusive
    ? 0
    : getScore(scores, drop.itype, drop.iid) || (drop.itype === 1 && drop.iid === 1 ? 1 : 0)
  const expectedQtyPerPull = drop.rate * drop.qty
  const expectedValuePerPull = expectedQtyPerPull * unitScore

  return {
    ...drop,
    ...extra,
    unitScore,
    scoreMeta: drop.exclusive ? { score: 0, batch: 1 } : getScoreMeta(scores, drop.itype, drop.iid),
    expectedQtyPerPull,
    expectedValuePerPull,
    isPriced: !drop.exclusive && unitScore > 0,
  }
}

function buildPickupSideDrops(config, scores) {
  const otherSrRate = Math.max(0, 0.0446 - config.baseRate - (config.permanentRate || 0))
  const characterDrops = PICKUP_CHARACTER_SIDE_DROPS.map(drop => ({
    ...drop,
    rate: drop.key === 'pickupOtherSr' ? otherSrRate : drop.rate,
  }))

  return [
    ...characterDrops,
    ...PICKUP_MILESTONE_SIDE_DROPS,
  ].map(drop => enrichSideDrop(drop, scores, {
    milestoneLabel: drop.milestoneCycle
      ? `每 ${drop.milestoneCycle} 抽循环`
      : '',
  }))
}

function buildSideDrops(config, typeKey, scores) {
  if (config.key === 'pickup') return buildPickupSideDrops(config, scores)
  if (config.key !== 'destiny') return []

  const sourceDrops = typeKey === 'lightDark'
    ? DESTINY_LIGHT_DARK_SIDE_DROPS
    : DESTINY_FOUR_ELEMENTS_SIDE_DROPS

  const weaponReferences = {
    forbiddenWeapon: buildForbiddenWeaponGachaAnalysis(scores, {
      bannerKey: 'forbidden',
      maxPulls: 100,
      selectedPulls: 100,
    }),
    lightWeapon: buildForbiddenWeaponGachaAnalysis(scores, {
      bannerKey: 'light',
      maxPulls: 100,
      selectedPulls: 100,
    }),
  }
  const referenceLabels = {
    forbiddenWeapon: `禁忌武具最低隐含单价（${weaponReferences.forbiddenWeapon.bestNode.pulls}抽）`,
    lightWeapon: `天光武具最低隐含单价（${weaponReferences.lightWeapon.bestNode.pulls}抽）`,
  }
  const referenceLabelKeys = {
    forbiddenWeapon: 'scoreReasonForbiddenWeapon',
    lightWeapon: 'scoreReasonLightWeapon',
  }

  return sourceDrops.map(drop => {
    const reference = drop.reference ? weaponReferences[drop.reference] : null
    const score = reference
      ? reference.bestNode.implicitCoreUnit
      : drop.exclusive
        ? 0
        : getScore(scores, drop.itype, drop.iid)
    const unitScore = score || (drop.itype === 1 && drop.iid === 1 ? 1 : 0)
    const expectedQtyPerPull = drop.rate * drop.qty
    const expectedValuePerPull = expectedQtyPerPull * unitScore
    return {
      ...drop,
      unitScore,
      scoreMeta: drop.exclusive || drop.reference ? { score: unitScore, batch: 1 } : getScoreMeta(scores, drop.itype, drop.iid),
      expectedQtyPerPull,
      expectedValuePerPull,
      isPriced: Boolean(drop.reference) || (!drop.exclusive && unitScore > 0),
      referenceLabel: drop.reference ? referenceLabels[drop.reference] : '',
      referenceLabelKey: drop.reference ? referenceLabelKeys[drop.reference] : '',
      referenceLabelParams: drop.reference ? { pulls: reference.bestNode.pulls } : {},
    }
  })
}

function countMilestoneDrop(drop, pulls) {
  if (!drop.milestoneCycle || !drop.milestoneOffsets?.length) return 0

  let count = 0
  for (let cycleStart = 0; cycleStart < pulls; cycleStart += drop.milestoneCycle) {
    drop.milestoneOffsets.forEach(offset => {
      const milestonePull = cycleStart + offset
      if (milestonePull <= 0 || milestonePull > pulls) return
      if (drop.onlyEvery && milestonePull % drop.onlyEvery !== 0) return
      if (drop.skipEvery && milestonePull % drop.skipEvery === 0) return
      count += drop.qty
    })
  }
  return count
}

function buildSideProbabilityCheck(config, sideDrops) {
  const sideRate = sideDrops.reduce((sum, drop) => sum + drop.rate, 0)
  const totalRate = sideRate + config.baseRate
  const gapRate = 1 - totalRate
  return {
    sideRate,
    limitedRate: config.baseRate,
    totalRate,
    gapRate,
    isClosed: Math.abs(gapRate) < 0.00002,
  }
}

export function buildGachaAnalysis(bannerKey, typeKey, scores = {}) {
  const config = getGachaConfig(bannerKey, typeKey, scores)
  const sideDrops = buildSideDrops(config, typeKey, scores)
  const randomSideValuePerPull = sideDrops.reduce((sum, drop) => sum + drop.expectedValuePerPull, 0)
  const buildSideSummaryAtPulls = pull => {
    const sideQuantities = {}
    const sideValues = {}
    let sideValue = 0

    sideDrops.forEach(drop => {
      const qty = drop.milestoneCycle
        ? countMilestoneDrop(drop, pull)
        : pull * drop.expectedQtyPerPull
      const value = qty * drop.unitScore
      sideQuantities[drop.key] = qty
      sideValues[drop.key] = value
      sideValue += value
    })

    return {
      pulls: pull,
      sideValue,
      sideRecoveryRate: pull * config.costPerPull > 0 ? sideValue / (pull * config.costPerPull) : 0,
      netCost: pull * config.costPerPull - sideValue,
      sideQuantities,
      sideValues,
    }
  }
  let survival = 1

  const pulls = Array.from({ length: config.maxPulls }, (_, index) => {
    const pull = index + 1
    const conditionalRate = getConditionalLimitedRate(config, pull)
    const firstHitRate = survival * conditionalRate
    const cumulativeRate = 1 - survival * (1 - conditionalRate)
    const sideSummary = buildSideSummaryAtPulls(pull)
    survival *= (1 - conditionalRate)

    return {
      pull,
      diamonds: pull * config.costPerPull,
      sideValue: sideSummary.sideValue,
      netDiamonds: sideSummary.netCost,
      conditionalRate,
      firstHitRate,
      cumulativeRate,
    }
  })

  const expectedPulls = pulls.reduce((sum, row) => sum + row.pull * row.firstHitRate, 0)
  const expectedGrossCost = expectedPulls * config.costPerPull
  const expectedSideValue = pulls.reduce((sum, row) => sum + row.firstHitRate * row.sideValue, 0)
  const expectedDiamondPrize = sideDrops.length
    ? (sideDrops.find(drop => drop.key === 'diamond30000')?.expectedValuePerPull || 0) * expectedPulls
    : config.diamondPrizeRate
      ? expectedPulls * config.diamondPrizeRate * config.diamondPrizeAmount
      : 0
  const expectedNetCost = sideDrops.length
    ? expectedGrossCost - expectedSideValue
    : expectedGrossCost - expectedDiamondPrize

  const pricedSideDrops = sideDrops
    .filter(drop => drop.isPriced)
    .sort((a, b) => {
      const aValue = buildSideSummaryAtPulls(config.invitationPulls || config.maxPulls).sideValues[a.key] || 0
      const bValue = buildSideSummaryAtPulls(config.invitationPulls || config.maxPulls).sideValues[b.key] || 0
      return bValue - aValue
    })
  const exclusiveSideDrops = sideDrops.filter(drop => drop.exclusive)

  const totalSideRate = sideDrops.reduce((sum, drop) => sum + drop.rate, 0)
  const unpricedSideRate = exclusiveSideDrops.reduce((sum, drop) => sum + drop.rate, 0)
  const pricedSideRate = totalSideRate - unpricedSideRate
  const sideValuePerPull = expectedPulls > 0 ? expectedSideValue / expectedPulls : randomSideValuePerPull
  const netCostPerPull = config.costPerPull - sideValuePerPull
  const sideProbabilityCheck = buildSideProbabilityCheck(config, sideDrops)

  const quantilePull = (rate) => pulls.find(row => row.cumulativeRate >= rate)?.pull || config.maxPulls

  return {
    config,
    pulls,
    sideDrops,
    pricedSideDrops,
    exclusiveSideDrops,
    sideValuePerPull,
    sideRecoveryRate: expectedGrossCost > 0 ? expectedSideValue / expectedGrossCost : 0,
    netCostPerPull,
    forbiddenWeaponReference: sideDrops.find(drop => drop.reference === 'forbiddenWeapon')?.unitScore || 0,
    lightWeaponReference: sideDrops.find(drop => drop.reference === 'lightWeapon')?.unitScore || 0,
    sideProbabilityCheck,
    totalSideRate,
    pricedSideRate,
    unpricedSideRate,
    expectedPulls,
    expectedGrossCost,
    expectedDiamondPrize,
    expectedSideValue,
    expectedNetCost,
    sideAtCeiling: buildSideSummaryAtPulls(config.maxPulls),
    getSideSummaryAtPulls: buildSideSummaryAtPulls,
    quantiles: {
      p50: quantilePull(0.5),
      p80: quantilePull(0.8),
      p90: quantilePull(0.9),
      p95: quantilePull(0.95),
      p100: config.maxPulls,
    },
    diamondPrizeChanceAtCeiling: config.diamondPrizeRate
      ? calcAtLeastOne(config.diamondPrizeRate, config.maxPulls)
      : 0,
    permanentChanceAtCeiling: config.permanentRate
      ? calcAtLeastOne(config.permanentRate, config.maxPulls)
      : 0,
    permanentChanceAtInvitation: config.permanentRate && config.invitationPulls
      ? calcAtLeastOne(config.permanentRate, config.invitationPulls)
      : 0,
  }
}
