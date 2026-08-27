const GEAR_PROGRESSIONS = {
  light: {
    initialLevel: 180,
    initialParts: 45,
    exchangeParts: 15,
    exchangeProducts: 1,
    stages: [
      [200, 240, 20, 15],
      [250, 260, 10, 20],
      [270, 290, 10, 25],
      [300, 330, 10, 30],
      [340, 1000, 10, 40],
    ],
  },
  forbidden: {
    initialLevel: 180,
    initialParts: 75,
    exchangeParts: 15,
    exchangeProducts: 1,
    stages: [
      [200, 240, 20, 10],
      [250, 260, 10, 15],
      [270, 290, 10, 20],
      [300, 330, 10, 25],
      [340, 520, 10, 30],
      [530, 1000, 10, 40],
    ],
  },
  seraph: {
    initialLevel: 240,
    initialParts: 100,
    exchangeParts: 50,
    exchangeProducts: 2,
    stages: [
      [250, 260, 10, 15],
      [270, 290, 10, 20],
      [300, 330, 10, 25],
      [340, 520, 10, 30],
      [530, 1000, 10, 40],
    ],
  },
  unique: {
    initialLevel: 180,
    initialParts: 80,
    exchangeParts: 10,
    exchangeProducts: 1,
    stages: [
      [200, 200, 10, 50],
      [220, 220, 10, 65],
      [240, 240, 10, 80],
      [250, 270, 10, 15],
      [280, 300, 10, 20],
      [310, 330, 10, 30],
      [340, 1000, 10, 40],
    ],
  },
}

export const GEAR_CORE_MIN_LEVEL = 0
export const GEAR_CORE_MAX_LEVEL = 1000

export function normalizeGearLevel(level) {
  const numericLevel = Math.trunc(Number(level))
  if (!Number.isFinite(numericLevel)) return GEAR_CORE_MIN_LEVEL
  return Math.min(GEAR_CORE_MAX_LEVEL, Math.max(GEAR_CORE_MIN_LEVEL, numericLevel))
}

function countStageSteps(level, [start, end, step]) {
  if (level < start) return 0
  return Math.floor((Math.min(level, end) - start) / step) + 1
}

export function calculateGearParts(level, gearKey) {
  const normalizedLevel = normalizeGearLevel(level)
  const progression = GEAR_PROGRESSIONS[gearKey]
  if (!progression || normalizedLevel < progression.initialLevel) return 0

  return progression.stages.reduce(
    (total, stage) => total + countStageSteps(normalizedLevel, stage) * stage[3],
    progression.initialParts,
  )
}

export function calculateGearCoreProducts(level) {
  const normalizedLevel = normalizeGearLevel(level)
  return Object.entries(GEAR_PROGRESSIONS).map(([key, progression]) => {
    const parts = calculateGearParts(normalizedLevel, key)
    const exchanges = parts > 0 ? Math.ceil(parts / progression.exchangeParts) : 0
    return {
      key,
      parts,
      products: exchanges * progression.exchangeProducts,
      exchangeParts: progression.exchangeParts,
      exchangeProducts: progression.exchangeProducts,
    }
  })
}
