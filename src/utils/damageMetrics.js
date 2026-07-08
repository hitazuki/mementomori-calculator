export const DAMAGE_METRIC_GROUPS = [
  {
    key: 'attack',
    labelKey: 'metricGroupAttack',
    metricKeys: ['finalDmg', 'dmgRatePct'],
  },
  {
    key: 'defense',
    labelKey: 'metricGroupDefense',
    metricKeys: ['ehpMultiplier', 'defMitPct', 'pmMitPct'],
  },
]

export const FIXED_PERCENT_DAMAGE_METRICS = new Set(['dmgRatePct', 'defMitPct', 'pmMitPct'])

export function getDamageMetrics(t, formatNumber) {
  const fmtNumber = formatNumber || (v => String(Math.round(v)))
  const fmtPercent = v => `${Number(v || 0).toFixed(1)}%`
  const fmtMultiplier = v => `${Number(v || 0).toFixed(2)}x`

  return {
    finalDmg: {
      label: t('finalDmg'),
      fmt: fmtNumber,
      unit: '',
      perspective: 'attack',
      higherIsBetter: true,
      chartDigits: 0,
    },
    dmgRatePct: {
      label: t('overallPenRate'),
      fmt: fmtPercent,
      unit: '%',
      perspective: 'attack',
      higherIsBetter: true,
      fixedPercentScale: true,
      chartDigits: 1,
    },
    ehpMultiplier: {
      label: t('ehpMultiplier'),
      fmt: fmtMultiplier,
      unit: 'x',
      perspective: 'defense',
      higherIsBetter: true,
      chartDigits: 2,
    },
    defMitPct: {
      label: t('defMitRate'),
      fmt: fmtPercent,
      unit: '%',
      perspective: 'defense',
      higherIsBetter: true,
      fixedPercentScale: true,
      chartDigits: 1,
    },
    pmMitPct: {
      label: t('pmMitRate'),
      fmt: fmtPercent,
      unit: '%',
      perspective: 'defense',
      higherIsBetter: true,
      fixedPercentScale: true,
      chartDigits: 1,
    },
  }
}

export function getDamageMetricGroups(t, metrics) {
  return DAMAGE_METRIC_GROUPS.map(group => ({
    key: group.key,
    label: t(group.labelKey),
    metrics: group.metricKeys
      .filter(key => metrics[key])
      .map(key => ({ key, ...metrics[key] })),
  })).filter(group => group.metrics.length > 0)
}

export function isFixedPercentDamageMetric(metricKey) {
  return FIXED_PERCENT_DAMAGE_METRICS.has(metricKey)
}
