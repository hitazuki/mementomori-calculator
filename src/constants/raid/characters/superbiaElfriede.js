import { RAID_ELEMENTS, RAID_STATUS_CLASSES, conditionalValue as branch, hook, normalPhysical, statusEffect } from '../shared.js'

const fullPride = { type: 'actorStatusStacksAtLeast', statusId: 'superbia-elfriede-pride', count: 10 }
const pride = statusEffect({
  id: 'superbia-elfriede-pride', effectGroupId: 15600340101, nameKey: 'raidBuffSuperbiaElfriedePride',
  target: 'selfAndTopAttackOther', targetCount: 3, duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, addStacks: 1, maxStacks: 10,
  modifiers: [{ id: 'superbia-elfriede-pride', channel: 'damageRate', rate: 0.05 }],
})

export default {
  id: 156, nameKey: 'raidCharSuperbiaElfriede', speed: 2949, element: RAID_ELEMENTS.DARK, normal: normalPhysical,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [
    hook('battleStart', [statusEffect({
      id: 'superbia-elfriede-protection', effectGroupId: 15600350401, nameKey: 'raidBuffSuperbiaElfriedeProtection',
      target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    })]),
    hook('roundStart', [pride], { everyRounds: 1, roundOffset: 1 }),
    hook('roundStart', [pride], { everyRounds: 1, roundOffset: 1, condition: { type: 'actorHpAtLeast50' } }),
  ],
  ignoredKeys: ['raidIgnoredSuperbiaElfriedeIncoming', 'raidIgnoredSuperbiaElfriedeBarrierBypass'],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillSuperbiaElfriedeS1', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{ enemyTarget: { type: 'first', count: 3 }, stat: 'ATK', hits: 1, originalTargetCount: 3, damageType: 'phys',
        percent: branch({ type: 'enemyCountIs', count: 1 }, branch(fullPride, 3060, 2040),
          branch({ type: 'enemyCountIs', count: 2 }, branch(fullPride, 1530, 1020), branch(fullPride, 1020, 680))),
      }],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillSuperbiaElfriedeS2', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [
        { enemyTarget: { type: 'randomHit' }, stat: 'ATK', percent: branch(fullPride, 870, 580), hits: 5, damageType: 'phys' },
        { enemyTarget: { type: 'first', count: 1 }, stat: 'STR', percent: 1500, hits: branch(fullPride, 3, 0),
          damageType: 'direct', criticalCondition: fullPride },
      ],
    },
  },
}
