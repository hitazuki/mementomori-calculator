// Fixed-panel editorial references. Never used by the raid simulator.
export const RATING_PANEL = Object.freeze({ attack: 1, hp: 3, primary: .25, defenseToAttack: .5, critRate: .5, critDamage: .5, defenseRatio: 1, penetrationRatio: 1 })

// Each critical adds one pending attack. Added attacks can also extend the chain.
export function criticalExtension(initial, cap, chance) {
  if (!Number.isInteger(initial) || !Number.isInteger(cap) || initial < 1 || cap < initial || !Number.isFinite(chance) || chance < 0 || chance > 1) throw new Error('Invalid critical extension')
  let pending = new Map([[initial, 1]]), expectedHits = 0, capProbability = 0
  for (let hit = 1; hit <= cap; hit++) {
    const active = [...pending.values()].reduce((a, b) => a + b, 0)
    expectedHits += active
    if (hit === cap) capProbability = active
    const next = new Map()
    for (const [left, probability] of pending) {
      next.set(left, (next.get(left) ?? 0) + probability * chance)
      if (left > 1) next.set(left - 1, (next.get(left - 1) ?? 0) + probability * (1 - chance))
    }
    pending = next
  }
  return { expectedHits, capProbability }
}

export function damageReference(component, effects = {}, enemies = 1, damageBonus = 0, gearAttack = 0) {
  if (![1, 5].includes(enemies)) throw new Error('Expected one or five enemies')
  const { coefficient, hits = 1, targets = 1, basis = 'attack' } = component
  if (![coefficient, hits, targets, damageBonus, gearAttack].every(n => Number.isFinite(n) && n >= 0)) throw new Error('Invalid damage input')
  if (!['attack', 'primary-direct', 'attack-direct', 'fixed-direct'].includes(basis)) throw new Error('External damage requires a separate authored expression')
  const v = key => effects[key] ?? 0
  if (Object.values(effects).some(n => typeof n !== 'boolean' && (!Number.isFinite(n) || n < 0))) throw new Error('Invalid effect')
  if (v('defenseDown') > 1 || v('specificDefenseDown') > 1) throw new Error('Invalid defense decrease')
  const attack = 1 + gearAttack + v('attack') + v('attackFromHp') * RATING_PANEL.hp + v('attackFromDefense') * RATING_PANEL.defenseToAttack
  const critical = component.canCrit === false || basis !== 'attack' ? 1 : 1 + (effects.guaranteedCrit ? 1 : Math.min(1, RATING_PANEL.critRate + v('critRate'))) * (RATING_PANEL.critDamage + v('critDamage'))
  const path = (penetration, decrease) => 1 / (1 + RATING_PANEL.defenseRatio * (1 - decrease) * (1 + RATING_PANEL.penetrationRatio) / (1 + RATING_PANEL.penetrationRatio * (1 + penetration)))
  const defense = basis === 'attack' ? path(v('penetration'), v('defenseDown')) * path(v('specificPenetration'), v('specificDefenseDown')) : 1
  const source = basis === 'fixed-direct' ? 1 : basis === 'primary-direct' ? RATING_PANEL.primary * (1 + v('primary')) : attack
  // A direct-damage description does not establish applicability of the damage bucket.
  const bonus = basis === 'attack' || component.damageBucket === true ? 1 + damageBonus + v('damage') : 1
  const count = hits * (targets === 0 ? 1 : Math.min(targets, enemies))
  const damage = coefficient * count * source * critical * defense * bonus
  return { damage, equivalentBasicHits: damage / (.25 * 1.25 * (1 + damageBonus)), factors: { coefficient, count, source, critical, defense, bonus } }
}

