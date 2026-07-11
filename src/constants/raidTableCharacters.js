export const RAID_STATUS_CLASSES = Object.freeze({
  REMOVABLE_BUFF: 'removableBuff',
  UNREMOVABLE_STATE: 'unremovableState',
  INTERNAL_MARK: 'internalMark',
})

export const RAID_TABLE_CHARACTER_IDS = Object.freeze({
  FLORENCE: 8,
  FENRIR: 7,
  LUKE: 30,
  MERLYN: 26,
  MERTILLIER: 29,
  RUSTICA: 113,
})

export const RAID_TABLE_ROSTER = Object.freeze([
  RAID_TABLE_CHARACTER_IDS.FLORENCE,
  RAID_TABLE_CHARACTER_IDS.FENRIR,
  RAID_TABLE_CHARACTER_IDS.LUKE,
  RAID_TABLE_CHARACTER_IDS.MERLYN,
  RAID_TABLE_CHARACTER_IDS.MERTILLIER,
  RAID_TABLE_CHARACTER_IDS.RUSTICA,
])

export const DEFAULT_RAID_LINEUP = Object.freeze(RAID_TABLE_ROSTER.slice(0, 5))
export const DEFAULT_RAID_BENCH_ID = RAID_TABLE_CHARACTER_IDS.RUSTICA

export const DEFAULT_RAID_ACTION_ORDER = Object.freeze([
  RAID_TABLE_CHARACTER_IDS.LUKE,
  RAID_TABLE_CHARACTER_IDS.FLORENCE,
  RAID_TABLE_CHARACTER_IDS.FENRIR,
  RAID_TABLE_CHARACTER_IDS.MERLYN,
  RAID_TABLE_CHARACTER_IDS.MERTILLIER,
])

export const DEFAULT_RAID_ATTACK_PRIORITY = Object.freeze([
  RAID_TABLE_CHARACTER_IDS.FLORENCE,
  RAID_TABLE_CHARACTER_IDS.FENRIR,
  RAID_TABLE_CHARACTER_IDS.LUKE,
  RAID_TABLE_CHARACTER_IDS.MERLYN,
  RAID_TABLE_CHARACTER_IDS.MERTILLIER,
])

const normalPhysical = Object.freeze({
  key: 'normal',
  nameKey: 'raidSkillNormalPhysical',
  damageType: 'phys',
  attackTerms: [{ stat: 'ATK', percent: 100, hits: 1 }],
})

const normalMagic = Object.freeze({
  key: 'normal',
  nameKey: 'raidSkillNormalMagic',
  damageType: 'mag',
  attackTerms: [{ stat: 'ATK', percent: 100, hits: 1 }],
})

function statusEffect({ id, effectGroupId, nameKey, target, duration, statusClass = RAID_STATUS_CLASSES.REMOVABLE_BUFF, modifiers = [], ...rest }) {
  return {
    type: 'status',
    id,
    effectGroupId,
    nameKey,
    target,
    duration,
    statusClass,
    modifiers,
    ...rest,
  }
}

