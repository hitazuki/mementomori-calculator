import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

const selfDamageHook = hook('beforeDamage', [{ type: 'emitEvent', event: 'selfDamage' }, { type: 'emitEvent', event: 'selfDamage' }])
const heartfulLoverEffects = [
  {
    type: 'changeCounter', counter: 'heartfulLover', amount: 1, max: 8,
    id: 'guinevere-heartful-lover', nameKey: 'raidBuffGuinevereAttack', eventType: 'counter',
  },
  statusEffect({
    id: 'guinevere-heartful-lover-self', effectGroupId: 14800320101, nameKey: 'raidBuffGuinevereAttack', target: 'self', duration: null,
    statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    symbolicModifiers: [{ kind: 'sourceAttackOverTargetAttack', sourceId: 148, coefficient: { type: 'counterLinear', counter: 'heartfulLover', base: 0, perStack: 0.06, max: 0.48 } }],
  }),
  statusEffect({
    id: 'guinevere-heartful-lover-other', effectGroupId: 14800320101, nameKey: 'raidBuffGuinevereAttack', target: 'topAttackOther', targetCount: 2, duration: null,
    statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    symbolicModifiers: [{ kind: 'sourceAttackOverTargetAttack', sourceId: 148, coefficient: { type: 'counterLinear', counter: 'heartfulLover', base: 0, perStack: 0.06, max: 0.48 } }],
  }),
]

export default {
  id: 148, nameKey: 'raidCharGuinevere', speed: 3091, element: RAID_ELEMENTS.RED, normal: normalPhysical,
  runtime: { counters: { heartfulLover: 0 }, flags: {} }, counterLabels: { heartfulLover: 'raidBuffGuinevereAttack' }, permanentModifiers: [],
  eventHooks: [{ event: 'selfDamage', effects: heartfulLoverEffects }],
  hooks: [hook('battleStart', [statusEffect({
    id: 'guinevere-speed', effectGroupId: 14800430101, nameKey: 'raidBuffGuinevereSpeed', target: 'self', duration: 4,
    statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    modifiers: [{ id: 'guinevere-speed', channel: 'speedRate', rate: 0.3 }],
  })])],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillGuinevereS1', cooldown: 4, damageType: 'phys', hooks: [
        selfDamageHook,
        hook('beforeDamage', [bossStatusEffect({
          id: 'guinevere-damage-taken', effectGroupId: 14800120201, nameKey: 'raidDebuffGuinevereDamageTaken', durationRounds: 2,
          damageRatePerStack: 0.1, condition: { type: 'probabilityEnabled', key: 'guinevereDamageTaken' }, recordSkipped: true,
        })]),
        hook('afterDamage', [bossStatusEffect({
          id: 'guinevere-weakness', effectGroupId: 14800140203, nameKey: 'raidDebuffGuinevereWeakness', durationRounds: 2,
          damageRatePerStack: 0, condition: { type: 'probabilityEnabled', key: 'guinevereDamageTaken' }, recordSkipped: true,
        })]),
      ],
      damageSteps: [{ stat: 'ATK', percent: 720, hits: 5, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredEnemyAttackDown', 'raidIgnoredStunImmunity'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillGuinevereS2', cooldown: 4, damageType: 'phys', hooks: [selfDamageHook],
      damageSteps: [{ stat: 'ATK', percent: { type: 'counterLinear', counter: 'heartfulLover', base: 340, perStack: 50, max: 740 }, hits: 5, damageType: 'phys' }],
    },
  },
}
