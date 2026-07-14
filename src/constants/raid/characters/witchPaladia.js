import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, removeStatusEffect, statusEffect } from '../shared.js'

const criticalRate = statusEffect({
  id: 'witch-paladia-critical-rate', effectGroupId: 6300330101, nameKey: 'raidBuffWitchPaladiaCriticalRate',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
  condition: { type: 'counterAtMost', counter: 'criticalStacks', count: 1 },
})

const selfBarrier = statusEffect({
  id: 'witch-paladia-self-barrier', effectGroupId: 6300400101, nameKey: 'raidBuffWitchPaladiaSelfBarrier',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

const initialAllyBarrier = statusEffect({
  id: 'witch-paladia-initial-ally-barrier', effectGroupId: 6300440201, nameKey: 'raidBuffWitchPaladiaInitialBarrier',
  target: 'allOther', targetElement: RAID_ELEMENTS.DARK, duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

const earnedBarrier = statusEffect({
  id: 'witch-paladia-earned-barrier', effectGroupId: 6300420401, nameKey: 'raidBuffWitchPaladiaEarnedBarrier',
  target: 'topAttack', targetCount: 3, targetElement: RAID_ELEMENTS.DARK, duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
  condition: { type: 'counterAtLeast', counter: 'ownCriticalPair', count: 2 },
})

const blackBulletRainCondition = { type: 'counterBeforeActionAtLeast', counter: 'criticalStacks', count: 20 }

export default {
  id: 63, nameKey: 'raidCharWitchPaladia', speed: 3065, element: RAID_ELEMENTS.DARK, normal: normalPhysical,
  runtime: { counters: { criticalStacks: 0, ownCriticalPair: 0 }, flags: {} },
  counterLabels: { criticalStacks: 'raidCounterWitchPaladiaCritical', ownCriticalPair: 'raidCounterWitchPaladiaBarrier' },
  permanentModifiers: [], derivedModifiers: [],
  eventHooks: [{
    event: 'criticalHit',
    effects: [
      { type: 'changeCounter', counter: 'criticalStacks', amount: 1, max: 20, record: false },
      criticalRate,
      { type: 'changeCounter', counter: 'ownCriticalPair', amount: 1, max: 2, record: false, condition: { type: 'eventSourceIsOwner' } },
      earnedBarrier,
      { type: 'changeCounter', counter: 'ownCriticalPair', amount: -2, min: 0, record: false, condition: { type: 'counterAtLeast', counter: 'ownCriticalPair', count: 2 } },
    ],
  }],
  hooks: [hook('battleStart', [selfBarrier, initialAllyBarrier])],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillWitchPaladiaS1', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [bossStatusEffect({
        id: 'witch-paladia-critical-resist-down', effectGroupId: 6300120101, nameKey: 'raidDebuffWitchPaladiaCriticalResistDown',
        durationRounds: 2, damageRatePerStack: 0,
        condition: { type: 'probabilityEnabled', key: 'paladiaCriticalResistDown' }, recordSkipped: true,
      })])],
      damageSteps: [{ stat: 'ATK', percent: 580, hits: 1, originalTargetCount: 5, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredCriticalRateUp', 'raidIgnoredBarrierDamageNullification'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillWitchPaladiaS2', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [
        { type: 'changeCounter', counter: 'criticalStacks', amount: -20, min: 0, record: false, condition: blackBulletRainCondition },
        removeStatusEffect({
          id: 'witch-paladia-critical-rate-consume', nameKey: 'raidBuffWitchPaladiaCriticalRate', target: 'self',
          statusId: 'witch-paladia-critical-rate', condition: blackBulletRainCondition,
        }),
      ])],
      damageSteps: [{
        stat: 'ATK', hits: 4, damageType: 'phys', criticalCondition: blackBulletRainCondition,
        percent: { type: 'conditional', condition: blackBulletRainCondition, whenTrue: 1960, whenFalse: 980 },
      }],
      ignoredKeys: ['raidIgnoredBuffRemoval', 'raidIgnoredCriticalRateUp', 'raidIgnoredBarrierDamageNullification'],
    },
  },
}
