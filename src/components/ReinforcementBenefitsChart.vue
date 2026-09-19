<template>
  <section class="card reinforcement-benefits">
    <h2>{{ t('reinforcementBenefitsTitle') }}</h2>
    <p class="view-desc">{{ t('reinforcementBenefitsScope') }}</p>
    <p v-if="!analysis.valid" role="alert">{{ t('reinforcementBenefitsUnavailable') }}</p>
    <template v-else>
      <div class="benefit-tabs" role="group" :aria-label="t('reinforcementBenefitsTitle')">
        <button v-for="(label, key) in modes" :key="key" type="button" class="btn" :class="mode === key ? 'btn-primary' : 'btn-secondary'" :aria-pressed="mode === key" @click="mode = key">{{ t(label) }}</button>
      </div>
      <div v-if="mode === 'efficiency'" class="benefit-tabs" role="group" :aria-label="t('reinforcementEfficiencyMaterial')">
        <button v-for="key in MATERIAL_KEYS" :key="key" type="button" class="btn" :class="material === key ? 'btn-primary' : 'btn-secondary'" :aria-pressed="material === key" @click="material = key">{{ t(`reinforcement_${key}`) }}</button>
      </div>
      <p class="view-desc">{{ t(mode === 'efficiency' ? 'reinforcementEfficiencyNote' : 'reinforcementGainNote') }}</p>
      <VChart class="benefit-chart" :option="chartOption" :update-options="{ replaceMerge: ['series'] }" autoresize @datazoom="onZoom" @mouseover="onHover" @zr:globalout="hoverTarget = null" />
      <p class="view-desc">{{ t('reinforcementCrossingNote') }}</p>
    </template>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkLineComponent, MarkAreaComponent, MarkPointComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getMoriTheme, LINE_COLORS } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'
