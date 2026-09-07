import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { survivalCapacity, SURVIVAL_SCENARIOS } from '../src/utils/characterSurvival.js'
import { offenseGain, OFFENSE_SCENARIOS } from '../src/utils/characterOffense.js'
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`)
test('HP and independent block multiply; damage-bucket reduction is diluted by damage bonuses', () => {
  near(survivalCapacity({ hp: 1, block: .5 }).withoutShield, 4)
  near(survivalCapacity({ reduction: .5 }, { ...SURVIVAL_SCENARIOS[1], damageBonus: 0 }).withoutShield, 2)
  near(survivalCapacity({ reduction: .5 }).withoutShield, 1.25 / .75)
  near(survivalCapacity({ hp: .4, defense: 1 }).withoutShield, 2.1)
})
test('attack shields use attack to HP ratio; defense routes stay separate', () => {
  near(survivalCapacity({ shieldAttack: 3 }).withShield, 2)
  near(survivalCapacity({ shieldAttack: 10 }).withShield, 1 + 10 / 3)
  near(survivalCapacity({ physicalDefense: 1 }, undefined, 'magic').withoutShield, 1)
  near(survivalCapacity({ physicalDefense: 1 }).withoutShield, 1.5)
  near(survivalCapacity({ hp: 1, shieldHp: 1, block: .5 }).withShield, 8)
})
test('offense uses same-bucket addition and cross-bucket multiplication', () => {
  const base = { ...OFFENSE_SCENARIOS[1], attackBonus: 0, damageBonus: 0 }
  near(offenseGain({ attack: .3, damage: .3 }, base).gain, 1.69)
  near(offenseGain({ attack: .6 }, base).gain, 1.6)
  near(offenseGain({ attack: .3, damage: .3 }).gain, 1.44)
})
test('critical expectation caps chance and penetration remains nonlinear', () => {
  near(offenseGain({ guaranteedCrit: true, critRate: .8 }).gain, offenseGain({ guaranteedCrit: true }).gain)
  near(offenseGain({ critRate: .8 }).gain, offenseGain({ critRate: .5 }).gain)
  near(offenseGain({ defenseDown: .8 }).factors.defense, 2 / 1.2)
  assert.ok(offenseGain({ defenseDown: .8 }, OFFENSE_SCENARIOS[2]).gain > offenseGain({ defenseDown: .8 }, OFFENSE_SCENARIOS[0]).gain)
  near(offenseGain({ penetration: .4 }).factors.defense, 2 / (1 + 2 / 2.4))
  near(offenseGain({ attackFromDefense: 2 }).factors.attack, 2.5 / 1.5)
})
test('unbounded mitigation and invalid inputs are rejected', () => {
  assert.throws(() => survivalCapacity({ block: 1 }))
  assert.throws(() => survivalCapacity({ reduction: 1 }, SURVIVAL_SCENARIOS[0]))
  assert.throws(() => survivalCapacity({ hp: NaN }))
  assert.throws(() => offenseGain({ defenseDown: 2 }))
  assert.throws(() => survivalCapacity({ healingAsMitigation: .6 }))
  assert.throws(() => offenseGain({ attackTypo: .3 }))
})
test('published reference states preserve reviewed inputs, sources and score decisions', () => {
  for (const kind of ['survival']) {
    const source = JSON.parse(fs.readFileSync(new URL(`../doc/character-ratings/${kind}-profiles.json`, import.meta.url)))
    for (const profile of source.profiles) {
      const rating = JSON.parse(fs.readFileSync(new URL(`../public/data/character-ratings/${profile.id}.json`, import.meta.url)))
      const published = rating.quantitative[kind]
      assert.equal(published.version, source.version)
      assert.deepEqual(published.states.map(({ comparisons, ...state }) => state), profile.states)
      assert.equal(published.note, profile.note)
      if (kind === 'survival') assert.equal(rating.axes[2].score, profile.score)
      else { assert.equal(rating.axes[0].score, profile.scores.single); assert.equal(rating.axes[1].score, profile.scores.area) }
      for (const state of published.states) {
        assert.ok(state.evidence.every(key => rating.sources.some(s => s.key === key)))
        for (const result of state.comparisons) {
          const expected = kind === 'survival' ? {
            physical: survivalCapacity(state.effects, SURVIVAL_SCENARIOS.find(s => s.key === result.scenario), 'physical'),
            magic: survivalCapacity(state.effects, SURVIVAL_SCENARIOS.find(s => s.key === result.scenario), 'magic'),
          } : offenseGain(state.effects, OFFENSE_SCENARIOS.find(s => s.key === result.scenario))
          const { scenario, ...actual } = result
          assert.deepEqual(actual, expected)
        }
      }
    }
  }
})


test('ordinary damage scenarios preserve combined mitigation and conditional block comparisons', () => {
  const [neutral, advantage, pressure] = SURVIVAL_SCENARIOS
  assert.deepEqual(SURVIVAL_SCENARIOS.map(s => s.damageBonus), [0, .25, 1])
  near(survivalCapacity({ hp: 1, reduction: .65 }, neutral).withoutShield, 2 / .35)
  near(survivalCapacity({ hp: 1, reduction: .65 }, advantage).withoutShield, 2 * 1.25 / .6)
  near(survivalCapacity({ reduction: .7, block: .5 }, advantage).withoutShield, 2 * 1.25 / .55)
  for (const scenario of [neutral, advantage, pressure]) {
    near(survivalCapacity({ block: .75 }, scenario).withoutShield, 4)
    near(survivalCapacity({ block: .5 }, scenario).withoutShield, 2)
  }
  assert.ok(survivalCapacity({ reduction: .7, block: .5 }, advantage).withoutShield > survivalCapacity({ block: .75 }, advantage).withoutShield)
  assert.ok(survivalCapacity({ reduction: .7 }, advantage).withoutShield < survivalCapacity({ block: .75 }, advantage).withoutShield)
})
