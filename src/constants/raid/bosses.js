export const RAID_BOSS_TEMPLATE_IDS = Object.freeze({
  SONYA: 'sonya',
  LUKE: 'luke',
})

export const RAID_BOSS_TEMPLATES = Object.freeze({
  [RAID_BOSS_TEMPLATE_IDS.SONYA]: Object.freeze({
    id: RAID_BOSS_TEMPLATE_IDS.SONYA,
    masterId: 1,
    nameKey: 'raidBossSonya',
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
    level: 240,
    defense: 300_000,
    physicalDefense: 600_000,
    magicDefense: 600_000,
    defenseRate: 0,
    physicalDefenseRate: 0,
    magicDefenseRate: 0,
  }),
})
