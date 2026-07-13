import { RAID_ELEMENTS, hook, normalMagic, removeStatusesEffect, statusEffect } from '../shared.js'

export default {
  id: 26, nameKey: 'raidCharMerlyn', speed: 2888, element: RAID_ELEMENTS.GREEN, normal: normalMagic, permanentModifiers: [],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillMerlynS1', cooldown: 4, damageType: 'support', damageSteps: [],
      hooks: [hook('afterDamage', [
        statusEffect({
          id: 'merlyn-atk', effectGroupId: 2600130102, nameKey: 'raidBuffMerlynAttack', target: 'topAttack', targetCount: 2,
          duration: 2, targetCondition: { type: 'targetRemovableDebuffCountAtMost', count: 0 }, recordSkipped: true,
          modifiers: [{ id: 'merlyn-atk', channel: 'attackRate', rate: 0.4 }],
        }),
        removeStatusesEffect({
          id: 'merlyn-debuff-cleanse', nameKey: 'raidIgnoredDebuffCleanse', target: 'topAttack', targetCount: 2, count: 2,
        }),
        statusEffect({
          id: 'merlyn-critical-damage', effectGroupId: 2600160103, nameKey: 'raidBuffMerlynCriticalDamage', target: 'topAttack', targetCount: 2,
          duration: 2, modifiers: [{ id: 'merlyn-critical-damage', channel: 'criticalDamageBonus', rate: 0.4 }],
        }),
      ])],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillMerlynS2', cooldown: 4, damageType: 'mag', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: 380, hits: 1, damageType: 'mag', originalTargetCount: 3 }],
      ignoredKeys: ['raidIgnoredBuffRemoval', 'raidIgnoredHealing'],
    },
  },
}
