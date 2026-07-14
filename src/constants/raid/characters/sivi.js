import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

const reactiveBlade = statusEffect({
  id: 'sivi-reactive-blade', effectGroupId: 5200150101, nameKey: 'raidBuffSiviReactiveBlade',
  target: 'selfAndLowestSpeedOthers', targetCount: 3, duration: 4,
  statusClass: RAID_STATUS_CLASSES.REMOVABLE_BUFF,
  modifiers: [{
    id: 'sivi-reactive-blade', channel: 'damageRate',
    rate: { type: 'configuredTier', key: 'siviReactiveBladeIncomingHits', values: [0.3, 0.54, 0.72, 0.84, 0.9] },
  }],
})

export default {
  id: 52, nameKey: 'raidCharSivi', speed: 2855, element: RAID_ELEMENTS.BLUE, normal: normalPhysical,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [], hooks: [],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillSiviS1', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [reactiveBlade])],
      damageSteps: [{ stat: 'ATK', percent: 1170, hits: 1, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredHealing', 'raidIgnoredPerTargetIncomingHitCount', 'raidIgnoredDefenseBuff', 'raidIgnoredIncomingDamageReduction'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillSiviS2', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: 530, hits: 1, originalTargetCount: 4, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredHealing', 'raidIgnoredDebuffCleanse', 'raidIgnoredDefenseBuff', 'raidIgnoredIncomingDamageReduction'],
    },
  },
}
