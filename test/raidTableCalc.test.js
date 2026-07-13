import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_RAID_ATTACK_PRIORITY,
  DEFAULT_RAID_LINEUP,
  RAID_STATUS_CLASSES,
  RAID_TABLE_CHARACTERS,
  RAID_TABLE_CHARACTER_IDS,
  RAID_TABLE_ROSTER,
  createDefaultRaidTableConfig,
} from '../src/constants/raidTableCharacters.js'
import {
  DEFAULT_RAID_ENVIRONMENT,
  DEFAULT_RAID_MECHANICS,
  compileRaidProgram,
  simulateRaidTable,
} from '../src/engine/raidTableCalc.js'
import { hook, statusEffect } from '../src/constants/raid/shared.js'

const {
  FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER, RUSTICA,
  ARTORIA, LIBERIA, SPRING_SHIZU, MORGANA, LUCILLE, FRACK, GUINEVERE, LIEBES, MIFRI, POPRI, CATTLEYYA, MERLAN, TAMA, MOWANO, CAROL, ASAHI,
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

test('roster exposes twenty-two characters and the original five remain the default lineup', () => {
  assert.equal(RAID_TABLE_ROSTER.length, 22)
  assert.deepEqual(DEFAULT_RAID_LINEUP, [FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER])
  assert.deepEqual(DEFAULT_RAID_ATTACK_PRIORITY, [FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER])
  assert.deepEqual(RAID_TABLE_ROSTER.slice(-16), [ARTORIA, LIBERIA, SPRING_SHIZU, MORGANA, LUCILLE, FRACK, GUINEVERE, LIEBES, MIFRI, POPRI, CATTLEYYA, MERLAN, TAMA, MOWANO, CAROL, ASAHI])
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

test('disabling guaranteed criticals removes critical multipliers, Florence follow-ups, and Luke stacks', () => {
  const result = simulateRaidTable({ ...createDefaultRaidTableConfig(), guaranteedCritical: false, turns: 1 })
  assert.equal(action(result, 1, FLORENCE).damageSteps.length, 6)
  assert.ok(action(result, 1, FLORENCE).damageSteps.every(step => step.criticalMultiplier === 1))
  assert.equal(action(result, 1, LUKE).bossStatusAfterAction.length, 0)
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
  closeTo(florence.damageSteps[0].effectivePercent, 525 * 1.3 * 1.6 * 2.1)
})

test('default lineup has a stable new critical-aware golden total', () => {
  const result = simulateRaidTable()
  closeTo(result.teamAtkPercent, 256388.5975, 1e-7)
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

test('Liebes defense debuffs add two zero-rate Boss groups that power debuff-count effects without defense calculation', () => {
  const result = simulateRaidTable(singleConfig(LIEBES, { turns: 2 }))
  const s1 = action(result, 1, LIEBES)
  const defenseDebuffs = s1.bossStatusAfterAction.filter(status => status.id.startsWith('liebes-'))
  assert.deepEqual(defenseDebuffs.map(status => status.id), ['liebes-defense-down', 'liebes-physical-defense-down'])
  assert.ok(defenseDebuffs.every(status => status.damageRatePerStack === 0))
  assert.equal(s1.damageSteps[0].bossDamageRate, 0)
  const s2 = action(result, 2, LIEBES)
  assert.equal(s2.damageSteps[0].percent, 600)
  assert.ok(s2.damageSteps[0].scalingTerms.some(term => Math.abs(term.coefficient - 378) < 1e-12))
  assert.equal(s2.damageSteps[0].attackRate, 0.1)
})

test('Mifri gains Flame Lamp on each action, hastens cooldown recovery, and upgrades third skill uses', () => {
  const result = simulateRaidTable(singleConfig(MIFRI, { turns: 8 }))
  const firstMifri = action(result, 1, MIFRI)
  assert.equal(firstMifri.damageSteps[0].attackRate, 0.05)
  assert.equal(firstMifri.damageSteps[0].modifierSources.find(source => source.id === 'mifri-flame-lamp').nameKey, 'raidBuffMifriFlameLamp')
  assert.deepEqual(actionsFor(result, MIFRI).slice(0, 5), ['s1', 's2', 'normal', 's1', 's2'])
  assert.equal(action(result, 2, MIFRI).cooldownsAfter.s2, 2)
  assert.equal(action(result, 7, MIFRI).damageSteps[0].percent, 1640)
  assert.equal(action(result, 8, MIFRI).damageSteps[0].percent, 1120)
  assert.equal(action(result, 7, MIFRI).effectsApplied.some(effect => effect.id === 'mifri-shield'), false)
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

test('Merlan round-start Fairy stacks, zero-rate magic-defense debuff, and late-skill branches are deterministic', () => {
  const solo = simulateRaidTable(singleConfig(MERLAN, { turns: 10 }))
  const firstSoloAction = action(solo, 1, MERLAN)
  assert.equal(firstSoloAction.runtimeAfter.counters.fairy, 1)
  assert.equal(firstSoloAction.removableBuffCountsAtActionStart[MERLAN], 2)
  assert.equal(firstSoloAction.removableBuffCountsAtDamage[MERLAN], 2)
  assert.equal(firstSoloAction.statusSnapshotAtDamage[MERLAN].statuses.find(status => status.id === 'merlan-fairy').statusClass, 'unremovableState')
  assert.equal(firstSoloAction.statusSnapshotAtDamage[MERLAN].statuses.find(status => status.id === 'merlan-shield').statusClass, 'removableBuff')
  assert.equal(firstSoloAction.statusSnapshotAtDamage[MERLAN].statuses.find(status => status.id === 'merlan-guard').statusClass, 'removableBuff')
  assert.equal(firstSoloAction.bossStatusAfterAction[0].damageRatePerStack, 0)
  assert.equal(action(solo, 9, MERLAN).bossStatusAfterAction[0].stacks, 5)
  assert.equal(action(solo, 10, MERLAN).damageSteps[0].percent, 630)

  const lineup = [MERLAN, MIFRI, POPRI]
  const lightTeam = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 1 })
  const firstLightAction = action(lightTeam, 1, MERLAN)
  assert.equal(firstLightAction.runtimeAfter.counters.fairy, 2)
  assert.equal(firstLightAction.removableBuffCountsAtActionStart[MERLAN], 3)
  assert.equal(firstLightAction.removableBuffCountsAtDamage[MERLAN], 3)
  assert.equal(firstLightAction.damageSteps[0].modifierSources.find(source => source.id === 'merlan-fairy').rate, 0.06)
})

test('Tama, Mowano, Carol, and Asahi retain count-relevant groups and supported rotation mechanics', () => {
  const lineup = [TAMA, MOWANO, CAROL, ASAHI]
  const result = simulateRaidTable({ lineup, attackPriority: [...lineup], turns: 6 })
  const tama = action(result, 1, TAMA)
  assert.equal(tama.removableBuffCountsAtActionStart[TAMA], 5)
  assert.equal(tama.removableBuffCountsAtDamage[TAMA], 6)
  assert.equal(tama.damageSteps[0].percent, 280)

  const mowano = action(result, 1, MOWANO)
  assert.equal(mowano.removableBuffCountsAtActionStart[MOWANO], 2)
  assert.equal(mowano.bossStatusAfterAction.length, 2)

  const carol = action(result, 1, CAROL)
  assert.equal(carol.removableBuffCountsAtActionStart[CAROL], 2)
  assert.equal(action(result, 2, CAROL).bossStatusAfterAction.some(status => status.id === 'carol-defense-down'), true)

  assert.equal(action(result, 1, ASAHI).runtimeAfter.counters.windForest, 2)
  assert.equal(action(result, 2, ASAHI).damageSteps.length, 5)
  assert.equal(action(result, 6, ASAHI).damageSteps.length, 10)
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
  closeTo(firstMowano.effectiveAtkPercent, 590 * 2.1)
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
