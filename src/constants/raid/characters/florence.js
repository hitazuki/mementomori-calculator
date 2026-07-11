import { RAID_ELEMENTS, normalPhysical } from '../shared.js'

export default {
  id: 8, nameKey: 'raidCharFlorence', speed: 3022, element: RAID_ELEMENTS.BLUE, normal: normalPhysical,
  permanentModifiers: [
    { id: 'florence-atk', channel: 'attackRate', rate: 0.3, nameKey: 'raidBuffFlorenceAttack' },
    { id: 'florence-damage', channel: 'damageRate', rate: 0.3, nameKey: 'raidBuffFlorenceDamage' },
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillFlorenceS1', cooldown: 5, damageType: 'phys', hooks: [],
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
