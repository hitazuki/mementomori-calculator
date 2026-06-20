import { getScore } from './packCalc.js'

export const WEAPON_GACHA_CONFIGS = {
  forbidden: {
    key: 'forbidden',
    label: '禁忌武具召唤',
    labelKey: 'weaponGachaForbidden',
    shortLabel: '禁忌武具',
    shortLabelKey: 'weaponGachaForbiddenShort',
    costItem: { itype: 16, iid: 7, fallbackValue: 300, label: '禁忌武具召唤券', nameKey: 'itemTicketForbiddenWeapon' },
    originalDiamondCost: 300,
    maxPulls: 100,
    coreDrops: [
      { key: 'scroll', label: '亚斯塔禄的卷轴', nameKey: 'itemAstarothScroll', iconId: 63, rate: 0.12, qty: 1 },
      { key: 'grimoire', label: '亚斯塔禄的魔书', nameKey: 'itemAstarothTome', iconId: 64, rate: 0.12, qty: 1 },
    ],
    sideDrops: [
      { key: 'boss1', label: '首领挑战券 x1', rate: 0.06, qty: 1, itype: 19, iid: 1 },
      { key: 'water', label: '强化水 x200', rate: 0.20, qty: 200, itype: 12, iid: 1 },
      { key: 'rune', label: '符石兑换券 x20', rate: 0.25, qty: 20, itype: 13, iid: 4 },
      { key: 'boss3', label: '首领挑战券 x3', rate: 0.25, qty: 3, itype: 19, iid: 1 },
    ],
    milestone: {
      interval: 10,
      rotation: [
        { key: 'scroll', label: '亚斯塔禄的卷轴', nameKey: 'itemAstarothScroll', iconId: 63, qty: 1 },
        { key: 'grimoire', label: '亚斯塔禄的魔书', nameKey: 'itemAstarothTome', iconId: 64, qty: 1 },
      ],
    },
  },
  light: {
    key: 'light',
    label: '天光武具召唤',
    labelKey: 'weaponGachaLight',
    shortLabel: '天光武具',
    shortLabelKey: 'weaponGachaLightShort',
    costItem: { itype: 16, iid: 6, fallbackValue: 60, label: '天光武具召唤券', nameKey: 'itemTicketLightWeapon' },
    originalDiamondCost: 60,
    maxPulls: 100,
    coreDrops: [
      { key: 'scroll', label: '圣德芬的卷轴', nameKey: 'itemSandalphonScroll', iconId: 61, rate: 0.12, qty: 1 },
      { key: 'grimoire', label: '圣德芬的魔书', nameKey: 'itemSandalphonTome', iconId: 62, rate: 0.12, qty: 1 },
    ],
    sideDrops: [
      { key: 'boss1', label: '首领挑战券 x1', rate: 0.06, qty: 1, itype: 19, iid: 1 },
      { key: 'water', label: '强化水 x40', rate: 0.20, qty: 40, itype: 12, iid: 1 },
      { key: 'rune', label: '符石兑换券 x4', rate: 0.25, qty: 4, itype: 13, iid: 4 },
      { key: 'boss3', label: '首领挑战券 x3', rate: 0.25, qty: 3, itype: 19, iid: 1 },
    ],
    milestone: {
      interval: 10,
      rotation: [
        { key: 'scroll', label: '圣德芬的卷轴', nameKey: 'itemSandalphonScroll', iconId: 61, qty: 1 },
        { key: 'grimoire', label: '圣德芬的魔书', nameKey: 'itemSandalphonTome', iconId: 62, qty: 1 },
      ],
    },
  },
  witchSecret: {
    key: 'witchSecret',
    label: '魔女的奥秘召唤',
    labelKey: 'weaponGachaWitchSecret',
    shortLabel: '魔女奥秘',
    shortLabelKey: 'weaponGachaWitchSecretShort',
    costItem: { itype: 16, iid: 12, fallbackValue: 300, label: '魔女的奥秘召唤券', nameKey: 'itemTicketWitchSecret' },
    originalDiamondCost: 300,
    maxPulls: 70,
    freePullsPerPeriod: 7,
    weeklyCap: 35,
    coreUnitLabel: '魔水晶',
    coreUnitLabelKey: 'itemMagicCrystal',
    implicitUnitLabel: '魔水晶推算价值',
    implicitUnitLabelKey: 'weaponGachaMagicCrystalValue',
    coreDrops: [
      { key: 'magicCrystal', label: '随机魔水晶', labelKey: 'weaponGachaRandomMagicCrystal', rate: 0.12, qty: 1 },
      { key: 'tenPullGuarantee', label: '10抽保证折算', labelKey: 'weaponGachaTenPullGuarantee', perPullQty: 1 },
    ],
    sideDrops: [
      { key: 'perfume', label: '魔装香油 x1', rate: 0.20, qty: 1, itype: 15, iid: 1 },
      { key: 'grandPerfume', label: '魔装高级香油 x1', rate: 0.08, qty: 1, itype: 15, iid: 2 },
      { key: 'tower3', label: '无穷之塔挑战券 x3', rate: 0.17, qty: 3, itype: 20, iid: 1 },
      { key: 'boss3', label: '首领挑战券 x3', rate: 0.20, qty: 3, itype: 19, iid: 1 },
      { key: 'rune15', label: '符石兑换券 x15', rate: 0.18, qty: 15, itype: 13, iid: 4 },
      { key: 'rune9', label: '符石兑换券 x9', rate: 0.09, qty: 9, itype: 13, iid: 4 },
    ],
    weeklyMilestones: [
      { pull: 4, key: 'weeklyBonus', label: '第4次周奖励', labelKey: 'weaponGachaWeeklyBonusAt', qty: 2 },
      { pull: 15, key: 'weeklyBonus', label: '第15次周奖励', labelKey: 'weaponGachaWeeklyBonusAt', qty: 2 },
      { pull: 25, key: 'weeklyBonus', label: '第25次周奖励', labelKey: 'weaponGachaWeeklyBonusAt', qty: 3 },
      { pull: 35, key: 'weeklyBonus', label: '第35次周奖励', labelKey: 'weaponGachaWeeklyBonusAt', qty: 3 },
    ],
  },
  seraphOracle: {
    key: 'seraphOracle',
    label: '圣天使的神谕召唤',
    labelKey: 'weaponGachaSeraphOracle',
    shortLabel: '圣天使神谕',
    shortLabelKey: 'weaponGachaSeraphOracleShort',
    costItem: { itype: 16, iid: 1, fallbackValue: 300, label: '圣天使的神谕召唤券', nameKey: 'itemTicketSeraphOracle' },
    originalDiamondCost: 300,
    maxPulls: 150,
    freePullsPerPeriod: 7,
    coreUnitLabel: '圣遗物',
    coreUnitLabelKey: 'itemRelic',
    implicitUnitLabel: '圣遗物推算价值',
    implicitUnitLabelKey: 'weaponGachaRelicValue',
    summaryCoreLabelKey: 'weaponGachaExpectedRelic',
    summaryMode: 'expectedCore',
    coreDrops: [
      { key: 'relic', label: '圣遗物', labelKey: 'itemRelic', rate: 0, qty: 1 },
    ],
    sideDrops: [
      { key: 'water', label: '强化水 x200', rate: 0.20, qty: 200, itype: 12, iid: 1 },
      { key: 'panacea', label: '强化秘药 x3', rate: 0.10, qty: 3, itype: 12, iid: 2 },
      { key: 'boss3', label: '首领挑战券 x3', rate: 0.15, qty: 3, itype: 19, iid: 1 },
      { key: 'tower1', label: '无穷之塔挑战券 x1', rate: 0.15, qty: 1, itype: 20, iid: 1 },
      { key: 'rune20', label: '符石兑换券 x20', rate: 0.15, qty: 20, itype: 13, iid: 4 },
      { key: 'grandPerfume', label: '魔装高级香油 x1', rate: 0.10, qty: 1, itype: 15, iid: 2 },
      { key: 'perfume', label: '魔装香油 x1', rate: 0.15, qty: 1, itype: 15, iid: 1 },
    ],
    milestone: {
      cycle: 50,
      rewards: [
        { pull: 10, key: 'relic', label: '圣遗物', labelKey: 'itemRelic', rate: 0.20, qty: 1, core: true },
        { pull: 10, key: 'holySteel1000', label: '圣装钢 x1000', rate: 1, qty: 1000, itype: 13, iid: 3 },
        { pull: 10, key: 'magicCrystal2', label: '魔水晶 x2', rate: 1, qty: 2, itype: 13, iid: 1 },
        { pull: 25, key: 'relic', label: '圣遗物', labelKey: 'itemRelic', rate: 0.40, qty: 1, core: true },
        { pull: 25, key: 'holySteel1500', label: '圣装钢 x1500', rate: 1, qty: 1500, itype: 13, iid: 3 },
        { pull: 25, key: 'magicCrystal3', label: '魔水晶 x3', rate: 1, qty: 3, itype: 13, iid: 1 },
        { pull: 50, key: 'relic', label: '圣遗物', labelKey: 'itemRelic', rate: 1, qty: 1, core: true },
        { pull: 50, key: 'holySteel2500', label: '圣装钢 x2500', rate: 1, qty: 2500, itype: 13, iid: 3 },
        { pull: 50, key: 'magicCrystal5', label: '魔水晶 x5', rate: 1, qty: 5, itype: 13, iid: 1 },
      ],
    },
  },
}

