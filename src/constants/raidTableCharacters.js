export { RAID_ELEMENTS, RAID_STATUS_CLASSES } from './raid/shared.js'
export { RAID_TABLE_CHARACTER_IDS, RAID_TABLE_CHARACTERS, RAID_TABLE_ROSTER } from './raid/characters/index.js'

import { RAID_TABLE_CHARACTER_IDS, RAID_TABLE_CHARACTERS, RAID_TABLE_ROSTER } from './raid/characters/index.js'

export const DEFAULT_RAID_LINEUP = Object.freeze(RAID_TABLE_ROSTER.slice(0, 5))
export const DEFAULT_RAID_ATTACK_PRIORITY = Object.freeze([
  RAID_TABLE_CHARACTER_IDS.FLORENCE,
  RAID_TABLE_CHARACTER_IDS.FENRIR,
  RAID_TABLE_CHARACTER_IDS.LUKE,
  RAID_TABLE_CHARACTER_IDS.MERLYN,
  RAID_TABLE_CHARACTER_IDS.MERTILLIER,
])

export function createDefaultRaidTableConfig() {
  return {
    lineup: [...DEFAULT_RAID_LINEUP],
    attackPriority: [...DEFAULT_RAID_ATTACK_PRIORITY],
    speeds: Object.fromEntries(RAID_TABLE_ROSTER.map(id => [id, RAID_TABLE_CHARACTERS[id].speed])),
    guaranteedCritical: true,
    baseCriticalDamageBonus: 1.1,
    probabilityOverrides: { liberiaSand: true, shizuSpeedDown: true },
    turns: 10,
  }
}