// Cooldowns measured in the actor's actions; no enemy actions or control assumed.
export function ratingCycle(skills, { normalReduction = 0, normalEvery = 1 } = {}) {
  if (skills.some(s => !Number.isInteger(s.cooldown) || s.cooldown < 0)) throw new Error('Invalid cooldown')
  if (!Number.isInteger(normalEvery) || normalEvery < 1 || !Number.isInteger(normalReduction) || normalReduction < 0) throw new Error('Invalid normal attack cadence')
  let remaining = skills.map(() => 0)
  const visited = new Map(), sequence = []
  let normalToken = false
  for (let action = 0; action < 500; action++) {
    if (action % normalEvery === 0) normalToken = true
    const key = remaining.join(',') + ':' + action % normalEvery + ':' + normalToken
    if (visited.has(key)) return { opening: sequence.slice(0, visited.get(key)), cycle: sequence.slice(visited.get(key)) }
    visited.set(key, sequence.length)
    const index = remaining.findIndex(n => n === 0)
    const selected = index < 0 ? null : skills[index]
    sequence.push(selected?.slot ?? 'N')
    if (selected) remaining[index] = selected.cooldown
    const reduction = selected?.selfReduction ?? (index < 0 && normalToken ? normalReduction : 0)
    if (index < 0) normalToken = false
    remaining = remaining.map(n => Math.max(0, n - 1 - reduction))
  }
  throw new Error('No bounded cycle')
}

export function growthRequirement({ initial = 0, cap, perEvent }) {
  if (![initial, cap, perEvent].every(Number.isFinite) || initial < 0 || cap < initial || perEvent <= 0) throw new Error('Invalid growth')
  return Math.ceil((cap - initial) / perEvent)
}

export function effectiveRecovery({ raw, missing, recoveryFactor = 1, alive = true }) {
  if (![raw, missing, recoveryFactor].every(n => Number.isFinite(n) && n >= 0)) throw new Error('Invalid recovery')
  return alive ? Math.min(missing, raw * recoveryFactor) : 0
}

export function shieldAfterHit({ shield, incoming }) {
  if (![shield, incoming].every(n => Number.isFinite(n) && n >= 0)) throw new Error('Invalid shield')
  return { shield: Math.max(0, shield - incoming), hpLoss: Math.max(0, incoming - shield) }
}

export function replaceShield(oldShield, newShield) {
  if (![oldShield, newShield].every(n => Number.isFinite(n) && n >= 0)) throw new Error('Invalid shield')
  return newShield
}

// Ordered attacks: explicitly supplied pre-hit and post-hit effects never leak backwards.
export function orderedDamage(steps, effects = {}, enemies = 1, gearAttack = 0) {
  let state = { ...effects }
  return steps.map(({ component, before = {}, after = {} }) => {
    state = { ...state, ...before }
    const result = damageReference(component, state, enemies, 0, gearAttack)
    state = { ...state, ...after }
    return result
  })
}

// An explicit event trace, not a guessed enemy action schedule. Expiry is exclusive.
export function protectionTrace(events) {
  let shield = 0, shieldUntil = 0, barriers = 0, immortalUntil = 0
  let hp = 1, maxHp = 1, previousTime = -1
  return events.map(event => {
    if (!Number.isFinite(event.time) || event.time < previousTime || event.time < 0) throw new Error('Invalid event time')
    if (!['shield','barrier','immortal','heal','hit'].includes(event.kind)) throw new Error('Unknown protection event')
    for (const key of ['amount','duration','factor','threshold']) if (event[key]!==undefined && (!Number.isFinite(event[key])||event[key]<0)) throw new Error('Invalid protection value')
    if (['shield','immortal'].includes(event.kind) && !Number.isFinite(event.duration)) throw new Error('Missing duration')
    if (event.kind!=='immortal' && !Number.isFinite(event.amount)) throw new Error('Missing amount')
    previousTime = event.time
    if (event.time >= shieldUntil) shield = 0
    if (event.kind === 'shield') {
      shield = event.mode === 'add' ? shield + event.amount : event.mode === 'duration' ? shield : event.amount
      shieldUntil = event.time + event.duration
    } else if (event.kind === 'barrier') barriers = event.amount
    else if (event.kind === 'immortal') immortalUntil = event.time + event.duration
    else if (event.kind === 'heal') hp += effectiveRecovery({ raw: event.amount, missing: maxHp - hp, alive: hp > 0, recoveryFactor: event.factor ?? 1 })
    else if (event.kind === 'hit' && hp > 0) {
      if (barriers > 0 && event.amount >= (event.threshold ?? 0)) barriers--
      else {
        const result = shieldAfterHit({ shield, incoming: event.amount })
        shield = result.shield
        hp = Math.max(event.time < immortalUntil ? .000001 : 0, hp - result.hpLoss)
      }
    }
    return { ...event, hp, shield, barriers, immortal: event.time < immortalUntil }
  })
}
