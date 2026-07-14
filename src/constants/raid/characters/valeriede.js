import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

const ferventAttack = statusEffect({
  id: 'valeriede-fervent-attack', effectGroupId: 4700330101, nameKey: 'raidBuffValeriedeFerventAttack',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'valeriede-fervent-attack', channel: 'attackRate', rate: 0.7 }],
})

const blaze = statusEffect({
  id: 'valeriede-blaze', effectGroupId: 4700340001, nameKey: 'raidBuffValeriedeBlaze',
  target: 'self', duration: 2, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

export default {
  id: 47, nameKey: 'raidCharValeriede', speed: 2883, element: RAID_ELEMENTS.DARK, normal: normalPhysical,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [
    hook('battleStart', [ferventAttack]),
    hook('roundStart', [blaze], { onceKey: 'valeriede-initial-blaze' }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillValeriedeS1', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: 380, hits: 10, originalTargetCount: 1, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredHealing', 'raidIgnoredIncomingDamageReduction', 'raidIgnoredKillFlameExtension'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillValeriedeS2', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: 620, hits: 6, originalTargetCount: 1, damageType: 'phys', conditionKey: 'raidConditionDummySurvives' }],
      ignoredKeys: ['raidIgnoredKillFollowup', 'raidIgnoredHealing', 'raidIgnoredIncomingDamageReduction', 'raidIgnoredKillFlameExtension'],
    },
  },
}
