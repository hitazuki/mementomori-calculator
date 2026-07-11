export const RAID_STATUS_CLASSES = Object.freeze({
  REMOVABLE_BUFF: 'removableBuff',
  UNREMOVABLE_STATE: 'unremovableState',
  REMOVABLE_DEBUFF: 'removableDebuff',
  UNREMOVABLE_DEBUFF: 'unremovableDebuff',
  INTERNAL_MARK: 'internalMark',
})

export const RAID_TABLE_CHARACTER_IDS = Object.freeze({
  FLORENCE: 8,
  FENRIR: 7,
  LUKE: 30,
  MERLYN: 26,
  MERTILLIER: 29,
  RUSTICA: 113,
  ARTORIA: 93,
  LIBERIA: 128,
  SPRING_SHIZU: 112,
})

export const RAID_TABLE_ROSTER = Object.freeze([
  RAID_TABLE_CHARACTER_IDS.FLORENCE,
  RAID_TABLE_CHARACTER_IDS.FENRIR,
  RAID_TABLE_CHARACTER_IDS.LUKE,
  RAID_TABLE_CHARACTER_IDS.MERLYN,
  RAID_TABLE_CHARACTER_IDS.MERTILLIER,
  RAID_TABLE_CHARACTER_IDS.RUSTICA,
  RAID_TABLE_CHARACTER_IDS.ARTORIA,
  RAID_TABLE_CHARACTER_IDS.LIBERIA,
  RAID_TABLE_CHARACTER_IDS.SPRING_SHIZU,
])

export const DEFAULT_RAID_LINEUP = Object.freeze(RAID_TABLE_ROSTER.slice(0, 5))
export const DEFAULT_RAID_ATTACK_PRIORITY = Object.freeze([
  RAID_TABLE_CHARACTER_IDS.FLORENCE,
  RAID_TABLE_CHARACTER_IDS.FENRIR,
  RAID_TABLE_CHARACTER_IDS.LUKE,
  RAID_TABLE_CHARACTER_IDS.MERLYN,
  RAID_TABLE_CHARACTER_IDS.MERTILLIER,
])

const ELEMENT = Object.freeze({ BLUE: 1, RED: 2, GREEN: 3, LIGHT: 4, DARK: 5 })

const normalPhysical = Object.freeze({
  key: 'normal', nameKey: 'raidSkillNormalPhysical', damageType: 'phys',
  damageSteps: [{ stat: 'ATK', percent: 100, hits: 1, damageType: 'phys' }],
})
const normalMagic = Object.freeze({
  key: 'normal', nameKey: 'raidSkillNormalMagic', damageType: 'mag',
  damageSteps: [{ stat: 'ATK', percent: 100, hits: 1, damageType: 'mag' }],
})

function statusEffect({ id, effectGroupId, nameKey, target, duration, statusClass = RAID_STATUS_CLASSES.REMOVABLE_BUFF, modifiers = [], symbolicModifiers = [], ...rest }) {
  return { type: 'status', id, effectGroupId, nameKey, target, duration, statusClass, modifiers, symbolicModifiers, ...rest }
}

function bossStatusEffect({ id, effectGroupId, nameKey, durationRounds = null, addStacks = 1, maxStacks = 1, damageRatePerStack = 0, ...rest }) {
  return {
    type: 'bossStatus', id, effectGroupId, nameKey, durationRounds, addStacks, maxStacks,
    damageRatePerStack, statusClass: RAID_STATUS_CLASSES.REMOVABLE_DEBUFF, ...rest,
  }
}

