<template>
  <div class="reinforcement-view">
    <header class="view-header">
      <h1 class="view-title">⚒ {{ t('reinforcementTitle') }}</h1>
      <p class="view-desc">{{ t('reinforcementDescription') }}</p>
    </header>
    <section class="card reinforcement-inputs">
      <label v-for="field in fields" :key="field.key" :for="field.key">
        <span>{{ t(field.label) }}</span>
        <input :id="field.key" v-model.number="inputs[field.key]" class="form-input" type="number" min="0" :max="field.max" step="1" :aria-invalid="!result.valid">
      </label>
    </section>
    <p v-if="!result.valid" class="reinforcement-error" role="alert">{{ t('reinforcementInvalid') }}</p>
    <template v-else>
      <section class="reinforcement-results" aria-live="polite">
        <div v-for="key in MATERIAL_KEYS" :key="key" class="card reinforcement-stat">
          <span>{{ t(`reinforcement_${key}`) }}</span>
          <strong>{{ format(result.totals[key]) }}</strong>
        </div>
        <div class="card reinforcement-stat">
          <span>{{ t('reinforcement_tickets') }}</span>
          <strong>{{ format(result.tickets) }}</strong>
        </div>
      </section>
      <p class="view-desc reinforcement-note">{{ t('reinforcementTicketNote') }}</p>
      <section class="card reinforcement-chart-panel">
        <h2>{{ t('reinforcementChartTitle') }}</h2>
        <p class="view-desc">{{ t('reinforcementChartNote') }}</p>
        <div class="reinforcement-tabs" role="group" :aria-label="t('reinforcementChartTitle')">
          <button v-for="key in MATERIAL_KEYS" :key="key" type="button" class="btn" :class="material === key ? 'btn-primary' : 'btn-secondary'" :aria-pressed="material === key" @click="material = key">{{ t(`reinforcement_${key}`) }}</button>
        </div>
        <VChart class="reinforcement-chart" :option="chartOption" :theme="chartTheme" autoresize @datazoom="onZoom" />
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent, MarkLineComponent, MarkAreaComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { baseChartOption, getMoriTheme, LINE_COLORS } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'
import { calculateEquipmentReinforcement, MAX_REINFORCEMENT_LEVEL, MATERIAL_KEYS } from '../engine/equipmentReinforcementCalc.js'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, DataZoomComponent, MarkLineComponent, MarkAreaComponent])
const { t, locale } = useI18n()
const inputs = reactive({ initialLevel: 0, targetLevel: 240, weaponCount: 1, otherCount: 0 })
const fields = [
  { key: 'initialLevel', label: 'reinforcementInitial', max: MAX_REINFORCEMENT_LEVEL },
  { key: 'targetLevel', label: 'reinforcementTarget', max: MAX_REINFORCEMENT_LEVEL },
  { key: 'weaponCount', label: 'reinforcementWeapons' },
  { key: 'otherCount', label: 'reinforcementOthers' },
]
const result = computed(() => calculateEquipmentReinforcement(inputs))
const material = ref('potion')
const chartTheme = computed(() => getMoriTheme(currentTheme.value === 'dark'))
const zoom = ref({ start: 0, end: 100 })
const format = value => new Intl.NumberFormat(locale.value).format(value)
function onZoom(event) {
  const value = event.batch?.[0] ?? event
  if (Number.isFinite(value.start) && Number.isFinite(value.end)) zoom.value = { start: value.start, end: value.end }
}
const chartOption = computed(() => {
  if (!result.value.valid) return {}
  const name = t(`reinforcement_${material.value}`)
  return {
    ...baseChartOption('', '', currentTheme.value === 'dark'),
    grid: { left: 16, right: 26, top: 55, bottom: 75, containLabel: true },
    tooltip: { ...chartTheme.value.tooltip, trigger: 'axis', confine: true, formatter: params => {
      const point = params[0].value
      return `${t('reinforcementLevel')}: ${format(point[0])}<br/>${name}: ${format(point[1])}`
    } },
    xAxis: { type: 'value', min: 0, max: MAX_REINFORCEMENT_LEVEL, name: t('reinforcementLevel'), nameLocation: 'middle', nameGap: 30,
      nameTextStyle: chartTheme.value.textStyle, axisLabel: chartTheme.value.axisLabel, axisLine: chartTheme.value.axisLine, splitLine: chartTheme.value.splitLine },
    yAxis: { type: 'value', name, nameTextStyle: chartTheme.value.textStyle, axisLine: chartTheme.value.axisLine, splitLine: chartTheme.value.splitLine,
      axisLabel: { ...chartTheme.value.axisLabel, formatter: value => new Intl.NumberFormat(locale.value, { notation: 'compact' }).format(value) } },
    dataZoom: [{ id: 'slider', type: 'slider', ...zoom.value, bottom: 5 }, { id: 'inside', type: 'inside', ...zoom.value }],
    series: [{ id: 'materials', name, type: 'line', showSymbol: false, smooth: false,
      itemStyle: { color: LINE_COLORS[MATERIAL_KEYS.indexOf(material.value)] },
      data: result.value.cumulative.map(row => [row.level, row[material.value]]),
      markLine: { symbol: 'none', label: { formatter: '{b}', position: 'insideEndTop', color: chartTheme.value.textStyle.color, textBorderWidth: 0 }, data: [
        { name: t('reinforcementInitial'), xAxis: inputs.initialLevel },
        { name: t('reinforcementTarget'), xAxis: inputs.targetLevel },
      ] },
      markArea: { silent: true, itemStyle: { color: 'rgba(201,168,76,0.12)' }, data: [[{ xAxis: inputs.initialLevel }, { xAxis: inputs.targetLevel }]] },
    }],
  }
})
</script>

<style scoped>
.reinforcement-view { max-width: 1180px; margin: 0 auto; }
.reinforcement-inputs, .reinforcement-results { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.reinforcement-inputs { padding: 20px; margin-bottom: 20px; }
.reinforcement-inputs label { display: flex; flex-direction: column; gap: 8px; }
.reinforcement-inputs input { width: 100%; min-width: 0; }
.reinforcement-stat { padding: 20px; display: flex; flex-direction: column; gap: 10px; overflow-wrap: anywhere; }
.reinforcement-stat strong { color: var(--gold); font-size: 1.5rem; }
.reinforcement-note { margin: 14px 0 24px; }
.reinforcement-chart-panel { padding: 20px; }
.reinforcement-chart-panel h2 { font-size: 1.1rem; margin-bottom: 8px; }
.reinforcement-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
.reinforcement-chart { height: 430px; width: 100%; }
.reinforcement-error { color: var(--danger, #d45c5c); margin: 16px 0; }
@media (max-width: 700px) {
  .reinforcement-inputs, .reinforcement-results { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .reinforcement-chart-panel { padding: 12px; }
  .reinforcement-chart { height: 360px; }
}
</style>
