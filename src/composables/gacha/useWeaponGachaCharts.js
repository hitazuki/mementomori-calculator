import { computed } from 'vue'
import { baseChartOption, getMoriTheme, LINE_COLORS } from '../../utils/chartTheme.js'
import { currentTheme } from '../../utils/themeStore.js'

export function useWeaponGachaCharts(model) {
  const { t, locale, implicitChartMode, seraphStrategyChartMode, pullStrategyMode, analysis, implicitChartAnalysis, selected, coreDistributions, tr, implicitUnitLabel, dropLabel, seraphStrategyRows, currentSeraphStrategyLabel, comparisonSeraphStrategyLabel, seraphCrossWeekRows, fmtDiamonds, fmtUnitDiamonds, fmtPulls, fmtScoreValue, fmtPercent, fmtQty } = model

  const chartTooltip = (rows, title, fields) => (params) => {
    const list = Array.isArray(params) ? params : [params]
    const row = rows[list[0].dataIndex]
    let html = `<b style="color:var(--gold)">${title}: ${fmtPulls(row.pulls)}</b><br>`
    list.forEach(item => {
      const value = item.value == null || item.value === undefined ? '—' : item.value
      html += `<span style="color:${item.color}">● ${item.seriesName}</span>: <b>${value}</b><br>`
    })
    fields?.forEach(field => {
      html += `${field.label}: <b>${field.format(row)}</b><br>`
    })
    return html
  }

  const implicitCostOption = computed(() => {
    const isDark = currentTheme.value === 'dark'
    const theme = getMoriTheme(isDark)
    const rows = implicitChartAnalysis.value.decisionRows
    const showEfficiency = implicitChartMode.value === 'efficiency'
    const hasComparableCore = row => row.totalCoreCount > 0
    const comparableCosts = rows
      .filter(hasComparableCore)
      .map(row => row.implicitCoreUnit)
    const bestCost = comparableCosts.length ? Math.min(...comparableCosts) : 0
    const worstCost = comparableCosts.length ? Math.max(...comparableCosts) : 0
    const metricValue = row => {
      if (!hasComparableCore(row)) return null
      if (!showEfficiency) return +row.implicitCoreUnit.toFixed(2)
      if (worstCost <= bestCost) return 100
      return +Math.max(0, Math.min(100,
        (worstCost - row.implicitCoreUnit) / (worstCost - bestCost) * 100
      )).toFixed(1)
    }
    const milestonePulls = analysis.value.config.weeklyMilestones?.length
      ? analysis.value.config.weeklyMilestones.map(reward => reward.pull)
      : analysis.value.config.milestone?.rewards?.length
        ? [...new Set(rows.flatMap(row => row.milestoneRewards.map(reward => reward.pull)))]
        : rows.filter(row => row.pulls % analysis.value.config.milestone.interval === 0).map(row => row.pulls)
    const milestonePoints = rows
      .filter(row => milestonePulls.includes(row.pulls))
      .map(row => ({
        name: fmtPulls(row.pulls),
        // Numeric coordinates on a category axis are indices, not pull labels.
        coord: [String(row.pulls), metricValue(row)],
        value: String(row.pulls),
      }))
      .filter(point => point.coord[1] != null)

    return {
      ...baseChartOption('', '', isDark),
      tooltip: {
        ...theme.tooltip,
        trigger: 'axis',
        formatter: chartTooltip(rows, t('weaponGachaPullCount'), [
          ...(showEfficiency ? [{ label: implicitUnitLabel.value, format: row => fmtUnitDiamonds(row.implicitCoreUnit) }] : []),
          { label: t('weaponGachaSideRecovery'), format: row => fmtPercent(row.sideRecoveryRate) },
          { label: t('weaponGachaExpectedCore'), format: row => fmtQty(row.totalCoreCount) },
        ]),
      },
      legend: { ...theme.legend, top: 8, right: 16 },
      xAxis: {
        type: 'category',
        data: rows.map(row => String(row.pulls)),
        axisLabel: theme.axisLabel,
        axisLine: theme.axisLine,
      },
      yAxis: {
        type: 'value',
        min: showEfficiency ? 0 : undefined,
        max: showEfficiency ? 100 : undefined,
        axisLabel: {
          ...theme.axisLabel,
          formatter: value => showEfficiency ? value : fmtDiamonds(value),
        },
        splitLine: theme.splitLine,
      },
      series: [
        {
          name: showEfficiency ? t('weaponGachaEfficiencyIndex') : implicitUnitLabel.value,
          type: 'line',
          smooth: true,
          symbolSize: 4,
          markPoint: {
            symbolSize: 34,
            data: milestonePoints,
            itemStyle: { color: LINE_COLORS[0] },
          },
          lineStyle: { width: 3, color: LINE_COLORS[0] },
          itemStyle: { color: LINE_COLORS[0] },
          data: rows.map(metricValue),
        },
      ],
    }
  })

  const seraphCrossWeekOption = computed(() => {
    const isDark = currentTheme.value === 'dark'
    const theme = getMoriTheme(isDark)
    const rows = seraphCrossWeekRows.value
    const currentSeriesName = t('weaponGachaCurrentStrategySeries', {
      strategy: currentSeraphStrategyLabel.value,
    })
    const comparisonSeriesName = t('weaponGachaComparisonStrategySeries', {
      strategy: comparisonSeraphStrategyLabel.value,
    })
    const differenceLabel = t(
      pullStrategyMode.value === 'weeklyRound'
        ? 'weaponGachaExpectedRelicGain'
        : 'weaponGachaExpectedRelicLoss'
    )
    const differenceSign = pullStrategyMode.value === 'weeklyRound' ? '+' : '-'

    return {
      ...baseChartOption('', '', isDark),
      tooltip: {
        ...theme.tooltip,
        trigger: 'axis',
        formatter: params => {
          const list = Array.isArray(params) ? params : [params]
          const row = rows[list[0].dataIndex]
          return `<b style="color:var(--gold)">${fmtPulls(row.comparablePulls)}</b><br>${currentSeriesName}: <b>${fmtQty(row.selected.expectedRelic)}</b><br>${comparisonSeriesName}: <b>${fmtQty(row.alternative.expectedRelic)}</b><br>${differenceLabel}: <b>${differenceSign}${fmtQty(row.strategyDifference)}</b> (${fmtPercent(row.strategyDifferenceRate)})`
        },
      },
      legend: { ...theme.legend, top: 8, right: 16 },
      grid: { top: 54, right: 24, bottom: 52, left: 58 },
      xAxis: {
        type: 'category',
        data: rows.map(row => fmtPulls(row.comparablePulls)),
        axisLabel: { ...theme.axisLabel, interval: 0 },
        axisLine: theme.axisLine,
      },
      yAxis: {
        type: 'value',
        min: 0,
        axisLabel: theme.axisLabel,
        splitLine: theme.splitLine,
      },
      series: [
        {
          name: currentSeriesName,
          type: 'bar',
          barMaxWidth: 48,
          itemStyle: { color: LINE_COLORS[0] },
          label: {
            show: true,
            position: 'top',
            color: theme.axisLabel.color,
            formatter: item => `${differenceSign}${fmtQty(rows[item.dataIndex].strategyDifference)}`,
          },
          data: rows.map(row => +row.selected.expectedRelic.toFixed(2)),
        },
        {
          name: comparisonSeriesName,
          type: 'bar',
          barMaxWidth: 48,
          itemStyle: { color: LINE_COLORS[4], opacity: 0.72 },
          data: rows.map(row => +row.alternative.expectedRelic.toFixed(2)),
        },
      ],
    }
  })

  const seraphStrategyOption = computed(() => {
    const isDark = currentTheme.value === 'dark'
    const theme = getMoriTheme(isDark)
    const rows = seraphStrategyRows.value
    const showEfficiency = seraphStrategyChartMode.value === 'efficiency'
    const bestCost = Math.min(...rows.map(row => row.implicitCoreUnit).filter(value => value > 0))
    const metricValue = row => showEfficiency
      ? +(bestCost / row.implicitCoreUnit * 100).toFixed(1)
      : +row.implicitCoreUnit.toFixed(2)

    return {
      ...baseChartOption('', '', isDark),
      tooltip: {
        ...theme.tooltip,
        trigger: 'item',
        formatter: item => {
          const row = rows[item.dataIndex]
          const efficiency = +(bestCost / row.implicitCoreUnit * 100).toFixed(1)
          return `<b style="color:var(--gold)">${row.label.replaceAll('\n', ' ')}</b><br>${t('weaponGachaPaidPulls')}: <b>${fmtPulls(row.paidPulls)}</b><br>${t('weaponGachaTotalCost')}: <b>${fmtDiamonds(row.totalCost)}</b><br>${t('weaponGachaSideDeduction')}: <b>${fmtDiamonds(row.sideValue)}</b><br>${t('weaponGachaExpectedRelic')}: <b>${fmtQty(row.expectedRelic)}</b><br>${t('weaponGachaRelicValue')}: <b>${fmtUnitDiamonds(row.implicitCoreUnit)}</b><br>${t('weaponGachaEfficiencyIndex')}: <b>${efficiency}</b>`
        },
      },
      grid: { top: 42, right: 18, bottom: 92, left: 72 },
      xAxis: {
        type: 'category',
        data: rows.map(row => row.label),
        axisLabel: { ...theme.axisLabel, interval: 0, lineHeight: 17 },
        axisLine: theme.axisLine,
      },
      yAxis: {
        type: 'value',
        min: showEfficiency ? 0 : undefined,
        max: showEfficiency ? 100 : undefined,
        axisLabel: {
          ...theme.axisLabel,
          formatter: value => showEfficiency ? value : fmtDiamonds(value),
        },
        splitLine: theme.splitLine,
      },
      series: [
        {
          name: showEfficiency ? t('weaponGachaEfficiencyIndex') : t('weaponGachaStrategyUnitCost'),
          type: 'bar',
          barMaxWidth: 52,
          label: {
            show: true,
            position: 'top',
            color: theme.axisLabel.color,
            formatter: item => showEfficiency
              ? Number(item.value).toLocaleString(locale.value, { maximumFractionDigits: 1 })
              : Math.round(item.value).toLocaleString(),
          },
          data: rows.map(row => ({
            value: metricValue(row),
            itemStyle: { color: row.color },
          })),
        },
      ],
    }
  })

  const coreDistributionOption = computed(() => {
    const isDark = currentTheme.value === 'dark'
    const theme = getMoriTheme(isDark)
    const distributions = coreDistributions.value
    const quantities = [...new Set(distributions.flatMap(distribution =>
      distribution.points.map(point => point.quantity)
    ))].sort((left, right) => left - right)

    return {
      ...baseChartOption('', '', isDark),
      tooltip: {
        ...theme.tooltip,
        trigger: 'axis',
        formatter: params => {
          const list = Array.isArray(params) ? params : [params]
          const quantity = quantities[list[0].dataIndex]
          let html = `<b style="color:var(--gold)">${t('weaponGachaCoreQuantity', { count: quantity })}</b><br>`
          list.forEach(item => {
            const distribution = distributions[item.seriesIndex]
            html += `<span style="color:${item.color}">● ${item.seriesName}</span>: <b>${Number(item.value).toFixed(2)}%</b><br>${t('weaponGachaDistributionExpected')}: <b>${fmtQty(distribution.expected)}</b><br>`
          })
          return html
        },
      },
      legend: { ...theme.legend, top: 8, right: 16 },
      grid: { top: 48, right: 18, bottom: 52, left: 58 },
      xAxis: {
        type: 'category',
        data: quantities,
        axisLabel: theme.axisLabel,
        axisLine: theme.axisLine,
      },
      yAxis: {
        type: 'value',
        min: 0,
        axisLabel: { ...theme.axisLabel, formatter: value => `${value}%` },
        splitLine: theme.splitLine,
      },
      series: distributions.map((distribution, index) => {
        const probabilities = new Map(distribution.points.map(point => [point.quantity, point.probability]))
        return {
          name: tr(distribution.labelKey, distribution.label),
          type: 'bar',
          barMaxWidth: 42,
          itemStyle: { color: LINE_COLORS[index % LINE_COLORS.length] },
          data: quantities.map(quantity => +((probabilities.get(quantity) || 0) * 100).toFixed(4)),
        }
      }),
    }
  })

  const quantityOption = computed(() => coreDistributionOption.value)

  const sideContributionOption = computed(() => {
    const isDark = currentTheme.value === 'dark'
    const theme = getMoriTheme(isDark)
    const rows = analysis.value.sideDrops

    return {
      ...baseChartOption('', '', isDark),
      tooltip: {
        ...theme.tooltip,
        trigger: 'axis',
        formatter: params => {
          const item = params[0]
          const row = rows[item.dataIndex]
          return `<b style="color:var(--gold)">${dropLabel(row)}</b><br>${t('weaponGachaRate')}: ${fmtPercent(row.rate)}<br>${t('weaponGachaScoreLine', { value: fmtScoreValue(row.scoreMeta.score), batch: row.scoreMeta.batch.toLocaleString() })}<br>${t('weaponGachaExpectedContribution')}: <b>${fmtScoreValue(row.expectedValuePerPull)}</b>`
        },
      },
      grid: { top: 36, right: 16, bottom: 70, left: 58 },
      xAxis: {
        type: 'category',
        data: rows.map(row => dropLabel(row)),
        axisLabel: { ...theme.axisLabel, rotate: 24 },
        axisLine: theme.axisLine,
      },
      yAxis: {
        type: 'value',
        axisLabel: { ...theme.axisLabel, formatter: '{value}' },
        splitLine: theme.splitLine,
      },
      series: [
        {
          name: t('weaponGachaExpectedContribution'),
          type: 'bar',
          barMaxWidth: 34,
          itemStyle: { color: LINE_COLORS[0] },
          data: rows.map(row => +row.expectedValuePerPull.toFixed(3)),
        },
      ],
    }
  })

  return { implicitCostOption, seraphCrossWeekOption, seraphStrategyOption, coreDistributionOption, quantityOption, sideContributionOption }
}
