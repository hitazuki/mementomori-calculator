import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

const activeHeal = { type: 'emitEvent', event: 'activeSkillHeal', target: 'all', targetCount: 1 }
const light = statusEffect({
  id: 'golden-artoria-sword-light', effectGroupId: 15400330101, nameKey: 'raidBuffGoldenArtoriaSwordLight',
  detailKey: 'raidDetailGoldenArtoriaSwordLight', target: 'all', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
})

export default {
  id: 154, nameKey: 'raidCharGoldenArtoria', speed: 3272, element: RAID_ELEMENTS.GREEN, normal: normalPhysical,
  runtime: { counters: { activeHealingTriggers: 0 }, flags: {} },
  counterLabels: { activeHealingTriggers: 'raidCounterGoldenArtoriaHealing' },
  permanentModifiers: [], derivedModifiers: [],
  eventHooks: [{ event: 'activeSkillHeal', effects: [
    { type: 'changeCounter', counter: 'activeHealingTriggers', amount: 1, max: 15,
      id: 'golden-artoria-active-healing', nameKey: 'raidCounterGoldenArtoriaHealing' },
    light,
  ] }],
  hooks: [
    hook('battleStart', [statusEffect({
      id: 'golden-artoria-companionship', effectGroupId: 15400430301, nameKey: 'raidBuffGoldenArtoriaCompanionship',
      target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    })]),
    hook('actionStart', [
      statusEffect({
        id: 'golden-artoria-magic-defense', effectGroupId: 15400400101, nameKey: 'raidBuffGoldenArtoriaMagicDefense',
        target: 'selfAndTopAttackOther', targetCount: 2, duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      }),
      statusEffect({
        id: 'golden-artoria-team-hp', effectGroupId: 15400400102, nameKey: 'raidBuffGoldenArtoriaTeamHp',
        target: 'selfAndTopAttackOther', targetCount: 2, duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
        condition: { type: 'otherLineupElementInCountAtLeast', elements: [RAID_ELEMENTS.GREEN, RAID_ELEMENTS.LIGHT], count: 2 },
      }),
    ], { condition: { type: 'roundAtMost', round: 1 }, onceKey: 'golden-artoria-first-action-defense' }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillGoldenArtoriaS1', cooldown: 4, damageType: 'phys',
      damageSteps: [{ stat: 'ATK', percent: 720, hits: 1, originalTargetCount: 3, damageType: 'phys' }],
      hooks: [hook('beforeDamage', [activeHeal, statusEffect({
        id: 'golden-artoria-debuff-resist', effectGroupId: 15400140301, nameKey: 'raidBuffGoldenArtoriaDebuffResist',
        target: 'all', duration: 2, statusClass: RAID_STATUS_CLASSES.REMOVABLE_BUFF,
      })])],
      ignoredKeys: ['raidIgnoredHealing', 'raidIgnoredGoldenArtoriaIncomingHealing', 'raidIgnoredMaxHpUp', 'raidIgnoredDefenseBuff', 'raidIgnoredIncomingDamageReduction', 'raidIgnoredGoldenArtoriaDebuffResist'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillGoldenArtoriaS2', cooldown: 4, damageType: 'phys',
      damageSteps: [{
        stat: 'ATK', percent: { type: 'conditional', condition: { type: 'counterAtLeast', counter: 'activeHealingTriggers', count: 15 }, whenTrue: 2160, whenFalse: 540 },
        hits: 4, damageType: 'phys',
      }],
      hooks: [hook('beforeDamage', [activeHeal])],
      ignoredKeys: ['raidIgnoredHealing', 'raidIgnoredGoldenArtoriaIncomingHealing', 'raidIgnoredMaxHpUp', 'raidIgnoredDefenseBuff', 'raidIgnoredIncomingDamageReduction'],
    },
  },
}
