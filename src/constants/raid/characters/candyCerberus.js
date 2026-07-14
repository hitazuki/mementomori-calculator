import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalMagic, statusEffect } from '../shared.js'

const hitRate = statusEffect({
  id: 'candy-cerberus-hit', effectGroupId: 12900440101, nameKey: 'raidBuffCandyCerberusHit',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

const adjacentAttack = statusEffect({
  id: 'candy-cerberus-adjacent-attack', effectGroupId: 12900420201, nameKey: 'raidBuffCandyCerberusAttack',
  target: 'adjacent', targetCount: 2, duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'candy-cerberus-adjacent-attack', channel: 'attackRate', rate: 0.1 }],
})

const adjacentSpeed = statusEffect({
  id: 'candy-cerberus-adjacent-speed', effectGroupId: 12900430301, nameKey: 'raidBuffCandyCerberusSpeed',
  target: 'adjacent', targetCount: 2, duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'candy-cerberus-adjacent-speed', channel: 'speedRate', rate: 0.1 }],
})

const kindMagic = statusEffect({
  id: 'candy-cerberus-kind-magic', effectGroupId: 12900340202, nameKey: 'raidBuffCandyCerberusKindMagic',
  target: 'self', duration: 4, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

export default {
  id: 129, nameKey: 'raidCharCandyCerberus', speed: 2563, element: RAID_ELEMENTS.DARK, normal: normalMagic,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [
    hook('battleStart', [hitRate, adjacentAttack, adjacentSpeed]),
    hook('roundStart', [kindMagic], {
      condition: { type: 'configuredActivationRoundReached', key: 'candyCerberusKindMagic' },
      onceKey: 'candy-cerberus-kind-magic-activated',
    }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillCandyCerberusS1', cooldown: 4, damageType: 'mag', hooks: [],
      damageSteps: [{
        stat: 'ATK',
        percent: { type: 'conditional', condition: { type: 'actorHasStatus', statusId: 'candy-cerberus-kind-magic' }, whenTrue: 510, whenFalse: 340 },
        hits: 10, damageType: 'mag',
      }],
      ignoredKeys: ['raidIgnoredHitRateUp', 'raidIgnoredIncomingDamageReduction', 'raidIgnoredReviveHealing'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillCandyCerberusS2', cooldown: 4, damageType: 'mag', hooks: [],
      damageSteps: [{
        stat: 'ATK',
        percent: { type: 'conditional', condition: { type: 'actorHasStatus', statusId: 'candy-cerberus-kind-magic' }, whenTrue: 1980, whenFalse: 1320 },
        hits: 1, originalTargetCount: 3, damageType: 'mag',
      }],
      ignoredKeys: ['raidIgnoredMultiBarrierReflectedDamage', 'raidIgnoredHitRateUp', 'raidIgnoredIncomingDamageReduction', 'raidIgnoredReviveHealing'],
    },
  },
}
