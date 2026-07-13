import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

const selfDamageHook = hook('beforeDamage', [{ type: 'emitEvent', event: 'selfDamage' }])
const messengerOathEffects = [
  { type: 'changeCounter', counter: 'messengerOath', amount: 1, max: 5, id: 'liebes-messenger-oath', nameKey: 'raidBuffLiebesAttack', eventType: 'counter' },
  statusEffect({
    id: 'liebes-messenger-oath', effectGroupId: 10200420101, nameKey: 'raidBuffLiebesAttack', target: 'all', duration: null,
    statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    modifiers: [{ id: 'liebes-messenger-oath', channel: 'attackRate', rate: { type: 'counterLinear', counter: 'messengerOath', base: 0, perStack: 0.05, max: 0.25 } }],
  }),
]

const flowingTimeSelf = statusEffect({
  id: 'liebes-flowing-time-self', effectGroupId: 10200330101, nameKey: 'raidBuffLiebesFlowingTime', target: 'self',
  duration: 1, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  symbolicModifiers: [{ kind: 'sourceAttackOverTargetAttack', sourceId: 102, coefficient: { type: 'bossStatusCountLinear', base: 0.1, perStack: 0.1, max: 0.6 } }],
})
const flowingTimeOther = statusEffect({
  id: 'liebes-flowing-time-other', effectGroupId: 10200330101, nameKey: 'raidBuffLiebesFlowingTime', target: 'topAttackOther', targetCount: 2,
  duration: 1, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  symbolicModifiers: [{ kind: 'sourceAttackOverTargetAttack', sourceId: 102, coefficient: { type: 'bossStatusCountLinear', base: 0.1, perStack: 0.1, max: 0.6 } }],
})

export default {
  id: 102, nameKey: 'raidCharLiebes', speed: 3592, element: RAID_ELEMENTS.RED, normal: normalPhysical,
  runtime: { counters: { messengerOath: 0 }, flags: {} }, counterLabels: { messengerOath: 'raidBuffLiebesAttack' }, permanentModifiers: [],
  eventHooks: [{ event: 'selfDamage', effects: messengerOathEffects }],
  hooks: [hook('actionStart', [flowingTimeSelf, flowingTimeOther])],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillLiebesS1', cooldown: 4, damageType: 'phys', hooks: [
        selfDamageHook,
        hook('beforeDamage', [
          bossStatusEffect({ id: 'liebes-defense-down', effectGroupId: 10200120201, nameKey: 'raidDebuffLiebesDefenseDown', durationRounds: 2, damageRatePerStack: 0 }),
          bossStatusEffect({ id: 'liebes-physical-defense-down', effectGroupId: 10200120202, nameKey: 'raidDebuffLiebesPhysicalDefenseDown', durationRounds: 2, damageRatePerStack: 0 }),
        ]),
      ],
      damageSteps: [{ stat: 'ATK', percent: 390, hits: 5, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredStun', 'raidIgnoredShield'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillLiebesS2', cooldown: 4, damageType: 'phys', hooks: [selfDamageHook],
      damageSteps: [{ stat: 'ATK', percent: { type: 'bossStatusCountLinear', base: 320, perStack: 140, max: 1020 }, hits: 5, damageType: 'phys' }],
    },
  },
}
