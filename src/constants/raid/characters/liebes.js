import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

const selfDamageHook = hook('beforeDamage', [{ type: 'emitEvent', event: 'selfDamage' }])
const flowingTimeCondition = { type: 'bossStatusCountAtLeast', count: 1 }
const flowingTimeGroupId = {
  type: 'conditional', condition: flowingTimeCondition, whenTrue: 10200330102, whenFalse: 10200330101,
}
const flowingTimeRate = {
  type: 'conditional', condition: flowingTimeCondition, whenTrue: 0.2, whenFalse: 0.1,
}
const messengerOathEffects = [
  { type: 'changeCounter', counter: 'messengerOath', amount: 1, max: 5, id: 'liebes-messenger-oath', nameKey: 'raidBuffLiebesAttack', eventType: 'counter' },
  statusEffect({
    id: 'liebes-messenger-oath', effectGroupId: 10200420101, nameKey: 'raidBuffLiebesAttack', target: 'all', duration: null,
    statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    modifiers: [{ id: 'liebes-messenger-oath', channel: 'attackRate', rate: { type: 'counterLinear', counter: 'messengerOath', base: 0, perStack: 0.05, max: 0.25 } }],
  }),
]

const flowingTimeSelf = statusEffect({
  id: 'liebes-flowing-time-self', replacementKey: 'liebes-flowing-time', effectGroupId: flowingTimeGroupId,
  nameKey: 'raidBuffLiebesFlowingTime', target: 'self',
  duration: 1, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  symbolicModifiers: [{ kind: 'sourceAttackOverTargetAttack', sourceId: 102, coefficient: flowingTimeRate }],
})
const flowingTimeOther = statusEffect({
  id: 'liebes-flowing-time-other', replacementKey: 'liebes-flowing-time', effectGroupId: flowingTimeGroupId,
  nameKey: 'raidBuffLiebesFlowingTime', target: 'topAttackOther', targetCount: 1,
  duration: 1, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  symbolicModifiers: [{ kind: 'sourceAttackOverTargetAttack', sourceId: 102, coefficient: flowingTimeRate }],
})

export default {
  id: 102, nameKey: 'raidCharLiebes', speed: 3592, element: RAID_ELEMENTS.RED, normal: normalPhysical,
  runtime: { counters: { messengerOath: 0 }, flags: {} }, counterLabels: { messengerOath: 'raidBuffLiebesAttack' }, permanentModifiers: [],
  eventHooks: [{ event: 'selfDamage', effects: messengerOathEffects }],
  hooks: [
    hook('battleStart', [statusEffect({
      id: 'liebes-barrier', effectGroupId: 10200430301, nameKey: 'raidBuffLiebesBarrier', target: 'self', duration: null,
      statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
    })]),
    hook('actionStart', [flowingTimeSelf, flowingTimeOther]),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillLiebesS1', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 390, hits: 5, damageType: 'phys' }],
      hooks: [
        selfDamageHook,
        hook('beforeDamage', [
          bossStatusEffect({ id: 'liebes-defense-down', effectGroupId: 10200120201, nameKey: 'raidDebuffLiebesDefenseDown', durationRounds: 2, defenseRatePerStack: -0.1 }),
          bossStatusEffect({ id: 'liebes-physical-defense-down', effectGroupId: 10200120202, nameKey: 'raidDebuffLiebesPhysicalDefenseDown', durationRounds: 2, physicalDefenseRatePerStack: -0.1 }),
        ]),
        hook('afterDamage', [bossStatusEffect({
          id: 'liebes-stun', effectGroupId: 10200100401, nameKey: 'raidDebuffStun', durationRounds: 1,
          condition: { type: 'probabilityEnabled', key: 'liebesStun' }, recordSkipped: true,
        })]),
      ],
      ignoredKeys: ['raidIgnoredStunAction', 'raidIgnoredShield'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillLiebesS2', cooldown: 4, damageType: 'phys', hooks: [selfDamageHook],
      damageSteps: [{ stat: 'ATK', percent: { type: 'bossStatusCountLinear', base: 320, perStack: 140, max: 1020 }, hits: 5, damageType: 'phys' }],
    },
  },
}
