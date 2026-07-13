import { RAID_ELEMENTS, bossStatusEffect, hook, normalPhysical } from '../shared.js'

export default {
  id: 8, nameKey: 'raidCharFlorence', speed: 3022, element: RAID_ELEMENTS.BLUE, normal: normalPhysical,
  permanentModifiers: [
    { id: 'florence-atk', channel: 'attackRate', rate: 0.3, nameKey: 'raidBuffFlorenceAttack' },
    { id: 'florence-damage', channel: 'damageRate', rate: 0.3, nameKey: 'raidBuffFlorenceDamage' },
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillFlorenceS1', cooldown: 5, damageType: 'phys', hooks: [hook('beforeDamage', [
        bossStatusEffect({
          id: 'florence-critical-resist-down', effectGroupId: 800100102, nameKey: 'raidDebuffFlorenceCriticalResistDown',
          durationRounds: 1, damageRatePerStack: 0,
        }),
      ])],
      damageSteps: [{
        stat: 'ATK', percent: 525,
        hits: { type: 'conditional', condition: { type: 'guaranteedCritical' }, whenTrue: 10, whenFalse: 6 },
        damageType: 'phys',
      }],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillFlorenceS2', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: 525, hits: 1, damageType: 'phys', originalTargetCount: 5 }],
      ignoredKeys: ['raidIgnoredKillFollowup'],
    },
  },
}
