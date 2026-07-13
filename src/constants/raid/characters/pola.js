import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

const earlySelfHeal = { type: 'emitEvent', event: 'activeSkillHeal', target: 'self', condition: { type: 'roundAtMost', round: 6 } }
const courage = statusEffect({
  id: 'pola-courage', effectGroupId: 11400320201, nameKey: 'raidBuffPolaCourage', target: 'all', targetElement: RAID_ELEMENTS.GREEN,
  duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'pola-courage', channel: 'attackRate', rate: { type: 'counterLinear', counter: 'courage', base: 0, perStack: 0.05, max: 0.75 } }],
})

export default {
  id: 114, nameKey: 'raidCharPola', speed: 2956, element: RAID_ELEMENTS.GREEN, normal: normalPhysical,
  runtime: { counters: { courage: 0 }, flags: {} }, counterLabels: { courage: 'raidBuffPolaCourage' }, permanentModifiers: [],
  eventHooks: [{ event: 'activeSkillHeal', effects: [
    { type: 'changeCounter', counter: 'courage', amount: 1, max: 15, id: 'pola-courage', nameKey: 'raidBuffPolaCourage', eventType: 'counter' },
    courage,
  ] }],
  hooks: [hook('roundStart', [
    { type: 'setCooldown', target: 'self', skills: ['s1', 's2'], value: 0, eventType: 'cooldownReset' },
    statusEffect({
      id: 'pola-speed', effectGroupId: 11400420301, nameKey: 'raidBuffPolaSpeed', target: 'self', duration: null,
      statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      modifiers: [{ id: 'pola-speed', channel: 'speedRate', rate: 0.3 }],
    }),
  ], { condition: { type: 'roundAtLeast', round: 7 }, onceKey: 'polaRoundSeven' })],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillPolaS1', cooldown: 4, damageType: 'phys', hooks: [hook('beforeDamage', [earlySelfHeal])],
      damageSteps: [{ stat: 'ATK', percent: { type: 'conditional', condition: { type: 'roundAtMost', round: 6 }, whenTrue: 590, whenFalse: 1180 }, hits: 1, originalTargetCount: 5, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredHealing'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillPolaS2', cooldown: 4, damageType: 'phys', hooks: [hook('beforeDamage', [earlySelfHeal])],
      damageSteps: [{ stat: 'ATK', percent: { type: 'conditional', condition: { type: 'roundAtMost', round: 6 }, whenTrue: 310, whenFalse: 620 }, hits: 8, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredHealing'],
    },
  },
}
