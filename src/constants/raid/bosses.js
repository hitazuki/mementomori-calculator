import { RAID_ELEMENTS } from './shared.js'

export const RAID_BOSS_TEMPLATE_IDS = Object.freeze({
  SONYA: 'sonya',
  LUKE: 'luke',
  GOLDEN_ARTORIA: 'golden-artoria',
})

export const RAID_BOSS_TEMPLATES = Object.freeze({
  [RAID_BOSS_TEMPLATE_IDS.GOLDEN_ARTORIA]: Object.freeze({
    id: RAID_BOSS_TEMPLATE_IDS.GOLDEN_ARTORIA, masterId: 17, nameKey: 'raidBossGoldenArtoria',
    element: RAID_ELEMENTS.GREEN, level: 240,
    defense: 20, physicalDefense: 500_000, magicDefense: 500_000,
    defenseRate: 0, physicalDefenseRate: 0, magicDefenseRate: 0,
    damageReductionRate: 0.6,
  }),
  [RAID_BOSS_TEMPLATE_IDS.SONYA]: Object.freeze({
    id: RAID_BOSS_TEMPLATE_IDS.SONYA,
    masterId: 1,
    nameKey: 'raidBossSonya',
    element: RAID_ELEMENTS.BLUE,
    level: 240,
    defense: 200_000,
    physicalDefense: 500_000,
    magicDefense: 500_000,
    defenseRate: 0,
    physicalDefenseRate: 0,
    magicDefenseRate: 0,
  }),
  [RAID_BOSS_TEMPLATE_IDS.LUKE]: Object.freeze({
    id: RAID_BOSS_TEMPLATE_IDS.LUKE,
    masterId: 2,
    nameKey: 'raidBossLuke',
    element: RAID_ELEMENTS.GREEN,
    level: 240,
    defense: 300_000,
    physicalDefense: 600_000,
    magicDefense: 600_000,
    defenseRate: 0,
    physicalDefenseRate: 0,
    magicDefenseRate: 0,
  }),
})