export const RAID_TABLE_CHARACTERS = Object.freeze({
  [RAID_TABLE_CHARACTER_IDS.FLORENCE]: {
    id: RAID_TABLE_CHARACTER_IDS.FLORENCE,
    nameKey: 'raidCharFlorence',
    normal: normalPhysical,
    permanentModifiers: [
      { id: 'florence-atk', channel: 'attackRate', rate: 0.3, nameKey: 'raidBuffFlorenceAttack' },
      { id: 'florence-damage', channel: 'damageDealtRate', rate: 0.3, nameKey: 'raidBuffFlorenceDamage' },
    ],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillFlorenceS1', cooldown: 5, damageType: 'phys',
        attackTerms: [{ stat: 'ATK', percent: 525, hits: 6 }],
        ignoredKeys: ['raidIgnoredCriticalExtraHits'],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillFlorenceS2', cooldown: 4, damageType: 'phys',
        attackTerms: [{ stat: 'ATK', percent: 525, hits: 1 }],
        ignoredKeys: ['raidIgnoredKillFollowup'],
      },
    },
  },
  [RAID_TABLE_CHARACTER_IDS.FENRIR]: {
    id: RAID_TABLE_CHARACTER_IDS.FENRIR,
    nameKey: 'raidCharFenrir',
    normal: normalMagic,
    permanentModifiers: [],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillFenrirS1', cooldown: 4, damageType: 'mag',
        attackTerms: [{ stat: 'ATK', percent: 720, hits: 1 }],
        effects: [
          { type: 'cooldownReduction', target: 'adjacent', targetCount: 2, amount: 2, phase: 'afterDamage' },
          statusEffect({
            id: 'fenrir-atk', effectGroupId: 700160202, nameKey: 'raidBuffFenrirAttack',
            target: 'adjacent', targetCount: 2, duration: 2, phase: 'afterDamage',
            modifiers: [{ id: 'fenrir-atk', channel: 'attackRate', rate: 0.2 }],
          }),
        ],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillFenrirS2', cooldown: 4, damageType: 'mag',
        attackTerms: [{ stat: 'ATK', percent: 380, hits: 1, originalTargetCount: 5 }],
        ignoredKeys: ['raidIgnoredDebuffCleanse'],
      },
    },
  },
  [RAID_TABLE_CHARACTER_IDS.LUKE]: {
    id: RAID_TABLE_CHARACTER_IDS.LUKE,
    nameKey: 'raidCharLuke',
    normal: normalPhysical,
    permanentModifiers: [],
    battleStartEffects: [
      statusEffect({
        id: 'luke-critical-resist', effectGroupId: 3000420101, nameKey: 'raidBuffLukeCriticalResist',
        target: 'self', duration: 4, phase: 'battleStart', modifiers: [],
      }),
      statusEffect({
        id: 'luke-critical-resist', effectGroupId: 3000420101, nameKey: 'raidBuffLukeCriticalResist',
        target: 'adjacent', targetCount: 1, duration: 3, phase: 'battleStart', modifiers: [],
      }),
    ],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillLukeS1', cooldown: 4, damageType: 'phys',
        attackTerms: [{ stat: 'ATK', percent: 540, hits: 1, originalTargetCount: 5 }],
        symbolicTerms: [{ stat: 'STR', percent: 150, hits: 1 }],
        ignoredKeys: ['raidIgnoredGuaranteedCritical', 'raidIgnoredEnemyAttackDown'],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillLukeS2', cooldown: 5, damageType: 'direct', attackTerms: [],
        symbolicTerms: [{ stat: 'STR', percent: 780, hits: 1, conditionKey: 'raidConditionDummyNoShield' }],
      },
    },
  },
  [RAID_TABLE_CHARACTER_IDS.MERLYN]: {
    id: RAID_TABLE_CHARACTER_IDS.MERLYN,
    nameKey: 'raidCharMerlyn',
    normal: normalMagic,
    permanentModifiers: [],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillMerlynS1', cooldown: 4, damageType: 'support', attackTerms: [],
        effects: [
          statusEffect({
            id: 'merlyn-atk', effectGroupId: 2600130102, nameKey: 'raidBuffMerlynAttack',
            target: 'topAttack', targetCount: 2, duration: 2, phase: 'afterDamage',
            modifiers: [{ id: 'merlyn-atk', channel: 'attackRate', rate: 0.4 }],
          }),
          statusEffect({
            id: 'merlyn-critical-damage', effectGroupId: 2600160103, nameKey: 'raidBuffMerlynCriticalDamage',
            target: 'topAttack', targetCount: 2, duration: 2, phase: 'afterDamage', modifiers: [],
          }),
        ],
        ignoredKeys: ['raidIgnoredCriticalDamageBuff', 'raidIgnoredDebuffCleanse'],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillMerlynS2', cooldown: 4, damageType: 'mag',
        attackTerms: [{ stat: 'ATK', percent: 380, hits: 1, originalTargetCount: 3 }],
        ignoredKeys: ['raidIgnoredBuffRemoval', 'raidIgnoredHealing'],
      },
    },
  },
  [RAID_TABLE_CHARACTER_IDS.MERTILLIER]: {
    id: RAID_TABLE_CHARACTER_IDS.MERTILLIER,
    nameKey: 'raidCharMertillier',
    normal: normalMagic,
    permanentModifiers: [],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillMertillierS1', cooldown: 4, damageType: 'mag',
        attackTerms: [{ stat: 'ATK', percent: 410, hits: 1, originalTargetCount: 4 }],
        effects: [statusEffect({
          id: 'mertillier-shield', effectGroupId: 2900130201, nameKey: 'raidBuffMertillierShield',
          target: 'self', duration: 3, phase: 'afterDamage', modifiers: [],
        })],
        ignoredKeys: ['raidIgnoredShield'],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillMertillierS2', cooldown: 4, damageType: 'support', attackTerms: [],
        effects: [
          { type: 'cooldownReduction', target: 'topAttack', targetCount: 1, amount: 2, phase: 'afterDamage' },
          statusEffect({
            id: 'mertillier-atk-defense', effectGroupId: 2900260102, nameKey: 'raidBuffMertillierAttackDefense',
            target: 'topAttack', targetCount: 1, duration: 3, phase: 'afterDamage',
            modifiers: [{ id: 'mertillier-atk', channel: 'attackRate', rate: 0.85, nameKey: 'raidBuffMertillierAttack' }],
          }),
        ],
        ignoredKeys: ['raidIgnoredDefenseBuff', 'raidIgnoredDebuffCleanse'],
      },
    },
  },
  [RAID_TABLE_CHARACTER_IDS.RUSTICA]: {
    id: RAID_TABLE_CHARACTER_IDS.RUSTICA,
    nameKey: 'raidCharRustica',
    normal: normalPhysical,
    permanentModifiers: [],
    passives: [
      {
        trigger: 'actionStart',
        condition: { type: 'anyRemovableBuffCountAtLeast', count: 4 },
        effects: [statusEffect({
          id: 'rustica-action-atk', effectGroupId: 11300430301, nameKey: 'raidBuffRusticaActionAttack',
          target: 'self', duration: 1, phase: 'actionStart', statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
          modifiers: [{ id: 'rustica-action-atk', channel: 'attackRate', rate: 0.3 }],
        })],
      },
      {
        trigger: 'actionEnd', every: 8, offset: 1,
        effects: [
          statusEffect({
            id: 'rustica-shield-self', effectGroupId: 11300340102, nameKey: 'raidBuffRusticaShield',
            target: 'self', duration: 8, phase: 'actionEnd', statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
          }),
          statusEffect({
            id: 'rustica-shield-ally', effectGroupId: 11300340101, nameKey: 'raidBuffRusticaShield',
            target: 'highestBuffCountOther', duration: 8, phase: 'actionEnd', statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
          }),
        ],
      },
      {
        trigger: 'actionEnd',
        condition: { type: 'anyRemovableBuffCountAtLeast', count: 3 },
        effects: [statusEffect({
          id: 'rustica-guardian', effectGroupId: 11300400101, nameKey: 'raidBuffRusticaGuardian',
          target: 'self', duration: 1, phase: 'actionEnd', statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, modifiers: [],
        })],
      },
    ],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillRusticaS1', cooldown: 4, damageType: 'phys',
        attackTerms: [{ stat: 'ATK', percent: 640, hits: 5 }],
        effects: [statusEffect({
          id: 'rustica-hp-drain', effectGroupId: 11300130101, nameKey: 'raidBuffRusticaHpDrain',
          target: 'highestBuffCount', duration: 4, phase: 'beforeDamage', modifiers: [],
        })],
        ignoredKeys: ['raidIgnoredHpDrain'],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillRusticaS2', cooldown: 4, damageType: 'phys',
        attackTerms: [{ stat: 'ATK', percent: 740, hitsByUse: { base: 4, increment: 1, max: 6, skillKey: 's2' } }],
        effects: [statusEffect({
          id: 'rustica-s2-atk', effectGroupId: 11300230101, nameKey: 'raidBuffRusticaS2Attack',
          target: 'highestBuffCount', duration: 4, phase: 'beforeDamage',
          modifiers: [{ id: 'rustica-s2-atk', channel: 'attackRate', rate: 0.3 }],
        })],
      },
    },
  },
})

export function createDefaultRaidTableConfig() {
  return {
    lineup: [...DEFAULT_RAID_LINEUP],
    actionOrder: [...DEFAULT_RAID_ACTION_ORDER],
    attackPriority: [...DEFAULT_RAID_ATTACK_PRIORITY],
    turns: 10,
  }
}

export function replaceRaidBenchMember(order, nextBenchId, previousBenchId) {
  return order.map(id => (id === nextBenchId ? previousBenchId : id))
}
