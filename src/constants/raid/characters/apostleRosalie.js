import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalMagic, removeStatusEffect, removeStatusesEffect, statusEffect } from '../shared.js'

const memory = statusEffect({
  id: 'apostle-rosalie-memory', effectGroupId: 8800300101, nameKey: 'raidBuffApostleRosalieMemory',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
})
const barrier = {
  id: 'apostle-rosalie-barrier', effectGroupId: 8800440101, nameKey: 'raidBuffApostleRosalieBarrier',
  duration: 2, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
}
const hpAttack = [{ kind: 'sourceMaxHpOverTargetAttack', coefficient: 0.1, sourceId: 88 }]
const fullMemory = { type: 'counterBeforeActionAtLeast', counter: 'memory', count: 15 }

export default {
  id: 88, nameKey: 'raidCharApostleRosalie', speed: 2646, element: RAID_ELEMENTS.LIGHT, normal: normalMagic,
  runtime: { counters: { memory: 1 }, flags: {} }, counterLabels: { memory: 'raidBuffApostleRosalieMemory' },
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [
    hook('battleStart', [memory, statusEffect({ ...barrier, target: 'self' }), statusEffect({ ...barrier, target: 'adjacent', targetCount: 2 })]),
    hook('roundStart', [
      { type: 'changeCounter', counter: 'memory', amount: 3, max: 15, id: 'apostle-rosalie-natural-memory', nameKey: 'raidBuffApostleRosalieMemory', condition: { type: 'roundAtLeast', round: 2 } },
      { type: 'changeCounter', counter: 'memory', amount: 15, max: 15, id: 'apostle-rosalie-configured-memory', nameKey: 'raidBuffApostleRosalieMemory', condition: { type: 'configuredActivationRoundReached', key: 'apostleRosalieMemory' } },
    ], { condition: { type: 'actorHasStatus', statusId: 'apostle-rosalie-memory' } }),
    hook('roundStart', [
      statusEffect({
        id: 'apostle-rosalie-memory-attack', effectGroupId: 8800300316, nameKey: 'raidBuffApostleRosalieMemoryAttack',
        target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, symbolicModifiers: hpAttack,
      }),
      removeStatusesEffect({ id: 'apostle-rosalie-cleanse', nameKey: 'raidBuffApostleRosalieMemory', target: 'self', count: 2 }),
      statusEffect({
        id: 'apostle-rosalie-memory-shield', effectGroupId: 8800330319, nameKey: 'raidBuffApostleRosalieMemoryShield',
        target: 'self', duration: 2, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      }),
    ], { condition: { type: 'counterAtLeast', counter: 'memory', count: 15 }, onceKey: 'apostle-rosalie-memory-reward' }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillApostleRosalieS1', cooldown: 4, damageType: 'mag',
      damageSteps: [{ stat: 'ATK', percent: 240, hits: 1, originalTargetCount: 5, damageType: 'mag' }],
      hooks: [hook('beforeDamage', [bossStatusEffect({
        id: 'apostle-rosalie-damage-taken', effectGroupId: 8800130101, nameKey: 'raidDebuffApostleRosalieDamageTaken',
        durationRounds: 2, damageRatePerStack: 0.1,
        condition: { type: 'probabilityEnabled', key: 'apostleRosalieDamageTaken' }, recordSkipped: true,
      })])], ignoredKeys: [],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillApostleRosalieS2', cooldown: 4, damageType: 'mag',
      damageSteps: [{ stat: 'ATK', percent: 180, hits: 10, damageType: 'mag' }],
      hooks: [
        hook('beforeDamage', [
          { type: 'changeCounter', counter: 'memory', amount: -15, min: 0, id: 'apostle-rosalie-memory-consumed', nameKey: 'raidBuffApostleRosalieMemory' },
          removeStatusEffect({ id: 'apostle-rosalie-memory-removed', nameKey: 'raidBuffApostleRosalieMemory', target: 'self', statusId: 'apostle-rosalie-memory' }),
        ], { condition: fullMemory }),
        hook('afterDamage', [
          { type: 'cooldownReduction', target: 'adjacent', targetCount: 2, amount: 2 },
          statusEffect({
            id: 'apostle-rosalie-sacrifice-attack', effectGroupId: 8800220702, nameKey: 'raidBuffApostleRosalieSacrificeAttack',
            target: 'adjacent', targetCount: 2, duration: 2, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, symbolicModifiers: hpAttack,
          }),
        ], { condition: fullMemory }),
      ], ignoredKeys: ['raidIgnoredShield', 'raidIgnoredIncomingDamageReduction', 'raidIgnoredApostleRosalieIncomingDebuffs'],
    },
  },
  ignoredKeys: ['raidIgnoredShield', 'raidIgnoredIncomingDamageReduction', 'raidIgnoredApostleRosalieIncomingDebuffs'],
}
