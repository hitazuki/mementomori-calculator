import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, statusEffect } from '../shared.js'

const selfDamageHook = hook('beforeDamage', [{ type: 'emitEvent', event: 'selfDamage' }])

export default {
  id: 112, nameKey: 'raidCharSpringShizu', speed: 3582, element: RAID_ELEMENTS.RED, normal: normalPhysical, permanentModifiers: [],
  hooks: [
    hook('battleStart', [statusEffect({
      id: 'shizu-defense-atk', effectGroupId: 11200320101, nameKey: 'raidBuffShizuDefenseAttack', target: 'self', duration: null,
      statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      symbolicModifiers: [{ kind: 'targetBaseDefenseOverTargetAttack', coefficient: 2 }],
    })]),
    hook('actionStart', [bossStatusEffect({
      id: 'shizu-damage-taken', effectGroupId: 11200430103, nameKey: 'raidDebuffShizuDamageTaken', durationRounds: 2,
      addStacks: 1, maxStacks: 1, damageRatePerStack: 0.1,
    })], { every: 4, offset: 1 }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillShizuS1', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 580, hits: 8, damageType: 'phys' }],
      hooks: [selfDamageHook, hook('beforeDamage', [bossStatusEffect({
        id: 'shizu-speed-down', effectGroupId: 11200120202, nameKey: 'raidDebuffShizuSpeedDown', durationRounds: 2,
        addStacks: 1, maxStacks: 1,
        condition: { type: 'probabilityEnabled', key: 'shizuSpeedDown' }, recordSkipped: true,
      })])],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillShizuS2', cooldown: 4, damageType: 'phys', hooks: [selfDamageHook],
      damageSteps: [{ stat: 'ATK', percent: 2280, hits: 1, damageType: 'phys', conditionKey: 'raidConditionDummyHigherHp' }],
    },
  },
}
