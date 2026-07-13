import { RAID_ELEMENTS, bossStatusEffect, hook, normalMagic } from '../shared.js'

const activeHealSelf = { type: 'emitEvent', event: 'activeSkillHeal', target: 'self' }

export default {
  id: 80, nameKey: 'raidCharMilla', speed: 3158, element: RAID_ELEMENTS.GREEN, normal: normalMagic,
  runtime: { counters: { activeHealingReceived: 0 }, flags: {} },
  counterLabels: { activeHealingReceived: 'raidCounterMillaHealingReceived' }, permanentModifiers: [],
  eventHooks: [{
    event: 'activeSkillHeal',
    effects: [{
      type: 'changeCounter', counter: 'activeHealingReceived', amount: 1, max: 6,
      id: 'milla-active-healing-received', nameKey: 'raidCounterMillaHealingReceived', eventType: 'counter',
      condition: { type: 'eventTargetsIncludeOwner' },
    }],
  }],
  hooks: [],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillMillaS1', cooldown: 4, damageType: 'mag',
      damageSteps: [{ stat: 'ATK', percent: 180, hits: 1, originalTargetCount: 3, damageType: 'mag' }],
      hooks: [hook('afterDamage', [
        bossStatusEffect({
          id: 'milla-delay', effectGroupId: 8000120102, nameKey: 'raidDebuffMillaDelay', durationRounds: 1,
          damageRatePerStack: 0, condition: { type: 'probabilityEnabled', key: 'millaDelay' }, recordSkipped: true,
        }),
        activeHealSelf,
      ])],
      ignoredKeys: ['raidIgnoredDelay', 'raidIgnoredHealing'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillMillaS2', cooldown: 4, damageType: 'mag',
      damageSteps: [{
        stat: 'ATK', percent: { type: 'counterThresholds', counter: 'activeHealingReceived', values: [480, 480, 480, 480, 480, 480, 1920] },
        hits: 4, damageType: 'mag',
      }],
      hooks: [hook('beforeDamage', [activeHealSelf])], ignoredKeys: ['raidIgnoredHealing'],
    },
  },
}
