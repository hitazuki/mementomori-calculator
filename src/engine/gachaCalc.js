export const GACHA_TYPES = {
  lightDark: {
    key: 'lightDark',
    label: '光暗限定',
  },
  fourElements: {
    key: 'fourElements',
    label: '四属限定',
  },
}

export const GACHA_BANNERS = {
  destiny: {
    key: 'destiny',
    label: '命运召唤',
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
  },
  pickup: {
    key: 'pickup',
    label: 'pick-up 召唤',
    costPerPull: 300,
    maxPulls: 100,
    baseRates: {
      lightDark: 0.0126,
      fourElements: 0.0137,
    },
    hardPityAt: 100,
    permanentRate: 0.0014,
    invitationPulls: 300,
    note: '第 100 抽指定限定概率升至 100%；300 抽赠送魔女的邀请函。',
  },
}

export function getGachaConfig(bannerKey, typeKey) {
  const banner = GACHA_BANNERS[bannerKey] || GACHA_BANNERS.destiny
  const characterType = GACHA_TYPES[typeKey] || GACHA_TYPES.lightDark
  return {
    ...banner,
    bannerLabel: banner.label,
    typeLabel: characterType.label,
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

export function buildGachaAnalysis(bannerKey, typeKey) {
  const config = getGachaConfig(bannerKey, typeKey)
  let survival = 1

  const pulls = Array.from({ length: config.maxPulls }, (_, index) => {
    const pull = index + 1
    const conditionalRate = getConditionalLimitedRate(config, pull)
    const firstHitRate = survival * conditionalRate
    const cumulativeRate = 1 - survival * (1 - conditionalRate)
    survival *= (1 - conditionalRate)

    return {
      pull,
      diamonds: pull * config.costPerPull,
      conditionalRate,
      firstHitRate,
      cumulativeRate,
    }
  })

  const expectedPulls = pulls.reduce((sum, row) => sum + row.pull * row.firstHitRate, 0)
  const expectedGrossCost = expectedPulls * config.costPerPull
  const expectedDiamondPrize = config.diamondPrizeRate
    ? expectedPulls * config.diamondPrizeRate * config.diamondPrizeAmount
    : 0
  const expectedNetCost = expectedGrossCost - expectedDiamondPrize

  const quantilePull = (rate) => pulls.find(row => row.cumulativeRate >= rate)?.pull || config.maxPulls

  return {
    config,
    pulls,
    expectedPulls,
    expectedGrossCost,
    expectedDiamondPrize,
    expectedNetCost,
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
