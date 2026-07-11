import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

export default {
  id: 113, nameKey: 'raidCharRustica', speed: 3187, element: RAID_ELEMENTS.LIGHT, normal: normalPhysical, permanentModifiers: [],
  hooks: [
    hook('actionStart', [statusEffect({
      id: 'rustica-action-atk', effectGroupId: 11300430301, nameKey: 'raidBuffRusticaActionAttack', target: 'self', duration: 1,
      statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      modifiers: [{ id: 'rustica-action-atk', channel: 'attackRate', rate: 0.3 }],
    })], { condition: { type: 'anyRemovableBuffCountAtLeast', count: 4 } }),
    hook('actionEnd', [
      statusEffect({ id: 'rustica-shield-self', effectGroupId: 11300340102, nameKey: 'raidBuffRusticaShield', target: 'self', duration: 8, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE }),
      statusEffect({ id: 'rustica-shield-ally', effectGroupId: 11300340101, nameKey: 'raidBuffRusticaShield', target: 'highestBuffCountOther', duration: 8, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE }),
    ], { every: 8, offset: 1 }),
    hook('actionEnd', [statusEffect({
      id: 'rustica-guardian', effectGroupId: 11300400101, nameKey: 'raidBuffRusticaGuardian', target: 'self', duration: 1,
      statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    })], { condition: { type: 'anyRemovableBuffCountAtLeast', count: 3 } }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillRusticaS1', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 640, hits: 5, damageType: 'phys' }],
      hooks: [hook('beforeDamage', [statusEffect({
        id: 'rustica-hp-drain', effectGroupId: 11300130101, nameKey: 'raidBuffRusticaHpDrain', target: 'highestBuffCount', duration: 4,
      })])],
      ignoredKeys: ['raidIgnoredHpDrain'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillRusticaS2', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{
        stat: 'ATK', percent: 740,
        hits: { type: 'skillUsesLinear', skillKey: 's2', base: 4, increment: 1, max: 6 },
        damageType: 'phys',
      }],
      hooks: [hook('beforeDamage', [statusEffect({
        id: 'rustica-s2-atk', effectGroupId: 11300230101, nameKey: 'raidBuffRusticaS2Attack', target: 'highestBuffCount', duration: 4,
        modifiers: [{ id: 'rustica-s2-atk', channel: 'attackRate', rate: 0.3 }],
      })])],
    },
  },
}
