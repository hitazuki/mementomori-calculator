import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalMagic, statusEffect } from '../shared.js'

const activeHealSelf = { type: 'emitEvent', event: 'activeSkillHeal', target: 'self', condition: { type: 'roundAtMost', round: 6 } }
const vigorousBloomOther = statusEffect({
  id: 'eidene-vigorous-bloom-other', effectGroupId: 9200320101, nameKey: 'raidBuffEideneVigorousBloom',
  target: 'selfAndTopAttackOther', targetCount: 3, duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'eidene-vigorous-bloom', channel: 'attackRate', rate: { type: 'counterLinear', counter: 'vigorousBloom', base: 0, perStack: 0.05, max: 0.75 } }],
  targetCondition: { type: 'targetElementNot', element: RAID_ELEMENTS.GREEN },
})
const vigorousBloomGreen = statusEffect({
  id: 'eidene-vigorous-bloom-green', effectGroupId: 9200320102, nameKey: 'raidBuffEideneVigorousBloom',
  target: 'selfAndTopAttackOther', targetCount: 3, targetElement: RAID_ELEMENTS.GREEN, duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'eidene-vigorous-bloom', channel: 'attackRate', rate: { type: 'counterLinear', counter: 'vigorousBloom', base: 0, perStack: 0.05, max: 0.75 } }],
})

export default {
  id: 92, nameKey: 'raidCharEidene', speed: 3261, element: RAID_ELEMENTS.GREEN, normal: normalMagic,
  runtime: { counters: { vigorousBloom: 0 }, flags: {} }, counterLabels: { vigorousBloom: 'raidBuffEideneVigorousBloom' }, permanentModifiers: [],
  eventHooks: [{ event: 'activeSkillHeal', effects: [
    { type: 'changeCounter', counter: 'vigorousBloom', amount: 1, max: 15, id: 'eidene-vigorous-bloom', nameKey: 'raidBuffEideneVigorousBloom', eventType: 'counter' },
    vigorousBloomOther,
    vigorousBloomGreen,
  ] }],
  hooks: [],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillEideneS1', cooldown: 4, damageType: 'mag', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: 480, hits: 4, damageType: 'mag' }],
      ignoredKeys: ['raidIgnoredMaxHpUp', 'raidIgnoredRegeneration'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillEideneS2', cooldown: 4, damageType: 'mag',
      hooks: [hook('beforeDamage', [activeHealSelf, activeHealSelf, activeHealSelf])],
      damageSteps: [{
        stat: 'ATK', percent: { type: 'conditional', condition: { type: 'roundAtMost', round: 6 }, whenTrue: 480, whenFalse: 1440 },
        hits: 1, originalTargetCount: 3, damageType: 'mag',
      }],
      ignoredKeys: ['raidIgnoredHealing'],
    },
  },
}
