import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

export default {
  id: 81, nameKey: 'raidCharTama', speed: 3286, element: RAID_ELEMENTS.LIGHT, normal: normalPhysical, permanentModifiers: [],
  hooks: [
    hook('roundStart', [
      statusEffect({ id: 'tama-shield', effectGroupId: 8100340102, nameKey: 'raidBuffTamaShield', target: 'topAttack', targetCount: 1, duration: 8 }),
      statusEffect({ id: 'tama-doll-1', effectGroupId: 8100330103, nameKey: 'raidBuffTamaDoll', target: 'topAttack', targetCount: 1, duration: 8 }),
      statusEffect({ id: 'tama-doll-2', effectGroupId: 8100330104, nameKey: 'raidBuffTamaDoll', target: 'topAttack', targetCount: 1, duration: 8 }),
      statusEffect({ id: 'tama-doll-3', effectGroupId: 8100330105, nameKey: 'raidBuffTamaDoll', target: 'topAttack', targetCount: 1, duration: 8 }),
    ], { everyRounds: 8, roundOffset: 1 }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillTamaS1', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 280, hits: 1, damageType: 'phys', originalTargetCount: 3 }],
      hooks: [hook('beforeDamage', [statusEffect({ id: 'tama-hit', effectGroupId: 8100130101, nameKey: 'raidBuffTamaHit', target: 'topAttack', targetCount: 2, duration: 4 })])],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillTamaS2', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: { type: 'skillUsesThresholds', skillKey: 's2', values: [280, 280, 1120] }, hits: 4, damageType: 'phys' }],
      hooks: [hook('beforeDamage', [bossStatusEffect({ id: 'tama-defense-down', effectGroupId: 8100230101, nameKey: 'raidDebuffTamaDefenseDown', durationRounds: 4, damageRatePerStack: 0 })])],
    },
  },
}
