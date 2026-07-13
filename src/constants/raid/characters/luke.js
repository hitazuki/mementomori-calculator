import { RAID_ELEMENTS, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

export default {
  id: 30, nameKey: 'raidCharLuke', speed: 3093, element: RAID_ELEMENTS.GREEN, normal: normalPhysical, permanentModifiers: [],
  hooks: [
    hook('battleStart', [
      statusEffect({ id: 'luke-critical-resist', effectGroupId: 3000420101, nameKey: 'raidBuffLukeCriticalResist', target: 'self', duration: 4 }),
      statusEffect({ id: 'luke-critical-resist', effectGroupId: 3000420101, nameKey: 'raidBuffLukeCriticalResist', target: 'adjacent', targetCount: 1, duration: 3 }),
    ]),
    hook('afterCriticalHit', [bossStatusEffect({
      id: 'luke-damage-taken', effectGroupId: 3000330101, nameKey: 'raidDebuffLukeDamageTaken',
      durationRounds: null, addStacks: 1, maxStacks: 5, damageRatePerStack: 0.15,
    })]),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillLukeS1', cooldown: 4, damageType: 'phys', hooks: [hook('afterDamage', [bossStatusEffect({
        id: 'luke-attack-down', effectGroupId: 3000120202, nameKey: 'raidDebuffLukeAttackDown', durationRounds: 1, damageRatePerStack: 0,
      })])],
      damageSteps: [
        { stat: 'ATK', percent: 540, hits: 1, damageType: 'phys', originalTargetCount: 5 },
        { stat: 'STR', percent: 150, hits: 1, damageType: 'direct' },
      ],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillLukeS2', cooldown: 5, damageType: 'direct', hooks: [],
      damageSteps: [{ stat: 'STR', percent: 780, hits: 1, damageType: 'direct', conditionKey: 'raidConditionDummyNoShield' }],
    },
  },
}
