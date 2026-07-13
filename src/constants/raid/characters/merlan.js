import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalMagic, statusEffect } from '../shared.js'

const fairy = statusEffect({
  id: 'merlan-fairy', effectGroupId: 13500300101, nameKey: 'raidBuffMerlanFairy', target: 'self', duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'merlan-fairy', channel: 'attackRate', rate: { type: 'counterLinear', counter: 'fairy', base: 0, perStack: 0.03, max: 0.9 } }],
})

export default {
  id: 135, nameKey: 'raidCharMerlan', speed: 3018, element: RAID_ELEMENTS.LIGHT, normal: normalMagic,
  runtime: { counters: { fairy: 0 }, flags: {} }, counterLabels: { fairy: 'raidBuffMerlanFairy' }, permanentModifiers: [],
  hooks: [
    hook('roundStart', [{ type: 'changeCounter', counter: 'fairy', amount: 1, max: 30, id: 'merlan-fairy', nameKey: 'raidBuffMerlanFairy', eventType: 'counter' }, fairy]),
    hook('roundStart', [{ type: 'changeCounter', counter: 'fairy', amount: 1, max: 30, id: 'merlan-fairy-bonus', nameKey: 'raidBuffMerlanFairy', eventType: 'counter' }], { condition: { type: 'otherLineupElementCountAtLeast', element: RAID_ELEMENTS.LIGHT, count: 2 } }),
    hook('roundStart', [statusEffect({ id: 'merlan-shield', effectGroupId: 13500340201, nameKey: 'raidBuffMerlanShield', target: 'self', duration: 4 })], { everyRounds: 4, roundOffset: 1, condition: { type: 'roundAtMost', round: 12 } }),
    hook('roundStart', [statusEffect({ id: 'merlan-guard', effectGroupId: 13500430101, nameKey: 'raidBuffMerlanGuard', target: 'self', duration: 4 })], { everyRounds: 4, roundOffset: 1 }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillMerlanS1', cooldown: 4, damageType: 'mag',
      damageSteps: [{ stat: 'ATK', percent: 440, hits: 1, damageType: 'mag', originalTargetCount: 5 }],
      hooks: [hook('beforeDamage', [
        bossStatusEffect({ id: 'merlan-magic-defense-down', effectGroupId: 13500100102, nameKey: 'raidDebuffMerlanMagicDefenseDown', durationRounds: 5, addStacks: 1, maxStacks: 8, magicDefenseRatePerStack: -0.05 }),
        bossStatusEffect({ id: 'merlan-magic-defense-down', effectGroupId: 13500100102, nameKey: 'raidDebuffMerlanMagicDefenseDown', durationRounds: 5, addStacks: 2, maxStacks: 8, magicDefenseRatePerStack: -0.05, condition: { type: 'skillUsesAtLeast', skillKey: 's1', count: 2 } }),
      ])],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillMerlanS2', cooldown: 4, damageType: 'mag', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: { type: 'skillUsesThresholds', skillKey: 's2', values: [420, 420, 630, 840] }, hits: 7, damageType: 'mag' }],
      ignoredKeys: ['raidIgnoredShield'],
    },
  },
}
