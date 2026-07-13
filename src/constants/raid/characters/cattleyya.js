import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

export default {
  id: 90, nameKey: 'raidCharCattleyya', speed: 2984, element: RAID_ELEMENTS.YELLOW, normal: normalPhysical, permanentModifiers: [],
  hooks: [
    hook('battleStart', [statusEffect({ id: 'cattleyya-damage-reduction', effectGroupId: 9000420101, nameKey: 'raidBuffCattleyyaDamageReduction', target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE })]),
    hook('roundStart', [
      statusEffect({ id: 'cattleyya-shield', effectGroupId: 9000440101, nameKey: 'raidBuffCattleyyaShield', target: 'self', duration: 4 }),
      statusEffect({ id: 'cattleyya-defense', effectGroupId: 9000430101, nameKey: 'raidBuffCattleyyaDefense', target: 'self', duration: 4 }),
    ], { everyRounds: 4, roundOffset: 1 }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillCattleyyaS1', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 590, hits: 4, damageType: 'phys' }],
      hooks: [hook('beforeDamage', [statusEffect({
        id: 'cattleyya-attack', effectGroupId: 9000140103, nameKey: 'raidBuffCattleyyaAttack', target: 'self', duration: 4,
        modifiers: [{ id: 'cattleyya-attack', channel: 'attackRate', rate: { type: 'skillUsesThresholds', skillKey: 's1', values: [0.2, 0.4, 0.8] } }],
      })])],
      ignoredKeys: ['raidIgnoredDebuffCleanse'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillCattleyyaS2', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: 470, hits: { type: 'skillUsesThresholds', skillKey: 's2', values: [6, 9, 12] }, damageType: 'phys' }],
    },
  },
}
