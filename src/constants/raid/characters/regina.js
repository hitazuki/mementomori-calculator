import { RAID_ELEMENTS, RAID_STATUS_CLASSES, bossStatusEffect, hook, normalPhysical, removeStatusEffect, statusEffect } from '../shared.js'

const remnant = statusEffect({
  id: 'regina-remnant', effectGroupId: 13700300101, nameKey: 'raidBuffReginaRemnant', target: 'self', duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

const remnantAttack = statusEffect({
  id: 'regina-remnant-attack', effectGroupId: 13700320201, nameKey: 'raidBuffReginaRemnantAttack',
  target: 'topAttack', targetCount: 2, duration: 1, modifiers: [
    { id: 'regina-remnant-attack', channel: 'attackRate', rate: 0.3 },
  ],
})

const treasureHp = statusEffect({
  id: 'regina-treasure-hp', effectGroupId: 13700440201, nameKey: 'raidBuffReginaTreasureHp',
  target: 'topAttack', targetCount: 1, duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
})

export default {
  id: 137, nameKey: 'raidCharRegina', speed: 2856, element: RAID_ELEMENTS.DARK, normal: normalPhysical,
  runtime: { counters: { remnant: 10, teamCriticalHits: 0 }, flags: {} },
  counterLabels: { remnant: 'raidCounterReginaRemnant', teamCriticalHits: 'raidCounterTeamCriticalHits' },
  permanentModifiers: [], derivedModifiers: [],
  eventHooks: [{
    event: 'criticalHit',
    effects: [{ type: 'changeCounter', counter: 'teamCriticalHits', amount: 1, max: 999, record: false }],
  }],
  hooks: [
    hook('battleStart', [remnant, treasureHp]),
    hook('roundStart', [
      remnantAttack,
      { type: 'changeCounter', id: 'regina-remnant-consume', nameKey: 'raidBuffReginaRemnant', counter: 'remnant', amount: -1, min: 0 },
      removeStatusEffect({
        id: 'regina-remnant-expire', nameKey: 'raidBuffReginaRemnant', target: 'self', statusId: 'regina-remnant',
        condition: { type: 'counterAtMost', counter: 'remnant', count: 0 },
      }),
    ], { condition: { type: 'counterAtLeast', counter: 'remnant', count: 1 } }),
    hook('roundStart', [
      { type: 'changeCounter', id: 'regina-remnant-cooldown-consume', nameKey: 'raidBuffReginaRemnant', counter: 'remnant', amount: -4, min: 0, condition: { type: 'counterAtLeast', counter: 'teamCriticalHits', count: 5 } },
      { type: 'cooldownReduction', id: 'regina-remnant-cooldown', target: 'topAttack', targetCount: 1, amount: 2, condition: { type: 'counterAtLeast', counter: 'teamCriticalHits', count: 5 } },
    ], { condition: { type: 'roundAtLeast', round: 3 }, onceKey: 'reginaRoundThreeCooldown' }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillReginaS1', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [bossStatusEffect({
        id: 'regina-damage-taken', effectGroupId: 13700120201, nameKey: 'raidDebuffReginaDamageTaken',
        durationRounds: 4, damageRatePerStack: 0.1,
      })])],
      damageSteps: [{ stat: 'ATK', percent: 480, hits: 1, originalTargetCount: 5, damageType: 'phys', conditionKey: 'raidConditionLoggedTargetAttackNotLower' }],
      ignoredKeys: ['raidIgnoredBaseAttackComparisonBranch', 'raidIgnoredCriticalRateUp', 'raidIgnoredMaxHpUp', 'raidIgnoredIncomingDamageReduction'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillReginaS2', cooldown: 4, damageType: 'phys', hooks: [],
      damageSteps: [{ stat: 'ATK', percent: 1520, hits: 1, originalTargetCount: 2, damageType: 'phys', conditionKey: 'raidConditionLoggedTargetAttackNotLower' }],
      ignoredKeys: ['raidIgnoredBaseAttackComparisonBranch', 'raidIgnoredCriticalRateUp', 'raidIgnoredMaxHpUp', 'raidIgnoredIncomingDamageReduction'],
    },
  },
}
