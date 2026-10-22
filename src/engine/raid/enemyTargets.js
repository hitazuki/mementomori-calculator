// Deterministic project model, fitted to the supplied position-frequency matrix.
export function createRaidRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6D2B79F5) >>> 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function enemyTargetProbabilities(position, candidates) {
  const weights = candidates.map(target => 1 / (Math.abs(position - target.position) + 1))
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  return weights.map(weight => weight / total)
}

export function selectEnemyTargets(spec, position, enemies, random, previous = []) {
  if (enemies.length === 1) return [...enemies]
  if (spec.type === 'all') return [...enemies]
  if (spec.type === 'previousHit') return [previous[0] ?? enemies[0]]
  if (spec.type === 'first') return enemies.slice(0, spec.count ?? 1)
  if (spec.type === 'lowestMagicDefense' || spec.type === 'lowestPhysicalDefense') return [[...enemies].sort((a, b) => {
    const channel = spec.type === 'lowestMagicDefense' ? 'magic' : 'physical'
    const defense = target => target.template[`${channel}Defense`] * Math.max(0, 1 + target.statuses.reduce((sum, status) => sum + status.stacks * status[`${channel}DefenseRatePerStack`], 0))
    return defense(a) - defense(b) || a.position - b.position
  })[0]]
  const candidates = [...enemies]
  const selected = []
  const count = Math.min(spec.type === 'randomGroup' ? spec.count : 1, candidates.length)
  for (let index = 0; index < count; index += 1) {
    const probabilities = enemyTargetProbabilities(position, candidates)
    let sample = random()
    let chosen = candidates.length - 1
    for (let candidate = 0; candidate < candidates.length; candidate += 1) {
      sample -= probabilities[candidate]
      if (sample < 0) { chosen = candidate; break }
    }
    selected.push(candidates.splice(chosen, 1)[0])
  }
  return selected.sort((a, b) => a.position - b.position)
}
