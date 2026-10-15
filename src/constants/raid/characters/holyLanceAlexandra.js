import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

const selfDamage = { type: 'emitEvent', event: 'selfDamage' }
// Negative IDs are project placeholders; official EffectGroup IDs await MB/log evidence.
const vulnerability = bossStatusEffect({
  id: 'holy-lance-vulnerability', effectGroupId: -15500101, nameKey: 'raidDebuffHolyLanceDamageTaken',
  durationRounds: 1, damageRatePerStack: 0.4,
  condition: { type: 'probabilityEnabled', key: 'holyLanceDamageTaken' }, recordSkipped: true,
})

export default {
  id: 155, nameKey: 'raidCharHolyLanceAlexandra', speed: 3114, element: RAID_ELEMENTS.RED, normal: normalPhysical,
  permanentModifiers: [], derivedModifiers: [], eventHooks: [],
  hooks: [
    hook('battleStart', [
      statusEffect({
        id: 'holy-lance-speed', effectGroupId: -15500301, nameKey: 'raidBuffHolyLanceSpeed',
        target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
        modifiers: [{ id: 'holy-lance-speed', channel: 'speedRate', rate: 0.3 }],
      }),
      statusEffect({
        id: 'holy-lance-barrier', effectGroupId: -15500401, nameKey: 'raidBuffHolyLanceBarrier',
        detailKey: 'raidDetailHolyLanceBarrier', target: 'selfAndTopAttackOther', targetCount: 3,
        duration: 3, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      }),
    ]),
    hook('roundStart', [statusEffect({
      id: 'holy-lance-attack', effectGroupId: -15500302, nameKey: 'raidBuffHolyLanceAttack',
      detailKey: 'raidHolyLanceP1AttackHint', target: 'self', duration: null,
      statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      attackSnapshotRatio: { type: 'configuredRate', key: 'holyLanceP1Attack' },
    })], { condition: { type: 'roundAtLeast', round: 2 }, onceKey: 'holy-lance-p1-attack' }),
  ],
  ignoredKeys: ['raidIgnoredHolyLanceBarrier', 'raidIgnoredHolyLanceSelfDamageAmount'],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillHolyLanceS1', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 320, hits: 8, damageType: 'phys' }],
      hooks: [
        hook('beforeDamage', [selfDamage, selfDamage]),
        hook('beforeDamage', [vulnerability], { condition: { type: 'otherLineupElementCountAtMost', element: RAID_ELEMENTS.RED, count: 1 } }),
        hook('beforeDamage', [{ ...vulnerability, durationRounds: 2 }], { condition: { type: 'otherLineupElementCountAtLeast', element: RAID_ELEMENTS.RED, count: 2 } }),
      ],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillHolyLanceS2', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [selfDamage])],
      damageSteps: [{ stat: 'ATK', hits: 10, damageType: 'phys', percent: {
        type: 'conditional', condition: { type: 'bossStatusCountAtLeast', count: 1 }, whenTrue: 540, whenFalse: 360,
      } }],
    },
  },
}
