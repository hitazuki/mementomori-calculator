import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

export default {
  id: 70, nameKey: 'raidCharSummerSabrina', speed: 3418, element: RAID_ELEMENTS.GREEN, normal: normalPhysical,
  permanentModifiers: [], eventHooks: [],
  hooks: [hook('battleStart', [
    statusEffect({
      id: 'summer-sabrina-hit', effectGroupId: 7000320201, nameKey: 'raidBuffSummerSabrinaHit',
      target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
    }),
    statusEffect({
      id: 'summer-sabrina-vitality', effectGroupId: 7000430101, nameKey: 'raidBuffSummerSabrinaVitality',
      target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
    }),
  ])],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillSummerSabrinaS1', cooldown: 4, damageType: 'phys',
      hooks: [
        hook('beforeDamage', [bossStatusEffect({
          id: 'summer-sabrina-critical-resist-down', effectGroupId: 7000130101,
          nameKey: 'raidDebuffSummerSabrinaCriticalResistDown', durationRounds: 4,
        })]),
        hook('afterDamage', [bossStatusEffect({
          id: 'summer-sabrina-stun', effectGroupId: 7000120201,
          nameKey: 'raidDebuffStun', durationRounds: 2,
        })]),
      ],
      damageSteps: [{ stat: 'ATK', percent: 400, hits: 1, originalTargetCount: 5, damageType: 'phys' }],
      ignoredKeys: [
        'raidIgnoredStunAction', 'raidIgnoredHitRateUp', 'raidIgnoredMaxHpUp',
        'raidIgnoredDefenseBuff', 'raidIgnoredDeathTriggeredStun',
      ],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillSummerSabrinaS2', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [
        { stat: 'ATK', percent: 200, hits: 7, damageType: 'phys' },
        {
          stat: 'ATK', percent: 600,
          hits: { type: 'conditional', condition: { type: 'guaranteedCritical' }, whenTrue: 1, whenFalse: 0 },
          damageType: 'phys',
        },
      ],
      ignoredKeys: [
        'raidIgnoredBuffRemoval', 'raidIgnoredKillFollowup', 'raidIgnoredHitRateUp',
        'raidIgnoredMaxHpUp', 'raidIgnoredDefenseBuff', 'raidIgnoredDeathTriggeredStun',
      ],
    },
  },
}
