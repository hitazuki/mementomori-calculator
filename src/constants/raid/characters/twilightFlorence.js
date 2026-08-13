import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, statusEffect } from '../shared.js'

const twilightBond = statusEffect({
  id: 'twilight-florence-bond', effectGroupId: 15000320101, nameKey: 'raidBuffTwilightFlorenceBond',
  target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{
    id: 'twilight-florence-bond', channel: 'attackRate',
    rate: { type: 'counterLinear', counter: 'twilightBondStacks', base: 0, perStack: 0.06, max: 0.6 },
  }],
})

const activeHeal = { type: 'emitEvent', event: 'activeSkillHeal', target: 'all', targetCount: 1 }

export default {
  id: 150, nameKey: 'raidCharTwilightFlorence', speed: 3077, element: RAID_ELEMENTS.GREEN,
  normal: {
    key: 'normal', nameKey: 'raidSkillNormalPhysical', damageType: 'phys',
    damageSteps: [{
      stat: 'ATK',
      percent: {
        type: 'conditional', condition: { type: 'actorHasStatus', statusId: 'twilight-florence-enhanced-normal' },
        whenTrue: 390, whenFalse: 100,
      },
      hits: 1, originalTargetCount: 5, damageType: 'phys',
    }],
    hooks: [hook('afterDamage', [{
      ...activeHeal, targetCount: 3,
      condition: { type: 'actorHasStatus', statusId: 'twilight-florence-enhanced-normal' },
    }])],
    ignoredKeys: ['raidIgnoredHealing', 'raidIgnoredActionControlRemoval'],
  },
  runtime: { counters: { twilightBondStacks: 0 }, flags: {} },
  counterLabels: { twilightBondStacks: 'raidBuffTwilightFlorenceBond' },
  permanentModifiers: [], derivedModifiers: [],
  eventHooks: [{
    event: 'activeSkillHeal',
    effects: [
      {
        type: 'changeCounter', counter: 'twilightBondStacks', amount: 1, max: 10,
        id: 'twilight-florence-bond-stack', nameKey: 'raidBuffTwilightFlorenceBond', eventType: 'counter',
      },
      twilightBond,
    ],
  }],
  hooks: [
    hook('battleStart', [
      statusEffect({
        id: 'twilight-florence-defense', effectGroupId: 15000330301, nameKey: 'raidBuffTwilightFlorenceBondDefense',
        target: 'self', duration: 10, modifiers: [],
      }),
      statusEffect({
        id: 'twilight-florence-physical-defense', effectGroupId: 15000330302, nameKey: 'raidBuffTwilightFlorenceBondPhysicalDefense',
        target: 'self', duration: 10, modifiers: [],
      }),
      statusEffect({
        id: 'twilight-florence-enhanced-normal', effectGroupId: 15000430101, nameKey: 'raidBuffTwilightFlorenceKnight',
        target: 'self', duration: 10, modifiers: [],
      }),
      statusEffect({
        id: 'twilight-florence-durability', effectGroupId: 15000440102, nameKey: 'raidBuffTwilightFlorenceKnightDurability',
        target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
      }),
    ]),
    hook('roundStart', [statusEffect({
      id: 'twilight-florence-vow', effectGroupId: 15000300201, nameKey: 'raidBuffTwilightFlorenceVow',
      target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
    })], {
      everyRounds: 1, roundOffset: 7,
      condition: { type: 'counterAtLeast', counter: 'twilightBondStacks', count: 10 },
      onceKey: 'twilight-florence-vow-granted',
    }),
  ],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillTwilightFlorenceS1', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [{
        ...activeHeal,
        condition: { type: 'roundAtMost', round: 6 },
      }])],
      damageSteps: [{
        stat: 'ATK', percent: {
          type: 'conditional', condition: { type: 'roundAtLeast', round: 7 }, whenTrue: 1960, whenFalse: 980,
        },
        hits: 3, damageType: 'phys',
      }],
      ignoredKeys: [
        'raidIgnoredHealing', 'raidIgnoredCriticalRateUp', 'raidIgnoredDefenseBuff',
        'raidIgnoredIncomingDamageReduction', 'raidIgnoredMaxHpUp', 'raidIgnoredActionControlRemoval',
      ],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillTwilightFlorenceS2', cooldown: 4, damageType: 'phys',
      condition: { type: 'actorHasStatus', statusId: 'twilight-florence-vow' }, hooks: [],
      damageSteps: [{
        stat: 'ATK', percent: 1050,
        hits: { type: 'conditional', condition: { type: 'guaranteedCritical' }, whenTrue: 10, whenFalse: 6 },
        damageType: 'phys',
      }],
      ignoredKeys: ['raidIgnoredCriticalRateUp'],
    },
  },
}
