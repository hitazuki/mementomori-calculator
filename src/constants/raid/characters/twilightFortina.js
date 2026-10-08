import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

export default {
  id: 151, nameKey: 'raidCharTwilightFortina', speed: 3423, element: RAID_ELEMENTS.LIGHT, normal: normalPhysical,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [
    hook('battleStart', [statusEffect({
      id: 'twilight-fortina-speed', effectGroupId: 15100300101, nameKey: 'raidBuffTwilightFortinaSpeed',
      target: 'all', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      modifiers: [{ id: 'twilight-fortina-speed', channel: 'speedRate', rate: 0.1 }],
    })], { condition: { type: 'lineupElementCountAtMost', count: 2 } }),
    hook('battleStart', [statusEffect({
      id: 'twilight-fortina-barrier', effectGroupId: 15100500101, nameKey: 'raidBuffTwilightFortinaBarrier',
      detailKey: 'raidDetailTwilightFortinaBarrier', target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    })]),
    hook('roundStart', [statusEffect({
      id: 'twilight-fortina-attack', effectGroupId: 15100330201, nameKey: 'raidBuffTwilightFortinaAttack',
      target: 'selfAndTopAttackOther', targetCount: 3, duration: 3, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      symbolicModifiers: [{ kind: 'sourceAttackOverTargetAttack', coefficient: 0.3, sourceId: 151 }],
    })], { roundOffset: 2, everyRounds: 1, onceKey: 'twilight-fortina-round-two-attack' }),
    hook('actionStart', [statusEffect({
      id: 'twilight-fortina-devotion', effectGroupId: 15100400101, nameKey: 'raidBuffTwilightFortinaDevotion',
      target: 'self', duration: 3, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    })], { condition: { type: 'roundAtMost', round: 1 }, onceKey: 'twilight-fortina-devotion' }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillTwilightFortinaS1', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 480, hits: 1, originalTargetCount: 5, damageType: 'phys' }],
      hooks: [hook('beforeDamage', [
        statusEffect({
          id: 'twilight-fortina-defense', effectGroupId: 15100140101, nameKey: 'raidBuffTwilightFortinaDefense',
          target: 'selfAndFasterAllies', duration: 3, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
        }),
        statusEffect({
          id: 'twilight-fortina-physical-magic-defense', effectGroupId: 15100140201, nameKey: 'raidBuffTwilightFortinaPhysicalMagicDefense',
          target: 'selfAndFasterAllies', duration: 3, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
        }),
      ])],
      ignoredKeys: ['raidIgnoredDefenseBuff', 'raidIgnoredTwilightFortinaDevotion', 'raidIgnoredBarrierDamageNullification'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillTwilightFortinaS2', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 610, hits: 5, damageType: 'phys' }],
      hooks: [hook('afterDamage', [{ type: 'emitEvent', event: 'activeSkillHeal', target: 'self' }])],
      ignoredKeys: ['raidIgnoredHealing', 'raidIgnoredTwilightFortinaDevotion', 'raidIgnoredBarrierDamageNullification'],
    },
  },
}
