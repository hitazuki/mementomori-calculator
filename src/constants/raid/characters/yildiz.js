import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

const activeHealSelf = { type: 'emitEvent', event: 'activeSkillHeal', target: 'self' }
const bond = statusEffect({
  id: 'yildiz-bond', effectGroupId: 12400430101, nameKey: 'raidBuffYildizBond', target: 'selfAndTopAttackOther', targetCount: 2,
  duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'yildiz-bond', channel: 'attackRate', rate: { type: 'counterLinear', counter: 'bond', base: 0, perStack: 0.08, max: 0.8 } }],
})

export default {
  id: 124, nameKey: 'raidCharYildiz', speed: 3146, element: RAID_ELEMENTS.GREEN, normal: normalPhysical,
  runtime: { counters: { bond: 0 }, flags: {} }, counterLabels: { bond: 'raidBuffYildizBond' }, permanentModifiers: [],
  eventHooks: [{ event: 'activeSkillHeal', effects: [
    { type: 'changeCounter', counter: 'bond', amount: 1, max: 10, id: 'yildiz-bond', nameKey: 'raidBuffYildizBond', eventType: 'counter' },
    bond,
  ] }],
  hooks: [],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillYildizS1', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [activeHealSelf]), hook('afterDamage', [bossStatusEffect({
        id: 'yildiz-buff-block', effectGroupId: 12400120202, nameKey: 'raidDebuffYildizBuffBlock', durationRounds: 6,
        damageRatePerStack: 0, condition: { type: 'probabilityEnabled', key: 'yildizBuffBlock' }, recordSkipped: true,
      })])],
      damageSteps: [{ stat: 'ATK', percent: 680, hits: 1, originalTargetCount: 3, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredHealing', 'raidIgnoredBuffBlock'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillYildizS2', cooldown: 4, damageType: 'phys', hooks: [hook('beforeDamage', [activeHealSelf])],
      damageSteps: [{ stat: 'ATK', percent: { type: 'counterThresholds', counter: 'bond', values: [280, 280, 280, 280, 280, 280, 280, 280, 280, 280, 1120] }, hits: 4, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredHealing'],
    },
  },
}
