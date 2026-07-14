export { RAID_ELEMENTS, RAID_JOB_FLAGS, RAID_MODIFIER_CHANNELS, RAID_STATUS_CLASSES } from './raid/shared.js'
export { RAID_BOSS_TEMPLATE_IDS, RAID_BOSS_TEMPLATES } from './raid/bosses.js'
export { RAID_TABLE_CHARACTER_IDS, RAID_TABLE_CHARACTER_JOB_FLAGS, RAID_TABLE_CHARACTERS, RAID_TABLE_ROSTER } from './raid/characters/index.js'

import { RAID_TABLE_CHARACTER_IDS, RAID_TABLE_CHARACTERS, RAID_TABLE_ROSTER } from './raid/characters/index.js'
import { RAID_BOSS_TEMPLATE_IDS } from './raid/bosses.js'

export const DEFAULT_RAID_CHARACTER_LEVEL = 500
export const DEFAULT_RAID_DEFENSE_PENETRATION = 11_950
export const DEFAULT_RAID_PM_DEFENSE_PENETRATION = 65_700
export const DEFAULT_RAID_CRITICAL_DAMAGE_BONUS = 1.1

export const RAID_EXCLUSIVE_WEAPON_PANEL_BONUSES = Object.freeze({
  [RAID_TABLE_CHARACTER_IDS.FLORENCE]: Object.freeze({ pmDefensePenetration: 7_000 }),
  [RAID_TABLE_CHARACTER_IDS.LIBERIA]: Object.freeze({ pmDefensePenetration: 7_000 }),
  [RAID_TABLE_CHARACTER_IDS.CORDIE]: Object.freeze({ criticalDamageBonus: 0.35 }),
  [RAID_TABLE_CHARACTER_IDS.FLOWER_NATASHA]: Object.freeze({ defensePenetration: 7_000, pmDefensePenetration: 7_000 }),
  [RAID_TABLE_CHARACTER_IDS.CANDY_CERBERUS]: Object.freeze({ defensePenetration: 7_000 }),
  [RAID_TABLE_CHARACTER_IDS.WITCH_ILLYA]: Object.freeze({ defensePenetration: 7_000, criticalDamageBonus: 0.35 }),
  [RAID_TABLE_CHARACTER_IDS.ARMSTRONG]: Object.freeze({ criticalDamageBonus: 0.35 }),
  [RAID_TABLE_CHARACTER_IDS.AA]: Object.freeze({ criticalDamageBonus: 0.35 }),
})

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
    bossTemplateId: RAID_BOSS_TEMPLATE_IDS.SONYA,
    levels: Object.fromEntries(RAID_TABLE_ROSTER.map(id => [id, DEFAULT_RAID_CHARACTER_LEVEL])),
    defensePenetrations: Object.fromEntries(RAID_TABLE_ROSTER.map(id => [id, DEFAULT_RAID_DEFENSE_PENETRATION + (RAID_EXCLUSIVE_WEAPON_PANEL_BONUSES[id]?.defensePenetration ?? 0)])),
    pmDefensePenetrations: Object.fromEntries(RAID_TABLE_ROSTER.map(id => [id, DEFAULT_RAID_PM_DEFENSE_PENETRATION + (RAID_EXCLUSIVE_WEAPON_PANEL_BONUSES[id]?.pmDefensePenetration ?? 0)])),
    criticalDamageBonuses: Object.fromEntries(RAID_TABLE_ROSTER.map(id => [id, DEFAULT_RAID_CRITICAL_DAMAGE_BONUS + (RAID_EXCLUSIVE_WEAPON_PANEL_BONUSES[id]?.criticalDamageBonus ?? 0)])),
    guaranteedCritical: true,
    baseCriticalDamageBonus: DEFAULT_RAID_CRITICAL_DAMAGE_BONUS,
    probabilityOverrides: {
      liberiaSand: true, shizuSpeedDown: true, guinevereDamageTaken: true,
      millaDelay: true, yildizBuffBlock: true, winterStellaSilence: true,
      lilicotteSilence: true, liebesStun: true, artoriaStun: true,
      carolSilence: true, morganaHealingDown: true, mowanoDelay: true,
      paladiaCriticalResistDown: true,
    },
    activationRounds: {
      candyCerberusKindMagic: 2,
      witchIllyaCurseUnleashed: 2,
    },
    turns: 10,
  }
}
