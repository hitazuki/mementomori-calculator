import { RAID_ELEMENTS } from '../shared.js'

const enhancedNormal = Object.freeze({
  key: 'normal', nameKey: 'raidSkillAaEnhancedNormal', damageType: 'direct', hooks: [],
  damageSteps: [{ stat: 'MAG', percent: 330, hits: 1, originalTargetCount: 3, damageType: 'direct' }],
  ignoredKeys: ['raidIgnoredHealing', 'raidIgnoredIncomingDamageReduction'],
})

export default {
  id: 48, nameKey: 'raidCharAa', speed: 2687, element: RAID_ELEMENTS.DARK, normal: enhancedNormal,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [], hooks: [],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillAaS1', cooldown: 4, damageType: 'mag', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: 710, hits: 4, damageType: 'mag' }],
      ignoredKeys: ['raidIgnoredHealing', 'raidIgnoredIncomingDamageReduction'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillAaS2', cooldown: 4, damageType: 'direct', hooks: [],
      damageSteps: [{ stat: 'MAG', percent: 980, hits: 1, originalTargetCount: 4, damageType: 'direct' }],
      ignoredKeys: ['raidIgnoredHealing', 'raidIgnoredIncomingDamageReduction'],
    },
  },
}
