import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalMagic, statusEffect } from '../shared.js'

export default {
  id: 58, nameKey: 'raidCharArtie', speed: 2734, element: RAID_ELEMENTS.RED, normal: normalMagic,
  runtime: { counters: { criticalResistStacks: 0 }, flags: {} },
  counterLabels: { criticalResistStacks: 'raidBuffArtieCriticalResist' },
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [hook('battleStart', [
    statusEffect({
      id: 'artie-partner-presence', effectGroupId: 5800330101, nameKey: 'raidBuffArtiePartnerPresence',
      target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
    }),
    statusEffect({
      id: 'artie-critical-resist', effectGroupId: 5800400101, nameKey: 'raidBuffArtieCriticalResist',
      target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
    }),
    { type: 'changeCounter', counter: 'criticalResistStacks', amount: 8, max: 10, id: 'artie-critical-resist-initial', nameKey: 'raidBuffArtieCriticalResist', eventType: 'counter' },
  ])],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillArtieS1', cooldown: 4, damageType: 'mag',
      hooks: [hook('beforeDamage', [
        bossStatusEffect({
          id: 'artie-s1-debuff', effectGroupId: 5800140101, nameKey: 'raidDebuffArtieDoOrDie', durationRounds: 4,
          damageRatePerStack: 0.2, magicDefenseRatePerStack: -0.4,
        }),
        { type: 'changeCounter', counter: 'criticalResistStacks', amount: 2, max: 10, id: 'artie-critical-resist-s1', nameKey: 'raidBuffArtieCriticalResist', eventType: 'counter' },
      ])],
      damageSteps: [{ stat: 'ATK', percent: 350, hits: 1, originalTargetCount: 5, damageType: 'mag' }],
      ignoredKeys: ['raidIgnoredCriticalResistStacks', 'raidIgnoredMaxHpUp', 'raidIgnoredIncomingDamageReduction'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillArtieS2', cooldown: 4, damageType: 'mag', hooks: [],
      damageSteps: [{
        stat: 'ATK', percent: 200, hits: 7, damageType: 'mag',
        criticalCondition: { type: 'bossStatusCountAtLeast', count: 1 },
      }],
      ignoredKeys: ['raidIgnoredTargetLowerHpDamageScaling', 'raidIgnoredHealing', 'raidIgnoredCriticalResistStacks'],
    },
  },
}