export const RAID_TABLE_CHARACTERS = Object.freeze({
  [RAID_TABLE_CHARACTER_IDS.FLORENCE]: {
    id: 8, nameKey: 'raidCharFlorence', speed: 3022, element: ELEMENT.BLUE, normal: normalPhysical,
    permanentModifiers: [
      { id: 'florence-atk', channel: 'attackRate', rate: 0.3, nameKey: 'raidBuffFlorenceAttack' },
      { id: 'florence-damage', channel: 'damageRate', rate: 0.3, nameKey: 'raidBuffFlorenceDamage' },
    ],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillFlorenceS1', cooldown: 5, damageType: 'phys',
        damageSteps: [{ stat: 'ATK', percent: 525, hits: 6, damageType: 'phys', criticalExtraHits: { maxHits: 10 } }],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillFlorenceS2', cooldown: 4, damageType: 'phys',
        damageSteps: [{ stat: 'ATK', percent: 525, hits: 1, damageType: 'phys', originalTargetCount: 5 }],
        ignoredKeys: ['raidIgnoredKillFollowup'],
      },
    },
  },
  [RAID_TABLE_CHARACTER_IDS.FENRIR]: {
    id: 7, nameKey: 'raidCharFenrir', speed: 2894, element: ELEMENT.BLUE, normal: normalMagic, permanentModifiers: [],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillFenrirS1', cooldown: 4, damageType: 'mag',
        damageSteps: [{ stat: 'ATK', percent: 720, hits: 1, damageType: 'mag' }],
        effects: [
          { type: 'cooldownReduction', target: 'adjacent', targetCount: 2, amount: 2, phase: 'afterDamage' },
          statusEffect({
            id: 'fenrir-atk', effectGroupId: 700160202, nameKey: 'raidBuffFenrirAttack', target: 'adjacent', targetCount: 2,
            duration: 2, phase: 'afterDamage', modifiers: [{ id: 'fenrir-atk', channel: 'attackRate', rate: 0.2 }],
          }),
        ],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillFenrirS2', cooldown: 4, damageType: 'mag',
        damageSteps: [{ stat: 'ATK', percent: 380, hits: 1, damageType: 'mag', originalTargetCount: 5 }],
        ignoredKeys: ['raidIgnoredDebuffCleanse'],
      },
    },
  },
  [RAID_TABLE_CHARACTER_IDS.LUKE]: {
    id: 30, nameKey: 'raidCharLuke', speed: 3093, element: ELEMENT.GREEN, normal: normalPhysical, permanentModifiers: [],
    battleStartEffects: [
      statusEffect({ id: 'luke-critical-resist', effectGroupId: 3000420101, nameKey: 'raidBuffLukeCriticalResist', target: 'self', duration: 4, phase: 'battleStart' }),
      statusEffect({ id: 'luke-critical-resist', effectGroupId: 3000420101, nameKey: 'raidBuffLukeCriticalResist', target: 'adjacent', targetCount: 1, duration: 3, phase: 'battleStart' }),
    ],
    afterCriticalHitBossStatus: bossStatusEffect({
      id: 'luke-damage-taken', effectGroupId: 3000330101, nameKey: 'raidDebuffLukeDamageTaken',
      durationRounds: null, addStacks: 1, maxStacks: 5, damageRatePerStack: 0.15,
    }),
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillLukeS1', cooldown: 4, damageType: 'phys',
        damageSteps: [
          { stat: 'ATK', percent: 540, hits: 1, damageType: 'phys', originalTargetCount: 5 },
          { stat: 'STR', percent: 150, hits: 1, damageType: 'direct' },
        ],
        ignoredKeys: ['raidIgnoredEnemyAttackDown'],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillLukeS2', cooldown: 5, damageType: 'direct',
        damageSteps: [{ stat: 'STR', percent: 780, hits: 1, damageType: 'direct', conditionKey: 'raidConditionDummyNoShield' }],
      },
    },
  },
  [RAID_TABLE_CHARACTER_IDS.MERLYN]: {
    id: 26, nameKey: 'raidCharMerlyn', speed: 2888, element: ELEMENT.GREEN, normal: normalMagic, permanentModifiers: [],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillMerlynS1', cooldown: 4, damageType: 'support', damageSteps: [],
        effects: [
          statusEffect({
            id: 'merlyn-atk', effectGroupId: 2600130102, nameKey: 'raidBuffMerlynAttack', target: 'topAttack', targetCount: 2,
            duration: 2, phase: 'afterDamage', modifiers: [{ id: 'merlyn-atk', channel: 'attackRate', rate: 0.4 }],
          }),
          statusEffect({
            id: 'merlyn-critical-damage', effectGroupId: 2600160103, nameKey: 'raidBuffMerlynCriticalDamage', target: 'topAttack', targetCount: 2,
            duration: 2, phase: 'afterDamage', modifiers: [{ id: 'merlyn-critical-damage', channel: 'criticalDamageBonus', rate: 0.4 }],
          }),
        ],
        ignoredKeys: ['raidIgnoredDebuffCleanse'],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillMerlynS2', cooldown: 4, damageType: 'mag',
        damageSteps: [{ stat: 'ATK', percent: 380, hits: 1, damageType: 'mag', originalTargetCount: 3 }],
        ignoredKeys: ['raidIgnoredBuffRemoval', 'raidIgnoredHealing'],
      },
    },
  },
  [RAID_TABLE_CHARACTER_IDS.MERTILLIER]: {
    id: 29, nameKey: 'raidCharMertillier', speed: 2796, element: ELEMENT.GREEN, normal: normalMagic, permanentModifiers: [],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillMertillierS1', cooldown: 4, damageType: 'mag',
        damageSteps: [{ stat: 'ATK', percent: 410, hits: 1, damageType: 'mag', originalTargetCount: 4 }],
        effects: [statusEffect({ id: 'mertillier-shield', effectGroupId: 2900130201, nameKey: 'raidBuffMertillierShield', target: 'self', duration: 3, phase: 'afterDamage' })],
        ignoredKeys: ['raidIgnoredShield'],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillMertillierS2', cooldown: 4, damageType: 'support', damageSteps: [],
        effects: [
          { type: 'cooldownReduction', target: 'topAttack', targetCount: 1, amount: 2, phase: 'afterDamage' },
          statusEffect({
            id: 'mertillier-atk-defense', effectGroupId: 2900260102, nameKey: 'raidBuffMertillierAttackDefense', target: 'topAttack', targetCount: 1,
            duration: 3, phase: 'afterDamage', modifiers: [{ id: 'mertillier-atk', channel: 'attackRate', rate: 0.85, nameKey: 'raidBuffMertillierAttack' }],
          }),
        ],
        ignoredKeys: ['raidIgnoredDefenseBuff', 'raidIgnoredDebuffCleanse'],
      },
    },
  },
  [RAID_TABLE_CHARACTER_IDS.RUSTICA]: {
    id: 113, nameKey: 'raidCharRustica', speed: 3187, element: ELEMENT.LIGHT, normal: normalPhysical, permanentModifiers: [],
    passives: [
      { trigger: 'actionStart', condition: { type: 'anyRemovableBuffCountAtLeast', count: 4 }, effects: [statusEffect({
        id: 'rustica-action-atk', effectGroupId: 11300430301, nameKey: 'raidBuffRusticaActionAttack', target: 'self', duration: 1,
        phase: 'actionStart', statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
        modifiers: [{ id: 'rustica-action-atk', channel: 'attackRate', rate: 0.3 }],
      })] },
      { trigger: 'actionEnd', every: 8, offset: 1, effects: [
        statusEffect({ id: 'rustica-shield-self', effectGroupId: 11300340102, nameKey: 'raidBuffRusticaShield', target: 'self', duration: 8, phase: 'actionEnd', statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE }),
        statusEffect({ id: 'rustica-shield-ally', effectGroupId: 11300340101, nameKey: 'raidBuffRusticaShield', target: 'highestBuffCountOther', duration: 8, phase: 'actionEnd', statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE }),
      ] },
      { trigger: 'actionEnd', condition: { type: 'anyRemovableBuffCountAtLeast', count: 3 }, effects: [statusEffect({
        id: 'rustica-guardian', effectGroupId: 11300400101, nameKey: 'raidBuffRusticaGuardian', target: 'self', duration: 1,
        phase: 'actionEnd', statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      })] },
    ],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillRusticaS1', cooldown: 4, damageType: 'phys',
        damageSteps: [{ stat: 'ATK', percent: 640, hits: 5, damageType: 'phys' }],
        effects: [statusEffect({ id: 'rustica-hp-drain', effectGroupId: 11300130101, nameKey: 'raidBuffRusticaHpDrain', target: 'highestBuffCount', duration: 4, phase: 'beforeDamage' })],
        ignoredKeys: ['raidIgnoredHpDrain'],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillRusticaS2', cooldown: 4, damageType: 'phys',
        damageSteps: [{ stat: 'ATK', percent: 740, hitsByUse: { base: 4, increment: 1, max: 6, skillKey: 's2' }, damageType: 'phys' }],
        effects: [statusEffect({
          id: 'rustica-s2-atk', effectGroupId: 11300230101, nameKey: 'raidBuffRusticaS2Attack', target: 'highestBuffCount', duration: 4, phase: 'beforeDamage',
          modifiers: [{ id: 'rustica-s2-atk', channel: 'attackRate', rate: 0.3 }],
        })],
      },
    },
  },
  [RAID_TABLE_CHARACTER_IDS.ARTORIA]: {
    id: 93, nameKey: 'raidCharArtoria', speed: 3572, element: ELEMENT.RED, normal: normalPhysical, permanentModifiers: [],
    eventPassives: [{ event: 'selfDamage', type: 'stackSelfAttack', id: 'artoria-justice', nameKey: 'raidBuffArtoriaJustice', maxStacks: 4, ratePerStack: 0.1 }],
    battleStartEffects: [
      statusEffect({
        id: 'artoria-flat-atk', effectGroupId: 9300430101, nameKey: 'raidBuffArtoriaAttack', target: 'lowestSpeedOther', duration: 2,
        phase: 'battleStart', statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
        symbolicModifiers: [{ kind: 'sourceAttackOverTargetAttack', coefficient: 0.5, sourceId: 93 }],
      }),
      statusEffect({
        id: 'artoria-speed', effectGroupId: 9300440201, nameKey: 'raidBuffArtoriaSpeed', target: 'lowestSpeedOther', duration: 2,
        phase: 'battleStart', statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, targetElement: ELEMENT.RED,
        modifiers: [{ id: 'artoria-speed', channel: 'speedRate', rate: 0.2 }],
      }),
    ],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillArtoriaS1', cooldown: 4, damageType: 'phys', beforeDamageEvents: ['selfDamage'],
        damageSteps: [{ stat: 'ATK', percent: 520, hits: 6, damageType: 'phys' }], ignoredKeys: ['raidIgnoredStun'],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillArtoriaS2', cooldown: 4, damageType: 'phys', beforeDamageEvents: ['selfDamage'],
        damageSteps: [{ stat: 'ATK', dynamicPercent: { type: 'artoriaJustice', base: 540, perStack: 150, max: 1140 }, hits: 7, damageType: 'phys' }],
      },
    },
  },
  [RAID_TABLE_CHARACTER_IDS.LIBERIA]: {
    id: 128, nameKey: 'raidCharLiberia', speed: 3597, element: ELEMENT.DARK, normal: normalPhysical, permanentModifiers: [],
    battleStartEffects: [statusEffect({
      id: 'liberia-defense-atk', effectGroupId: 12800330101, nameKey: 'raidBuffLiberiaDefenseAttack', target: 'topAttack', targetCount: 2,
      duration: 4, phase: 'battleStart', statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      symbolicModifiers: [{ kind: 'targetBaseDefenseOverTargetAttack', coefficient: 2 }],
    })],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillLiberiaS1', cooldown: 4, damageType: 'phys',
        damageSteps: [{ stat: 'ATK', percent: 480, hits: 8, damageType: 'phys' }],
        effects: [bossStatusEffect({
          id: 'liberia-sand', effectGroupId: 12800100101, nameKey: 'raidDebuffLiberiaSand', durationRounds: 2,
          addStacks: 2, maxStacks: 4, damageRatePerStack: 0.05, phase: 'beforeDamage', probabilityKey: 'liberiaSand',
        })],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillLiberiaS2', cooldown: 4, damageType: 'phys',
        damageSteps: [{ stat: 'ATK', percent: 780, hits: 5, damageType: 'phys' }],
        afterDamageRules: [{ type: 'resetCooldownsIfBossStacks', bossStatusId: 'liberia-sand', requiredStacks: 4, onceKey: 'liberiaCooldownReset' }],
        ignoredKeys: ['raidIgnoredBuffRemoval'],
      },
    },
  },
  [RAID_TABLE_CHARACTER_IDS.SPRING_SHIZU]: {
    id: 112, nameKey: 'raidCharSpringShizu', speed: 3582, element: ELEMENT.RED, normal: normalPhysical, permanentModifiers: [],
    battleStartEffects: [statusEffect({
      id: 'shizu-defense-atk', effectGroupId: 11200320101, nameKey: 'raidBuffShizuDefenseAttack', target: 'self', duration: null,
      phase: 'battleStart', statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      symbolicModifiers: [{ kind: 'targetBaseDefenseOverTargetAttack', coefficient: 2 }],
    })],
    passives: [{ trigger: 'actionStart', every: 4, offset: 1, effects: [bossStatusEffect({
      id: 'shizu-damage-taken', effectGroupId: 11200430103, nameKey: 'raidDebuffShizuDamageTaken', durationRounds: 2,
      addStacks: 1, maxStacks: 1, damageRatePerStack: 0.1, phase: 'actionStart',
    })] }],
    skills: {
      s1: {
        key: 's1', nameKey: 'raidSkillShizuS1', cooldown: 4, damageType: 'phys', beforeDamageEvents: ['selfDamage'],
        damageSteps: [{ stat: 'ATK', percent: 580, hits: 8, damageType: 'phys' }],
        effects: [bossStatusEffect({
          id: 'shizu-speed-down', effectGroupId: 11200120202, nameKey: 'raidDebuffShizuSpeedDown', durationRounds: 2,
          addStacks: 1, maxStacks: 1, phase: 'beforeDamage', probabilityKey: 'shizuSpeedDown',
        })],
      },
      s2: {
        key: 's2', nameKey: 'raidSkillShizuS2', cooldown: 4, damageType: 'phys', beforeDamageEvents: ['selfDamage'],
        damageSteps: [{ stat: 'ATK', percent: 2280, hits: 1, damageType: 'phys', conditionKey: 'raidConditionDummyHigherHp' }],
      },
    },
  },
})

export function createDefaultRaidTableConfig() {
  return {
    lineup: [...DEFAULT_RAID_LINEUP],
    attackPriority: [...DEFAULT_RAID_ATTACK_PRIORITY],
    speeds: Object.fromEntries(RAID_TABLE_ROSTER.map(id => [id, RAID_TABLE_CHARACTERS[id].speed])),
    guaranteedCritical: true,
    baseCriticalDamageBonus: 1.1,
    probabilityOverrides: { liberiaSand: true, shizuSpeedDown: true },
    turns: 10,
  }
}