export const FORBIDDEN_WEAPON_GACHA = WEAPON_GACHA_CONFIGS.forbidden

function scoreKey(itype, iid) {
  return `[${itype},${iid}]`
}

export function getUnitScore(scores, itype, iid, fallback = 0) {
  const entry = scores?.[scoreKey(itype, iid)]
  if (!entry) return fallback
  return (Number(entry.score) || 0) / (Number(entry.batch) || 1)
}

function getScoreMeta(scores, itype, iid) {
  const entry = scores?.[scoreKey(itype, iid)] || {}
  return {
    score: Number(entry.score) || 0,
    batch: Number(entry.batch) || 1,
  }
}

export function getForbiddenMilestoneRewards(pulls, config = FORBIDDEN_WEAPON_GACHA) {
  if (config.weeklyMilestones?.length) {
    const eligiblePulls = Math.min(pulls, config.weeklyCap || pulls)
    return config.weeklyMilestones
      .filter(reward => reward.pull <= eligiblePulls)
      .map(reward => ({
        ...reward,
        label: `${reward.label} ${config.coreUnitLabel || reward.key} x${reward.qty}`,
      }))
  }

  if (config.milestone?.rewards?.length) {
    const cycle = config.milestone.cycle || config.milestone.interval || pulls
    const rewards = []
    for (let cycleStart = 0; cycleStart < pulls; cycleStart += cycle) {
      const cycleIndex = Math.floor(cycleStart / cycle) + 1
      for (const reward of config.milestone.rewards) {
        const pull = cycleStart + reward.pull
        if (pull > pulls) continue
        rewards.push({
          ...reward,
          cycle,
          cycleIndex,
          pull,
          expectedQty: (reward.qty || 0) * (reward.rate ?? 1),
          label: `第${pull}次 ${reward.label} x${reward.qty}`,
        })
      }
    }
    return rewards
  }

  if (!config.milestone?.interval) return []

  const count = Math.floor(pulls / config.milestone.interval)
  return Array.from({ length: count }, (_, index) => {
    const milestoneIndex = index + 1
    const reward = config.milestone.rotation[index % config.milestone.rotation.length]
    const pull = milestoneIndex * config.milestone.interval
    return {
      ...reward,
      pull,
      label: `第${pull}次 ${reward.label} x${reward.qty}`,
    }
  })
}

