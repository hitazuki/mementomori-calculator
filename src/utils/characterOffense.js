// Marginal benefit of a reviewed self-buff snapshot, not total skill damage.
export const OFFENSE_SCENARIOS = [
  { key: 'low', label: '低防／低外援', defenseRatio: .25, penetrationRatio: 1, attackBonus: 0, damageBonus: 0, critRate: .2, critMultiplier: 1.5, hpToAttack: 3, defenseToAttack: .25 },
  { key: 'reference', label: '中性参照', defenseRatio: 1, penetrationRatio: 1, attackBonus: .5, damageBonus: .5, critRate: .5, critMultiplier: 1.5, hpToAttack: 3, defenseToAttack: .5 },
  { key: 'high', label: '高防／高外援', defenseRatio: 4, penetrationRatio: 1, attackBonus: 1, damageBonus: 1, critRate: .8, critMultiplier: 2, hpToAttack: 3, defenseToAttack: 1 },
]
export function offenseGain(effects = {}, scenario = OFFENSE_SCENARIOS[1]) {
  const allowed = ['attack', 'attackFromHp', 'attackFromDefense', 'damage', 'critRate', 'critDamage', 'guaranteedCrit', 'penetration', 'specificPenetration', 'defenseDown', 'specificDefenseDown']
  if (Object.keys(effects).some(key => !allowed.includes(key))) throw new Error('Unknown offense effect')
  const v = key => effects[key] ?? 0
  for (const [key, number] of Object.entries(effects)) {
    if (key === 'guaranteedCrit') { if (typeof number !== 'boolean') throw new Error('Invalid critical flag'); continue }
    if (!Number.isFinite(number) || number < 0) throw new Error('Invalid offense input')
  }
  if (v('defenseDown') > 1 || v('specificDefenseDown') > 1) throw new Error('Invalid defense reduction')
  const attack = (1 + scenario.attackBonus + v('attack') + v('attackFromHp') * scenario.hpToAttack + v('attackFromDefense') * scenario.defenseToAttack) / (1 + scenario.attackBonus)
  const damage = (1 + scenario.damageBonus + v('damage')) / (1 + scenario.damageBonus)
  const rate = effects.guaranteedCrit ? 1 : Math.min(1, scenario.critRate + v('critRate'))
  const critical = (1 + rate * (scenario.critMultiplier + v('critDamage') - 1)) / (1 + scenario.critRate * (scenario.critMultiplier - 1))
  const path = (penetration, decrease) => (1 + scenario.defenseRatio) / (1 + scenario.defenseRatio * (1 - decrease) * (1 + scenario.penetrationRatio) / (1 + scenario.penetrationRatio * (1 + penetration)))
  const defense = path(v('penetration'), v('defenseDown'))
  const specificDefense = path(v('specificPenetration'), v('specificDefenseDown'))
  return { factors: { attack, damage, critical, defense, specificDefense }, gain: attack * damage * critical * defense * specificDefense }
}
export function compareOffense(states) {
  return states.map(state => ({ ...state, comparisons: OFFENSE_SCENARIOS.map(scenario => ({ scenario: scenario.key, ...offenseGain(state.effects, scenario) })) }))
}
