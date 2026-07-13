import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, statusEffect } from '../shared.js'

const selfDamage = { type: 'emitEvent', event: 'selfDamage' }

const enhancedNormal = {
  key: 'normal', nameKey: 'raidSkillLilicotteNormal', damageType: 'phys', hooks: [],
  damageSteps: [{
    stat: 'ATK', percent: 300, hits: 3, damageType: 'phys', conditionKey: 'raidConditionAlliesFullHp',
  }],
  ignoredKeys: ['raidIgnoredLowHpDamageScaling'],
}

export default {
  id: 99, nameKey: 'raidCharLilicotte', speed: 3064, element: RAID_ELEMENTS.RED, normal: enhancedNormal,
  permanentModifiers: [], eventHooks: [],
  hooks: [hook('battleStart', [
    statusEffect({
      id: 'lilicotte-enhanced-normal', effectGroupId: 9900400101, nameKey: 'raidBuffLilicotteEnhancedNormal',
      target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
    }),
    statusEffect({
      id: 'lilicotte-speed', effectGroupId: 9900430201, nameKey: 'raidBuffLilicotteSpeed', target: 'self', duration: 4,
      statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      modifiers: [{ id: 'lilicotte-speed', channel: 'speedRate', rate: 0.3 }],
    }),
  ])],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillLilicotteS1', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [selfDamage, selfDamage])],
      damageSteps: [{ stat: 'ATK', percent: 630, hits: 6, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredBuffRemoval', 'raidIgnoredBuffRemovalTriggeredBuff'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillLilicotteS2', cooldown: 4, damageType: 'phys',
      hooks: [
        hook('beforeDamage', [selfDamage, selfDamage]),
        hook('afterDamage', [bossStatusEffect({
          id: 'lilicotte-silence', effectGroupId: 9900250302, nameKey: 'raidDebuffLilicotteSilence', durationRounds: 2,
          damageRatePerStack: 0, condition: { type: 'probabilityEnabled', key: 'lilicotteSilence' }, recordSkipped: true,
        })]),
      ],
      damageSteps: [{ stat: 'ATK', percent: 1120, hits: 1, originalTargetCount: 3, damageType: 'phys' }],
      ignoredKeys: ['raidIgnoredBuffRemoval', 'raidIgnoredBuffRemovalTriggeredBuff'],
    },
  },
}
