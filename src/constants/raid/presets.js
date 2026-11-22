import { RAID_TABLE_CHARACTER_IDS } from './characters/index.js'
import { RAID_BOSS_TEMPLATE_IDS } from './bosses.js'
import { createDefaultRaidTableConfig } from '../raidTableCharacters.js'

const { WITCH_ILLYA, MERLYN, LUKE, SUPERBIA_ELFRIEDE, MERTILLIER, RUSTICA, POPRI, SHILOH } = RAID_TABLE_CHARACTER_IDS
const { FLORENCE, POLA, FENRIR, TWILIGHT_FLORENCE, YILDIZ } = RAID_TABLE_CHARACTER_IDS
const { AISHE, ARTORIA, HOLY_LANCE_ALEXANDRA, GUINEVERE, LIEBES } = RAID_TABLE_CHARACTER_IDS

const florenceLineup = [FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER]
const aisheLineup = [AISHE, ARTORIA, HOLY_LANCE_ALEXANDRA, GUINEVERE, LIEBES]

export const DEFAULT_RAID_PRESET = {
  nameKey: 'raidCharFlorence',
  mainAttackerId: FLORENCE,
  lineup: florenceLineup,
  attackPriority: florenceLineup,
  speeds: { [FLORENCE]: 3022, [FENRIR]: 2894, [LUKE]: 3793, [MERLYN]: 3888, [MERTILLIER]: 3096 },
  actionOrderOverrides: { 6: [MERLYN, LUKE, FLORENCE, MERTILLIER, FENRIR] },
}

export const RAID_PRESETS = [
  DEFAULT_RAID_PRESET,
  {
    mainAttackerId: WITCH_ILLYA,
    lineup: [WITCH_ILLYA, MERLYN, LUKE, SUPERBIA_ELFRIEDE, MERTILLIER],
    attackPriority: [WITCH_ILLYA, SUPERBIA_ELFRIEDE, LUKE, MERLYN, MERTILLIER],
    speeds: { [LUKE]: 4093, [MERLYN]: 3888 },
  },
  {
    mainAttackerId: POPRI,
    lineup: [RUSTICA, MERLYN, LUKE, POPRI, SHILOH],
    attackPriority: [POPRI, RUSTICA, MERLYN, LUKE, SHILOH],
    speeds: { [LUKE]: 4093, [MERLYN]: 3888 },
  },
  {
    mainAttackerId: TWILIGHT_FLORENCE,
    lineup: [POLA, FENRIR, TWILIGHT_FLORENCE, LUKE, YILDIZ],
    attackPriority: [TWILIGHT_FLORENCE, POLA, LUKE, FENRIR, YILDIZ],
    speeds: { [POLA]: 2956, [FENRIR]: 3894, [TWILIGHT_FLORENCE]: 3877, [LUKE]: 4093, [YILDIZ]: 3946 },
    actionOrderOverrides: { 5: [LUKE, YILDIZ, TWILIGHT_FLORENCE, FENRIR, POLA] },
  },
  {
    mainAttackerId: AISHE,
    lineup: aisheLineup,
    attackPriority: aisheLineup,
    speeds: { [AISHE]: 3424, [ARTORIA]: 3572, [HOLY_LANCE_ALEXANDRA]: 3514, [GUINEVERE]: 3591, [LIEBES]: 4692 },
  },
]

export function createRaidPresetConfig(preset) {
  const config = createDefaultRaidTableConfig()
  config.bossTemplateId = RAID_BOSS_TEMPLATE_IDS.SONYA
  config.lineup = [...preset.lineup]
  config.attackPriority = [...preset.attackPriority]
  Object.assign(config.speeds, preset.speeds)
  if (preset.actionOrderOverrides) config.actionOrderOverrides = structuredClone(preset.actionOrderOverrides)
  return config
}
