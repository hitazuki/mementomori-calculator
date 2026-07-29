import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

const turnNineCondition = { type: 'roundAtLeast', round: 9 }

const happinessMagic = statusEffect({
  id: 'shiloh-happiness-magic',
  effectGroupId: { type: 'conditional', condition: turnNineCondition, whenTrue: 15300330102, whenFalse: 15300330101 },
  replacementKey: 'shiloh-happiness-magic', nameKey: 'raidBuffShilohHappinessMagic',
  target: 'topAttack', targetCount: 2, duration: 4,
  modifiers: [{
    id: 'shiloh-happiness-magic', channel: 'attackRate',
    rate: { type: 'conditional', condition: turnNineCondition, whenTrue: 0.5, whenFalse: 0.1 },
  }],
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
          id: 'shiloh-critical-rate',
          effectGroupId: { type: 'conditional', condition: turnNineCondition, whenTrue: 15300120202, whenFalse: 15300120201 },
          replacementKey: 'shiloh-critical-rate', nameKey: 'raidBuffShilohCriticalRate',
          target: 'topAttack', targetCount: 2, duration: 4, modifiers: [],
        }),
        statusEffect({
          id: 'shiloh-critical-damage',
          effectGroupId: { type: 'conditional', condition: turnNineCondition, whenTrue: 15300120204, whenFalse: 15300120203 },
          replacementKey: 'shiloh-critical-damage', nameKey: 'raidBuffShilohCriticalDamage',
          target: 'topAttack', targetCount: 2, duration: 4,
          modifiers: [{
            id: 'shiloh-critical-damage', channel: 'criticalDamageBonus',
            rate: { type: 'conditional', condition: turnNineCondition, whenTrue: 0.3, whenFalse: 0.15 },
          }],
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
          type: 'conditional', condition: turnNineCondition, whenFalse: 640,
          whenTrue: { type: 'maxLineupRemovableBuffCountLinear', base: 640, perStack: 30, max: 940 },
        },
      }],
      ignoredKeys: ['raidIgnoredDefenseBuff', 'raidIgnoredIncomingDamageReduction'],
    },
  },
}
