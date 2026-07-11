import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_RAID_BENCH_ID,
  DEFAULT_RAID_ACTION_ORDER,
  DEFAULT_RAID_ATTACK_PRIORITY,
  DEFAULT_RAID_LINEUP,
  RAID_STATUS_CLASSES,
  RAID_TABLE_CHARACTER_IDS,
  RAID_TABLE_ROSTER,
  replaceRaidBenchMember,
} from '../src/constants/raidTableCharacters.js'
import { simulateRaidTable } from '../src/engine/raidTableCalc.js'

const { FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER, RUSTICA } = RAID_TABLE_CHARACTER_IDS

function actionsFor(result, characterId) {
  return result.rounds.map(round => round.actions.find(action => action.actorId === characterId).actionKey)
}

test('default raid table produces the expected ten-turn rotations', () => {
  const result = simulateRaidTable()

  assert.deepEqual(actionsFor(result, FLORENCE), ['s1', 's2', 's1', 's2', 'normal', 's1', 's2', 'normal', 's1', 's2'])
  assert.deepEqual(actionsFor(result, FENRIR), ['s1', 's2', 'normal', 'normal', 's1', 's2', 'normal', 'normal', 's1', 's2'])
  assert.deepEqual(actionsFor(result, MERLYN), ['s1', 's2', 'normal', 'normal', 's1', 's2', 'normal', 'normal', 's1', 's2'])
  assert.deepEqual(actionsFor(result, MERTILLIER), ['s1', 's2', 'normal', 'normal', 's1', 's2', 'normal', 'normal', 's1', 's2'])
  assert.deepEqual(actionsFor(result, LUKE), ['s1', 's2', 's1', 'normal', 'normal', 's1', 's2', 'normal', 'normal', 's1'])
})

test('default raid table matches the normalized ATK and symbolic STR golden totals', () => {
  const result = simulateRaidTable()

  assert.equal(result.teamAtkPercent, 49_956.25)
  assert.equal(result.symbolicTotals.STR, 2_160)
  assert.equal(result.characterTotals[FLORENCE].atkPercent, 39_666.25)
  assert.equal(result.characterTotals[FENRIR].atkPercent, 4_236)
  assert.equal(result.characterTotals[LUKE].atkPercent, 2_884)
  assert.equal(result.characterTotals[MERLYN].atkPercent, 1_540)
  assert.equal(result.characterTotals[MERTILLIER].atkPercent, 1_630)
})

test('Florence only consumes buffs that existed before her action', () => {
  const result = simulateRaidTable()
  const turn1 = result.rounds[0].actions.find(action => action.actorId === FLORENCE)
  const turn3 = result.rounds[2].actions.find(action => action.actorId === FLORENCE)

  assert.equal(turn1.baseAtkPercent, 3_150)
  assert.equal(turn1.modifierTotals.attackRate, 0.3)
  assert.equal(turn1.modifierTotals.damageDealtRate, 0.3)
  assert.equal(turn1.effectiveAtkPercent, 5_323.5)

  assert.equal(turn3.baseAtkPercent, 3_150)
  assert.equal(turn3.modifierTotals.attackRate, 1.75)
  assert.equal(turn3.modifierTotals.damageDealtRate, 0.3)
  assert.equal(turn3.effectiveAtkPercent, 11_261.25)
  assert.deepEqual(
    turn3.modifierSources.filter(source => source.channel === 'attackRate').map(source => source.id).sort(),
    ['fenrir-atk', 'florence-atk', 'merlyn-atk', 'mertillier-atk'],
  )
})

test('moving Fenrir changes both adjacency targets and the resulting rotation', () => {
  const lineup = [FLORENCE, LUKE, MERLYN, MERTILLIER, FENRIR]
  const actionOrder = DEFAULT_RAID_ACTION_ORDER.filter(id => lineup.includes(id))
  const attackPriority = DEFAULT_RAID_ATTACK_PRIORITY.filter(id => lineup.includes(id))
  const result = simulateRaidTable({ lineup, actionOrder, attackPriority })
  const fenrirTurn1 = result.rounds[0].actions.find(action => action.actorId === FENRIR)
  const cooldownTargets = fenrirTurn1.effectsApplied
    .filter(effect => effect.type === 'cooldownReduction')
    .map(effect => effect.targetId)

  assert.deepEqual(cooldownTargets, [MERTILLIER])
  assert.notDeepEqual(actionsFor(result, FLORENCE), ['s1', 's2', 's1', 's2', 'normal', 's1', 's2', 'normal', 's1', 's2'])
})

