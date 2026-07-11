import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

export default {
  id: 128, nameKey: 'raidCharLiberia', speed: 3597, element: RAID_ELEMENTS.DARK, normal: normalPhysical, permanentModifiers: [],
  hooks: [hook('battleStart', [statusEffect({
    id: 'liberia-defense-atk', effectGroupId: 12800330101, nameKey: 'raidBuffLiberiaDefenseAttack', target: 'topAttack', targetCount: 2,
    duration: 4, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    symbolicModifiers: [{ kind: 'targetBaseDefenseOverTargetAttack', coefficient: 2 }],
  })])],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillLiberiaS1', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 480, hits: 8, damageType: 'phys' }],
      hooks: [hook('beforeDamage', [bossStatusEffect({
        id: 'liberia-sand', effectGroupId: 12800100101, nameKey: 'raidDebuffLiberiaSand', durationRounds: 2,
        addStacks: 2, maxStacks: 4, damageRatePerStack: 0.05,
        condition: { type: 'probabilityEnabled', key: 'liberiaSand' }, recordSkipped: true,
      })])],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillLiberiaS2', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 780, hits: 5, damageType: 'phys' }],
      hooks: [hook('afterDamage', [{ type: 'setCooldown', target: 'self', skills: ['s1', 's2'], value: 0, eventType: 'cooldownReset' }], {
        condition: { type: 'bossStacksAtLeast', statusId: 'liberia-sand', count: 4 },
        onceKey: 'liberiaCooldownReset',
      })],
      ignoredKeys: ['raidIgnoredBuffRemoval'],
    },
  },
}
