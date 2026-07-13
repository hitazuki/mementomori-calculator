import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

const wordSpell = statusEffect({
  id: 'popri-word-spell', effectGroupId: 11500150101, nameKey: 'raidBuffPopriWordSpell', target: 'self', duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
})

export default {
  id: 115, nameKey: 'raidCharPopri', speed: 3036, element: RAID_ELEMENTS.YELLOW, normal: normalPhysical,
  runtime: { counters: { wordSpell: 0 }, flags: {} }, counterLabels: { wordSpell: 'raidBuffPopriWordSpell' }, permanentModifiers: [],
  hooks: [
    hook('roundStart', [
      statusEffect({ id: 'popri-critical-resist', effectGroupId: 11500340101, nameKey: 'raidBuffPopriTeacher', target: 'self', duration: 4 }),
      statusEffect({ id: 'popri-defense', effectGroupId: 11500330102, nameKey: 'raidBuffPopriTeacher', target: 'self', duration: 4 }),
      statusEffect({ id: 'popri-physical-defense', effectGroupId: 11500330103, nameKey: 'raidBuffPopriTeacher', target: 'self', duration: 4 }),
      statusEffect({ id: 'popri-buff-cover', effectGroupId: 11500400201, nameKey: 'raidBuffPopriBuffCover', target: 'all', duration: 4 }),
    ], { everyRounds: 4, roundOffset: 1 }),
    hook('battleStart', [statusEffect({ id: 'popri-damage-reduction', effectGroupId: 11500430101, nameKey: 'raidBuffPopriDamageReduction', target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE })]),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillPopriS1', cooldown: 4, damageType: 'phys', hooks: [
        hook('beforeDamage', [{ type: 'changeCounter', counter: 'wordSpell', amount: 1, max: 5, id: 'popri-word-spell', nameKey: 'raidBuffPopriWordSpell', eventType: 'counter' }, wordSpell]),
        hook('beforeDamage', [{ type: 'changeCounter', counter: 'wordSpell', amount: 1, max: 5, id: 'popri-word-spell-bonus', nameKey: 'raidBuffPopriWordSpell', eventType: 'counter' }], { condition: { type: 'otherLineupElementCountAtLeast', element: RAID_ELEMENTS.YELLOW, count: 2 } }),
      ],
      damageSteps: [{ stat: 'ATK', percent: { type: 'counterThresholds', counter: 'wordSpell', values: [210, 210, 210, 630] }, hits: 6, damageType: 'phys' }],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillPopriS2', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: { type: 'counterThresholds', counter: 'wordSpell', values: [340, 340, 340, 1020, 1020, 2720] }, hits: 4, damageType: 'phys' }],
    },
  },
}
