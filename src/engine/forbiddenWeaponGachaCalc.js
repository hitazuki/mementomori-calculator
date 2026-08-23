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
  const baselinePulls = config.key === 'seraphOracle' && options.ignoreFirstTopUp3
    ? 10
    : (config.freePullsPerPeriod || 0)
  const minimumSelectedPulls = config.key === 'seraphOracle' && options.ignoreFirstTopUp3 ? 11 : 1
  const requestedPulls = Math.trunc(Number(options.selectedPulls))
  const selectedPulls = Number.isFinite(requestedPulls) ? Math.max(minimumSelectedPulls, requestedPulls) : Math.max(minimumSelectedPulls, 20)
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

  const subtractFromBaseline = (pulls, comparisonBaselinePulls = 0, overrides = {}) => {
    const current = buildAtPulls(pulls, overrides)
    if (!comparisonBaselinePulls) return current

    const effectiveBaselinePulls = Math.min(pulls, comparisonBaselinePulls)
    const baseline = buildAtPulls(effectiveBaselinePulls, overrides)
    const coreCounts = Object.fromEntries(Object.keys(current.coreCounts).map(key => [
      key,
      (current.coreCounts[key] || 0) - (baseline.coreCounts[key] || 0),
    ]))
    const sideQuantities = Object.fromEntries(Object.keys(current.sideQuantities).map(key => [
      key,
      (current.sideQuantities[key] || 0) - (baseline.sideQuantities[key] || 0),
    ]))
    const sideValues = Object.fromEntries(Object.keys(current.sideValues).map(key => [
      key,
      (current.sideValues[key] || 0) - (baseline.sideValues[key] || 0),
    ]))
    const totalCost = current.totalCost - baseline.totalCost
    const sideValue = current.sideValue - baseline.sideValue
    const totalCoreCount = Object.values(coreCounts).reduce((sum, qty) => sum + qty, 0)
    const rawCoreBudget = totalCost - sideValue
    const coreBudget = Math.max(0, rawCoreBudget)

    return {
      ...current,
      paidPulls: current.paidPulls - baseline.paidPulls,
      freePulls: current.freePulls - baseline.freePulls,
      totalCost,
      originalDiamondCost: current.originalDiamondCost - baseline.originalDiamondCost,
      sideValue,
      sideRecoveryRate: totalCost > 0 ? sideValue / totalCost : 0,
      coreBudget,
      rawCoreBudget,
      implicitCoreUnit: totalCoreCount > 0 ? coreBudget / totalCoreCount : 0,
      coreCounts,
      milestoneRewards: current.milestoneRewards.filter(reward => reward.pull > effectiveBaselinePulls),
      totalCoreCount,
      sideQuantities,
      sideValues,
    }
  }

  const rows = Array.from(
    { length: Math.max(0, maxPulls - baselinePulls) },
    (_, index) => subtractFromBaseline(baselinePulls + index + 1, baselinePulls)
  )
  const cumulativeRows = Array.from({ length: maxPulls }, (_, index) => buildAtPulls(index + 1))
  const selected = subtractFromBaseline(selectedPulls, baselinePulls)
  const cumulativeSelected = buildAtPulls(selectedPulls)
  const decisionBaselinePulls = baselinePulls
  const decisionRows = rows
  const bestNode = rows.reduce(
    (best, row) => row.implicitCoreUnit < best.implicitCoreUnit ? row : best,
    rows[0]
  )

  return {
    config,
    ticketValue,
    sideDrops,
    sideValuePerPull,
    baselinePulls,
    selectedPulls,
    selected,
    cumulativeSelected,
    rows,
    cumulativeRows,
    decisionBaselinePulls,
    decisionRows,
    bestNode,
    weeklyFullNode: config.weeklyCap ? subtractFromBaseline(config.weeklyCap, baselinePulls) : null,
    noFreeCycleNode: config.milestone?.cycle
      ? buildAtPulls(config.milestone.cycle, { freePullsPerPeriod: 0 })
      : null,
    noFreeCycleRows: config.milestone?.cycle
      ? Array.from({ length: config.milestone.cycle }, (_, index) => buildAtPulls(index + 1, { freePullsPerPeriod: 0 }))
      : [],
  }
}