export function buildForbiddenWeaponGachaAnalysis(scores, options = {}) {
  const config = WEAPON_GACHA_CONFIGS[options.bannerKey] || FORBIDDEN_WEAPON_GACHA
  const maxPulls = options.maxPulls || config.maxPulls
  const selectedPulls = Math.max(1, Math.min(maxPulls, Number(options.selectedPulls) || 20))
  const ticketValue = getUnitScore(
    scores,
    config.costItem.itype,
    config.costItem.iid,
    config.costItem.fallbackValue
  ) || config.costItem.fallbackValue

  const sideDrops = config.sideDrops.map(drop => {
    const unitScore = getScore(scores, drop.itype, drop.iid) || getUnitScore(scores, drop.itype, drop.iid)
    const rawScoreMeta = getScoreMeta(scores, drop.itype, drop.iid)
    const scoreMeta = rawScoreMeta.score > 0
      ? rawScoreMeta
      : { score: unitScore, batch: 1 }
    const expectedQtyPerPull = drop.rate * drop.qty
    const expectedValuePerPull = expectedQtyPerPull * unitScore
    return {
      ...drop,
      unitScore,
      scoreMeta,
      expectedQtyPerPull,
      expectedValuePerPull,
    }
  })

  const sideValuePerPull = sideDrops.reduce((sum, drop) => sum + drop.expectedValuePerPull, 0)

  const buildAtPulls = (pulls, overrides = {}) => {
    const availableFreePulls = overrides.freePullsPerPeriod ?? config.freePullsPerPeriod ?? 0
    const freePulls = Math.min(availableFreePulls, pulls)
    const paidPulls = Math.max(0, pulls - freePulls)
    const totalCost = paidPulls * ticketValue
    const originalDiamondCost = pulls * config.originalDiamondCost
    let sideValue = pulls * sideValuePerPull
    const coreCounts = Object.fromEntries(config.coreDrops.map(drop => [
      drop.key,
      pulls * ((drop.rate || 0) * (drop.qty || 0) + (drop.perPullQty || 0)),
    ]))
    const milestoneSideQuantities = {}
    const milestoneSideValues = {}

    const milestoneRewards = getForbiddenMilestoneRewards(pulls, config)
    for (const reward of milestoneRewards) {
      const expectedQty = reward.expectedQty ?? ((reward.qty || 0) * (reward.rate ?? 1))
      if (reward.core || (!reward.itype && !reward.iid)) {
        coreCounts[reward.key] = (coreCounts[reward.key] || 0) + expectedQty
        continue
      }

      const unitScore = getScore(scores, reward.itype, reward.iid) || getUnitScore(scores, reward.itype, reward.iid)
      const expectedValue = expectedQty * unitScore
      milestoneSideQuantities[reward.key] = (milestoneSideQuantities[reward.key] || 0) + expectedQty
      milestoneSideValues[reward.key] = (milestoneSideValues[reward.key] || 0) + expectedValue
      sideValue += expectedValue
    }

    const totalCoreCount = Object.values(coreCounts).reduce((sum, qty) => sum + qty, 0)
    const coreBudget = Math.max(0, totalCost - sideValue)
    const rawCoreBudget = totalCost - sideValue
    const implicitCoreUnit = totalCoreCount > 0 ? coreBudget / totalCoreCount : 0

    return {
      pulls,
      paidPulls,
      freePulls,
      totalCost,
      originalDiamondCost,
      sideValue,
      sideRecoveryRate: totalCost > 0 ? sideValue / totalCost : 0,
      coreBudget,
      rawCoreBudget,
      implicitCoreUnit,
      coreCounts,
      milestoneRewards,
      totalCoreCount,
      sideQuantities: {
        ...Object.fromEntries(sideDrops.map(drop => [
          drop.key,
          pulls * drop.expectedQtyPerPull,
        ])),
        ...milestoneSideQuantities,
      },
      sideValues: {
        ...Object.fromEntries(sideDrops.map(drop => [
          drop.key,
          pulls * drop.expectedValuePerPull,
        ])),
        ...milestoneSideValues,
      },
    }
  }

  const rows = Array.from({ length: maxPulls }, (_, index) => buildAtPulls(index + 1))
  const selected = buildAtPulls(selectedPulls)
  const bestNode = rows.reduce(
    (best, row) => row.implicitCoreUnit < best.implicitCoreUnit ? row : best,
    rows[0]
  )

  const defaultComparePulls = config.key === 'witchSecret'
    ? [config.freePullsPerPeriod, 15, 25, config.weeklyCap, selectedPulls, (config.weeklyCap || 35) + 10]
    : config.milestone?.cycle
      ? [7, 10, 25, config.milestone.cycle, selectedPulls, config.milestone.cycle * 2, config.milestone.cycle * 3]
    : [10, 20, selectedPulls]
  const comparePulls = [...new Set(defaultComparePulls.filter(pull => pull >= 1 && pull <= maxPulls))]
    .sort((a, b) => a - b)

  return {
    config,
    ticketValue,
    sideDrops,
    sideValuePerPull,
    selectedPulls,
    selected,
    rows,
    compareRows: comparePulls.map(buildAtPulls),
    bestNode,
    weeklyFullNode: config.weeklyCap ? buildAtPulls(config.weeklyCap) : null,
    noFreeCycleNode: config.milestone?.cycle
      ? buildAtPulls(config.milestone.cycle, { freePullsPerPeriod: 0 })
      : null,
    noFreeCycleRows: config.milestone?.cycle
      ? Array.from({ length: config.milestone.cycle }, (_, index) => buildAtPulls(index + 1, { freePullsPerPeriod: 0 }))
      : [],
  }
}
