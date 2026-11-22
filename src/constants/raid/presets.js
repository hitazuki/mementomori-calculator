import { RAID_TABLE_CHARACTER_IDS } from './characters/index.js'
import { RAID_BOSS_TEMPLATE_IDS } from './bosses.js'
import { createDefaultRaidTableConfig } from '../raidTableCharacters.js'

const { WITCH_ILLYA, MERLYN, LUKE, SUPERBIA_ELFRIEDE, MERTILLIER, RUSTICA, POPRI, SHILOH } = RAID_TABLE_CHARACTER_IDS

export const RAID_PRESETS = [
  {
    mainAttackerId: WITCH_ILLYA,
    lineup: [WITCH_ILLYA, MERLYN, LUKE, SUPERBIA_ELFRIEDE, MERTILLIER],
    attackPriority: [WITCH_ILLYA, SUPERBIA_ELFRIEDE, LUKE, MERLYN, MERTILLIER],
  },
  {
    mainAttackerId: POPRI,
    lineup: [RUSTICA, MERLYN, LUKE, POPRI, SHILOH],
    attackPriority: [POPRI, RUSTICA, MERLYN, LUKE, SHILOH],
  },
]

export function createRaidPresetConfig(preset) {
  const config = createDefaultRaidTableConfig()
  config.bossTemplateId = RAID_BOSS_TEMPLATE_IDS.SONYA
  config.lineup = [...preset.lineup]
  config.attackPriority = [...preset.attackPriority]
  config.speeds[LUKE] = 4093
  config.speeds[MERLYN] = 3888
  return config
}
