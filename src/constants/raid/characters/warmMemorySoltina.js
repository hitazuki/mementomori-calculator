import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

const normalSnowFairy = statusEffect({
  id: 'warm-memory-soltina-snow-fairy-normal', effectGroupId: 10700150101,
  replacementKey: 'warm-memory-soltina-snow-fairy', nameKey: 'raidBuffWarmMemorySoltinaSnowFairy',
  target: 'topAttack', targetCount: 1, duration: 4, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'warm-memory-soltina-snow-fairy-normal-attack', channel: 'attackRate', rate: 0.3 }],
  targetCondition: { type: 'targetElementNotIn', elements: [RAID_ELEMENTS.RED, RAID_ELEMENTS.GREEN] },
})

const enhancedSnowFairy = statusEffect({
  id: 'warm-memory-soltina-snow-fairy-enhanced', effectGroupId: 10700150102,
  replacementKey: 'warm-memory-soltina-snow-fairy', nameKey: 'raidBuffWarmMemorySoltinaSnowFairy',
  target: 'topAttack', targetCount: 1, duration: 32, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'warm-memory-soltina-snow-fairy-enhanced-attack', channel: 'attackRate', rate: 0.6 }],
  targetCondition: { type: 'targetElementIn', elements: [RAID_ELEMENTS.RED, RAID_ELEMENTS.GREEN] },
})

export default {
  id: 107, nameKey: 'raidCharWarmMemorySoltina', speed: 3073, element: RAID_ELEMENTS.RED, normal: normalPhysical,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [hook('battleStart', [statusEffect({
    id: 'warm-memory-soltina-speed', effectGroupId: 10700430101, nameKey: 'raidBuffWarmMemorySoltinaSpeed',
    target: 'self', duration: 2, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    modifiers: [{ id: 'warm-memory-soltina-speed', channel: 'speedRate', rate: 0.3 }],
  })])],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillWarmMemorySoltinaS1', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [normalSnowFairy, enhancedSnowFairy])],
      damageSteps: [{ stat: 'ATK', percent: 480, hits: 1, originalTargetCount: 5, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredHitRateUp', 'raidIgnoredDebuffCleanse'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillWarmMemorySoltinaS2', cooldown: 4, damageType: 'phys',
      hooks: [hook('afterHit', [bossStatusEffect({
        id: 'warm-memory-soltina-stun', effectGroupId: 10700240102, nameKey: 'raidDebuffStun', durationRounds: 2,
        damageRatePerStack: 0, condition: { type: 'probabilityEnabled', key: 'warmMemorySoltinaStun' }, recordSkipped: true,
      })])],
      damageSteps: [{ stat: 'ATK', percent: 420, hits: 5, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredStunAction', 'raidIgnoredDebuffCleanse'],
    },
  },
}