test('attack priority reroutes Merlyn and Mertillier support effects', () => {
  const attackPriority = [LUKE, FENRIR, FLORENCE, MERLYN, MERTILLIER]
  const result = simulateRaidTable({
    lineup: [...DEFAULT_RAID_LINEUP],
    actionOrder: [...DEFAULT_RAID_ACTION_ORDER],
    attackPriority,
  })
  const merlynTurn1 = result.rounds[0].actions.find(action => action.actorId === MERLYN)
  const mertillierTurn2 = result.rounds[1].actions.find(action => action.actorId === MERTILLIER)

  assert.deepEqual(
    merlynTurn1.effectsApplied.filter(effect => effect.type === 'status').map(effect => effect.targetId),
    [LUKE, FENRIR, LUKE, FENRIR],
  )
  assert.deepEqual(
    mertillierTurn2.effectsApplied.map(effect => effect.targetId),
    [LUKE, LUKE],
  )
})

test('the six-character roster defaults to Rustica on the bench and swaps all orders in place', () => {
  assert.equal(RAID_TABLE_ROSTER.length, 6)
  assert.equal(DEFAULT_RAID_BENCH_ID, RUSTICA)
  assert.deepEqual(DEFAULT_RAID_LINEUP, [FLORENCE, FENRIR, LUKE, MERLYN, MERTILLIER])

  assert.deepEqual(
    replaceRaidBenchMember(DEFAULT_RAID_LINEUP, FENRIR, RUSTICA),
    [FLORENCE, RUSTICA, LUKE, MERLYN, MERTILLIER],
  )
  assert.deepEqual(
    replaceRaidBenchMember(DEFAULT_RAID_ACTION_ORDER, FENRIR, RUSTICA),
    [LUKE, FLORENCE, RUSTICA, MERLYN, MERTILLIER],
  )
  assert.deepEqual(
    replaceRaidBenchMember(DEFAULT_RAID_ATTACK_PRIORITY, FENRIR, RUSTICA),
    [FLORENCE, RUSTICA, LUKE, MERLYN, MERTILLIER],
  )
})

test('Rustica keeps five S1 hits and grows S2 history as 4, 5, 6, 6 hits', () => {
  const lineup = [FLORENCE, LUKE, MERLYN, MERTILLIER, RUSTICA]
  const result = simulateRaidTable({
    lineup,
    actionOrder: [LUKE, FLORENCE, MERLYN, MERTILLIER, RUSTICA],
    attackPriority: [FLORENCE, LUKE, MERLYN, MERTILLIER, RUSTICA],
    turns: 15,
  })
  const rusticaActions = result.rounds.map(round => round.actions.find(action => action.actorId === RUSTICA))
  const s1Actions = rusticaActions.filter(action => action.actionKey === 's1')
  const s2Actions = rusticaActions.filter(action => action.actionKey === 's2')

  assert.deepEqual(rusticaActions.map(action => action.actionKey), [
    's1', 's2', 'normal', 'normal', 's1', 's2', 'normal', 'normal', 's1', 's2', 'normal', 'normal', 's1', 's2', 'normal',
  ])
  assert.ok(s1Actions.every(action => action.attackTerms[0].hits === 5))
  assert.deepEqual(s2Actions.map(action => action.attackTerms[0].hits), [4, 5, 6, 6])
  assert.deepEqual(s2Actions.map(action => action.historyBefore.skillUses.s2), [0, 1, 2, 3])
  assert.deepEqual(s2Actions.map(action => action.historyAfter.skillUses.s2), [1, 2, 3, 4])
})

function rusticaBuffScenario() {
  const lineup = [FLORENCE, FENRIR, RUSTICA, MERLYN, MERTILLIER]
  return simulateRaidTable({
    lineup,
    actionOrder: [FENRIR, MERLYN, MERTILLIER, FLORENCE, RUSTICA],
    attackPriority: [RUSTICA, MERTILLIER, FLORENCE, FENRIR, MERLYN],
    turns: 2,
  })
}

test('Rustica counts only removable EffectGroups for the three/four buff passive threshold', () => {
  const result = rusticaBuffScenario()
  const turn1 = result.rounds[0].actions.find(action => action.actorId === RUSTICA)
  const turn2 = result.rounds[1].actions.find(action => action.actorId === RUSTICA)

  assert.equal(turn1.statusSnapshotBeforeAction[RUSTICA].removableBuffCount, 3)
  assert.equal(turn1.effectsApplied.some(effect => effect.id === 'rustica-action-atk'), false)
  assert.ok(turn2.statusSnapshotBeforeAction[RUSTICA].removableBuffCount >= 4)
  assert.equal(turn2.effectsApplied.some(effect => effect.id === 'rustica-action-atk'), true)

  const unremovable = turn2.statusSnapshotBeforeAction[RUSTICA].statuses
    .filter(status => status.statusClass === RAID_STATUS_CLASSES.UNREMOVABLE_STATE)
  assert.ok(unremovable.length >= 2)
  assert.ok(unremovable.every(status => status.countsTowardBuffCount === false))
})