export function buildSeraphCrossWeekComparisonRows(analysis, pullCounts = [200, 400, 600, 800, 1000]) {
  if (analysis?.config?.key !== 'seraphOracle') return []

  const cycleRows = analysis.noFreeCycleRows || []
  const zero = {
    pulls: 0,
    paidPulls: 0,
    totalCost: 0,
    sideValue: 0,
    totalCoreCount: 0,
  }
  const rowAt = pulls => pulls <= 0
    ? zero
    : cycleRows.find(row => row.pulls === pulls) || zero
  const diff = (before, after) => ({
    paidPulls: after.paidPulls - before.paidPulls,
    totalCost: after.totalCost - before.totalCost,
    sideValue: after.sideValue - before.sideValue,
    expectedRelic: after.totalCoreCount - before.totalCoreCount,
  })
  const finalize = metrics => {
    const coreBudget = Math.max(0, metrics.totalCost - metrics.sideValue)
    return {
      ...metrics,
      coreBudget,
      implicitCoreUnit: metrics.expectedRelic > 0 ? coreBudget / metrics.expectedRelic : 0,
    }
  }
  const scale = (stage, count) => finalize({
    paidPulls: stage.paidPulls * count,
    totalCost: stage.totalCost * count,
    sideValue: stage.sideValue * count,
    expectedRelic: stage.expectedRelic * count,
  })
  const full50 = diff(rowAt(0), rowAt(50))
  const stage23 = diff(rowAt(10), rowAt(50))

  return pullCounts.map(requestedPulls => {
    const singleWeekStages = Math.floor(requestedPulls / 50)
    const splitWeekStages = Math.floor(requestedPulls / 40)
    const continuous = scale(full50, singleWeekStages)
    const splitWeeks = scale(stage23, splitWeekStages)
    const comparablePulls = Math.min(continuous.paidPulls, splitWeeks.paidPulls)
    const expectedRelicLoss = Math.max(0, splitWeeks.expectedRelic - continuous.expectedRelic)
    return {
      requestedPulls,
      comparablePulls,
      singleWeekStages,
      splitWeekStages,
      continuous,
      splitWeeks,
      expectedRelicLoss,
      expectedRelicLossRate: splitWeeks.expectedRelic > 0
        ? expectedRelicLoss / splitWeeks.expectedRelic
        : 0,
    }
  })
}

const logGamma = value => {
  const coefficients = [
    676.5203681218851, -1259.1392167224028, 771.3234287776531,
    -176.6150291621406, 12.507343278686905, -0.13857109526572012,
    9.984369578019572e-6, 1.5056327351493116e-7,
  ]
  if (value < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value)
  let adjusted = value - 1
  let sum = 0.9999999999998099
  coefficients.forEach((coefficient, index) => {
    sum += coefficient / (adjusted + index + 1)
  })
  const base = adjusted + coefficients.length - 0.5
  return 0.5 * Math.log(2 * Math.PI) + (adjusted + 0.5) * Math.log(base) - base + Math.log(sum)
}

const buildBinomialPmf = (trials, probability, quantity = 1) => {
  if (trials <= 0 || probability <= 0) return new Map([[0, 1]])
  if (probability >= 1) return new Map([[trials * quantity, 1]])
  const mean = trials * probability
  const deviation = Math.sqrt(trials * probability * (1 - probability))
  const lower = Math.max(0, Math.floor(mean - 8 * deviation - 2))
  const upper = Math.min(trials, Math.ceil(mean + 8 * deviation + 2))
  const result = new Map()
  for (let successes = lower; successes <= upper; successes += 1) {
    const logProbability = logGamma(trials + 1)
      - logGamma(successes + 1)
      - logGamma(trials - successes + 1)
      + successes * Math.log(probability)
      + (trials - successes) * Math.log(1 - probability)
    const chance = Math.exp(logProbability)
    if (chance >= 1e-12) result.set(successes * quantity, chance)
  }
  return result
}