import { MATERIAL_KEYS } from '../engine/equipmentReinforcementCalc.js'
import { buildReinforcementBenefits, equivalentReinforcementLevels } from '../engine/equipmentReinforcementBenefits.js'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkLineComponent, MarkAreaComponent, MarkPointComponent])
const props = defineProps({ initialLevel: { type: Number, required: true }, targetLevel: { type: Number, required: true } })
const { t, locale } = useI18n()
const analysis = buildReinforcementBenefits()
const modes = { adjacent: 'reinforcementAdjacentGain', cumulative: 'reinforcementCumulativeGain', efficiency: 'reinforcementEfficiency' }
const mode = ref('efficiency')
const material = ref('potion')
const hoverTarget = ref(null)
const zoom = ref(null)
const number = value => new Intl.NumberFormat(locale.value, { maximumSignificantDigits: 7 }).format(value)
const unit = computed(() => mode.value === 'efficiency' ? t('reinforcementEfficiencyUnit', { material: t(`reinforcement_${material.value}`) }) : t('reinforcementGainUnit'))
const lines = computed(() => {
  const kinds = mode.value === 'efficiency' ? ['weapon', 'other'] : ['gain']
  return kinds.map((kind, index) => {
    const rows = analysis.points.map(point => ({
      point, value: [point.level, kind === 'gain' ? point[mode.value] : point.efficiency[kind][material.value]],
    }))
    if (mode.value === 'cumulative') rows.unshift({ point: { from: 0, level: 0, before: 1, after: 1, cumulative: 0 }, value: [0, 0] })
    return { kind, index, name: t(kind === 'gain' ? 'reinforcementStatGain' : `reinforcementSingle_${kind}`), rows }
  })
})
const extent = computed(() => {
  const levels = lines.value.flatMap(line => line.rows.filter(row => Number.isFinite(row.value[1])).map(row => row.value[0]))
  return [levels.length ? Math.min(...levels) : 0, 1000]
})
watch([mode, material], () => {
  hoverTarget.value = null
  if (zoom.value) {
    const startValue = Math.max(extent.value[0], zoom.value.startValue)
    const endValue = Math.min(extent.value[1], zoom.value.endValue)
    zoom.value = startValue < endValue ? { startValue, endValue } : null
  }
})
function onZoom(event) {
  const value = event.batch?.[0] ?? event
  const [min, max] = extent.value
  if (Number.isFinite(value.start) && Number.isFinite(value.end)) {
    zoom.value = { startValue: min + (max - min) * value.start / 100, endValue: min + (max - min) * value.end / 100 }
  }
}
function onHover(event) {
  if (event.componentType === 'series' && Number.isFinite(event.data?.value?.[1])) hoverTarget.value = event.data.value[1]
}
const match = (line, target) => equivalentReinforcementLevels(line.rows.map(row => row.value), target)
function matchesText(target) {
  return lines.value.map(line => {
    const result = match(line, target)
    return `${line.name}: ${result.intersections.length ? result.intersections.map(value => '≈' + number(value)).join(' / ') : t('upgradeNoCrossing')} · ${t('reinforcementFirstReached')}: ${result.firstReached ?? t('upgradeUnreached')}`
  }).join('<br/>')
}
const chartOption = computed(() => {
  const theme = getMoriTheme(currentTheme.value === 'dark')
  const target = hoverTarget.value
  return {
    animation: false,
    grid: { left: 14, right: 24, top: 90, bottom: 82, containLabel: true },
    legend: { top: 8, textStyle: theme.textStyle },
    tooltip: { ...theme.tooltip, trigger: 'item', confine: true, extraCssText: 'max-width: calc(100vw - 40px); white-space: normal; overflow-wrap: anywhere;', formatter: param => {
      const point = param.data?.point
      if (!point) return ''
      const line = lines.value[param.seriesIndex]
      const from = mode.value === 'cumulative' ? 0 : point.from
      const before = mode.value === 'cumulative' ? 1 : point.before
      const gain = mode.value === 'cumulative' ? point.cumulative : point.adjacent
      const value = param.value[1]
      let text = `${param.marker}${param.seriesName}<br/>${t('reinforcementLevel')}: ${from} → ${point.level} (+${point.level - from})<br/>${t('reinforcementCoefficient')}: ${number(before)} → ${number(point.after)}<br/>${t('reinforcementStatGain')}: ${number(gain)} ${t('reinforcementGainUnit')}`
      if (mode.value === 'efficiency') text += `<br/>${t('reinforcementTierCost')}: ${number(point.costs[line.kind][material.value])} ${t(`reinforcement_${material.value}`)}<br/>${t('reinforcementEfficiency')}: ${number(value)} ${unit.value}`
      return text + `<br/><br/>${t('reinforcementSameGain')}: ${number(value)} ${unit.value}<br/>${matchesText(value)}`
    } },
    xAxis: { type: 'value', min: extent.value[0], max: extent.value[1], name: t('reinforcementLevel'), nameLocation: 'middle', nameGap: 30,
      nameTextStyle: theme.textStyle, axisLabel: theme.axisLabel, axisLine: theme.axisLine, splitLine: theme.splitLine },
    yAxis: { type: 'value', name: unit.value, nameTextStyle: { ...theme.textStyle, align: 'left', fontSize: 11, width: 240, overflow: 'break' }, axisLabel: { ...theme.axisLabel, formatter: number }, axisLine: theme.axisLine, splitLine: theme.splitLine },
    dataZoom: [{ id: 'benefit-slider', type: 'slider', bottom: 4, ...(zoom.value ?? { start: 0, end: 100 }) }, { id: 'benefit-inside', type: 'inside', ...(zoom.value ?? { start: 0, end: 100 }) }],
    series: lines.value.map(line => ({
      id: line.kind, name: line.name, type: 'line', smooth: false, connectNulls: false, showSymbol: true, symbolSize: 5,
      itemStyle: { color: LINE_COLORS[line.index] }, data: line.rows,
      markLine: { precision: -1, silent: true, symbol: 'none', label: { color: theme.textStyle.color, textBorderWidth: 0, position: 'insideStartTop', formatter: '{b}' }, data: line.index ? [] : [
        ...[ ['reinforcementInitial', props.initialLevel], ['reinforcementTarget', props.targetLevel] ].filter(([, level]) => level >= extent.value[0]).map(([key, level]) => ({ name: t(key), xAxis: level, label: { position: 'insideEndTop' } })),
        ...(target === null ? [] : [{ name: `${number(target)} ${unit.value}`, yAxis: target }]),
      ] },
      markArea: { silent: true, itemStyle: { color: 'rgba(201,168,76,0.10)' }, data: line.index || props.targetLevel < extent.value[0] ? [] : [[{ xAxis: Math.max(props.initialLevel, extent.value[0]) }, { xAxis: props.targetLevel }]] },
      markPoint: { silent: true, symbol: 'circle', symbolSize: 7, label: { color: LINE_COLORS[line.index], position: line.index ? 'bottom' : 'top', formatter: param => '≈' + number(param.value) }, data: target === null ? [] : match(line, target).intersections.map(level => ({ coord: [level, target], value: level })) },
    })),
  }
})
</script>

<style scoped>
.reinforcement-benefits { padding: 20px; margin-bottom: 20px; }
h2 { font-size: 1.1rem; margin-bottom: 8px; }
.benefit-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
.benefit-chart { height: 480px; width: 100%; }
@media (max-width: 700px) {
  .reinforcement-benefits { padding: 12px; }
  .benefit-chart { height: 400px; }
}
</style>
