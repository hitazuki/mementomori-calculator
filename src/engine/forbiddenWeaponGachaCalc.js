export const FORBIDDEN_WEAPON_GACHA = {
  costItem: { itype: 16, iid: 7, fallbackValue: 300, label: '禁忌武具召唤券' },
  originalDiamondCost: 300,
  maxPulls: 100,
  coreDrops: [
    { key: 'scroll', label: '亚斯塔禄的卷轴', rate: 0.12, qty: 1 },
    { key: 'grimoire', label: '亚斯塔禄的魔书', rate: 0.12, qty: 1 },
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
      { key: 'scroll', label: '亚斯塔禄的卷轴', qty: 1 },
      { key: 'grimoire', label: '亚斯塔禄的魔书', qty: 1 },
    ],
  },
}

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
  const config = FORBIDDEN_WEAPON_GACHA
  const maxPulls = options.maxPulls || config.maxPulls
  const selectedPulls = Math.max(1, Math.min(maxPulls, Number(options.selectedPulls) || 20))
  const ticketValue = getUnitScore(
    scores,
    config.costItem.itype,
    config.costItem.iid,
    config.costItem.fallbackValue
  ) || config.costItem.fallbackValue

  const sideDrops = config.sideDrops.map(drop => {
    const unitScore = getUnitScore(scores, drop.itype, drop.iid)
    const scoreMeta = getScoreMeta(scores, drop.itype, drop.iid)
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

  const buildAtPulls = (pulls) => {
    const totalCost = pulls * ticketValue
    const originalDiamondCost = pulls * config.originalDiamondCost
    const sideValue = pulls * sideValuePerPull
    const coreCounts = Object.fromEntries(config.coreDrops.map(drop => [
      drop.key,
      pulls * drop.rate * drop.qty,
    ]))

    const milestoneRewards = getForbiddenMilestoneRewards(pulls, config)
    for (const reward of milestoneRewards) {
      coreCounts[reward.key] = (coreCounts[reward.key] || 0) + reward.qty
    }

    const totalCoreCount = Object.values(coreCounts).reduce((sum, qty) => sum + qty, 0)
    const coreBudget = Math.max(0, totalCost - sideValue)
    const rawCoreBudget = totalCost - sideValue
    const implicitCoreUnit = totalCoreCount > 0 ? coreBudget / totalCoreCount : 0

    return {
      pulls,
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
      sideQuantities: Object.fromEntries(sideDrops.map(drop => [
        drop.key,
        pulls * drop.expectedQtyPerPull,
      ])),
      sideValues: Object.fromEntries(sideDrops.map(drop => [
        drop.key,
        pulls * drop.expectedValuePerPull,
      ])),
    }
  }

  const rows = Array.from({ length: maxPulls }, (_, index) => buildAtPulls(index + 1))
  const selected = buildAtPulls(selectedPulls)
  const bestNode = rows.reduce(
    (best, row) => row.implicitCoreUnit < best.implicitCoreUnit ? row : best,
    rows[0]
  )

  const comparePulls = [...new Set([10, 20, selectedPulls].filter(pull => pull >= 1 && pull <= maxPulls))]
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
  }
}
