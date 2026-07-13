import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

const selfDamage = { type: 'emitEvent', event: 'selfDamage' }
const repeatCondition = { type: 'counterAtLeast', counter: 'analysis', count: 3 }

const analysis = statusEffect({
  id: 'aishe-analysis', effectGroupId: 13000340101, nameKey: 'raidBuffAisheAnalysis', target: 'self', duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{
    id: 'aishe-analysis', channel: 'attackRate',
    rate: { type: 'counterLinear', counter: 'analysis', base: 0, perStack: 0.1, max: 0.6 },
  }],
})

const analysisSpeed = statusEffect({
  id: 'aishe-analysis-speed', effectGroupId: 13000330102, nameKey: 'raidBuffAisheSpeed', target: 'self', duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  modifiers: [{ id: 'aishe-analysis-speed', channel: 'speedRate', rate: 0.3 }],
  condition: { type: 'counterAtLeast', counter: 'analysis', count: 6 },
})

export default {
  id: 130, nameKey: 'raidCharAishe', speed: 3424, element: RAID_ELEMENTS.RED, normal: normalPhysical,
  runtime: { counters: { analysis: 0 }, flags: {} }, counterLabels: { analysis: 'raidBuffAisheAnalysis' },
  permanentModifiers: [],
  eventHooks: [{ event: 'selfDamage', effects: [
    { type: 'changeCounter', counter: 'analysis', amount: 1, max: 6, id: 'aishe-analysis', nameKey: 'raidBuffAisheAnalysis', eventType: 'counter' },
    analysis,
    analysisSpeed,
  ] }],
  hooks: [hook('battleStart', [statusEffect({
    id: 'aishe-barrier', effectGroupId: 13000420201, nameKey: 'raidBuffAisheBarrier', target: 'self', duration: null,
    statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
  })])],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillAisheS1', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [selfDamage])],
      damageSteps: [
        {
          stat: 'ATK', percent: 670, hits: 4, damageType: 'phys',
          afterEffects: [{ ...selfDamage, condition: repeatCondition }],
        },
        {
          stat: 'ATK', percent: 670,
          hits: { type: 'conditional', condition: repeatCondition, whenTrue: 4, whenFalse: 0 },
          damageType: 'phys',
        },
      ],
      ignoredKeys: ['raidIgnoredEnemyBuffTurnReduction', 'raidIgnoredShield'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillAisheS2', cooldown: 4, damageType: 'phys',
      hooks: [hook('beforeDamage', [selfDamage])],
      damageSteps: [{
        stat: 'ATK', percent: 1520, hits: 5, damageType: 'phys', conditionKey: 'raidConditionDummyHighHp',
      }],
    },
  },
}
