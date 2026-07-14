import { RAID_ELEMENTS } from '../../constants/raid/shared.js'

const NORMAL_ELEMENT_TIERS = Object.freeze({
  0: Object.freeze({ phase: 0, hpRate: 0, attackRate: 0 }),
  1: Object.freeze({ phase: 1, hpRate: 0.10, attackRate: 0.10 }),
  2: Object.freeze({ phase: 2, hpRate: 0.15, attackRate: 0.15 }),
  3: Object.freeze({ phase: 3, hpRate: 0.20, attackRate: 0.15 }),
  4: Object.freeze({ phase: 4, hpRate: 0.25, attackRate: 0.25 }),
})

const NORMAL_ELEMENTS = Object.freeze([
  RAID_ELEMENTS.BLUE,
  RAID_ELEMENTS.RED,
  RAID_ELEMENTS.GREEN,
  RAID_ELEMENTS.YELLOW,
])

function normalPhase(counts) {
  const ordered = [...counts].sort((left, right) => right - left)
  if (ordered[0] >= 5) return 4
  if (ordered[0] >= 4) return 3
  if (ordered[0] >= 3 && ordered[1] >= 2) return 2
  if (ordered[0] >= 3) return 1
  return 0
}

function bestNormalPhase(elements) {
  const counts = NORMAL_ELEMENTS.map(element => elements.filter(value => value === element).length)
  const lightCount = elements.filter(element => element === RAID_ELEMENTS.LIGHT).length
  let best = normalPhase(counts)

  function assignLight(index) {
    if (index >= lightCount) {
      best = Math.max(best, normalPhase(counts))
      return
    }
    for (let elementIndex = 0; elementIndex < counts.length; elementIndex += 1) {
      counts[elementIndex] += 1
      assignLight(index + 1)
      counts[elementIndex] -= 1
    }
  }

  assignLight(0)
  return best
}

export function calculateRaidElementBonus(lineup, characters) {
  const elements = lineup.map(id => characters[id].element)
  const normal = NORMAL_ELEMENT_TIERS[bestNormalPhase(elements)]
  const darkCount = elements.filter(element => element === RAID_ELEMENTS.DARK).length

  return {
    normal: { ...normal },
    dark: {
      count: darkCount,
      defenseRate: darkCount >= 1 ? 0.25 : 0,
      hpDrainRate: darkCount >= 2 ? 0.05 : 0,
      defensePenetration: darkCount >= 3 ? 1_000 : 0,
      damageReflectRate: darkCount >= 4 ? 0.10 : 0,
      criticalDamageBonus: darkCount >= 5 ? 0.30 : 0,
    },
  }
}
