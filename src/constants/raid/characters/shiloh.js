import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

const happinessMagic = statusEffect({
  id: 'shiloh-happiness-magic', effectGroupId: 15300330102, nameKey: 'raidBuffShilohHappinessMagic',
  target: 'topAttack', targetCount: 2, duration: 4,
  modifiers: [{ id: 'shiloh-happiness-magic', channel: 'attackRate', rate: 0.5 }],
})

const heartfeltSmileDefense = [
  statusEffect({
    id: 'shiloh-heartfelt-smile-defense-1', effectGroupId: 15300400101, nameKey: 'raidBuffShilohHeartfeltSmileDefense',
    target: 'selfAndTopAttackOther', targetCount: 3, duration: 4, modifiers: [],
  }),
  statusEffect({
    id: 'shiloh-heartfelt-smile-defense-2', effectGroupId: 15300400102, nameKey: 'raidBuffShilohHeartfeltSmileDefense',
    target: 'selfAndTopAttackOther', targetCount: 3, duration: 4, modifiers: [],
  }),
  statusEffect({
    id: 'shiloh-heartfelt-smile-defense-3', effectGroupId: 15300400103, nameKey: 'raidBuffShilohHeartfeltSmileDefense',
    target: 'selfAndTopAttackOther', targetCount: 3, duration: 4, modifiers: [],
  }),
]

const incomingDamageReduction = statusEffect({
  id: 'shiloh-incoming-damage-reduction', effectGroupId: 15300430301, nameKey: 'raidBuffShilohHeartfeltSmile',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

export default {
  id: 153, nameKey: 'raidCharShiloh', speed: 3229, element: RAID_ELEMENTS.YELLOW, normal: normalPhysical,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [
    hook('battleStart', [incomingDamageReduction]),
    hook('roundStart', [happinessMagic], { everyRounds: 4, roundOffset: 1 }),
    hook('actionStart', heartfeltSmileDefense, { every: 4, offset: 1 }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillShilohS1', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [
        statusEffect({
          id: 'shiloh-critical-rate', effectGroupId: 15300120202, nameKey: 'raidBuffShilohCriticalRate',
          target: 'topAttack', targetCount: 2, duration: 4, modifiers: [],
        }),
        statusEffect({
          id: 'shiloh-critical-damage', effectGroupId: 15300120204, nameKey: 'raidBuffShilohCriticalDamage',
          target: 'topAttack', targetCount: 2, duration: 4,
          modifiers: [{ id: 'shiloh-critical-damage', channel: 'criticalDamageBonus', rate: 0.3 }],
        }),
      ])],
      damageSteps: [{ stat: 'ATK', percent: 580, hits: 1, originalTargetCount: 5, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredCriticalRateUp', 'raidIgnoredDefenseBuff', 'raidIgnoredIncomingDamageReduction'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillShilohS2', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{
        stat: 'ATK', hits: 5, damageType: 'phys',
        percent: {
          type: 'conditional', condition: { type: 'roundAtLeast', round: 9 }, whenFalse: 640,
          whenTrue: { type: 'maxLineupRemovableBuffCountLinear', base: 640, perStack: 30, max: 940 },
        },
      }],
      ignoredKeys: ['raidIgnoredDefenseBuff', 'raidIgnoredIncomingDamageReduction'],
    },
  },
}
