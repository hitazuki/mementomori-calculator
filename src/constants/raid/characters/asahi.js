import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

const windForest = statusEffect({
  id: 'asahi-wind-forest', effectGroupId: 7800300101, nameKey: 'raidBuffAsahiWindForest', target: 'self', duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'asahi-wind-forest', channel: 'attackRate', rate: { type: 'counterLinear', counter: 'windForest', base: 0, perStack: 0.05, max: 0.75 } }],
})

export default {
  id: 78, nameKey: 'raidCharAsahi', speed: 3044, element: RAID_ELEMENTS.LIGHT, normal: normalPhysical,
  runtime: { counters: { windForest: 0 }, flags: {} }, counterLabels: { windForest: 'raidBuffAsahiWindForest' }, permanentModifiers: [],
  hooks: [
    hook('battleStart', [
      statusEffect({ id: 'asahi-damage-reduction', effectGroupId: 7800440101, nameKey: 'raidBuffAsahiDamageReduction', target: 'self', duration: 10 }),
      statusEffect({ id: 'asahi-defense', effectGroupId: 7800420102, nameKey: 'raidBuffAsahiDefense', target: 'self', duration: 10 }),
      statusEffect({ id: 'asahi-shield', effectGroupId: 7800430103, nameKey: 'raidBuffAsahiShield', target: 'self', duration: 10, condition: { type: 'otherLineupElementCountAtLeast', element: RAID_ELEMENTS.LIGHT, count: 2 } }),
    ]),
    hook('actionEnd', [{ type: 'changeCounter', counter: 'windForest', amount: 1, max: 15, id: 'asahi-wind-forest', nameKey: 'raidBuffAsahiWindForest', eventType: 'counter' }, windForest]),
    hook('actionEnd', [{ type: 'changeCounter', counter: 'windForest', amount: 1, max: 15, id: 'asahi-wind-forest-bonus-4', nameKey: 'raidBuffAsahiWindForest', eventType: 'counter' }], { condition: { type: 'actorRemovableBuffCountAtLeast', count: 4 } }),
    hook('actionEnd', [{ type: 'changeCounter', counter: 'windForest', amount: 1, max: 15, id: 'asahi-wind-forest-bonus-8', nameKey: 'raidBuffAsahiWindForest', eventType: 'counter' }], { condition: { type: 'actorRemovableBuffCountAtLeast', count: 8 } }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillAsahiS1', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 380, hits: 5, damageType: 'phys' }],
      hooks: [hook('afterDamage', [statusEffect({ id: 'asahi-critical', effectGroupId: 7800130401, nameKey: 'raidBuffAsahiCritical', target: 'self', duration: 10 })])],
      ignoredKeys: ['raidIgnoredHitRateUp'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillAsahiS2', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 380, hits: { type: 'counterThresholds', counter: 'windForest', values: [5, 5, 5, 5, 5, 5, 10, 10, 10, 10, 10, 10, 15] }, damageType: 'phys' }],
      hooks: [],
    },
  },
}
