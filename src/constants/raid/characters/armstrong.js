import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

const criticalDamage = statusEffect({
  id: 'armstrong-critical-damage', effectGroupId: 5000330101, nameKey: 'raidBuffArmstrongCriticalDamage',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'armstrong-critical-damage', channel: 'criticalDamageBonus', rate: 0.4 }],
})

const elasticAttack = statusEffect({
  id: 'armstrong-elastic-attack', effectGroupId: 5000440202, nameKey: 'raidBuffArmstrongElasticAttack',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'armstrong-elastic-attack', channel: 'attackRate', rate: { type: 'previousActionCriticalHitsLinear', base: 0, perStack: 0.04, max: 0.4 } }],
})

const selfCriticalRate = statusEffect({
  id: 'armstrong-critical-rate-self', effectGroupId: 5000330201, nameKey: 'raidBuffArmstrongCriticalRate',
  target: 'self', duration: 2, modifiers: [],
})

const allyCriticalRate = statusEffect({
  id: 'armstrong-critical-rate-ally', effectGroupId: 5000330201, nameKey: 'raidBuffArmstrongCriticalRate',
  target: 'highestSpeedOther', duration: 2, modifiers: [],
})

export default {
  id: 50, nameKey: 'raidCharArmstrong', speed: 3047, element: RAID_ELEMENTS.DARK, normal: normalPhysical,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [
    hook('battleStart', [criticalDamage, elasticAttack]),
    hook('roundStart', [selfCriticalRate, allyCriticalRate], { everyRounds: 4, roundOffset: 1 }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillArmstrongS1', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: 600, hits: 2, originalTargetCount: 3, damageType: 'phys', conditionKey: 'raidConditionDummySurvives' }],
      ignoredKeys: [],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillArmstrongS2', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: 600, hits: 8, originalTargetCount: 8, damageType: 'phys', conditionKey: 'raidConditionBossHpAtLeastHalf' }],
      ignoredKeys: ['raidIgnoredLowHpGuaranteedHit'],
    },
  },
}
