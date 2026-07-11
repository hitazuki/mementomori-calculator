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

const {
  FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER, RUSTICA,
  ARTORIA, LIBERIA, SPRING_SHIZU,
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

test('roster exposes nine characters and the original five remain the default lineup', () => {
  assert.equal(RAID_TABLE_ROSTER.length, 9)
  assert.deepEqual(DEFAULT_RAID_LINEUP, [FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER])
  assert.deepEqual(DEFAULT_RAID_ATTACK_PRIORITY, [FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER])
  assert.deepEqual(RAID_TABLE_ROSTER.slice(-3), [ARTORIA, LIBERIA, SPRING_SHIZU])
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
  assert.deepEqual(DEFAULT_RAID_MECHANICS.targetSelectors.adjacent(
    { ownerId: 2, config: { lineup: [1, 2, 3] } },
  ), [1, 3])
})
