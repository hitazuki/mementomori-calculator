import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalMagic, statusEffect } from '../shared.js'

const flameLampSelf = statusEffect({
  id: 'mifri-flame-lamp-self', effectGroupId: 12600300101, nameKey: 'raidBuffMifriFlameLamp', target: 'self', duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'mifri-flame-lamp', channel: 'attackRate', rate: { type: 'counterLinear', counter: 'flameLamp', base: 0, perStack: 0.05, max: 0.75 } }],
})
const flameLampOther = statusEffect({
  id: 'mifri-flame-lamp-other', effectGroupId: 12600300101, nameKey: 'raidBuffMifriFlameLamp', target: 'topAttackOther', targetCount: 1, duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'mifri-flame-lamp', channel: 'attackRate', rate: { type: 'counterLinear', counter: 'flameLamp', base: 0, perStack: 0.05, max: 0.75 } }],
})

export default {
  id: 126, nameKey: 'raidCharMifri', speed: 3136, element: RAID_ELEMENTS.YELLOW, normal: normalMagic,
  runtime: { counters: { flameLamp: 0 }, flags: {} }, counterLabels: { flameLamp: 'raidBuffMifriFlameLamp' }, permanentModifiers: [],
  hooks: [
    hook('actionStart', [{ type: 'changeCounter', counter: 'flameLamp', amount: 1, max: 15, id: 'mifri-flame-lamp', nameKey: 'raidBuffMifriFlameLamp', eventType: 'counter' }, flameLampSelf, flameLampOther]),
    hook('actionStart', [{ type: 'changeCounter', counter: 'flameLamp', amount: 1, max: 15, id: 'mifri-flame-lamp-bonus', nameKey: 'raidBuffMifriFlameLamp', eventType: 'counter' }], { condition: { type: 'anyRemovableBuffCountAtLeast', count: 4 } }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillMifriS1', cooldown: 4, damageType: 'mag',
      damageSteps: [{ stat: 'ATK', percent: { type: 'skillUsesThresholds', skillKey: 's1', values: [410, 410, 1640] }, hits: 1, damageType: 'mag', originalTargetCount: 4 }],
      hooks: [hook('beforeDamage', [statusEffect({
        id: 'mifri-shield', effectGroupId: 12600140101, nameKey: 'raidBuffMifriShield', target: 'all', duration: 4,
      })], { condition: { type: 'skillUsesAtMost', skillKey: 's1', count: 1 } })],
      ignoredKeys: ['raidIgnoredShield'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillMifriS2', cooldown: 4, damageType: 'mag',
      damageSteps: [{ stat: 'ATK', percent: { type: 'skillUsesThresholds', skillKey: 's2', values: [280, 280, 1120] }, hits: 4, damageType: 'mag' }],
      hooks: [hook('afterDamage', [statusEffect({
        id: 'mifri-hasten', effectGroupId: 12600230301, nameKey: 'raidBuffMifriHasten', target: 'self', duration: 1,
        modifiers: [{ id: 'mifri-hasten', channel: 'cooldownRecoveryBonus', rate: 1 }],
      })])],
    },
  },
}
