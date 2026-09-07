// Reference comparisons, not character panels or a battle simulation.
export const SURVIVAL_SCENARIOS = [
  { key: 'pressure', label: '高增伤／低防御参照', defenseRatio: 0.25, damageBonus: 1, attackToHp: 0.25 },
  { key: 'reference', label: '中性参照', defenseRatio: 1, damageBonus: 0.5, attackToHp: 1 / 3 },
  { key: 'favorable', label: '低增伤／高防御参照', defenseRatio: 4, damageBonus: 0, attackToHp: 0.5 },
]

export function survivalCapacity(effects = {}, scenario = SURVIVAL_SCENARIOS[1], damageType = 'physical') {
  const allowed = ['hp', 'hpFromAttack', 'defense', 'physicalDefense', 'magicDefense', 'reduction', 'block', 'shieldAttack', 'shieldHp', 'attack']
  if (Object.keys(effects).some(key => !allowed.includes(key))) throw new Error('Unknown survival effect')
  if (!['physical', 'magic'].includes(damageType)) throw new Error('Invalid damage type')
  const value = key => effects[key] ?? 0
  for (const number of [...Object.values(effects), scenario.defenseRatio, scenario.damageBonus, scenario.attackToHp]) {
    if (!Number.isFinite(number) || number < 0) throw new Error('Invalid reference input')
  }
  if (value('block') >= 1 || value('reduction') >= 1 + scenario.damageBonus) throw new Error('Unbounded mitigation is not a finite capacity')
  const hp = 1 + value('hp') + value('hpFromAttack') * scenario.attackToHp
  const defense = (1 + scenario.defenseRatio * (1 + value('defense'))) / (1 + scenario.defenseRatio)
  const specificDefense = (1 + scenario.defenseRatio * (1 + value(damageType === 'physical' ? 'physicalDefense' : 'magicDefense'))) / (1 + scenario.defenseRatio)
  const damage = (1 + scenario.damageBonus) / (1 + scenario.damageBonus - value('reduction'))
  const block = 1 / (1 - value('block'))
  const shield = value('shieldAttack') * scenario.attackToHp * (1 + value('attack')) + value('shieldHp') * hp
  const multiplier = defense * specificDefense * damage * block
  return { factors: { hp, defense, specificDefense, damage, block, shield }, withoutShield: hp * multiplier, withShield: (hp + shield) * multiplier }
}

export function compareSurvival(states) {
  return states.map(state => ({ ...state, comparisons: SURVIVAL_SCENARIOS.map(scenario => ({
    scenario: scenario.key,
    physical: survivalCapacity(state.effects, scenario, 'physical'),
    magic: survivalCapacity(state.effects, scenario, 'magic'),
  })) }))
}
