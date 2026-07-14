import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalMagic, statusEffect } from '../shared.js'

const sisterlyBond = statusEffect({
  id: 'lunalynn-sisterly-bond', effectGroupId: 4600330101, nameKey: 'raidBuffLunalynnSisterlyBond',
  target: 'all', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

const frozenHeart = statusEffect({
  id: 'lunalynn-frozen-heart', effectGroupId: 4600430101, nameKey: 'raidBuffLunalynnFrozenHeart',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

export default {
  id: 46, nameKey: 'raidCharLunalynn', speed: 3304, element: RAID_ELEMENTS.DARK, normal: normalMagic,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [hook('battleStart', [sisterlyBond, frozenHeart])],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillLunalynnS1', cooldown: 7, damageType: 'mag',
      hooks: [
        hook('beforeDamage', [statusEffect({
          id: 'lunalynn-critical-rate', effectGroupId: 4600160101, nameKey: 'raidBuffLunalynnCriticalRate',
          target: 'self', duration: 1, modifiers: [],
        })]),
        hook('afterCriticalHit', [bossStatusEffect({
          id: 'lunalynn-silence', effectGroupId: 4600150202, nameKey: 'raidDebuffLunalynnSilence',
          durationRounds: 3, damageRatePerStack: 0,
        })]),
      ],
      damageSteps: [{ stat: 'ATK', percent: 300, hits: 1, originalTargetCount: 5, damageType: 'mag' }],
      ignoredKeys: ['raidIgnoredCriticalRateUp', 'raidIgnoredSilence'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillLunalynnS2', cooldown: 4, damageType: 'mag',
      hooks: [hook('afterDamage', [bossStatusEffect({
        id: 'lunalynn-poison', effectGroupId: 4600240102, nameKey: 'raidDebuffLunalynnPoison',
        durationRounds: 3, damageRatePerStack: 0,
      })])],
      damageSteps: [{ stat: 'ATK', percent: 285, hits: 1, originalTargetCount: 5, damageType: 'mag', conditionKey: 'raidConditionLoggedTargetMagicLower' }],
      ignoredKeys: ['raidIgnoredBaseMagicComparisonBranch', 'raidIgnoredDotDamage'],
    },
  },
}
