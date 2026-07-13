import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

const allEyes = statusEffect({
  id: 'cordie-all-eyes', effectGroupId: 2700330101, nameKey: 'raidBuffCordieAllEyes', target: 'self', duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [
    { id: 'cordie-all-eyes-attack', channel: 'attackRate', rate: 0.4 },
    { id: 'cordie-all-eyes-penetration', channel: 'defensePenetrationRate', rate: 0.4 },
  ],
})

const debuffImmunity = statusEffect({
  id: 'cordie-debuff-immunity', effectGroupId: 2700430101, nameKey: 'raidBuffCordieDebuffImmunity',
  target: 'self', duration: 3, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

export default {
  id: 27, nameKey: 'raidCharCordie', speed: 3562, element: RAID_ELEMENTS.GREEN, normal: normalPhysical,
  permanentModifiers: [], eventHooks: [],
  hooks: [
    hook('battleStart', [allEyes]),
    hook('roundStart', [debuffImmunity], { everyRounds: 3, roundOffset: 1 }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillCordieS1', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [bossStatusEffect({
        id: 'cordie-defense-down', effectGroupId: 2700150102, nameKey: 'raidDebuffCordieDefenseDown',
        durationRounds: 3, defenseRatePerStack: -0.8,
      })])],
      damageSteps: [{ stat: 'ATK', percent: 570, hits: 5, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredKillTriggeredAttackBuff', 'raidIgnoredDebuffImmunity'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillCordieS2', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{
        stat: 'ATK', percent: 520, hits: 1, originalTargetCount: 5, damageType: 'phys',
        conditionKey: 'raidConditionAlliesFullHp',
        criticalCondition: { type: 'bossStatusCountAtLeast', count: 1 },
      }],
      ignoredKeys: ['raidIgnoredLowHpActiveSkillScaling', 'raidIgnoredDebuffImmunity'],
    },
  },
}
