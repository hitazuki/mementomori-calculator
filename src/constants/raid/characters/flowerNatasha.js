import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

const hitRate = statusEffect({
  id: 'flower-natasha-hit', effectGroupId: 10500320101, nameKey: 'raidBuffFlowerNatashaHit',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

const teamAttack = statusEffect({
  id: 'flower-natasha-team-attack', effectGroupId: 10500330201, nameKey: 'raidBuffFlowerNatashaTeamAttack',
  target: 'all', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'flower-natasha-team-attack', channel: 'attackRate', rate: 0.1 }],
})

const barrier = statusEffect({
  id: 'flower-natasha-barrier', effectGroupId: 10500500101, nameKey: 'raidBuffFlowerNatashaBarrier',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

const selfAggravation = statusEffect({
  id: 'flower-natasha-self-aggravation', effectGroupId: 10500300301, nameKey: 'raidDebuffFlowerNatashaSelfAggravation',
  target: 'self', duration: 1, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_DEBUFF, modifiers: [], copyable: false,
})

export default {
  id: 105, nameKey: 'raidCharFlowerNatasha', speed: 2601, element: RAID_ELEMENTS.DARK, normal: normalPhysical,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [
    hook('battleStart', [hitRate, teamAttack, barrier]),
    hook('roundStart', [
      selfAggravation,
      bossStatusEffect({
        id: 'flower-natasha-aggravation', effectGroupId: 10500300401, nameKey: 'raidDebuffFlowerNatashaAggravation',
        durationRounds: 1, damageRatePerStack: 0, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_DEBUFF,
      }),
    ]),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillFlowerNatashaS1', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: 680, hits: 2, originalTargetCount: 3, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredHeartBloomIncomingStacks', 'raidIgnoredHeartBloomEnhancedSkill', 'raidIgnoredHitRateUp', 'raidIgnoredMaxHpUp', 'raidIgnoredBarrierDamageNullification', 'raidIgnoredDotDamage'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillFlowerNatashaS2', cooldown: 4, damageType: 'phys',
      hooks: [hook('afterDamage', [bossStatusEffect({
        id: 'flower-natasha-poison', effectGroupId: 10500250102, nameKey: 'raidDebuffFlowerNatashaPoison',
        durationRounds: 2, damageRatePerStack: 0,
      })])],
      damageSteps: [{ stat: 'ATK', percent: 1320, hits: 1, originalTargetCount: 3, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredHeartBloomIncomingStacks', 'raidIgnoredHeartBloomEnhancedSkill', 'raidIgnoredHitRateUp', 'raidIgnoredMaxHpUp', 'raidIgnoredBarrierDamageNullification', 'raidIgnoredDotDamage'],
    },
  },
}
