// Describe the resolver itself, rather than suggesting its extrema are fixed values.
export function raidDetailValueText(spec, { t, conditionText, counterText, elementText }, scale = 1, suffix = '') {
  const number = n => `${Number((n * scale).toFixed(6))}${suffix}`
  const recurse = value => raidDetailValueText(value, { t, conditionText, counterText, elementText }, scale, suffix)
  if (typeof spec === 'number') return number(spec)
  if (!spec) return t('raidCharacterDynamicValue')
  if (spec.type === 'fixed') return recurse(spec.value)
  if (spec.type === 'conditional') return t('raidDetailBranch', { condition: conditionText(spec.condition), yes: recurse(spec.whenTrue), no: recurse(spec.whenFalse) })
  let input
  if (spec.counter) input = counterText(spec.counter)
  else if (spec.skillKey) input = t('raidDetailUses', { skill: spec.skillKey.toUpperCase() })
  else input = t({
    previousActionCriticalHitsLinear: 'raidDetailPreviousCrits',
    otherLineupElementCountLinear: 'raidDetailElementCount',
    bossStatusCountLinear: 'raidDetailBossCount', bossStatusThresholds: 'raidDetailBossCount',
    maxLineupRemovableBuffCountLinear: 'raidDetailMaxBuffs', configuredTier: 'raidDetailConfiguredHits',
  }[spec.type] ?? 'raidCharacterDynamicValue', { element: elementText(spec.element) })
  if (spec.values) {
    const entries = spec.values.flatMap((value, index) => {
      if (index > 0 && value === spec.values[index - 1]) return []
      let end = index
      while (end + 1 < spec.values.length && spec.values[end + 1] === value) end++
      const range = end === spec.values.length - 1 ? `≥${index}` : end === index ? `${index}` : `${index}–${end}`
      return [`${range}: ${recurse(value)}`]
    })
    return `${input} [${entries.join('; ')}]`
  }
  const formula = `${number(spec.base ?? 0)} + ${number(spec.perStack ?? spec.increment ?? 1)} × ${input}`
  return spec.max == null ? formula : t('raidDetailCapped', { formula, max: number(spec.max) })
}
