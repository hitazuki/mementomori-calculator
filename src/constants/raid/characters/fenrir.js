import { RAID_ELEMENTS, hook, normalMagic, statusEffect } from '../shared.js'

export default {
  id: 7, nameKey: 'raidCharFenrir', speed: 2894, element: RAID_ELEMENTS.BLUE, normal: normalMagic, permanentModifiers: [],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillFenrirS1', cooldown: 4, damageType: 'mag',
      damageSteps: [{ stat: 'ATK', percent: 720, hits: 1, damageType: 'mag' }],
      hooks: [hook('afterDamage', [
        { type: 'cooldownReduction', target: 'adjacent', targetCount: 2, amount: 2 },
        statusEffect({
          id: 'fenrir-atk', effectGroupId: 700160202, nameKey: 'raidBuffFenrirAttack', target: 'adjacent', targetCount: 2,
          duration: 2, modifiers: [{ id: 'fenrir-atk', channel: 'attackRate', rate: 0.2 }],
        }),
      ])],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillFenrirS2', cooldown: 4, damageType: 'mag', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: 380, hits: 1, damageType: 'mag', originalTargetCount: 5 }],
      ignoredKeys: ['raidIgnoredDebuffCleanse'],
    },
  },
}
