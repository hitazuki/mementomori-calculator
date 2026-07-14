import {
  RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect,
} from '../shared.js'

const enhancedNormalSelf = statusEffect({
  id: 'eirene-enhanced-normal-self', effectGroupId: 10900320101, nameKey: 'raidBuffEireneEnhancedNormal',
  target: 'self', duration: 3, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

const enhancedNormalAlly = statusEffect({
  id: 'eirene-enhanced-normal-ally', effectGroupId: 10900330201, nameKey: 'raidBuffEireneEnhancedNormal',
  target: 'lowestSpeedOthers', targetCount: 1, duration: 3, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

const barrier = statusEffect({
  id: 'eirene-barrier', effectGroupId: 10900440201, nameKey: 'raidBuffEireneBarrier',
  target: 'lowestSpeedOthers', targetCount: 1, duration: 4, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

const natalisHitRate = statusEffect({
  id: 'eirene-natalis-hit-rate', effectGroupId: 10900220301, nameKey: 'raidBuffEireneHitRate',
  target: 'self', duration: 1, statusClass: RAID_STATUS_CLASSES.REMOVABLE_BUFF, modifiers: [],
  condition: { type: 'skillUsesAtLeast', skillKey: 's2', count: 2 },
})

const enhancedNormal = Object.freeze({
  ...normalPhysical,
  hooks: [hook('afterDamage', [
    { type: 'cooldownReduction', target: 'self', amount: 1, phase: 'afterDamage' },
    { type: 'removeStatus', target: 'self', statusId: 'eirene-enhanced-normal-self' },
  ], { condition: { type: 'actorHasStatus', statusId: 'eirene-enhanced-normal-self' } })],
  ignoredKeys: ['raidIgnoredDebuffCleanse'],
})

const allyEnhancedNormalCondition = { type: 'eventSourceHasStatus', statusId: 'eirene-enhanced-normal-ally' }

export default {
  id: 109, nameKey: 'raidCharEirene', speed: 3148, element: RAID_ELEMENTS.LIGHT, normal: enhancedNormal,
  permanentModifiers: [], derivedModifiers: [],
  eventHooks: [{
    event: 'normalAttack',
    effects: [
      { type: 'cooldownReduction', target: 'eventSource', amount: 1, condition: allyEnhancedNormalCondition },
      { type: 'removeStatus', target: 'eventSource', statusId: 'eirene-enhanced-normal-ally', condition: allyEnhancedNormalCondition },
    ],
  }],
  hooks: [
    hook('roundStart', [enhancedNormalSelf, enhancedNormalAlly], { everyRounds: 3, roundOffset: 1 }),
    hook('roundStart', [barrier], { everyRounds: 4, roundOffset: 1 }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillEireneS1', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [bossStatusEffect({
        id: 'eirene-defense-down', effectGroupId: 10900120101, nameKey: 'raidDebuffEireneDefense',
        durationRounds: 4, defenseRatePerStack: -0.25, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_DEBUFF,
      })])],
      damageSteps: [{ stat: 'ATK', percent: 280, hits: 1, originalTargetCount: 5, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredIncomingDamageReduction'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillEireneS2', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [natalisHitRate])],
      damageSteps: [{
        stat: 'ATK', damageType: 'phys',
        percent: { type: 'skillUsesThresholds', skillKey: 's2', values: [380, 380, 760] },
        hits: { type: 'skillUsesThresholds', skillKey: 's2', values: [4, 4, 8] },
      }],
      ignoredKeys: ['raidIgnoredHitRateUp', 'raidIgnoredIncomingDamageReduction'],
    },
  },
}
