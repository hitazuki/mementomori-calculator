import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_RAID_ATTACK_PRIORITY,
  DEFAULT_RAID_CHARACTER_LEVEL,
  DEFAULT_RAID_CRITICAL_DAMAGE_BONUS,
  DEFAULT_RAID_DEFENSE_PENETRATION,
  DEFAULT_RAID_LINEUP,
  DEFAULT_RAID_PM_DEFENSE_PENETRATION,
  RAID_BOSS_TEMPLATE_IDS,
  RAID_BOSS_TEMPLATES,
  RAID_ELEMENTS,
  RAID_JOB_FLAGS,
  RAID_STATUS_CLASSES,
  RAID_TABLE_CHARACTERS,
  RAID_TABLE_CHARACTER_IDS,
  RAID_TABLE_ROSTER,
  createDefaultRaidTableConfig,
} from '../src/constants/raidTableCharacters.js'
import {
  DEFAULT_RAID_ENVIRONMENT,
  DEFAULT_RAID_MECHANICS,
  calculateRaidElementBonus,
  compileRaidProgram,
  simulateRaidTable,
} from '../src/engine/raidTableCalc.js'
import { bossStatusEffect, hook, statusEffect } from '../src/constants/raid/shared.js'

const {
  FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER, RUSTICA,
  ARTORIA, LIBERIA, SPRING_SHIZU, MORGANA, LUCILLE, FRACK, GUINEVERE, LIEBES, MIFRI, POPRI, CATTLEYYA, MERLAN, TAMA, MOWANO, CAROL, ASAHI,
  MILLA, EIDENE, POLA, YILDIZ, WINTER_STELLA, AISHE, LILICOTTE,
  CORDIE, SUMMER_SABRINA,
  REGINA, FLOWER_NATASHA, CANDY_CERBERUS, WITCH_PALADIA, WITCH_ILLYA, LUNALYNN, ARMSTRONG, VALERIEDE, AA, SIVI, EIRENE,
} = RAID_TABLE_CHARACTER_IDS

function action(result, turn, id) {
  return result.rounds[turn - 1].actions.find(item => item.actorId === id)
}

function actionsFor(result, id) {
  return result.rounds.map(round => action(result, round.turn, id).actionKey)
}

function singleConfig(id, extra = {}) {
  return { lineup: [id], attackPriority: [id], turns: 10, ...extra }
}

