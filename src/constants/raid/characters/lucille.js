import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

const selfDamageHook = hook('beforeDamage', [{ type: 'emitEvent', event: 'selfDamage' }])

const radiantLight = bossStatusEffect({
  id: 'lucille-radiant-light', effectGroupId: 8900430101, nameKey: 'raidDebuffLucilleRadiantLight',
  durationRounds: 2, addStacks: 1, maxStacks: 5, damageRatePerStack: 0.02,
})

export default {
  id: 89, nameKey: 'raidCharLucille', speed: 3525, element: RAID_ELEMENTS.RED, normal: normalPhysical, permanentModifiers: [],
  eventHooks: [{ event: 'selfDamage', effects: [radiantLight] }],
  hooks: [hook('battleStart', [
    statusEffect({
      id: 'lucille-attack', effectGroupId: 8900330101, nameKey: 'raidBuffLucilleAttack', target: 'all', duration: null,
      statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      symbolicModifiers: [{ kind: 'sourceAttackOverTargetAttack', coefficient: 0.25, sourceId: 89 }],
    }),
    statusEffect({
      id: 'lucille-red-speed', effectGroupId: 8900340201, nameKey: 'raidBuffLucilleSpeed', target: 'all', targetElement: RAID_ELEMENTS.RED,
      duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      modifiers: [{ id: 'lucille-red-speed', channel: 'speedRate', rate: 0.2 }],
    }),
  ])],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillLucilleS1', cooldown: 4, damageType: 'phys', hooks: [selfDamageHook],
      damageSteps: [{
        stat: 'ATK',
        percent: { type: 'bossStatusThresholds', values: [420, 530, 730] },
        hits: 5, damageType: 'phys',
      }],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillLucilleS2', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 580, hits: 5, damageType: 'phys' }],
      hooks: [
        selfDamageHook,
        hook('afterDamage', [{
          type: 'cooldownReduction', id: 'lucille-cooldown-reduction', nameKey: 'raidEffectCooldownReduction', target: 'topAttack',
          targetCount: 1, amount: 2,
        }], {
          onceKey: 'lucilleCooldownReduction',
          condition: { type: 'bossStacksAtLeast', statusId: 'lucille-radiant-light', count: 5 },
        }),
      ],
    },
  },
}
