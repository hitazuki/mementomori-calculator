import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalMagic } from '../shared.js'

const selfDamageHook = hook('beforeDamage', [{ type: 'emitEvent', event: 'selfDamage' }])

export default {
  id: 75, nameKey: 'raidCharMorgana', speed: 2715, element: RAID_ELEMENTS.RED, normal: normalMagic,
  runtime: { counters: { fightingSpirit: 0 }, flags: {} },
  counterLabels: { fightingSpirit: 'raidBuffMorganaAttack' },
  permanentModifiers: [],
  derivedModifiers: [
    {
      id: 'morgana-fighting-spirit', effectGroupId: 7500300101, nameKey: 'raidBuffMorganaAttack', channel: 'attackRate',
      rate: { type: 'counterLinear', counter: 'fightingSpirit', base: 0, perStack: 0.1, max: 0.4 },
    },
    {
      id: 'morgana-bonds', effectGroupId: 7500430101, nameKey: 'raidBuffMorganaBonds', channel: 'attackRate',
      rate: { type: 'otherLineupElementCountLinear', element: RAID_ELEMENTS.RED, base: 0.1, perStack: 0.1, max: 0.5 },
    },
  ],
  eventHooks: [{
    event: 'selfDamage',
    effects: [{
      type: 'changeCounter', counter: 'fightingSpirit', amount: 1, max: 4,
      id: 'morgana-fighting-spirit', nameKey: 'raidBuffMorganaAttack', eventType: 'counter',
    }],
  }],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillMorganaS1', cooldown: 4, damageType: 'mag', hooks: [
        selfDamageHook,
        hook('afterHit', [bossStatusEffect({
          id: 'morgana-healing-down', effectGroupId: 7500130202, nameKey: 'raidDebuffMorganaHealingDown', durationRounds: 2,
          damageRatePerStack: 0, statusClass: RAID_STATUS_CLASSES.REMOVABLE_DEBUFF,
          condition: { type: 'probabilityEnabled', key: 'morganaHealingDown' }, recordSkipped: true,
        })]),
      ],
      damageSteps: [{ stat: 'ATK', percent: 420, hits: 5, damageType: 'mag' }],
      ignoredKeys: ['raidIgnoredHealing', 'raidIgnoredHealingReceivedDown'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillMorganaS2', cooldown: 4, damageType: 'mag', hooks: [selfDamageHook],
      damageSteps: [{
        stat: 'ATK', percent: 580,
        hits: { type: 'counterLinear', counter: 'fightingSpirit', base: 3, perStack: 1, max: 7 },
        damageType: 'mag',
      }],
    },
  },
}
