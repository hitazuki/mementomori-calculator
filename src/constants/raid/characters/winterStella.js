import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalMagic, statusEffect } from '../shared.js'

const selfHeal = { type: 'emitEvent', event: 'activeSkillHeal', target: 'self', condition: { type: 'roundAtMost', round: 6 } }
const starlight = statusEffect({
  id: 'winter-stella-starlight', effectGroupId: 13200430101, nameKey: 'raidBuffWinterStellaStarlight', target: 'self', duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'winter-stella-starlight', channel: 'attackRate', rate: { type: 'counterLinear', counter: 'starlight', base: 0, perStack: 0.1, max: 1 } }],
})

export default {
  id: 132, nameKey: 'raidCharWinterStella', speed: 2968, element: RAID_ELEMENTS.GREEN, normal: normalMagic,
  runtime: { counters: { starlight: 0 }, flags: {} }, counterLabels: { starlight: 'raidBuffWinterStellaStarlight' }, permanentModifiers: [],
  eventHooks: [{ event: 'activeSkillHeal', effects: [
    { type: 'changeCounter', counter: 'starlight', amount: 1, max: 10, id: 'winter-stella-starlight', nameKey: 'raidBuffWinterStellaStarlight', eventType: 'counter' },
    starlight,
  ] }],
  hooks: [hook('roundStart', [
    { type: 'setCooldown', target: 'self', skills: ['s1', 's2'], value: 0, eventType: 'cooldownReset' },
  ], { condition: { type: 'roundAtLeast', round: 7 }, onceKey: 'winterStellaRoundSeven' })],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillWinterStellaS1', cooldown: 4, damageType: 'mag',
      hooks: [hook('beforeDamage', [
        selfHeal,
        bossStatusEffect({ id: 'winter-stella-damage-taken-early', replacementKey: 'winter-stella-damage-taken', effectGroupId: 13200130201, nameKey: 'raidDebuffWinterStellaDamageTaken', durationRounds: 4, damageRatePerStack: 0.1, condition: { type: 'roundAtMost', round: 6 } }),
        bossStatusEffect({ id: 'winter-stella-magic-defense-down-early', replacementKey: 'winter-stella-magic-defense-down', effectGroupId: 13200130202, nameKey: 'raidDebuffWinterStellaMagicDefenseDown', durationRounds: 4, magicDefenseRatePerStack: -0.2, condition: { type: 'roundAtMost', round: 6 } }),
        bossStatusEffect({ id: 'winter-stella-damage-taken-late', replacementKey: 'winter-stella-damage-taken', effectGroupId: 13200130203, nameKey: 'raidDebuffWinterStellaDamageTaken', durationRounds: 4, damageRatePerStack: 0.2, condition: { type: 'roundAtLeast', round: 7 } }),
        bossStatusEffect({ id: 'winter-stella-magic-defense-down-late', replacementKey: 'winter-stella-magic-defense-down', effectGroupId: 13200130204, nameKey: 'raidDebuffWinterStellaMagicDefenseDown', durationRounds: 4, magicDefenseRatePerStack: -0.4, condition: { type: 'roundAtLeast', round: 7 } }),
      ])],
      damageSteps: [{ stat: 'ATK', percent: 720, hits: 1, originalTargetCount: 5, damageType: 'mag' }],
      ignoredKeys: ['raidIgnoredHealing'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillWinterStellaS2', cooldown: 4, damageType: 'mag',
      hooks: [
        hook('beforeDamage', [{ ...selfHeal, target: 'selfAndTopAttackOther', targetCount: 2 }]),
        hook('afterDamage', [bossStatusEffect({
          id: 'winter-stella-silence', effectGroupId: 13200230501, nameKey: 'raidDebuffWinterStellaSilence', durationRounds: 2,
          damageRatePerStack: 0, condition: { type: 'probabilityEnabled', key: 'winterStellaSilence' }, recordSkipped: true,
        })], { condition: { type: 'roundAtLeast', round: 7 } }),
      ],
      damageSteps: [{ stat: 'ATK', percent: 780, hits: 4, damageType: 'mag' }],
      ignoredKeys: ['raidIgnoredHealing', 'raidIgnoredSilence'],
    },
  },
}