const convolvePmfs = (left, right) => {
  const result = new Map()
  left.forEach((leftProbability, leftQuantity) => {
    right.forEach((rightProbability, rightQuantity) => {
      const quantity = leftQuantity + rightQuantity
      result.set(quantity, (result.get(quantity) || 0) + leftProbability * rightProbability)
    })
  })
  return result
}

const shiftPmf = (pmf, quantity) => new Map(
  [...pmf].map(([currentQuantity, probability]) => [currentQuantity + quantity, probability])
)

export function buildCoreProductProbabilityDistributions(analysis, options = {}) {
  const config = analysis?.config
  if (!config) return []
  const isWitchSecret = config.key === 'witchSecret'
  const isSeraphOracle = config.key === 'seraphOracle'
  const periodMode = options.periodMode || 'singleWeek'
  const decisionPulls = isSeraphOracle
    ? Math.max(0, analysis.selectedPulls - 10)
    : analysis.selected.paidPulls
  const repeatMilestones = (pulls, cycleLength, milestones) => {
    const rewards = []
    for (let cycleStart = 0; cycleStart < pulls; cycleStart += cycleLength) {
      milestones.forEach(milestone => {
        if (cycleStart + milestone.offset <= pulls) rewards.push(milestone)
      })
    }
    return rewards
  }
  const milestoneRewards = isWitchSecret && periodMode === 'weeklyRound'
    ? repeatMilestones(decisionPulls, 28, [
        { offset: 8, key: 'weeklyBonus', qty: 2, rate: 1 },
        { offset: 18, key: 'weeklyBonus', qty: 3, rate: 1 },
        { offset: 28, key: 'weeklyBonus', qty: 3, rate: 1 },
      ])
    : isSeraphOracle && periodMode === 'weeklyRound'
      ? repeatMilestones(decisionPulls, 40, [
          { offset: 15, key: 'relic', qty: 1, rate: 0.40 },
          { offset: 40, key: 'relic', qty: 1, rate: 1 },
        ])
      : isSeraphOracle
        ? (analysis.cumulativeSelected.milestoneRewards || [])
            .filter(reward => reward.core && reward.pull > 10)
        : (analysis.selected.milestoneRewards || [])
  const products = isWitchSecret
    ? [{
        key: 'magicCrystal',
        label: config.coreUnitLabel,
        labelKey: config.coreUnitLabelKey,
        sourceKeys: new Set(['magicCrystal', 'tenPullGuarantee', 'weeklyBonus']),
      }]
    : config.coreDrops.map(drop => ({
        key: drop.key,
        label: drop.label,
        labelKey: drop.nameKey || drop.labelKey,
        sourceKeys: new Set([drop.key]),
      }))

  return products.map(product => {
    let pmf = new Map([[0, 1]])
    let deterministicQuantity = 0
    const sources = config.coreDrops.filter(drop => product.sourceKeys.has(drop.key))
    sources.forEach(source => {
      if (source.rate > 0) {
        pmf = convolvePmfs(pmf, buildBinomialPmf(
          decisionPulls,
          source.rate,
          source.qty || 1
        ))
      }
      deterministicQuantity += decisionPulls * (source.perPullQty || 0)
    })
    ;milestoneRewards
      .filter(reward => product.sourceKeys.has(reward.key))
      .forEach(reward => {
        const quantity = reward.qty || 0
        const probability = reward.rate ?? 1
        if (probability >= 1) deterministicQuantity += quantity
        else pmf = convolvePmfs(pmf, new Map([[0, 1 - probability], [quantity, probability]]))
      })
    pmf = shiftPmf(pmf, deterministicQuantity)
    const points = [...pmf]
      .map(([quantity, probability]) => ({ quantity, probability }))
      .sort((left, right) => left.quantity - right.quantity)
    const expected = points.reduce((sum, point) => sum + point.quantity * point.probability, 0)
    const probabilityAtLeastOne = points
      .filter(point => point.quantity > 0)
      .reduce((sum, point) => sum + point.probability, 0)
    return {
      ...product,
      points,
      expected,
      probabilityAtLeastOne,
      decisionPulls,
    }
  })
}
