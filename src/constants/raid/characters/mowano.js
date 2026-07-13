import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, copyStatusesEffect, hook, normalPhysical, statusEffect } from '../shared.js'

export default {
  id: 100, nameKey: 'raidCharMowano', speed: 3145, element: RAID_ELEMENTS.LIGHT, normal: normalPhysical, permanentModifiers: [],
  hooks: [
    hook('roundStart', [statusEffect({ id: 'mowano-shield', effectGroupId: 10000430101, nameKey: 'raidBuffMowanoShield', target: 'self', duration: 10, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE })], { everyRounds: 10, roundOffset: 1 }),
    hook('actionStart', [copyStatusesEffect({
      id: 'mowano-copy-buffs', nameKey: 'raidBuffMowanoCopy', target: 'self', sourceTarget: 'highestBuffCountOther', copyAttackRateAsSourceAttack: true,
    })], { every: 4, offset: 1 }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillMowanoS1', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 590, hits: 1, damageType: 'phys', originalTargetCount: 5 }],
      hooks: [hook('beforeDamage', [
        bossStatusEffect({ id: 'mowano-physical-defense-down', effectGroupId: 10000120102, nameKey: 'raidDebuffMowanoPhysicalDefenseDown', durationRounds: 4, physicalDefenseRatePerStack: -0.25, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_DEBUFF }),
        bossStatusEffect({ id: 'mowano-weaken', effectGroupId: 10000130105, nameKey: 'raidDebuffMowanoWeaken', durationRounds: 4, damageRatePerStack: 0 }),
      ])],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillMowanoS2', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: { type: 'skillUsesThresholds', skillKey: 's2', values: [980, 980, 2450] }, hits: 1, damageType: 'phys', originalTargetCount: 3 }],
      hooks: [], ignoredKeys: ['raidIgnoredDelay'],
    },
  },
}
