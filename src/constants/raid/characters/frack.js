import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

const selfDamageHook = hook('beforeDamage', [{ type: 'emitEvent', event: 'selfDamage' }])
const smileTalent = statusEffect({
  id: 'frack-smile-talent', effectGroupId: 12200330101, nameKey: 'raidBuffFrackSmileTalent', target: 'self', duration: 1,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'frack-smile-talent', channel: 'speedRate', rate: 0.3 }],
})

export default {
  id: 122, nameKey: 'raidCharFrack', speed: 3048, element: RAID_ELEMENTS.RED, normal: normalPhysical, permanentModifiers: [],
  hooks: [
    hook('battleStart', [smileTalent]),
    hook('actionStart', [smileTalent], { every: 1, offset: 2, condition: { type: 'bossStatusCountAtLeast', count: 3 } }),
    hook('actionStart', [
      statusEffect({
        id: 'frack-attack-self', effectGroupId: 12200430101, nameKey: 'raidBuffFrackAttack', target: 'self', duration: 2,
        statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
        symbolicModifiers: [{ kind: 'sourceAttackOverTargetAttack', coefficient: 0.3, sourceId: 122 }],
      }),
      statusEffect({
        id: 'frack-attack-other', effectGroupId: 12200430101, nameKey: 'raidBuffFrackAttack', target: 'topAttackOther', targetCount: 2, duration: 2,
        statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
        symbolicModifiers: [{ kind: 'sourceAttackOverTargetAttack', coefficient: 0.3, sourceId: 122 }],
      }),
      statusEffect({
        id: 'frack-debuff-hit', effectGroupId: 12200430102, nameKey: 'raidBuffFrackDebuffHit', target: 'self', duration: 2,
        statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      }),
    ], { onceKey: 'frack-first-action' }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillFrackS1', cooldown: 4, damageType: 'phys', hooks: [
        selfDamageHook,
        hook('beforeDamage', [
          bossStatusEffect({ id: 'frack-avoidance-down', effectGroupId: 12200150201, nameKey: 'raidDebuffFrackAvoidanceDown', durationRounds: 4, damageRatePerStack: 0 }),
          bossStatusEffect({ id: 'frack-healing-down', effectGroupId: 12200150202, nameKey: 'raidDebuffFrackHealingDown', durationRounds: 4, damageRatePerStack: 0 }),
        ]),
      ],
      damageSteps: [{ stat: 'ATK', percent: 790, hits: 1, damageType: 'phys', originalTargetCount: 5 }],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillFrackS2', cooldown: 4, damageType: 'phys', hooks: [selfDamageHook],
      damageSteps: [{
        stat: 'ATK',
        percent: { type: 'conditional', condition: { type: 'actorHasStatus', statusId: 'frack-smile-talent' }, whenTrue: 1120, whenFalse: 560 },
        hits: 5, damageType: 'phys',
      }],
    },
  },
}