test('Rustica applies her S2 attack buff before damage and preserves a self-applied four-action duration', () => {
  const result = rusticaBuffScenario()
  const turn1 = result.rounds[0].actions.find(action => action.actorId === RUSTICA)
  const turn2 = result.rounds[1].actions.find(action => action.actorId === RUSTICA)
  const hpDrain = turn1.effectsApplied.find(effect => effect.id === 'rustica-hp-drain')
  const s2Attack = turn2.effectsApplied.find(effect => effect.id === 'rustica-s2-atk')

  assert.equal(hpDrain.targetId, RUSTICA)
  assert.equal(turn2.statusSnapshotBeforeAction[RUSTICA].statuses.find(status => status.id === 'rustica-hp-drain').remainingActions, 4)
  assert.equal(s2Attack.targetId, RUSTICA)
  assert.ok(turn2.modifierSources.some(source => source.id === 'rustica-s2-atk' && source.rate === 0.3))
})

test('highest buff count ties use lineup order and unremovable states do not affect selection', () => {
  const lineup = [FLORENCE, FENRIR, RUSTICA, MERLYN, MERTILLIER]
  const result = simulateRaidTable({
    lineup,
    actionOrder: [RUSTICA, FLORENCE, FENRIR, MERLYN, MERTILLIER],
    attackPriority: [FLORENCE, FENRIR, RUSTICA, MERLYN, MERTILLIER],
    turns: 1,
  })
  const rustica = result.rounds[0].actions[0]
  const hpDrain = rustica.effectsApplied.find(effect => effect.id === 'rustica-hp-drain')

  assert.deepEqual(hpDrain.selectionCounts, {
    [FLORENCE]: 0, [FENRIR]: 0, [RUSTICA]: 0, [MERLYN]: 0, [MERTILLIER]: 0,
  })
  assert.equal(hpDrain.targetId, FLORENCE)
})

test('Merlyn has two removable groups, Mertillier attack/defense is one, and shields keep their class', () => {
  const result = simulateRaidTable()
  const merlynS1 = result.rounds[0].actions.find(action => action.actorId === MERLYN)
  const mertillierS1 = result.rounds[0].actions.find(action => action.actorId === MERTILLIER)
  const mertillierS2 = result.rounds[1].actions.find(action => action.actorId === MERTILLIER)

  assert.equal(merlynS1.effectsApplied.filter(effect => effect.type === 'status').length, 4)
  assert.equal(new Set(merlynS1.effectsApplied.filter(effect => effect.type === 'status').map(effect => effect.effectGroupId)).size, 2)
  assert.equal(mertillierS2.effectsApplied.filter(effect => effect.type === 'status').length, 1)
  assert.equal(mertillierS2.effectsApplied.find(effect => effect.type === 'status').effectGroupId, 2900260102)
  assert.equal(mertillierS1.effectsApplied.find(effect => effect.id === 'mertillier-shield').statusClass, RAID_STATUS_CLASSES.REMOVABLE_BUFF)
})

test('Rustica shield and guardian are unremovable states and never count as buffs', () => {
  const result = rusticaBuffScenario()
  const rusticaTurn1 = result.rounds[0].actions.find(action => action.actorId === RUSTICA)
  const passiveStates = rusticaTurn1.effectsApplied.filter(effect => (
    effect.id === 'rustica-shield-self' || effect.id === 'rustica-shield-ally' || effect.id === 'rustica-guardian'
  ))

  assert.equal(passiveStates.length, 3)
  assert.ok(passiveStates.every(effect => effect.statusClass === RAID_STATUS_CLASSES.UNREMOVABLE_STATE))
  assert.ok(passiveStates.every(effect => effect.countsTowardBuffCount === false))
})

test('single-target normalization keeps explicit hits and excludes symbolic terms from ATK total', () => {
  const result = simulateRaidTable()
  const florenceS1 = result.rounds[0].actions.find(action => action.actorId === FLORENCE)
  const fenrirS2 = result.rounds[1].actions.find(action => action.actorId === FENRIR)
  const lukeS2 = result.rounds[1].actions.find(action => action.actorId === LUKE)

  assert.equal(florenceS1.attackTerms[0].hits, 6)
  assert.equal(florenceS1.baseAtkPercent, 3_150)
  assert.equal(fenrirS2.attackTerms[0].originalTargetCount, 5)
  assert.equal(fenrirS2.baseAtkPercent, 380)
  assert.equal(lukeS2.baseAtkPercent, 0)
  assert.deepEqual(lukeS2.symbolicTerms, [
    { stat: 'STR', percent: 780, hits: 1, conditionKey: 'raidConditionDummyNoShield' },
  ])
})
