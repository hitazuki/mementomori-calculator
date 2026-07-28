import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalMagic, statusEffect } from '../shared.js'

const banana = statusEffect({
  id: 'matilda-banana', effectGroupId: 8500340101, replacementKey: 'matilda-royal-buff',
  nameKey: 'raidBuffMatildaBanana', target: 'selfAndTopAttackOther', targetCount: 2, duration: 4,
  modifiers: [{ id: 'matilda-banana-attack', channel: 'attackRate', rate: 0.1 }],
})

const queenShort = statusEffect({
  id: 'matilda-queen-short', effectGroupId: 8500140101, replacementKey: 'matilda-royal-buff', nameKey: 'raidBuffMatildaQueen',
  target: 'selfAndTopAttackOther', targetCount: 2, duration: 1, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'matilda-queen-short-attack', channel: 'attackRate', rate: 0.5 }],
  targetCondition: { type: 'targetLacksStatus', statusId: 'matilda-banana' },
})

const queenLong = statusEffect({
  id: 'matilda-queen-long', effectGroupId: 8500140101, replacementKey: 'matilda-royal-buff', nameKey: 'raidBuffMatildaQueen',
  target: 'selfAndTopAttackOther', targetCount: 2, duration: 4, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'matilda-queen-long-attack', channel: 'attackRate', rate: 0.5 }],
  targetCondition: { type: 'targetHasStatus', statusId: 'matilda-banana' },
})

export default {
  id: 85, nameKey: 'raidCharMatilda', speed: 3181, element: RAID_ELEMENTS.RED, normal: normalMagic,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [hook('roundStart', [banana], { everyRounds: 4, roundOffset: 1 })],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillMatildaS1', cooldown: 4, damageType: 'mag',
      hooks: [hook('beforeDamage', [queenShort, queenLong])],
      damageSteps: [{ stat: 'ATK', percent: 680, hits: 1, damageType: 'mag' }],
      ignoredKeys: ['raidIgnoredCriticalRateUp', 'raidIgnoredHitRateUp', 'raidIgnoredIncomingDamageReduction'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillMatildaS2', cooldown: 4, damageType: 'mag', hooks: [],
      damageSteps: [
        { stat: 'ATK', percent: 380, hits: 1, originalTargetCount: 2, damageType: 'mag' },
        { stat: 'ATK', percent: 380, hits: 1, originalTargetCount: 2, damageType: 'mag', conditionKey: 'raidConditionSelfHpAtLeastHalf' },
      ],
      ignoredKeys: ['raidIgnoredHealing'],
    },
  },
}
