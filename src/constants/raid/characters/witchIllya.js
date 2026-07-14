import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

const hitRate = statusEffect({
  id: 'witch-illya-hit', effectGroupId: 6100100101, nameKey: 'raidBuffWitchIllyaHit',
  target: 'self', duration: 1, modifiers: [],
})

const devotion = statusEffect({
  id: 'witch-illya-devotion', effectGroupId: 6100300101, nameKey: 'raidBuffWitchIllyaDevotion',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

const curseUnleashed = statusEffect({
  id: 'witch-illya-curse-unleashed', effectGroupId: 6100330402, nameKey: 'raidBuffWitchIllyaCurseUnleashed',
  target: 'self', duration: 8, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

const barrier = statusEffect({
  id: 'witch-illya-barrier', effectGroupId: 6100440101, nameKey: 'raidBuffWitchIllyaBarrier',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

const penetration = statusEffect({
  id: 'witch-illya-penetration', effectGroupId: 6100500101, nameKey: 'raidBuffWitchIllyaPenetration',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'witch-illya-penetration', channel: 'defensePenetrationRate', rate: 0.4 }],
})

export default {
  id: 61, nameKey: 'raidCharWitchIllya', speed: 2703, element: RAID_ELEMENTS.DARK, normal: normalPhysical,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [
    hook('battleStart', [barrier]),
    hook('battleStart', [penetration], { condition: { type: 'otherLineupElementCountAtLeast', element: RAID_ELEMENTS.DARK, count: 2 } }),
    hook('battleStart', [devotion]),
    hook('roundStart', [
      { type: 'removeStatus', target: 'self', statusId: 'witch-illya-devotion' },
      curseUnleashed,
    ], {
      condition: { type: 'configuredActivationRoundReached', key: 'witchIllyaCurseUnleashed' },
      onceKey: 'witch-illya-curse-unleashed-activated',
    }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillWitchIllyaS1', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [hitRate])],
      damageSteps: [
        { stat: 'ATK', percent: { type: 'skillUsesThresholds', skillKey: 's1', values: [240, 240, 720] }, hits: 10, damageType: 'phys' },
        { stat: 'ATK', percent: 580, hits: 1, damageType: 'phys', conditionKey: 'raidConditionDummySurvives' },
      ],
      ignoredKeys: ['raidIgnoredHitRateUp', 'raidIgnoredBuffRemoval', 'raidIgnoredIncomingAttackTrigger', 'raidIgnoredBarrierDamageNullification', 'raidIgnoredReviveHealing'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillWitchIllyaS2', cooldown: 0, damageType: 'phys',
      condition: { type: 'actorHasStatus', statusId: 'witch-illya-curse-unleashed' }, hooks: [],
      damageSteps: [{
        stat: 'ATK', hits: 5, damageType: 'phys',
        percent: { type: 'conditional', condition: { type: 'bossStatusCountAtLeast', count: 1 }, whenTrue: 660, whenFalse: 440 },
      }],
      ignoredKeys: ['raidIgnoredIncomingAttackTrigger', 'raidIgnoredBarrierDamageNullification', 'raidIgnoredReviveHealing'],
    },
  },
}
