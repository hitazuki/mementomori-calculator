import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalMagic, statusEffect } from '../shared.js'

export default {
  id: 40, nameKey: 'raidCharCarol', speed: 3452, element: RAID_ELEMENTS.YELLOW, normal: normalMagic, permanentModifiers: [],
  hooks: [hook('battleStart', [
    statusEffect({ id: 'carol-team-defense', effectGroupId: 4000420101, nameKey: 'raidBuffCarolTeamDefense', target: 'all', duration: null }),
    statusEffect({ id: 'carol-self-defense', effectGroupId: 4000430201, nameKey: 'raidBuffCarolSelfDefense', target: 'self', duration: null }),
  ])],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillCarolS1', cooldown: 5, damageType: 'mag',
      damageSteps: [{ stat: 'ATK', percent: 590, hits: 1, damageType: 'mag', originalTargetCount: 3 }],
      hooks: [], ignoredKeys: ['raidIgnoredSilence'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillCarolS2', cooldown: 4, damageType: 'mag',
      damageSteps: [{ stat: 'ATK', percent: 365, hits: 1, damageType: 'mag', originalTargetCount: 5 }],
      hooks: [hook('beforeDamage', [bossStatusEffect({ id: 'carol-defense-down', effectGroupId: 4000230101, nameKey: 'raidDebuffCarolDefenseDown', durationRounds: 2, defenseRatePerStack: -0.4 })])],
      ignoredKeys: ['raidIgnoredBuffDispel'],
    },
  },
  ignoredKeys: ['raidIgnoredSelfHeal'],
}