function closeTo(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be close to ${expected}`)
}

test('roster exposes forty-two characters and the original five remain the default lineup', () => {
  assert.equal(RAID_TABLE_ROSTER.length, 42)
  assert.deepEqual(RAID_ELEMENTS, { BLUE: 1, RED: 2, GREEN: 3, YELLOW: 4, LIGHT: 5, DARK: 6 })
  assert.equal(RAID_TABLE_CHARACTERS[LIBERIA].element, RAID_ELEMENTS.LIGHT)
  assert.deepEqual(DEFAULT_RAID_LINEUP, [FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER])
  assert.deepEqual(DEFAULT_RAID_ATTACK_PRIORITY, [FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER])
  assert.deepEqual(RAID_TABLE_ROSTER.slice(22, 29), [MILLA, EIDENE, POLA, YILDIZ, WINTER_STELLA, AISHE, LILICOTTE])
  assert.deepEqual(RAID_TABLE_ROSTER.slice(29, 31), [CORDIE, SUMMER_SABRINA])
  assert.deepEqual(RAID_TABLE_ROSTER.slice(-11), [REGINA, FLOWER_NATASHA, CANDY_CERBERUS, WITCH_PALADIA, WITCH_ILLYA, LUNALYNN, ARMSTRONG, VALERIEDE, AA, SIVI, EIRENE])
})

test('default defense config uses Sonya and per-character Lv500 dual penetration values', () => {
  const defaults = createDefaultRaidTableConfig()
  assert.equal(defaults.bossTemplateId, RAID_BOSS_TEMPLATE_IDS.SONYA)
  assert.equal(defaults.levels[FLORENCE], DEFAULT_RAID_CHARACTER_LEVEL)
  assert.equal(defaults.defensePenetrations[FLORENCE], DEFAULT_RAID_DEFENSE_PENETRATION)
  assert.equal(defaults.pmDefensePenetrations[FLORENCE], DEFAULT_RAID_PM_DEFENSE_PENETRATION + 7_000)
  assert.equal(defaults.pmDefensePenetrations[LIBERIA], DEFAULT_RAID_PM_DEFENSE_PENETRATION + 7_000)
  assert.equal(defaults.pmDefensePenetrations[FLOWER_NATASHA], DEFAULT_RAID_PM_DEFENSE_PENETRATION + 7_000)
  assert.equal(defaults.defensePenetrations[FLOWER_NATASHA], DEFAULT_RAID_DEFENSE_PENETRATION + 7_000)
  assert.equal(defaults.defensePenetrations[CANDY_CERBERUS], DEFAULT_RAID_DEFENSE_PENETRATION + 7_000)
  assert.equal(defaults.defensePenetrations[WITCH_ILLYA], DEFAULT_RAID_DEFENSE_PENETRATION + 7_000)
  assert.equal(defaults.criticalDamageBonuses[CORDIE], DEFAULT_RAID_CRITICAL_DAMAGE_BONUS + 0.35)
  assert.equal(defaults.criticalDamageBonuses[WITCH_ILLYA], DEFAULT_RAID_CRITICAL_DAMAGE_BONUS + 0.35)
  assert.equal(defaults.criticalDamageBonuses[ARMSTRONG], DEFAULT_RAID_CRITICAL_DAMAGE_BONUS + 0.35)
  assert.equal(defaults.criticalDamageBonuses[AA], DEFAULT_RAID_CRITICAL_DAMAGE_BONUS + 0.35)
  assert.equal(defaults.criticalDamageBonuses[FLORENCE], DEFAULT_RAID_CRITICAL_DAMAGE_BONUS)
  assert.equal(RAID_BOSS_TEMPLATES.sonya.defense, 200_000)
  assert.equal(RAID_BOSS_TEMPLATES.luke.physicalDefense, 600_000)
  assert.equal(RAID_BOSS_TEMPLATES.sonya.element, RAID_ELEMENTS.BLUE)
  assert.equal(RAID_BOSS_TEMPLATES.luke.element, RAID_ELEMENTS.GREEN)
  assert.equal(defaults.probabilityOverrides.liebesStun, true)
  assert.equal(defaults.probabilityOverrides.artoriaStun, true)
  assert.equal(defaults.probabilityOverrides.carolSilence, true)
  assert.equal(defaults.probabilityOverrides.morganaHealingDown, true)
  assert.equal(defaults.probabilityOverrides.mowanoDelay, true)
  assert.equal(defaults.activationRounds.witchIllyaCurseUnleashed, 2)
  assert.equal(defaults.activationRounds.candyCerberusKindMagic, 2)
  assert.equal(defaults.scenarioTiers.siviReactiveBladeIncomingHits, 0)
  assert.equal(defaults.speeds[CORDIE], 3562)
  assert.equal(defaults.speeds[SUMMER_SABRINA], 3418)
})

test('lineups accept one to five unique supported characters', () => {
  assert.equal(simulateRaidTable(singleConfig(ARTORIA, { turns: 1 })).config.lineup.length, 1)
  assert.equal(simulateRaidTable().config.lineup.length, 5)
  assert.throws(() => simulateRaidTable({ lineup: [], attackPriority: [] }), /one to five/)
  assert.throws(() => simulateRaidTable({ lineup: [FLORENCE, FLORENCE], attackPriority: [FLORENCE, FLORENCE] }), /one to five/)
  assert.throws(() => simulateRaidTable({
    lineup: [FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER, RUSTICA],
    attackPriority: [FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER, RUSTICA],
  }), /one to five/)
  assert.throws(() => simulateRaidTable(singleConfig(FLORENCE, { bossTemplateId: 'unknown' })), /Unsupported raid Boss template/)
  assert.throws(() => simulateRaidTable(singleConfig(FLORENCE, { levels: { [FLORENCE]: 0 } })), /Invalid level/)
  assert.throws(() => simulateRaidTable(singleConfig(FLORENCE, { defensePenetrations: { [FLORENCE]: -1 } })), /Invalid defense penetration/)
  assert.throws(() => simulateRaidTable(singleConfig(FLORENCE, { criticalDamageBonuses: { [FLORENCE]: -1 } })), /Invalid critical damage bonus/)
  assert.throws(() => simulateRaidTable(singleConfig(FLORENCE, {
    activationRounds: { witchIllyaCurseUnleashed: 0 },
  })), /Invalid raid activation round/)
  assert.throws(() => simulateRaidTable(singleConfig(FLORENCE, {
    activationRounds: { witchIllyaCurseUnleashed: 11 },
  })), /Invalid raid activation round/)
  assert.throws(() => simulateRaidTable(singleConfig(FLORENCE, {
    scenarioTiers: { siviReactiveBladeIncomingHits: 5 },
  })), /Invalid raid scenario tier/)
})

test('lineup element bonuses follow MB tiers and let Light fill the best non-Dark group', () => {
  const bonus = lineup => calculateRaidElementBonus(lineup, RAID_TABLE_CHARACTERS)

  assert.deepEqual(bonus([FLORENCE]).normal, { phase: 0, hpRate: 0, attackRate: 0 })
  assert.deepEqual(bonus([LUKE, MERLYN, MERTILLIER]).normal, { phase: 1, hpRate: 0.1, attackRate: 0.1 })
  assert.deepEqual(bonus([LUKE, MERLYN, MERTILLIER, FLORENCE, FENRIR]).normal, { phase: 2, hpRate: 0.15, attackRate: 0.15 })
  assert.deepEqual(bonus([LUKE, MERLYN, MERTILLIER, MILLA, FLORENCE]).normal, { phase: 3, hpRate: 0.2, attackRate: 0.15 })
  assert.deepEqual(bonus([LUKE, MERLYN, MERTILLIER, MILLA, EIDENE]).normal, { phase: 4, hpRate: 0.25, attackRate: 0.25 })
  assert.equal(bonus([LUKE, MERLYN, MERTILLIER, FLORENCE, LIBERIA]).normal.phase, 3)
  assert.equal(bonus([LUKE, MERLYN, FLORENCE, FENRIR, LIBERIA]).normal.phase, 2)
})

test('formation ATK is a pre-status multiplier and temporary ATK buffs multiply after it', () => {
  const result = simulateRaidTable({ turns: 1 })
  const step = action(result, 1, FLORENCE).damageSteps[0]

  assert.equal(result.config.elementBonus.normal.attackRate, 0.15)
  closeTo(step.preStatusAttackScale, 1.15)
  closeTo(step.combatAttackScale, 1.3)
  closeTo(step.attackScale, 1.15 * 1.3)
  closeTo(step.effectivePercent, 525 * 1.15 * 1.3 * 1.6 * 2.1 * step.defenseMultiplier)
})

test('Dark formation bonuses add pre-status penetration and critical damage cumulatively', () => {
  const shizuSolo = simulateRaidTable(singleConfig(SPRING_SHIZU, { turns: 1 }))
  const shizuWithDark = simulateRaidTable({
    lineup: [SPRING_SHIZU, REGINA], attackPriority: [SPRING_SHIZU, REGINA], turns: 1,
  })
  const soloDefenseTerm = action(shizuSolo, 1, SPRING_SHIZU).damageSteps[0].scalingTerms.find(term => term.kind === 'targetBaseDefenseOverTargetAttack')
  const darkDefenseTerm = action(shizuWithDark, 1, SPRING_SHIZU).damageSteps[0].scalingTerms.find(term => term.kind === 'targetBaseDefenseOverTargetAttack')
  closeTo(darkDefenseTerm.coefficient, soloDefenseTerm.coefficient * 1.25)

  const threeDark = simulateRaidTable({
    lineup: [FLOWER_NATASHA, CANDY_CERBERUS, WITCH_ILLYA],
    attackPriority: [FLOWER_NATASHA, CANDY_CERBERUS, WITCH_ILLYA], turns: 1,
  })
  const illyaStep = action(threeDark, 1, WITCH_ILLYA).damageSteps[0]
  assert.equal(threeDark.config.elementBonus.dark.defensePenetration, 1_000)
  assert.equal(illyaStep.defense.panelDefensePenetration, DEFAULT_RAID_DEFENSE_PENETRATION + 7_000)
  assert.equal(illyaStep.defense.baseDefensePenetration, DEFAULT_RAID_DEFENSE_PENETRATION + 8_000)
  closeTo(illyaStep.defense.defensePenetration, (DEFAULT_RAID_DEFENSE_PENETRATION + 8_000) * 1.4)

  const fiveDark = simulateRaidTable({
    lineup: [REGINA, FLOWER_NATASHA, CANDY_CERBERUS, WITCH_PALADIA, WITCH_ILLYA],
    attackPriority: [REGINA, FLOWER_NATASHA, CANDY_CERBERUS, WITCH_PALADIA, WITCH_ILLYA], turns: 1,
  })
  assert.equal(fiveDark.config.elementBonus.dark.criticalDamageBonus, 0.3)
  closeTo(action(fiveDark, 1, WITCH_ILLYA).damageSteps[0].criticalMultiplier, 2.75)
})

test('Boss template and per-character level and penetration settings change defense pass rates', () => {
  const sonya = simulateRaidTable(singleConfig(FLORENCE, { turns: 1 }))
  const luke = simulateRaidTable(singleConfig(FLORENCE, {
    turns: 1,
    bossTemplateId: RAID_BOSS_TEMPLATE_IDS.LUKE,
    levels: { [FLORENCE]: 240 },
    defensePenetrations: { [FLORENCE]: 0 },
    pmDefensePenetrations: { [FLORENCE]: 0 },
  }))
  const sonyaStep = action(sonya, 1, FLORENCE).damageSteps[0]
  const lukeStep = action(luke, 1, FLORENCE).damageSteps[0]
  assert.equal(luke.config.levels[FLORENCE], 240)
  assert.equal(luke.config.bossTemplateId, RAID_BOSS_TEMPLATE_IDS.LUKE)
  assert.equal(lukeStep.defense.baseDefense, 300_000)
  assert.equal(lukeStep.defense.basePmDefense, 600_000)
  assert.ok(lukeStep.defenseMultiplier < sonyaStep.defenseMultiplier)
})

test('default speed order matches MB values and can be overridden', () => {
  const defaults = simulateRaidTable({ turns: 1 })
  assert.deepEqual(defaults.rounds[0].actionOrder, [LUKE, FLORENCE, FENRIR, MERLYN, MERTILLIER])

  const overridden = simulateRaidTable({
    ...createDefaultRaidTableConfig(),
    speeds: { ...createDefaultRaidTableConfig().speeds, [MERTILLIER]: 9999 },
    turns: 1,
  })
  assert.equal(overridden.rounds[0].actionOrder[0], MERTILLIER)
})

test('Artoria speed buff changes rounds one and two but expires before round three', () => {
  const lineup = [ARTORIA, SPRING_SHIZU, LUKE]
  const result = simulateRaidTable({
    lineup,
    attackPriority: [...lineup],
    speeds: { [ARTORIA]: 3572, [SPRING_SHIZU]: 3000, [LUKE]: 3093 },
    turns: 3,
  })
  assert.deepEqual(result.rounds[0].actionOrder, [SPRING_SHIZU, ARTORIA, LUKE])
  assert.deepEqual(result.rounds[1].actionOrder, [SPRING_SHIZU, ARTORIA, LUKE])
  assert.deepEqual(result.rounds[2].actionOrder, [ARTORIA, LUKE, SPRING_SHIZU])
  assert.equal(result.rounds[0].speedSnapshot[SPRING_SHIZU].effectiveSpeed, 3600)
  assert.equal(result.rounds[2].speedSnapshot[SPRING_SHIZU].effectiveSpeed, 3000)
})

test('default critical multiplier is 2.10 and Merlyn raises it to 2.50', () => {
  const result = simulateRaidTable()
  assert.equal(action(result, 1, LUKE).damageSteps[0].criticalMultiplier, 2.1)
  assert.equal(action(result, 2, FLORENCE).damageSteps[0].criticalMultiplier, 2.5)
})

test('critical damage panel values are per character and remain separate from temporary skill states', () => {
  const lineup = [CORDIE, ARMSTRONG, FLORENCE]
  const result = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 1 })
  assert.equal(action(result, 1, CORDIE).damageSteps[0].criticalMultiplier, 2.45)
  assert.equal(action(result, 1, ARMSTRONG).damageSteps[0].criticalMultiplier, 2.85)
  assert.equal(action(result, 1, FLORENCE).damageSteps[0].criticalMultiplier, 2.1)

  const edited = simulateRaidTable({
    lineup: [CORDIE], attackPriority: [CORDIE], turns: 1,
    criticalDamageBonuses: { [CORDIE]: 0.8 },
  })
  assert.equal(action(edited, 1, CORDIE).damageSteps[0].criticalMultiplier, 1.8)
})

test('disabling guaranteed criticals removes critical multipliers, Florence follow-ups, and Luke stacks', () => {
  const result = simulateRaidTable({ ...createDefaultRaidTableConfig(), guaranteedCritical: false, turns: 1 })
  assert.equal(action(result, 1, FLORENCE).damageSteps.length, 6)
  assert.ok(action(result, 1, FLORENCE).damageSteps.every(step => step.criticalMultiplier === 1))
  assert.equal(action(result, 1, LUKE).bossStatusAfterAction.some(status => status.id === 'luke-damage-taken'), false)
})

test('Luke applies vulnerability after each step and the current step only uses prior stacks', () => {
  const result = simulateRaidTable({ ...singleConfig(LUKE), turns: 1 })
  const luke = action(result, 1, LUKE)
  assert.equal(luke.damageSteps.length, 2)
  assert.equal(luke.damageSteps[0].stat, 'ATK')
  assert.equal(luke.damageSteps[0].bossDamageRate, 0)
  assert.equal(luke.damageSteps[1].stat, 'STR')
  assert.equal(luke.damageSteps[1].bossDamageRate, 0.15)
  closeTo(luke.damageSteps[1].effectivePercent, 150 * 2.1 * 1.15)
  assert.equal(luke.bossStatusAfterAction.find(status => status.id === 'luke-damage-taken').stacks, 2)
})

test('Florence damage bonus and two Luke stacks add in one damage-rate channel', () => {
  const result = simulateRaidTable({ turns: 1 })
  const florence = action(result, 1, FLORENCE)
  assert.equal(florence.damageSteps.length, 10)
  assert.ok(florence.damageSteps.every(step => Math.abs(step.damageRate - 0.6) < 1e-12))
  closeTo(florence.damageSteps[0].effectivePercent, 525 * 1.15 * 1.3 * 1.6 * 2.1 * florence.damageSteps[0].defenseMultiplier)
})

test('job flags select physical or magic defense while direct damage bypasses both paths', () => {
  const lineup = [FLORENCE, FENRIR, LUKE]
  const result = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 1 })
  const florence = action(result, 1, FLORENCE).damageSteps[0]
  const fenrir = action(result, 1, FENRIR).damageSteps[0]
  const luke = action(result, 1, LUKE).damageSteps
  assert.equal(RAID_TABLE_CHARACTERS[FLORENCE].jobFlags, RAID_JOB_FLAGS.WARRIOR)
  assert.equal(RAID_TABLE_CHARACTERS[FENRIR].jobFlags, RAID_JOB_FLAGS.MAGE)
  assert.equal(florence.damageType, 'phys')
  assert.equal(florence.defense.basePmDefense, RAID_BOSS_TEMPLATES.sonya.physicalDefense)
  assert.equal(fenrir.damageType, 'mag')
  assert.equal(fenrir.defense.basePmDefense, RAID_BOSS_TEMPLATES.sonya.magicDefense)
  assert.equal(luke[1].damageType, 'direct')
  assert.equal(luke[1].defenseMultiplier, 1)
})

test('Boss defense buffs and differently named debuffs add by defense path before mitigation', () => {
  const character = {
    ...RAID_TABLE_CHARACTERS[FLORENCE],
    hooks: [],
    skills: {
      ...RAID_TABLE_CHARACTERS[FLORENCE].skills,
      s1: {
        ...RAID_TABLE_CHARACTERS[FLORENCE].skills.s1,
        hooks: [hook('beforeDamage', [
          bossStatusEffect({ id: 'test-defense-down', effectGroupId: 991001, nameKey: 'raidDebuffCarolDefenseDown', defenseRatePerStack: -0.4 }),
          bossStatusEffect({ id: 'test-defense-up', effectGroupId: 991002, nameKey: 'raidDebuffCarolDefenseDown', defenseRatePerStack: 0.1 }),
          bossStatusEffect({ id: 'test-physical-down', effectGroupId: 991003, nameKey: 'raidDebuffLiebesPhysicalDefenseDown', physicalDefenseRatePerStack: -0.2 }),
          bossStatusEffect({ id: 'test-physical-up', effectGroupId: 991004, nameKey: 'raidDebuffLiebesPhysicalDefenseDown', physicalDefenseRatePerStack: 0.05 }),
        ])],
      },
    },
  }
  const result = simulateRaidTable(singleConfig(FLORENCE, { turns: 1 }), {
    ...DEFAULT_RAID_ENVIRONMENT,
    characters: { ...RAID_TABLE_CHARACTERS, [FLORENCE]: character },
  })
  const step = action(result, 1, FLORENCE).damageSteps[0]
  closeTo(step.defense.defenseRate, -0.3)
  closeTo(step.defense.pmDefenseRate, -0.15)
  closeTo(step.defense.actualDefense, 140_000)
  closeTo(step.defense.actualPmDefense, 425_000)
})

test('Florence and Luke retain their zero-rate Boss debuffs with source and removal class', () => {
  const lineup = [FLORENCE, LUKE]
  const result = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 1 })
  const florenceStatus = action(result, 1, FLORENCE).bossStatusAfterAction.find(status => status.id === 'florence-critical-resist-down')
  assert.equal(florenceStatus.sourceId, FLORENCE)
  assert.equal(florenceStatus.statusClass, RAID_STATUS_CLASSES.REMOVABLE_DEBUFF)
  assert.equal(florenceStatus.damageRatePerStack, 0)
  const lukeStatus = action(result, 1, LUKE).bossStatusAfterAction.find(status => status.id === 'luke-attack-down')
  assert.equal(lukeStatus.sourceId, LUKE)
  assert.equal(lukeStatus.statusClass, RAID_STATUS_CLASSES.REMOVABLE_DEBUFF)
  assert.equal(lukeStatus.damageRatePerStack, 0)
})

test('default lineup has a stable defense-aware golden total', () => {
  const result = simulateRaidTable()
  closeTo(result.teamAtkPercent, 183812.4741798407, 1e-7)
  closeTo(result.symbolicTotals.STR, 6964.65, 1e-8)
})

test('Liberia applies two Sand stacks before all eight S1 hits and the toggle can disable it', () => {
  const enabled = simulateRaidTable({ ...singleConfig(LIBERIA), turns: 2 })
  const s1 = action(enabled, 1, LIBERIA)
  assert.equal(s1.damageSteps.length, 8)
  assert.ok(s1.damageSteps.every(step => Math.abs(step.bossDamageRate - 0.1) < 1e-12))
  assert.equal(s1.bossStatusAfterAction.find(status => status.id === 'liberia-sand').stacks, 2)
  assert.equal(enabled.rounds[0].bossStatusAfterRound.find(status => status.id === 'liberia-sand').remainingRounds, 1)
  assert.equal(enabled.rounds[1].bossStatusAfterRound.some(status => status.id === 'liberia-sand'), false)

  const disabled = simulateRaidTable({
    ...singleConfig(LIBERIA), turns: 1,
    probabilityOverrides: { liberiaSand: false, shizuSpeedDown: true },
  })
  assert.ok(action(disabled, 1, LIBERIA).damageSteps.every(step => step.bossDamageRate === 0))
  assert.equal(action(disabled, 1, LIBERIA).effectsApplied.find(effect => effect.id === 'liberia-sand').skipped, true)
})

test('Liberia can reach four Sand stacks and reset cooldowns only once', () => {
  const lineup = [LIBERIA, FENRIR, MERTILLIER]
  const result = simulateRaidTable({
    lineup,
    attackPriority: [LIBERIA, FENRIR, MERTILLIER],
    speeds: { [LIBERIA]: 3597, [FENRIR]: 2894, [MERTILLIER]: 5000 },
    turns: 3,
  })
  assert.deepEqual(actionsFor(result, LIBERIA), ['s1', 's1', 's2'])
  assert.equal(action(result, 2, LIBERIA).bossStatusAfterAction.find(status => status.id === 'liberia-sand').stacks, 4)
  const reset = action(result, 3, LIBERIA).effectsApplied.find(effect => effect.type === 'cooldownReset')
  assert.ok(reset)
  assert.deepEqual(action(result, 3, LIBERIA).cooldownsAfter, { s1: 0, s2: 0 })
})

test('Shizu applies damage taken on actions one, five, and nine and uses the high-HP S2 branch', () => {
  const result = simulateRaidTable(singleConfig(SPRING_SHIZU))
  const appliedTurns = result.rounds
    .filter(round => action(result, round.turn, SPRING_SHIZU).effectsApplied.some(effect => effect.id === 'shizu-damage-taken'))
    .map(round => round.turn)
  assert.deepEqual(appliedTurns, [1, 5, 9])
  assert.equal(action(result, 2, SPRING_SHIZU).damageSteps[0].percent, 2280)
})

test('Shizu self-damage stacks Artoria before Artoria acts and Artoria own damage stacks again', () => {
  const lineup = [ARTORIA, SPRING_SHIZU]
  const result = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 2 })
  const artoria1 = action(result, 1, ARTORIA)
  const artoria2 = action(result, 2, ARTORIA)
  assert.equal(artoria1.runtimeBefore.counters.justice, 1)
  assert.equal(artoria1.runtimeAfter.counters.justice, 2)
  assert.equal(artoria1.damageSteps[0].attackRate, 0.2)
  assert.equal(artoria2.runtimeAfter.counters.justice, 4)
  assert.equal(artoria2.damageSteps[0].percent, 1140)
})

test('panel-based attack additions remain separate symbolic terms', () => {
  const lineup = [ARTORIA, LIBERIA, SPRING_SHIZU]
  const result = simulateRaidTable({ lineup, attackPriority: [ARTORIA, SPRING_SHIZU, LIBERIA], turns: 1 })
  const shizuTerms = action(result, 1, SPRING_SHIZU).scalingTotals
  assert.ok(shizuTerms[`ATK_${ARTORIA}/ATK_${SPRING_SHIZU}`])
  assert.ok(shizuTerms[`DEF0_${SPRING_SHIZU}/ATK_${SPRING_SHIZU}`])
  const artoriaTerms = action(result, 1, ARTORIA).scalingTotals
  assert.ok(artoriaTerms[`DEF0_${ARTORIA}/ATK_${ARTORIA}`])
  assert.equal(result.teamAtkPercent > 0, true)
  assert.ok(Object.keys(result.scalingTotals).length >= 3)
})

test('Rustica history and removable EffectGroup rules remain supported', () => {
  const lineup = [RUSTICA]
  const result = simulateRaidTable({ lineup, attackPriority: lineup, turns: 14 })
  const s2 = result.rounds.map(round => action(result, round.turn, RUSTICA)).filter(item => item.actionKey === 's2')
  assert.deepEqual(s2.map(item => item.damageSteps.length), [4, 5, 6, 6])
  const passiveStates = action(result, 1, RUSTICA).effectsApplied.filter(effect => effect.id?.startsWith('rustica-shield') || effect.id === 'rustica-guardian')
  assert.ok(passiveStates.every(effect => effect.statusClass === RAID_STATUS_CLASSES.UNREMOVABLE_STATE))
})

test('compiler includes hooks and event listeners only for selected characters', () => {
  const program = compileRaidProgram(singleConfig(ARTORIA, { turns: 1 }))
  assert.deepEqual(Object.keys(program.characters).map(Number), [ARTORIA])
  assert.deepEqual(program.eventListeners.selfDamage.map(listener => listener.actorId), [ARTORIA])
  assert.equal(program.characters[ARTORIA].hooksByTrigger.afterCriticalHit.length, 0)

  const lukeProgram = compileRaidProgram(singleConfig(LUKE, { turns: 1 }))
  assert.deepEqual(Object.keys(lukeProgram.eventListeners), [])
  assert.equal(lukeProgram.characters[LUKE].hooksByTrigger.afterCriticalHit.length, 1)

  const injected = simulateRaidTable(singleConfig(LUKE, { turns: 1 }), {
    characters: { [LUKE]: RAID_TABLE_CHARACTERS[LUKE] },
    mechanics: DEFAULT_RAID_MECHANICS,
  })
  assert.equal(injected.config.lineup[0], LUKE)
  assert.equal(action(injected, 1, LUKE).damageSteps.length, 2)
})

test('compiler rejects unregistered mechanics and missing counters', () => {
  const base = RAID_TABLE_CHARACTERS[FLORENCE]
  const config = { lineup: [999], attackPriority: [999], speeds: { 999: 1000 }, turns: 1 }
  const environmentFor = character => ({
    ...DEFAULT_RAID_ENVIRONMENT,
    characters: { 999: { ...character, id: 999, speed: 1000 } },
  })

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    hooks: [{ trigger: 'actionStart', effects: [{ type: 'unknownEffect' }] }],
  })), /Unregistered raid effect/)

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    permanentModifiers: [{ id: 'bad-channel', channel: 'unknownChannel', rate: 0.1 }],
  })), /Unsupported raid modifier channel/)

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    skills: {
      ...base.skills,
      s1: {
        ...base.skills.s1,
        damageSteps: [{ ...base.skills.s1.damageSteps[0], criticalCondition: { type: 'unknownCondition' } }],
      },
    },
  })), /Unregistered raid condition/)

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    runtime: { counters: {} },
    skills: {
      ...base.skills,
      s1: {
        ...base.skills.s1,
        damageSteps: [{
          ...base.skills.s1.damageSteps[0],
          afterEffects: [{
            type: 'emitEvent', event: 'selfDamage',
            condition: { type: 'counterAtLeast', counter: 'missing', count: 1 },
          }],
        }],
      },
    },
  })), /Unknown raid counter/)

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    hooks: [{ trigger: 'actionStart', effects: [{
      type: 'status', id: 'bad-target', effectGroupId: 1, target: 'unknownTarget', duration: 1,
    }] }],
  })), /Unregistered raid target selector/)

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    runtime: { counters: {} },
    derivedModifiers: [{
      id: 'missing-counter', channel: 'attackRate',
      rate: { type: 'counterLinear', counter: 'missing', base: 0, perStack: 0.1 },
    }],
  })), /Unknown raid counter/)

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    hooks: [{ trigger: 'actionStart', effects: [{
      type: 'bossStatus', id: 'bad-replacement', replacementKey: '', effectGroupId: 1,
    }] }],
  })), /replacementKey must be a non-empty string/)

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    hooks: [{ trigger: 'actionStart', effects: [{
      type: 'bossStatus', id: 'bad-defense-rate', effectGroupId: 1, defenseRatePerStack: Number.NaN,
    }] }],
  })), /defenseRatePerStack must be finite/)

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    hooks: [{
      trigger: 'actionStart', condition: { type: 'bossElementIs', element: 999 }, effects: [],
    }],
  })), /Invalid raid Boss element/)

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    skills: {
      ...base.skills,
      s1: {
        ...base.skills.s1,
        damageSteps: [{
          ...base.skills.s1.damageSteps[0],
          afterEffects: [{ type: 'unknownAfterStepEffect' }],
        }],
      },
    },
  })), /Unregistered raid effect/)

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    skills: { ...base.skills, s2: { ...base.skills.s2, condition: { type: 'unknownAvailability' } } },
  })), /Unregistered raid condition/)

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    hooks: [{ trigger: 'actionStart', effects: [{ type: 'removeStatus', target: 'self', statusId: '' }] }],
  })), /removeStatus effect requires a non-empty statusId/)

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    eventHooks: [{ event: 'normalAttack', effects: [{
      type: 'cooldownReduction', target: 'eventSource', amount: 1,
      condition: { type: 'eventSourceHasStatus', statusId: '' },
    }] }],
  })), /eventSourceHasStatus condition requires a non-empty statusId/)

  assert.throws(() => compileRaidProgram(config, environmentFor({
    ...base,
    runtime: { counters: { charge: 0 } },
    hooks: [{ trigger: 'actionStart', effects: [{ type: 'changeCounter', counter: 'charge', amount: 1, record: 'no' }] }],
  })), /changeCounter record must be boolean/)
})

test('mechanic registry resolves counters, skill history, conditions, and targets generically', () => {
  const actor = { runtime: { counters: { charge: 2 }, skillUses: { s1: 3 } } }
  assert.equal(DEFAULT_RAID_MECHANICS.valueResolvers.counterLinear(
    { counter: 'charge', base: 100, perStack: 25, max: 200 }, { actor },
  ), 150)
  assert.equal(DEFAULT_RAID_MECHANICS.valueResolvers.skillUsesLinear(
    { skillKey: 's1', base: 2, increment: 2, max: 7 }, { actor },
  ), 7)
  assert.equal(DEFAULT_RAID_MECHANICS.conditionHandlers.bossStacksAtLeast(
    { statusId: 'sand', count: 4 }, { boss: { statuses: [{ id: 'sand', stacks: 4 }] } },
  ), true)
  closeTo(DEFAULT_RAID_MECHANICS.valueResolvers.otherLineupElementCountLinear(
    { element: 2, base: 0.1, perStack: 0.1, max: 0.5 }, {
      actor: { id: 75 }, config: { lineup: [75, 93, 112] },
      actors: new Map([[93, { definition: { element: 2 } }], [112, { definition: { element: 2 } }]]),
    },
  ), 0.3)
  assert.deepEqual(DEFAULT_RAID_MECHANICS.targetSelectors.adjacent(
    { ownerId: 2, config: { lineup: [1, 2, 3] } },
  ), [1, 3])
  assert.deepEqual(DEFAULT_RAID_MECHANICS.targetSelectors.all({ config: { lineup: [1, 2, 3] } }), [1, 2, 3])
  assert.deepEqual(DEFAULT_RAID_MECHANICS.targetSelectors.selfAndTopAttackOther({
    ownerId: 2, config: { attackPriority: [3, 2, 1] },
  }), [2, 3, 1])
  assert.equal(DEFAULT_RAID_MECHANICS.conditionHandlers.eventTargetsIncludeOwner(
    {}, { eventTargetIds: [1, 2], ownerId: 2 },
  ), true)
  const eventActors = new Map([[3, { statuses: [{ id: 'enhanced-normal' }] }]])
  assert.deepEqual(DEFAULT_RAID_MECHANICS.targetSelectors.eventSource({ eventSourceId: 3 }), [3])
  assert.equal(DEFAULT_RAID_MECHANICS.conditionHandlers.eventSourceHasStatus(
    { statusId: 'enhanced-normal' }, { eventSourceId: 3, actors: eventActors },
  ), true)
  assert.equal(DEFAULT_RAID_MECHANICS.conditionHandlers.counterAtLeast(
    { counter: 'charge', count: 2 }, { actor },
  ), true)
  assert.equal(DEFAULT_RAID_MECHANICS.conditionHandlers.bossElementIs(
    { element: RAID_ELEMENTS.GREEN }, { boss: { template: RAID_BOSS_TEMPLATES.luke } },
  ), true)
})

test('Morgana stacks Fighting Spirit from allied self-damage and uses the current stack on S2', () => {
  const lineup = [MORGANA, ARTORIA]
  const result = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 3 })
  const morganaS1 = action(result, 1, MORGANA)
  assert.equal(morganaS1.runtimeBefore.counters.fightingSpirit, 1)
  assert.equal(morganaS1.runtimeAfter.counters.fightingSpirit, 2)
  assert.equal(morganaS1.damageSteps[0].attackRate, 0.4)
  const morganaS2 = action(result, 2, MORGANA)
  assert.equal(morganaS2.actionKey, 's2')
  assert.equal(morganaS2.damageSteps.length, 7)
  closeTo(morganaS2.damageSteps[0].attackRate, 0.6)
})

test('Carol, Morgana, and Mowano retain removable utility debuffs and trigger Boss-debuff linkages', () => {
  const oneTurnCases = [
    { id: CAROL, key: 'carolSilence', statusId: 'carol-silence', effectGroupId: 4000150102, durationRounds: 1, attempts: 1 },
    { id: MORGANA, key: 'morganaHealingDown', statusId: 'morgana-healing-down', effectGroupId: 7500130202, durationRounds: 2, attempts: 5 },
  ]
  for (const entry of oneTurnCases) {
    const lineup = [entry.id, LIEBES]
    const config = {
      lineup, attackPriority: [...lineup], speeds: { [entry.id]: 5000, [LIEBES]: 1000 }, turns: 1,
      probabilityOverrides: { [entry.key]: true, liebesStun: false },
    }
    const enabled = simulateRaidTable(config)
    const sourceAction = action(enabled, 1, entry.id)
    const status = sourceAction.bossStatusAfterAction.find(item => item.id === entry.statusId)
    assert.equal(status.effectGroupId, entry.effectGroupId)
    assert.equal(status.statusClass, RAID_STATUS_CLASSES.REMOVABLE_DEBUFF)
    assert.equal(status.durationRounds, entry.durationRounds)
    assert.equal(status.damageRatePerStack, 0)
    assert.equal(sourceAction.effectsApplied.filter(effect => effect.id === entry.statusId).length, entry.attempts)
    assert.ok(action(enabled, 1, LIEBES).statusSnapshotAtDamage[LIEBES].statuses.some(item => item.effectGroupId === 10200330102))

    const disabled = simulateRaidTable({ ...config, probabilityOverrides: { [entry.key]: false, liebesStun: false } })
    assert.equal(action(disabled, 1, entry.id).bossStatusAfterAction.some(item => item.id === entry.statusId), false)
    assert.ok(action(disabled, 1, LIEBES).statusSnapshotAtDamage[LIEBES].statuses.some(item => item.effectGroupId === 10200330101))
  }

  const mowanoConfig = {
    lineup: [MOWANO, LIEBES], attackPriority: [MOWANO, LIEBES],
    speeds: { [MOWANO]: 5000, [LIEBES]: 1000 }, turns: 2,
    probabilityOverrides: { mowanoDelay: true, liebesStun: false },
  }
  const enabledMowano = simulateRaidTable(mowanoConfig)
  const delay = action(enabledMowano, 2, MOWANO).bossStatusAfterAction.find(status => status.id === 'mowano-delay')
  assert.equal(delay.effectGroupId, 10000220102)
  assert.equal(delay.statusClass, RAID_STATUS_CLASSES.REMOVABLE_DEBUFF)
  assert.equal(delay.durationRounds, 1)
  assert.equal(action(enabledMowano, 2, LIEBES).damageSteps[0].percent, 1020)

  const disabledMowano = simulateRaidTable({ ...mowanoConfig, probabilityOverrides: { mowanoDelay: false, liebesStun: false } })
  assert.equal(action(disabledMowano, 2, MOWANO).bossStatusAfterAction.some(status => status.id === 'mowano-delay'), false)
  assert.equal(action(disabledMowano, 2, LIEBES).damageSteps[0].percent, 880)
})

test('Lucille applies all-target battle-start buffs, Radiant Light, damage branches, and one cooldown reduction', () => {
  const lineup = [LUCILLE, ARTORIA, SPRING_SHIZU]
  const result = simulateRaidTable({
    lineup, attackPriority: [ARTORIA, LUCILLE, SPRING_SHIZU],
    speeds: { [LUCILLE]: 1000, [ARTORIA]: 4000, [SPRING_SHIZU]: 5000 }, turns: 3,
  })
  const firstLucille = action(result, 1, LUCILLE)
  assert.equal(firstLucille.damageSteps.length, 5)
  assert.equal(firstLucille.damageSteps[0].percent, 730)
  assert.ok(firstLucille.damageSteps[0].scalingTerms.some(term => term.key === `ATK_${LUCILLE}/ATK_${LUCILLE}`))
  assert.equal(result.rounds[0].speedSnapshot[LUCILLE].effectiveSpeed, 1400)
  assert.equal(result.rounds[0].speedSnapshot[ARTORIA].effectiveSpeed, 4800)
  assert.equal(firstLucille.bossStatusAfterAction.find(status => status.id === 'lucille-radiant-light').stacks, 3)
  const s2 = action(result, 2, LUCILLE)
  assert.equal(s2.actionKey, 's2')
  const reduction = s2.effectsApplied.find(effect => effect.id === 'lucille-cooldown-reduction')
  assert.equal(reduction.amount, 2)
  assert.equal(reduction.targetId, ARTORIA)

  const solo = simulateRaidTable(singleConfig(LUCILLE, { turns: 1 }))
  assert.equal(action(solo, 1, LUCILLE).damageSteps[0].percent, 530)
})

test('Frack keeps separate utility debuffs on the dummy and refreshes Smile Talent from three debuff groups', () => {
  const solo = simulateRaidTable(singleConfig(FRACK, { turns: 2 }))
  const s1 = action(solo, 1, FRACK)
  assert.equal(s1.damageSteps.length, 1)
  assert.deepEqual(s1.bossStatusAfterAction.map(status => status.id), ['frack-avoidance-down', 'frack-healing-down'])
  assert.ok(s1.bossStatusAfterAction.every(status => status.damageRatePerStack === 0))
  assert.equal(action(solo, 2, FRACK).damageSteps[0].percent, 560)

  const lineup = [FRACK, LIEBES]
  const supported = simulateRaidTable({
    lineup, attackPriority: [...lineup], speeds: { [FRACK]: 3000, [LIEBES]: 5000 }, turns: 2,
  })
  assert.equal(action(supported, 2, FRACK).actionKey, 's2')
  assert.equal(action(supported, 2, FRACK).damageSteps[0].percent, 1120)
})

test('Guinevere emits two self-damage events, supports probability scenarios, and reads Heartful Lover before S2 history advances', () => {
  const enabled = simulateRaidTable(singleConfig(GUINEVERE, { turns: 2 }))
  const s1 = action(enabled, 1, GUINEVERE)
  assert.equal(s1.runtimeAfter.counters.heartfulLover, 2)
  assert.equal(s1.damageSteps[0].bossDamageRate, 0.1)
  assert.deepEqual(s1.bossStatusAfterAction.map(status => status.id), ['guinevere-damage-taken', 'guinevere-weakness'])
  const s2 = action(enabled, 2, GUINEVERE)
  assert.equal(s2.runtimeAfter.counters.heartfulLover, 4)
  assert.equal(s2.damageSteps[0].percent, 540)
  assert.ok(s2.damageSteps[0].scalingTerms.some(term => term.coefficient > 0))

  const disabled = simulateRaidTable(singleConfig(GUINEVERE, {
    turns: 1, probabilityOverrides: { guinevereDamageTaken: false },
  }))
  assert.equal(action(disabled, 1, GUINEVERE).bossStatusAfterAction.length, 0)
  assert.equal(action(disabled, 1, GUINEVERE).effectsApplied.filter(effect => effect.skipped).length, 2)
})

test('Liebes defense debuffs modify separate defense paths and still power debuff-count effects', () => {
  const result = simulateRaidTable(singleConfig(LIEBES, { turns: 2 }))
  const s1 = action(result, 1, LIEBES)
  const defenseDebuffs = s1.bossStatusAfterAction.filter(status => status.id.startsWith('liebes-'))
  assert.deepEqual(defenseDebuffs.map(status => status.id), ['liebes-defense-down', 'liebes-physical-defense-down', 'liebes-stun'])
  assert.ok(defenseDebuffs.every(status => status.damageRatePerStack === 0))
  assert.equal(defenseDebuffs[0].defenseRatePerStack, -0.1)
  assert.equal(defenseDebuffs[1].physicalDefenseRatePerStack, -0.1)
  assert.equal(defenseDebuffs[2].effectGroupId, 10200100401)
  assert.equal(defenseDebuffs[2].statusClass, RAID_STATUS_CLASSES.REMOVABLE_DEBUFF)
  assert.equal(defenseDebuffs[2].durationRounds, 1)
  assert.equal(s1.damageSteps[0].bossDamageRate, 0)
  assert.equal(s1.damageSteps[0].defense.defenseRate, -0.1)
  assert.equal(s1.damageSteps[0].defense.pmDefenseRate, -0.1)
  const s2 = action(result, 2, LIEBES)
  assert.equal(s2.damageSteps[0].percent, 600)
  assert.ok(s2.damageSteps[0].scalingTerms.some(term => Math.abs(term.coefficient - 252 * s2.damageSteps[0].defenseMultiplier) < 1e-12))
  assert.equal(s2.damageSteps[0].attackRate, 0.1)

  const disabled = simulateRaidTable(singleConfig(LIEBES, {
    turns: 1, probabilityOverrides: { liebesStun: false },
  }))
  const disabledS1 = action(disabled, 1, LIEBES)
  assert.equal(disabledS1.bossStatusAfterAction.some(status => status.id === 'liebes-stun'), false)
  assert.equal(disabledS1.effectsApplied.find(effect => effect.id === 'liebes-stun').skipped, true)
})

test('Artoria Stun is a removable Boss debuff that triggers Liebes on green Bosses without simulating action loss', () => {
  const lineup = [ARTORIA, LIEBES]
  const config = {
    lineup, attackPriority: [ARTORIA, LIEBES], speeds: { [ARTORIA]: 5000, [LIEBES]: 1000 }, turns: 1,
  }
  const luke = simulateRaidTable({ ...config, bossTemplateId: RAID_BOSS_TEMPLATE_IDS.LUKE })
  const artoria = action(luke, 1, ARTORIA)
  const stun = artoria.bossStatusAfterAction.find(status => status.id === 'artoria-stun')
  assert.equal(stun.effectGroupId, 9300120202)
  assert.equal(stun.statusClass, RAID_STATUS_CLASSES.REMOVABLE_DEBUFF)
  assert.equal(stun.durationRounds, 1)
  assert.equal(artoria.effectsApplied.filter(effect => effect.id === 'artoria-stun').length, 6)
  assert.ok(action(luke, 1, LIEBES).statusSnapshotAtDamage[LIEBES].statuses.some(status => status.effectGroupId === 10200330102))

  const sonya = simulateRaidTable({ ...config, bossTemplateId: RAID_BOSS_TEMPLATE_IDS.SONYA })
  assert.equal(action(sonya, 1, ARTORIA).bossStatusAfterAction.some(status => status.id === 'artoria-stun'), false)
  assert.ok(action(sonya, 1, LIEBES).statusSnapshotAtDamage[LIEBES].statuses.some(status => status.effectGroupId === 10200330101))

  const disabled = simulateRaidTable({
    ...config, bossTemplateId: RAID_BOSS_TEMPLATE_IDS.LUKE, probabilityOverrides: { artoriaStun: false },
  })
  assert.equal(action(disabled, 1, ARTORIA).bossStatusAfterAction.some(status => status.id === 'artoria-stun'), false)
  assert.ok(action(disabled, 1, LIEBES).statusSnapshotAtDamage[LIEBES].statuses.some(status => status.effectGroupId === 10200330101))
})

test('Liebes Flowing Time selects one other ally and uses binary debuffed-enemy scaling on a single Boss', () => {
  const lineup = [LIEBES, ARTORIA, AISHE]
  const result = simulateRaidTable({
    lineup, attackPriority: [AISHE, ARTORIA, LIEBES],
    speeds: { [LIEBES]: 5000, [ARTORIA]: 4000, [AISHE]: 3000 }, turns: 2,
  })
  const first = action(result, 1, LIEBES)
  assert.deepEqual(first.effectsApplied.filter(effect => effect.id.startsWith('liebes-flowing-time')).map(effect => effect.targetId), [LIEBES, AISHE])
  assert.ok(first.statusSnapshotAtDamage[LIEBES].statuses.some(status => status.effectGroupId === 10200330101))
  const second = action(result, 2, LIEBES)
  assert.ok(second.statusSnapshotAtDamage[LIEBES].statuses.some(status => status.effectGroupId === 10200330102))
  assert.ok(second.damageSteps[0].scalingTerms.some(term => Math.abs(term.coefficient - 252 * 1.1 * second.damageSteps[0].defenseMultiplier) < 1e-12))
})

test('Mifri gains Flame Lamp on each action, hastens cooldown recovery, and upgrades third skill uses', () => {
  const result = simulateRaidTable(singleConfig(MIFRI, { turns: 8 }))
  const firstMifri = action(result, 1, MIFRI)
  assert.equal(firstMifri.damageSteps[0].attackRate, 0.05)
  assert.equal(firstMifri.damageSteps[0].modifierSources.find(source => source.id === 'mifri-flame-lamp').nameKey, 'raidBuffMifriFlameLamp')
  assert.equal(firstMifri.statusSnapshotAtDamage[MIFRI].statuses.find(status => status.id === 'mifri-shield').statusClass, RAID_STATUS_CLASSES.REMOVABLE_BUFF)
  assert.equal(firstMifri.removableBuffCountsAtDamage[MIFRI], 1)
  const firstHasten = action(result, 2, MIFRI)
  assert.equal(firstHasten.statusSnapshotAfterAction[MIFRI].statuses.find(status => status.id === 'mifri-hasten').statusClass, RAID_STATUS_CLASSES.REMOVABLE_BUFF)
  assert.equal(firstHasten.removableBuffCountsAfterAction[MIFRI], 2)
  assert.deepEqual(actionsFor(result, MIFRI).slice(0, 5), ['s1', 's2', 'normal', 's1', 's2'])
  assert.equal(action(result, 2, MIFRI).cooldownsAfter.s2, 2)
  assert.equal(action(result, 7, MIFRI).damageSteps[0].percent, 1640)
  assert.equal(action(result, 8, MIFRI).damageSteps[0].percent, 1120)
  assert.equal(action(result, 7, MIFRI).effectsApplied.some(effect => effect.id === 'mifri-shield'), false)
})

test('highest Buff-count selectors choose one frontmost target on a tie', () => {
  const lineup = [RUSTICA, FLORENCE, MIFRI]
  const result = simulateRaidTable({
    lineup, attackPriority: [...lineup], speeds: { [RUSTICA]: 5000, [FLORENCE]: 3000, [MIFRI]: 2000 }, turns: 1,
  })
  const rustica = action(result, 1, RUSTICA)
  const drainEffects = rustica.effectsApplied.filter(effect => effect.id === 'rustica-hp-drain')
  assert.deepEqual(drainEffects.map(effect => effect.targetId), [RUSTICA])
  assert.deepEqual(DEFAULT_RAID_MECHANICS.targetSelectors.highestBuffCount({
    config: { lineup: [1, 2] }, actors: new Map([[1, { statuses: [] }], [2, { statuses: [] }]]),
    api: { removableBuffCount: () => 0 },
  }), [1])
})

test('action records snapshot removable Buff counts at action start and damage time in action order', () => {
  const lineup = [MERLYN, FLORENCE]
  const result = simulateRaidTable({
    lineup, attackPriority: [FLORENCE, MERLYN],
    speeds: { [MERLYN]: 9999, [FLORENCE]: 1 }, turns: 1,
  })
  const merlyn = action(result, 1, MERLYN)
  const florence = action(result, 1, FLORENCE)
  assert.equal(merlyn.removableBuffCountsAtActionStart[FLORENCE], 0)
  assert.equal(merlyn.removableBuffCountsAtDamage[FLORENCE], 0)
  assert.equal(merlyn.removableBuffCountsAfterAction[FLORENCE], 2)
  assert.equal(florence.removableBuffCountsAtActionStart[FLORENCE], 2)
  assert.equal(florence.removableBuffCountsAtDamage[FLORENCE], 2)
  assert.equal(florence.removableBuffCountsAfterAction[FLORENCE], 2)
  assert.equal(florence.statusSnapshotAtDamage[FLORENCE].statuses.length, 2)
})

test('Merlyn S1 skips its attack Buff for a selected target carrying a removable debuff', () => {
  const debuffTargetMerlyn = {
    ...RAID_TABLE_CHARACTERS[MERLYN],
    hooks: [hook('battleStart', [statusEffect({
      id: 'test-removable-debuff', effectGroupId: 990001, nameKey: 'raidBuffMerlynAttack', target: 'topAttack', targetCount: 1,
      duration: 2, statusClass: RAID_STATUS_CLASSES.REMOVABLE_DEBUFF,
    }), statusEffect({
      id: 'test-second-removable-debuff', effectGroupId: 990002, nameKey: 'raidBuffMerlynAttack', target: 'topAttack', targetCount: 1,
      duration: 2, statusClass: RAID_STATUS_CLASSES.REMOVABLE_DEBUFF,
    })])],
  }
  const lineup = [MERLYN, FLORENCE]
  const result = simulateRaidTable({
    lineup, attackPriority: [FLORENCE, MERLYN], speeds: { [MERLYN]: 5000, [FLORENCE]: 1 }, turns: 1,
  }, {
    ...DEFAULT_RAID_ENVIRONMENT,
    characters: { ...RAID_TABLE_CHARACTERS, [MERLYN]: debuffTargetMerlyn },
  })
  const merlyn = action(result, 1, MERLYN)
  assert.equal(merlyn.effectsApplied.find(effect => effect.id === 'merlyn-atk').skipped, true)
  assert.equal(merlyn.effectsApplied.find(effect => effect.id === 'merlyn-debuff-cleanse').removed.length, 2)
  assert.equal(merlyn.effectsApplied.find(effect => effect.id === 'merlyn-critical-damage').targetId, FLORENCE)
  const florence = action(result, 1, FLORENCE)
  assert.equal(florence.removableBuffCountsAtActionStart[FLORENCE], 1)
  assert.equal(florence.statusSnapshotBeforeAction[FLORENCE].statuses.some(status => status.id === 'merlyn-atk'), false)
})

test('Popri and Cattleya use round-start state and skill-use thresholds', () => {
  const lineup = [POPRI, MIFRI, CATTLEYYA]
  const popriTeam = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 6 })
  assert.equal(action(popriTeam, 1, POPRI).runtimeAfter.counters.wordSpell, 2)
  assert.equal(action(popriTeam, 5, POPRI).damageSteps[0].percent, 630)
  assert.equal(action(popriTeam, 6, POPRI).damageSteps[0].percent, 1020)
  assert.equal(popriTeam.rounds[0].roundStartEffects.filter(effect => effect.id === 'popri-buff-cover').length, 3)
  assert.equal(popriTeam.rounds[4].roundStartEffects.filter(effect => effect.id === 'popri-buff-cover').length, 3)

  const cattleyya = simulateRaidTable(singleConfig(CATTLEYYA, { turns: 10 }))
  const firstCattleyyaAction = action(cattleyya, 1, CATTLEYYA)
  assert.equal(firstCattleyyaAction.removableBuffCountsAtActionStart[CATTLEYYA], 2)
  assert.equal(firstCattleyyaAction.removableBuffCountsAtDamage[CATTLEYYA], 3)
  assert.equal(firstCattleyyaAction.damageSteps[0].attackRate, 0.2)
  assert.equal(action(cattleyya, 9, CATTLEYYA).damageSteps[0].attackRate, 0.8)
  assert.equal(action(cattleyya, 10, CATTLEYYA).damageSteps.length, 12)
})

test('Merlan round-start Fairy stacks, magic-defense debuff, and late-skill branches are deterministic', () => {
  const solo = simulateRaidTable(singleConfig(MERLAN, { turns: 10 }))
  const firstSoloAction = action(solo, 1, MERLAN)
  assert.equal(firstSoloAction.runtimeAfter.counters.fairy, 1)
  assert.equal(firstSoloAction.removableBuffCountsAtActionStart[MERLAN], 2)
  assert.equal(firstSoloAction.removableBuffCountsAtDamage[MERLAN], 2)
  assert.equal(firstSoloAction.statusSnapshotAtDamage[MERLAN].statuses.find(status => status.id === 'merlan-fairy').statusClass, 'unremovableState')
  assert.equal(firstSoloAction.statusSnapshotAtDamage[MERLAN].statuses.find(status => status.id === 'merlan-shield').statusClass, 'removableBuff')
  assert.equal(firstSoloAction.statusSnapshotAtDamage[MERLAN].statuses.find(status => status.id === 'merlan-guard').statusClass, 'removableBuff')
  assert.equal(firstSoloAction.bossStatusAfterAction[0].damageRatePerStack, 0)
  assert.equal(firstSoloAction.bossStatusAfterAction[0].magicDefenseRatePerStack, -0.05)
  assert.equal(firstSoloAction.damageSteps[0].defense.pmDefenseRate, -0.05)
  assert.equal(action(solo, 9, MERLAN).bossStatusAfterAction[0].stacks, 5)
  assert.equal(action(solo, 10, MERLAN).damageSteps[0].percent, 630)

  const lineup = [MERLAN, MIFRI, POPRI]
  const lightTeam = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 1 })
  const firstLightAction = action(lightTeam, 1, MERLAN)
  assert.equal(firstLightAction.runtimeAfter.counters.fairy, 2)
  assert.equal(firstLightAction.removableBuffCountsAtActionStart[MERLAN], 4)
  assert.equal(firstLightAction.removableBuffCountsAtDamage[MERLAN], 4)
  assert.equal(firstLightAction.damageSteps[0].modifierSources.find(source => source.id === 'merlan-fairy').rate, 0.06)
})

test('Tama, Mowano, Carol, and Asahi retain count-relevant groups and supported rotation mechanics', () => {
  const lineup = [TAMA, MOWANO, CAROL, ASAHI]
  const result = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 6 })
  const tama = action(result, 1, TAMA)
  assert.equal(tama.removableBuffCountsAtActionStart[TAMA], 5)
  assert.equal(tama.removableBuffCountsAtDamage[TAMA], 6)
  assert.equal(tama.damageSteps[0].percent, 280)
  const tamaS2 = action(result, 2, TAMA).damageSteps[0]
  assert.equal(tamaS2.defense.defenseRate, -0.9)
  assert.equal(tamaS2.bossStatusAfter.find(status => status.id === 'tama-defense-down').defenseRatePerStack, -0.5)
  assert.equal(tamaS2.bossStatusAfter.find(status => status.id === 'tama-defense-down').physicalDefenseRatePerStack, -0.5)
  assert.equal(tamaS2.defense.pmDefenseRate, -0.75)

  const mowano = action(result, 1, MOWANO)
  assert.equal(mowano.removableBuffCountsAtActionStart[MOWANO], 2)
  assert.equal(mowano.bossStatusAfterAction.filter(status => status.id.startsWith('mowano-')).length, 2)
  assert.equal(mowano.bossStatusAfterAction.find(status => status.id === 'mowano-physical-defense-down').statusClass, RAID_STATUS_CLASSES.UNREMOVABLE_DEBUFF)
  assert.equal(mowano.damageSteps[0].defense.pmDefenseRate, -0.25)

  const carol = action(result, 1, CAROL)
  assert.equal(carol.removableBuffCountsAtActionStart[CAROL], 2)
  assert.equal(action(result, 2, CAROL).bossStatusAfterAction.some(status => status.id === 'carol-defense-down'), true)
  assert.equal(action(result, 2, CAROL).damageSteps[0].defense.defenseRate, -0.4)

  assert.equal(action(result, 1, ASAHI).runtimeAfter.counters.windForest, 2)
  assert.equal(action(result, 2, ASAHI).damageSteps.length, 5)
  assert.equal(action(result, 6, ASAHI).damageSteps.length, 10)
})

test('active-skill healing events preserve recipients and apply green-team stacks before damage', () => {
  const lineup = [MILLA, EIDENE, POLA, YILDIZ, WINTER_STELLA]
  const result = simulateRaidTable({
    lineup,
    attackPriority: [WINTER_STELLA, YILDIZ, MILLA, EIDENE, POLA],
    turns: 2,
  })

  const firstMilla = action(result, 1, MILLA)
  assert.equal(firstMilla.damageSteps[0].attackRate, 0)
  assert.equal(firstMilla.runtimeAfter.counters.activeHealingReceived, 1)
  assert.equal(firstMilla.effectsApplied.find(effect => effect.id === 'milla-delay').phase, 'afterDamage')

  const firstYildiz = action(result, 1, YILDIZ)
  assert.equal(firstYildiz.runtimeAfter.counters.bond, 2)
  closeTo(firstYildiz.damageSteps[0].attackRate, 0.36)
  assert.equal(firstYildiz.statusSnapshotAtDamage[YILDIZ].statuses.find(status => status.id === 'yildiz-bond').statusClass, RAID_STATUS_CLASSES.UNREMOVABLE_STATE)

  const firstStella = action(result, 1, WINTER_STELLA)
  assert.equal(firstStella.runtimeAfter.counters.starlight, 3)
  closeTo(firstStella.damageSteps[0].attackRate, 0.84)
  assert.equal(firstStella.damageSteps[0].bossDamageRate, 0.1)
  assert.equal(firstStella.damageSteps[0].defense.pmDefenseRate, -0.2)
  assert.deepEqual(firstStella.bossStatusAfterAction.filter(status => status.id.startsWith('winter-stella')).map(status => status.effectGroupId), [13200130201, 13200130202])

  const eideneS2 = action(result, 2, EIDENE)
  assert.equal(eideneS2.runtimeAfter.counters.vigorousBloom, 7)
  assert.equal(eideneS2.damageSteps[0].percent, 480)
  closeTo(eideneS2.damageSteps[0].attackRate, 0.7)
  assert.equal(eideneS2.effectsApplied.filter(effect => effect.id === 'eidene-vigorous-bloom').length, 3)
})

test('Milla and Yildiz read healing counters before their conditional damage', () => {
  const milla = simulateRaidTable(singleConfig(MILLA, { turns: 10 }))
  assert.equal(action(milla, 1, MILLA).runtimeAfter.counters.activeHealingReceived, 1)
  assert.equal(action(milla, 10, MILLA).runtimeBefore.counters.activeHealingReceived, 5)
  assert.equal(action(milla, 10, MILLA).damageSteps[0].percent, 1920)
  assert.equal(action(milla, 10, MILLA).runtimeAfter.counters.activeHealingReceived, 6)

  const lineup = [EIDENE, YILDIZ]
  const yildiz = simulateRaidTable({ lineup, attackPriority: [YILDIZ, EIDENE], turns: 6 })
  assert.equal(action(yildiz, 6, YILDIZ).runtimeAfter.counters.bond, 10)
  assert.equal(action(yildiz, 6, YILDIZ).damageSteps[0].percent, 1120)
})

test('round-seven healing branches, cooldown resets, speed, and Stella debuffs are structured', () => {
  const eidene = simulateRaidTable(singleConfig(EIDENE, { turns: 10 }))
  assert.equal(action(eidene, 2, EIDENE).runtimeAfter.counters.vigorousBloom, 3)
  assert.equal(action(eidene, 10, EIDENE).damageSteps[0].percent, 1440)
  assert.equal(action(eidene, 10, EIDENE).runtimeAfter.counters.vigorousBloom, 6)

  const pola = simulateRaidTable(singleConfig(POLA, { turns: 8 }))
  assert.equal(action(pola, 7, POLA).actionKey, 's1')
  assert.equal(action(pola, 7, POLA).damageSteps[0].percent, 1180)
  assert.equal(action(pola, 8, POLA).damageSteps[0].percent, 620)
  assert.equal(pola.rounds[6].speedSnapshot[POLA].effectiveSpeed, 2956 * 1.3)
  assert.equal(action(pola, 8, POLA).runtimeAfter.counters.courage, 4)

  const stella = simulateRaidTable(singleConfig(WINTER_STELLA, { turns: 8 }))
  const lateS1 = action(stella, 7, WINTER_STELLA)
  assert.equal(lateS1.actionKey, 's1')
  assert.equal(lateS1.damageSteps[0].bossDamageRate, 0.2)
  assert.equal(lateS1.damageSteps[0].defense.pmDefenseRate, -0.4)
  assert.deepEqual(lateS1.bossStatusAfterAction.filter(status => status.id.startsWith('winter-stella')).map(status => status.effectGroupId), [13200130203, 13200130204])
  const lateS2 = action(stella, 8, WINTER_STELLA)
  assert.equal(lateS2.actionKey, 's2')
  assert.equal(lateS2.bossStatusAfterAction.find(status => status.id === 'winter-stella-silence').statusClass, RAID_STATUS_CLASSES.REMOVABLE_DEBUFF)
  assert.equal(lateS2.runtimeAfter.counters.starlight, 4)
})

test('Ayse reactivates S1 only after the first four hits and snapshots the second self-damage', () => {
  const solo = simulateRaidTable(singleConfig(AISHE, { turns: 1 }))
  const soloS1 = action(solo, 1, AISHE)
  assert.equal(soloS1.damageSteps.length, 4)
  assert.ok(soloS1.damageSteps.every(step => step.attackRate === 0.1))
  assert.equal(soloS1.runtimeAfter.counters.analysis, 1)

  const lineup = [LILICOTTE, AISHE]
  const result = simulateRaidTable({
    lineup, attackPriority: [AISHE, LILICOTTE], speeds: { [LILICOTTE]: 5000, [AISHE]: 1000 }, turns: 2,
  })
  const aisheS1 = action(result, 1, AISHE)
  assert.equal(aisheS1.damageSteps.length, 8)
  assert.ok(aisheS1.damageSteps.slice(0, 4).every(step => Math.abs(step.attackRate - 0.3) < 1e-12))
  assert.ok(aisheS1.damageSteps.slice(4).every(step => Math.abs(step.attackRate - 0.4) < 1e-12))
  assert.equal(aisheS1.runtimeAfter.counters.analysis, 4)
  assert.equal(aisheS1.effectsApplied.filter(effect => effect.id === 'aishe-analysis' && effect.type === 'counter').length, 2)

  const aisheS2 = action(result, 2, AISHE)
  assert.equal(aisheS2.actionKey, 's2')
  assert.equal(aisheS2.damageSteps.length, 5)
  assert.ok(aisheS2.damageSteps.every(step => step.percent === 1520 && step.attackRate === 0.6))
  assert.equal(aisheS2.runtimeAfter.counters.analysis, 6)
  assert.ok(aisheS2.statusSnapshotAtDamage[AISHE].statuses.some(status => status.effectGroupId === 13000330102))
})

test('Lillicotte broadcasts two self-damage events, keeps enhanced normals, and expires her speed after four actions', () => {
  const result = simulateRaidTable(singleConfig(LILICOTTE, { turns: 5 }))
  const s1 = action(result, 1, LILICOTTE)
  assert.equal(s1.damageSteps.length, 6)
  assert.ok(s1.damageSteps.every(step => step.percent === 630))
  assert.equal(s1.statusSnapshotAtDamage[LILICOTTE].statuses.find(status => status.id === 'lilicotte-speed').remainingActions, 4)

  const s2 = action(result, 2, LILICOTTE)
  assert.equal(s2.damageSteps.length, 1)
  assert.equal(s2.damageSteps[0].percent, 1120)
  assert.equal(s2.damageSteps[0].originalTargetCount, 3)
  assert.equal(s2.bossStatusAfterAction.find(status => status.id === 'lilicotte-silence').effectGroupId, 9900250302)

  for (const turn of [3, 4]) {
    const normal = action(result, turn, LILICOTTE)
    assert.equal(normal.actionKey, 'normal')
    assert.equal(normal.damageSteps.length, 3)
    assert.ok(normal.damageSteps.every(step => step.percent === 300))
  }
  assert.equal(result.rounds[0].speedSnapshot[LILICOTTE].effectiveSpeed, 3064 * 1.3)
  assert.equal(result.rounds[3].speedSnapshot[LILICOTTE].effectiveSpeed, 3064 * 1.3)
  assert.equal(result.rounds[4].speedSnapshot[LILICOTTE].effectiveSpeed, 3064)

  const disabled = simulateRaidTable(singleConfig(LILICOTTE, {
    turns: 2, probabilityOverrides: { lilicotteSilence: false },
  }))
  const disabledS2 = action(disabled, 2, LILICOTTE)
  assert.equal(disabledS2.bossStatusAfterAction.some(status => status.id === 'lilicotte-silence'), false)
  assert.equal(disabledS2.effectsApplied.find(effect => effect.id === 'lilicotte-silence').skipped, true)
})

test('Cordie applies defense down before five hits and forces S2 criticals against a debuffed Boss', () => {
  const result = simulateRaidTable(singleConfig(CORDIE, {
    turns: 4,
    guaranteedCritical: false,
    defensePenetrations: { [CORDIE]: 1000 },
  }))
  const s1 = action(result, 1, CORDIE)
  assert.equal(s1.damageSteps.length, 5)
  assert.ok(s1.damageSteps.every(step => step.percent === 570 && step.critical === false))
  assert.ok(s1.damageSteps.every(step => step.attackRate === 0.4))
  assert.ok(s1.damageSteps.every(step => step.defense.defenseRate === -0.8))
  assert.ok(s1.damageSteps.every(step => step.defense.baseDefensePenetration === 1000))
  assert.ok(s1.damageSteps.every(step => step.defense.defensePenetrationRate === 0.4))
  assert.ok(s1.damageSteps.every(step => step.defense.defensePenetration === 1400))
  assert.equal(s1.removableBuffCountsAtDamage[CORDIE], 0)
  assert.deepEqual(
    s1.statusSnapshotAtDamage[CORDIE].statuses.map(status => status.effectGroupId),
    [2700330101, 2700430101],
  )
  const defenseDown = s1.bossStatusAfterAction.find(status => status.id === 'cordie-defense-down')
  assert.equal(defenseDown.effectGroupId, 2700150102)
  assert.equal(defenseDown.statusClass, RAID_STATUS_CLASSES.REMOVABLE_DEBUFF)
  assert.equal(defenseDown.remainingRounds, 3)

  const s2 = action(result, 2, CORDIE)
  assert.equal(s2.damageSteps.length, 1)
  assert.equal(s2.damageSteps[0].percent, 520)
  assert.equal(s2.damageSteps[0].originalTargetCount, 5)
  assert.equal(s2.damageSteps[0].critical, true)
  assert.equal(action(result, 4, CORDIE).statusSnapshotBeforeAction[CORDIE].statuses
    .find(status => status.id === 'cordie-debuff-immunity').remainingActions, 3)

  const withoutDebuff = {
    ...RAID_TABLE_CHARACTERS[CORDIE],
    skills: {
      ...RAID_TABLE_CHARACTERS[CORDIE].skills,
      s1: { ...RAID_TABLE_CHARACTERS[CORDIE].skills.s1, hooks: [] },
    },
  }
  const noForcedCritical = simulateRaidTable(singleConfig(CORDIE, {
    turns: 2, guaranteedCritical: false,
  }), {
    ...DEFAULT_RAID_ENVIRONMENT,
    characters: { ...RAID_TABLE_CHARACTERS, [CORDIE]: withoutDebuff },
  })
  assert.equal(action(noForcedCritical, 2, CORDIE).damageSteps[0].critical, false)
})

test('Summer Sabrina separates pre-hit critical-resist down from post-hit Stun and conditionally adds S2 damage', () => {
  const enabled = simulateRaidTable(singleConfig(SUMMER_SABRINA, { turns: 2 }))
  const s1 = action(enabled, 1, SUMMER_SABRINA)
  assert.equal(s1.damageSteps.length, 1)
  assert.equal(s1.damageSteps[0].percent, 400)
  assert.equal(s1.damageSteps[0].originalTargetCount, 5)
  assert.deepEqual(s1.damageSteps[0].bossStatusBefore.map(status => status.effectGroupId), [7000130101])
  assert.deepEqual(s1.damageSteps[0].bossStatusAfter.map(status => status.effectGroupId), [7000130101])
  assert.deepEqual(s1.bossStatusAfterAction.map(status => status.effectGroupId), [7000130101, 7000120201])
  assert.ok(s1.bossStatusAfterAction.every(status => status.statusClass === RAID_STATUS_CLASSES.REMOVABLE_DEBUFF))
  assert.equal(s1.bossStatusAfterAction.find(status => status.id === 'summer-sabrina-critical-resist-down').remainingRounds, 4)
  assert.equal(s1.bossStatusAfterAction.find(status => status.id === 'summer-sabrina-stun').remainingRounds, 2)
  assert.equal(s1.removableBuffCountsAtDamage[SUMMER_SABRINA], 0)
  assert.deepEqual(
    s1.statusSnapshotAtDamage[SUMMER_SABRINA].statuses.map(status => status.effectGroupId),
    [7000320201, 7000430101],
  )

  const s2 = action(enabled, 2, SUMMER_SABRINA)
  assert.equal(s2.damageSteps.length, 8)
  assert.ok(s2.damageSteps.slice(0, 7).every(step => step.percent === 200))
  assert.equal(s2.damageSteps[7].percent, 600)

  const disabled = simulateRaidTable(singleConfig(SUMMER_SABRINA, {
    turns: 2, guaranteedCritical: false,
  }))
  const disabledS2 = action(disabled, 2, SUMMER_SABRINA)
  assert.equal(disabledS2.damageSteps.length, 7)
  assert.ok(disabledS2.damageSteps.every(step => step.percent === 200 && step.critical === false))

  const lineup = [SUMMER_SABRINA, LIEBES]
  const linked = simulateRaidTable({
    lineup, attackPriority: [...lineup], speeds: { [SUMMER_SABRINA]: 5000, [LIEBES]: 1000 }, turns: 1,
    probabilityOverrides: { liebesStun: false },
  })
  const liebes = action(linked, 1, LIEBES)
  assert.equal(liebes.damageSteps[0].bossStatusBefore.filter(status => status.sourceId === SUMMER_SABRINA).length, 2)
  assert.equal(liebes.statusSnapshotAtDamage[LIEBES].statuses
    .find(status => status.id === 'liebes-flowing-time-self').effectGroupId, 10200330102)
})

test('the r1820 five-character self-damage chain reaches Ayse Analysis cap before her first damage', () => {
  const lineup = [AISHE, LIEBES, LUCILLE, ARTORIA, LILICOTTE]
  const result = simulateRaidTable({
    lineup,
    attackPriority: [AISHE, ARTORIA, LUCILLE, LIEBES, LILICOTTE],
    speeds: { [AISHE]: 1000, [LIEBES]: 2000, [LUCILLE]: 4000, [ARTORIA]: 3000, [LILICOTTE]: 5000 },
    turns: 2,
  })
  const firstAishe = action(result, 1, AISHE)
  assert.equal(firstAishe.runtimeBefore.counters.analysis, 5)
  assert.equal(firstAishe.runtimeAfter.counters.analysis, 6)
  assert.equal(firstAishe.damageSteps.length, 8)
  assert.ok(firstAishe.damageSteps.every(step => step.attackRate === 0.85))
  assert.ok(firstAishe.statusSnapshotAtDamage[AISHE].statuses.some(status => status.effectGroupId === 13000340101))

  const secondLucille = action(result, 2, LUCILLE)
  assert.equal(secondLucille.actionKey, 's2')
  assert.equal(secondLucille.effectsApplied.some(effect => effect.id === 'artoria-justice' && effect.type === 'counter'), true)
  assert.equal(secondLucille.effectsApplied.some(effect => effect.id === 'liebes-messenger-oath' && effect.type === 'counter'), true)
})

test('Mowano copies all removable Buffs at action start, including attack, without consuming their duration immediately', () => {
  const lineup = [CATTLEYYA, MOWANO]
  const result = simulateRaidTable({
    lineup, attackPriority: [...lineup], speeds: { [CATTLEYYA]: 5000, [MOWANO]: 4000 }, turns: 5,
  })
  const firstMowano = action(result, 1, MOWANO)
  const copied = firstMowano.effectsApplied.filter(effect => effect.copiedFromId === CATTLEYYA)
  assert.deepEqual(copied.map(effect => effect.effectGroupId), [9000440101, 9000430101, 9000140103])
  assert.equal(firstMowano.removableBuffCountsAtActionStart[MOWANO], 0)
  assert.equal(firstMowano.removableBuffCountsAtDamage[MOWANO], 3)
  assert.equal(firstMowano.damageSteps[0].attackRate, 0)
  closeTo(firstMowano.effectiveAtkPercent, 590 * 2.1 * firstMowano.damageSteps[0].defenseMultiplier)
  assert.equal(copied.find(effect => effect.effectGroupId === 9000140103).symbolicModifiers[0].coefficient, 0.2)
  const copiedAttackSource = firstMowano.damageSteps[0].scalingTerms.find(source => source.effectGroupId === 9000140103)
  assert.equal(copiedAttackSource.sourceId, CATTLEYYA)
  assert.equal(copiedAttackSource.copiedFromId, CATTLEYYA)
  assert.equal(copiedAttackSource.key, `ATK_${CATTLEYYA}/ATK_${MOWANO}`)

  const secondMowano = action(result, 2, MOWANO)
  const copiedAttack = secondMowano.statusSnapshotBeforeAction[MOWANO].statuses.find(status => status.effectGroupId === 9000140103)
  assert.equal(copiedAttack.remainingActions, 4)
  assert.equal(secondMowano.damageSteps[0].attackRate, 0)
  assert.deepEqual(result.rounds.filter(round => (
    action(result, round.turn, MOWANO).effectsApplied.some(effect => effect.copiedFromId === CATTLEYYA)
  )).map(round => round.turn), [1, 5])
})

test('Mowano retains a copied Buff caster but uses the copied ally ATK as its attack value source', () => {
  const donor = (id, buffId, effectGroupId, rate) => ({
    ...RAID_TABLE_CHARACTERS[id],
    hooks: [hook('battleStart', [statusEffect({
      id: buffId, effectGroupId, nameKey: 'raidBuffMerlynAttack', target: 'topAttack', targetCount: 1,
      duration: 2, modifiers: [{ id: buffId, channel: 'attackRate', rate }],
    })])],
  })
  const lineup = [FENRIR, MERLYN, FLORENCE, MOWANO]
  const result = simulateRaidTable({
    lineup, attackPriority: [FLORENCE, FENRIR, MERLYN, MOWANO],
    speeds: { [FENRIR]: 1, [MERLYN]: 1, [FLORENCE]: 1, [MOWANO]: 5000 }, turns: 1,
  }, {
    ...DEFAULT_RAID_ENVIRONMENT,
    characters: {
      ...RAID_TABLE_CHARACTERS,
      [FENRIR]: donor(FENRIR, 'test-fenrir-buff', 997001, 0.2),
      [MERLYN]: donor(MERLYN, 'test-merlyn-buff', 997002, 0.4),
    },
  })
  const mowano = action(result, 1, MOWANO)
  const copied = mowano.effectsApplied.filter(effect => effect.copiedFromId === FLORENCE)
  assert.deepEqual(copied.map(effect => effect.sourceId), [FENRIR, MERLYN])
  assert.deepEqual(copied.map(effect => effect.copiedFromId), [FLORENCE, FLORENCE])
  assert.deepEqual(mowano.damageSteps[0].scalingTerms.map(term => term.sourceId), [FLORENCE, FLORENCE])
  assert.ok(mowano.damageSteps[0].scalingTerms.every(term => term.key === `ATK_${FLORENCE}/ATK_${MOWANO}`))
})

test('Cattleya and Rustica keep their ordinary attack buffs on the original target', () => {
  const lineup = [RUSTICA, CATTLEYYA]
  const result = simulateRaidTable({
    lineup, attackPriority: [...lineup], speeds: { [RUSTICA]: 5000, [CATTLEYYA]: 4000 }, turns: 2,
  })
  const cattleyya = action(result, 2, CATTLEYYA)
  assert.equal(cattleyya.damageSteps[0].attackRate, 0.7)
  assert.equal(Object.keys(cattleyya.scalingTotals).length, 0)
})

test('Regina uses the logged base-ATK branch and spends Remnant on round three cooldown support', () => {
  const lineup = [REGINA, FLOWER_NATASHA, CANDY_CERBERUS, WITCH_PALADIA, WITCH_ILLYA]
  const result = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 6 })
  const s1 = action(result, 1, REGINA)
  assert.equal(s1.damageSteps.length, 1)
  assert.equal(s1.damageSteps[0].percent, 480)
  assert.equal(s1.damageSteps[0].originalTargetCount, 5)
  assert.equal(s1.damageSteps[0].bossDamageRate, 0.1)
  assert.equal(s1.bossStatusAfterAction.find(status => status.id === 'regina-damage-taken').effectGroupId, 13700120201)

  const s2 = action(result, 2, REGINA)
  assert.equal(s2.damageSteps[0].percent, 1520)
  assert.equal(s2.damageSteps[0].originalTargetCount, 2)
  assert.equal(action(result, 3, REGINA).runtimeBefore.counters.remnant, 3)
  assert.ok(result.rounds[2].roundStartEffects.some(effect => effect.type === 'cooldownReduction' && effect.targetId === REGINA))
  assert.equal(action(result, 6, REGINA).statusSnapshotAfterAction[REGINA].statuses.some(status => status.id === 'regina-remnant'), false)
})

test('Flower Natasha displays Aggravation and Poison without adding DOT damage', () => {
  const result = simulateRaidTable(singleConfig(FLOWER_NATASHA, { turns: 2 }))
  const s1 = action(result, 1, FLOWER_NATASHA)
  assert.equal(s1.damageSteps.length, 2)
  assert.ok(s1.damageSteps.every(step => step.percent === 680 && step.attackRate === 0.1))
  assert.equal(s1.damageSteps[0].bossStatusBefore.find(status => status.id === 'flower-natasha-aggravation').statusClass, RAID_STATUS_CLASSES.UNREMOVABLE_DEBUFF)
  assert.equal(s1.statusSnapshotAtDamage[FLOWER_NATASHA].statuses.find(status => status.id === 'flower-natasha-self-aggravation').statusClass, RAID_STATUS_CLASSES.UNREMOVABLE_DEBUFF)

  const s2 = action(result, 2, FLOWER_NATASHA)
  assert.equal(s2.damageSteps[0].percent, 1320)
  assert.equal(s2.damageSteps[0].bossDamageRate, 0)
  const poison = s2.bossStatusAfterAction.find(status => status.id === 'flower-natasha-poison')
  assert.equal(poison.effectGroupId, 10500250102)
  assert.equal(poison.statusClass, RAID_STATUS_CLASSES.REMOVABLE_DEBUFF)
  assert.equal(poison.remainingRounds, 2)
  assert.equal(poison.damageRatePerStack, 0)
})

test('Candy Cerberus buffs adjacent allies and uses Kindest Magic after the configured revival round', () => {
  const lineup = [REGINA, CANDY_CERBERUS, FLOWER_NATASHA]
  const result = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 5 })
  const s1 = action(result, 1, CANDY_CERBERUS)
  assert.equal(s1.damageSteps.length, 10)
  assert.ok(s1.damageSteps.every(step => step.percent === 340 && step.damageType === 'mag'))
  closeTo(result.rounds[0].speedSnapshot[REGINA].effectiveSpeed, 2856 * 1.1)
  closeTo(result.rounds[0].speedSnapshot[FLOWER_NATASHA].effectiveSpeed, 2601 * 1.1)
  assert.equal(action(result, 1, REGINA).damageSteps[0].attackRate, 0.5)
  const s2 = action(result, 2, CANDY_CERBERUS)
  assert.equal(s2.damageSteps[0].percent, 1980)
  assert.equal(s2.statusSnapshotAtDamage[CANDY_CERBERUS].statuses.find(status => status.id === 'candy-cerberus-kind-magic').effectGroupId, 12900340202)
  assert.equal(s1.statusSnapshotAtDamage[CANDY_CERBERUS].statuses.some(status => status.id === 'candy-cerberus-kind-magic'), false)
  assert.equal(action(result, 5, CANDY_CERBERUS).damageSteps[0].percent, 510)
  assert.equal(action(result, 5, CANDY_CERBERUS).statusSnapshotAfterAction[CANDY_CERBERUS].statuses.some(status => status.id === 'candy-cerberus-kind-magic'), false)

  const delayed = simulateRaidTable({
    lineup, attackPriority: [...lineup], turns: 6,
    activationRounds: { candyCerberusKindMagic: 5 },
  })
  assert.equal(action(delayed, 2, CANDY_CERBERUS).damageSteps[0].percent, 1320)
  assert.equal(action(delayed, 5, CANDY_CERBERUS).damageSteps[0].percent, 510)
  assert.equal(action(delayed, 6, CANDY_CERBERUS).damageSteps[0].percent, 1980)
  assert.ok(action(delayed, 5, CANDY_CERBERUS).statusSnapshotAtDamage[CANDY_CERBERUS].statuses.some(status => status.id === 'candy-cerberus-kind-magic'))
})

test('Witch Paladia consumes twenty team-critical stacks before Black Bullet Rain and rebuilds four', () => {
  const lineup = [REGINA, FLOWER_NATASHA, CANDY_CERBERUS, WITCH_PALADIA, WITCH_ILLYA]
  const result = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 2 })
  const s1 = action(result, 1, WITCH_PALADIA)
  assert.equal(s1.damageSteps[0].percent, 580)
  assert.equal(s1.bossStatusAfterAction.find(status => status.id === 'witch-paladia-critical-resist-down').effectGroupId, 6300120101)

  const s2 = action(result, 2, WITCH_PALADIA)
  assert.equal(s2.runtimeBefore.counters.criticalStacks, 20)
  assert.equal(s2.damageSteps.length, 4)
  assert.ok(s2.damageSteps.every(step => step.percent === 1960 && step.critical))
  assert.equal(s2.runtimeAfter.counters.criticalStacks, 4)
  assert.ok(s2.effectsApplied.some(effect => effect.type === 'removeStatus' && effect.statusId === 'witch-paladia-critical-rate'))
  assert.ok(s2.statusSnapshotAfterAction[WITCH_PALADIA].statuses.some(status => status.id === 'witch-paladia-critical-rate'))
  assert.ok(s2.statusSnapshotAfterAction[REGINA].statuses.some(status => status.id === 'witch-paladia-earned-barrier'))

  const disabled = simulateRaidTable(singleConfig(WITCH_PALADIA, {
    turns: 2, guaranteedCritical: false, probabilityOverrides: { paladiaCriticalResistDown: false },
  }))
  assert.equal(action(disabled, 1, WITCH_PALADIA).bossStatusAfterAction.some(status => status.id === 'witch-paladia-critical-resist-down'), false)
  assert.ok(action(disabled, 2, WITCH_PALADIA).damageSteps.every(step => step.percent === 980 && !step.critical))
})

test('Witch Illya only selects S2 while God Curse Unleashed is present', () => {
  const penetrationResult = simulateRaidTable({
    lineup: [FLOWER_NATASHA, CANDY_CERBERUS, WITCH_ILLYA],
    attackPriority: [FLOWER_NATASHA, CANDY_CERBERUS, WITCH_ILLYA], turns: 1,
  })
  const penetration = action(penetrationResult, 1, WITCH_ILLYA).damageSteps[0].defense
  assert.equal(penetration.baseDefensePenetration, 19_950)
  assert.equal(penetration.defensePenetrationRate, 0.4)
  assert.equal(penetration.defensePenetration, 27_930)

  const solo = simulateRaidTable(singleConfig(WITCH_ILLYA, { turns: 9 }))
  assert.deepEqual(actionsFor(solo, WITCH_ILLYA).slice(0, 5), ['s1', 's2', 's2', 's2', 's1'])
  assert.ok(action(solo, 2, WITCH_ILLYA).damageSteps.every(step => step.percent === 440))
  assert.ok(action(solo, 1, WITCH_ILLYA).statusSnapshotAfterAction[WITCH_ILLYA].statuses.some(status => status.id === 'witch-illya-devotion'))
  assert.ok(action(solo, 2, WITCH_ILLYA).statusSnapshotAtDamage[WITCH_ILLYA].statuses.some(status => status.id === 'witch-illya-curse-unleashed'))
  assert.ok(action(solo, 9, WITCH_ILLYA).damageSteps.slice(0, 10).every(step => step.percent === 720))
  assert.equal(action(solo, 9, WITCH_ILLYA).statusSnapshotAfterAction[WITCH_ILLYA].statuses.some(status => status.id === 'witch-illya-curse-unleashed'), false)

  const lineup = [FLOWER_NATASHA, WITCH_ILLYA]
  const multi = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 2 })
  assert.deepEqual(actionsFor(multi, WITCH_ILLYA), ['s1', 's2'])
  const first = action(multi, 1, WITCH_ILLYA)
  assert.equal(first.statusSnapshotAtDamage[WITCH_ILLYA].statuses.some(status => status.id === 'witch-illya-devotion'), true)
  assert.ok(first.statusSnapshotAtDamage[WITCH_ILLYA].statuses.some(status => status.id === 'witch-illya-barrier'))

  const delayed = simulateRaidTable({
    lineup, attackPriority: [...lineup], turns: 6,
    activationRounds: { witchIllyaCurseUnleashed: 5 },
  })
  assert.deepEqual(actionsFor(delayed, WITCH_ILLYA), ['s1', 'normal', 'normal', 'normal', 's1', 's2'])
  assert.ok(action(delayed, 4, WITCH_ILLYA).statusSnapshotAfterAction[WITCH_ILLYA].statuses.some(status => status.id === 'witch-illya-devotion'))
  assert.equal(action(delayed, 5, WITCH_ILLYA).statusSnapshotAtDamage[WITCH_ILLYA].statuses.some(status => status.id === 'witch-illya-devotion'), false)
  assert.ok(action(delayed, 5, WITCH_ILLYA).statusSnapshotAtDamage[WITCH_ILLYA].statuses.some(status => status.id === 'witch-illya-curse-unleashed'))
})

test('Lunalynn displays Silence and Poison while leaving Poison DOT at zero', () => {
  const result = simulateRaidTable(singleConfig(LUNALYNN, { turns: 8 }))
  assert.deepEqual(actionsFor(result, LUNALYNN), ['s1', 's2', 'normal', 'normal', 'normal', 's2', 'normal', 's1'])

  const s1 = action(result, 1, LUNALYNN)
  assert.equal(s1.damageSteps[0].percent, 300)
  assert.equal(s1.damageSteps[0].originalTargetCount, 5)
  assert.ok(s1.statusSnapshotAtDamage[LUNALYNN].statuses.some(status => status.effectGroupId === 4600160101))
  const silence = s1.bossStatusAfterAction.find(status => status.id === 'lunalynn-silence')
  assert.equal(silence.effectGroupId, 4600150202)
  assert.equal(silence.remainingRounds, 3)

  const s2 = action(result, 2, LUNALYNN)
  assert.equal(s2.damageSteps[0].percent, 285)
  const poison = s2.bossStatusAfterAction.find(status => status.id === 'lunalynn-poison')
  assert.equal(poison.effectGroupId, 4600240102)
  assert.equal(poison.remainingRounds, 3)
  assert.equal(poison.damageRatePerStack, 0)
  assert.ok(s2.statusSnapshotAtDamage[LUNALYNN].statuses.some(status => status.effectGroupId === 4600330101))
  assert.ok(s2.statusSnapshotAtDamage[LUNALYNN].statuses.some(status => status.effectGroupId === 4600430101))
})

test('Armstrong reactivates S1 and converts previous-action critical hits into next-action ATK', () => {
  const lineup = [ARMSTRONG, LUNALYNN]
  const result = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 5 })
  const s1 = action(result, 1, ARMSTRONG)
  assert.equal(s1.damageSteps.length, 2)
  assert.ok(s1.damageSteps.every(step => step.percent === 600 && step.originalTargetCount === 3))
  assert.equal(s1.runtimeAfter.lastActionCriticalHits, 2)
  assert.ok(s1.statusSnapshotAtDamage[LUNALYNN].statuses.some(status => status.effectGroupId === 5000330201))

  const s2 = action(result, 2, ARMSTRONG)
  assert.equal(s2.damageSteps.length, 8)
  assert.ok(s2.damageSteps.every(step => step.percent === 600 && step.attackRate === 0.08))
  assert.equal(s2.runtimeAfter.lastActionCriticalHits, 8)
  assert.equal(action(result, 3, ARMSTRONG).damageSteps[0].attackRate, 0.32)
  assert.equal(action(result, 4, ARMSTRONG).damageSteps[0].attackRate, 0.04)
  assert.ok(action(result, 5, ARMSTRONG).statusSnapshotAtDamage[ARMSTRONG].statuses.some(status => status.effectGroupId === 5000330201))

  const nonCritical = simulateRaidTable(singleConfig(ARMSTRONG, { turns: 2, guaranteedCritical: false }))
  assert.equal(action(nonCritical, 2, ARMSTRONG).damageSteps[0].attackRate, 0)
})

test('Valeriede uses the current reworked MB rotation and permanent-dummy S2 branch', () => {
  const result = simulateRaidTable(singleConfig(VALERIEDE, { turns: 6 }))
  assert.deepEqual(actionsFor(result, VALERIEDE), ['s1', 's2', 'normal', 'normal', 's1', 's2'])
  const s1 = action(result, 1, VALERIEDE)
  assert.equal(s1.damageSteps.length, 10)
  assert.ok(s1.damageSteps.every(step => step.percent === 380 && step.attackRate === 0.7))
  assert.ok(s1.statusSnapshotAtDamage[VALERIEDE].statuses.some(status => status.effectGroupId === 4700340001))
  const s2 = action(result, 2, VALERIEDE)
  assert.equal(s2.damageSteps.length, 6)
  assert.ok(s2.damageSteps.every(step => step.percent === 620 && step.conditionKey === 'raidConditionDummySurvives'))
  assert.equal(s2.statusSnapshotAfterAction[VALERIEDE].statuses.some(status => status.effectGroupId === 4700340001), false)
  assert.ok(s2.statusSnapshotAfterAction[VALERIEDE].statuses.some(status => status.effectGroupId === 4700330101))
})

test('A.A. uses reworked EX3 skills and replaces normal attacks with direct MAG damage', () => {
  const result = simulateRaidTable(singleConfig(AA, { turns: 4 }))
  assert.deepEqual(actionsFor(result, AA), ['s1', 's2', 'normal', 'normal'])
  const s1 = action(result, 1, AA)
  assert.equal(s1.damageSteps.length, 4)
  assert.ok(s1.damageSteps.every(step => step.percent === 710 && step.damageType === 'mag' && step.criticalMultiplier === 2.45))
  const s2 = action(result, 2, AA)
  assert.equal(s2.damageSteps.length, 1)
  assert.equal(s2.damageSteps[0].stat, 'MAG')
  assert.equal(s2.damageSteps[0].percent, 980)
  assert.equal(s2.damageSteps[0].originalTargetCount, 4)
  assert.equal(s2.damageSteps[0].defenseMultiplier, 1)
  closeTo(s2.symbolicTotals.MAG, 980 * 2.45)
  const normal = action(result, 3, AA)
  assert.equal(normal.damageSteps[0].stat, 'MAG')
  assert.equal(normal.damageSteps[0].percent, 330)
  assert.equal(normal.damageSteps[0].originalTargetCount, 3)
  closeTo(normal.symbolicTotals.MAG, 330 * 2.45)
})

test('Sivi uses one configured incoming-hit tier for every Reactive Blade recipient', () => {
  const rates = [0.3, 0.54, 0.72, 0.84, 0.9]
  for (const [tier, rate] of rates.entries()) {
    const result = simulateRaidTable(singleConfig(SIVI, {
      turns: 1, scenarioTiers: { siviReactiveBladeIncomingHits: tier },
    }))
    const s1 = action(result, 1, SIVI)
    assert.equal(s1.damageSteps.length, 1)
    assert.equal(s1.damageSteps[0].percent, 1170)
    closeTo(s1.damageSteps[0].damageRate, rate)
    const status = s1.statusSnapshotAtDamage[SIVI].statuses.find(item => item.id === 'sivi-reactive-blade')
    assert.equal(status.effectGroupId, 5200150101)
    assert.equal(status.statusClass, RAID_STATUS_CLASSES.REMOVABLE_BUFF)
    closeTo(status.modifiers[0].copyRate, rate)
  }

  const lineup = [SIVI, FLORENCE, FENRIR, LUKE, MERTILLIER]
  const shared = simulateRaidTable({
    lineup, attackPriority: [...lineup], turns: 1,
    scenarioTiers: { siviReactiveBladeIncomingHits: 3 },
  })
  const s1 = action(shared, 1, SIVI)
  const recipients = lineup.filter(id => s1.statusSnapshotAfterAction[id].statuses.some(status => status.id === 'sivi-reactive-blade'))
  assert.deepEqual(recipients, [SIVI, FENRIR, MERTILLIER])
  for (const id of recipients) {
    const status = s1.statusSnapshotAfterAction[id].statuses.find(item => item.id === 'sivi-reactive-blade')
    closeTo(status.modifiers[0].copyRate, 0.84)
  }
  assert.deepEqual(actionsFor(shared, SIVI), ['s1'])
})

test('Eirene applies DEF down before S1 and upgrades every S2 from its third use', () => {
  const result = simulateRaidTable(singleConfig(EIRENE, { turns: 11 }))
  assert.deepEqual(actionsFor(result, EIRENE), ['s1', 's2', 'normal', 's1', 's2', 'normal', 's1', 's2', 'normal', 's1', 's2'])

  const s1 = action(result, 1, EIRENE)
  assert.equal(s1.damageSteps[0].percent, 280)
  assert.equal(s1.damageSteps[0].originalTargetCount, 5)
  closeTo(s1.damageSteps[0].defense.defenseRate, -0.25)
  closeTo(s1.damageSteps[0].defense.actualDefense, 150_000)
  const defenseDown = s1.bossStatusAfterAction.find(status => status.id === 'eirene-defense-down')
  assert.equal(defenseDown.effectGroupId, 10900120101)
  assert.equal(defenseDown.statusClass, RAID_STATUS_CLASSES.UNREMOVABLE_DEBUFF)
  assert.equal(defenseDown.remainingRounds, 4)

  const firstS2 = action(result, 2, EIRENE)
  assert.equal(firstS2.damageSteps.length, 4)
  assert.ok(firstS2.damageSteps.every(step => step.percent === 380))
  assert.equal(firstS2.removableBuffCountsAtDamage[EIRENE], 0)

  const thirdS2 = action(result, 8, EIRENE)
  assert.equal(thirdS2.damageSteps.length, 8)
  assert.ok(thirdS2.damageSteps.every(step => step.percent === 760))
  assert.equal(thirdS2.removableBuffCountsAtDamage[EIRENE], 1)
  const hitRate = thirdS2.statusSnapshotAtDamage[EIRENE].statuses.find(status => status.id === 'eirene-natalis-hit-rate')
  assert.equal(hitRate.effectGroupId, 10900220301)
  assert.equal(hitRate.statusClass, RAID_STATUS_CLASSES.REMOVABLE_BUFF)
})

test('Eirene enhanced normal reduces her and the slowest ally cooldowns and retains the ally barrier state', () => {
  const solo = simulateRaidTable(singleConfig(EIRENE, { turns: 4 }))
  const normal = action(solo, 3, EIRENE)
  assert.equal(normal.actionKey, 'normal')
  assert.deepEqual(normal.cooldownsBefore, { s1: 2, s2: 3 })
  assert.deepEqual(normal.cooldownsAfter, { s1: 0, s2: 1 })
  assert.ok(normal.effectsApplied.some(effect => effect.type === 'cooldownReduction' && effect.amount === 1))
  assert.ok(normal.effectsApplied.some(effect => effect.type === 'removeStatus' && effect.statusId === 'eirene-enhanced-normal-self'))
  assert.equal(normal.statusSnapshotAfterAction[EIRENE].statuses.some(status => status.id === 'eirene-enhanced-normal-self'), false)
  assert.equal(action(solo, 4, EIRENE).actionKey, 's1')

  const lineup = [EIRENE, SIVI, MERTILLIER]
  const team = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 4 })
  const eirene = action(team, 1, EIRENE)
  const enhanced = eirene.statusSnapshotBeforeAction[MERTILLIER].statuses.find(status => status.id === 'eirene-enhanced-normal-ally')
  const barrier = eirene.statusSnapshotBeforeAction[MERTILLIER].statuses.find(status => status.id === 'eirene-barrier')
  assert.equal(enhanced.effectGroupId, 10900330201)
  assert.equal(barrier.effectGroupId, 10900440201)
  assert.equal(enhanced.statusClass, RAID_STATUS_CLASSES.UNREMOVABLE_STATE)
  assert.equal(barrier.statusClass, RAID_STATUS_CLASSES.UNREMOVABLE_STATE)
  assert.equal(eirene.statusSnapshotBeforeAction[SIVI].statuses.some(status => status.id === 'eirene-barrier'), false)

  const allyNormal = action(team, 3, MERTILLIER)
  assert.equal(allyNormal.actionKey, 'normal')
  assert.deepEqual(allyNormal.cooldownsBefore, { s1: 2, s2: 3 })
  assert.deepEqual(allyNormal.cooldownsAfter, { s1: 0, s2: 1 })
  assert.ok(allyNormal.effectsApplied.some(effect => effect.type === 'cooldownReduction' && effect.targetId === MERTILLIER))
  assert.ok(allyNormal.effectsApplied.some(effect => effect.type === 'removeStatus' && effect.statusId === 'eirene-enhanced-normal-ally'))
  assert.equal(allyNormal.statusSnapshotAfterAction[MERTILLIER].statuses.some(status => status.id === 'eirene-enhanced-normal-ally'), false)
  assert.equal(action(team, 4, MERTILLIER).actionKey, 's1')
})
