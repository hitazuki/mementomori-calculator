import { RAID_ELEMENTS, hook, normalMagic, statusEffect } from '../shared.js'

export default {
  id: 29, nameKey: 'raidCharMertillier', speed: 2796, element: RAID_ELEMENTS.GREEN, normal: normalMagic, permanentModifiers: [],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillMertillierS1', cooldown: 4, damageType: 'mag',
      damageSteps: [{ stat: 'ATK', percent: 410, hits: 1, damageType: 'mag', originalTargetCount: 4 }],
      hooks: [hook('afterDamage', [statusEffect({ id: 'mertillier-shield', effectGroupId: 2900130201, nameKey: 'raidBuffMertillierShield', target: 'self', duration: 3 })])],
      ignoredKeys: ['raidIgnoredShield'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillMertillierS2', cooldown: 4, damageType: 'support', damageSteps: [],
      hooks: [hook('afterDamage', [
        { type: 'cooldownReduction', target: 'topAttack', targetCount: 1, amount: 2 },
        statusEffect({
          id: 'mertillier-atk-defense', effectGroupId: 2900260102, nameKey: 'raidBuffMertillierAttackDefense', target: 'topAttack', targetCount: 1,
          duration: 3, modifiers: [{ id: 'mertillier-atk', channel: 'attackRate', rate: 0.85, nameKey: 'raidBuffMertillierAttack' }],
        }),
      ])],
      ignoredKeys: ['raidIgnoredDefenseBuff', 'raidIgnoredDebuffCleanse'],
    },
  },
}
