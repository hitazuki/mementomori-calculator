<template>
  <section class="upgrade-panel">
    <details class="card upgrade-config">
      <summary><strong>{{ t('upgradeConfig') }}</strong><span class="upgrade-config-summary">{{ t('upgradeLevel') }} {{ panel.level }} · {{ t('upgradePanel_def') }} {{ number(panel.def) }} · {{ t('upgradePanel_pdef') }} {{ number(panel.pdef) }} · {{ t('upgradePanel_mdef') }} {{ number(panel.mdef) }}</span></summary>
      <div class="upgrade-config-body">
    <div class="card upgrade-fields">
      <label v-for="field in panelFields" :key="field.key">{{ t(field.label) }}
        <input v-model.number="panel[field.key]" class="form-input" type="number" :min="field.level ? CHARACTER_LEVEL_RANGE[0] : 0" :max="field.level ? CHARACTER_LEVEL_RANGE[1] : undefined" step="1">
      </label>
      <label class="upgrade-check"><input v-model="sameLevel" type="checkbox">{{ t('upgradeSameLevel') }}</label>
      <label v-if="!sameLevel">{{ t('upgradeEnemyLevel') }}<input v-model.number="enemyLevel" class="form-input" type="number" :min="CHARACTER_LEVEL_RANGE[0]" :max="CHARACTER_LEVEL_RANGE[1]" step="1"></label>
    </div>
    <div class="upgrade-actions">
      <button type="button" class="btn btn-secondary" @click="addPlan">{{ t('upgradeAdd') }}</button>
    </div>
    <div class="upgrade-plan-grid">
    <div v-for="(plan, index) in plans" :key="plan.id" class="card upgrade-plan">
      <h3 :style="{ color: LINE_COLORS[index % LINE_COLORS.length] }">{{ planName(plan, index) }}</h3>
      <div class="upgrade-fields">
        <label>{{ t('upgradeStat') }}<select v-model="plan.stat" class="form-input"><option v-for="stat in UPGRADE_STATS" :key="stat" :value="stat">{{ t(`upgrade_${stat}`) }}</option></select></label>
        <label>{{ t('upgradeSeries') }}<select v-model.number="plan.seriesId" class="form-input"><option v-for="series in EQUIPMENT_UPGRADE_DATA.series" :key="series.id" :value="series.id">{{ series.names[locale] || series.names.en }}</option></select></label>
        <button v-if="plans.length > 1" type="button" class="btn btn-secondary" @click="plans.splice(index, 1)">{{ t('upgradeRemove') }}</button>
      </div>
      <details><summary>{{ t('upgradeAdvanced') }}</summary><label>{{ t('upgradeBonus') }}<input v-model.number="plan.bonus" class="form-input" type="number" min="0" step="0.1"></label></details>
    </div>
    </div>
      </div>
    </details>
    <div class="upgrade-plan-summary"><span v-for="(plan, index) in plans" :key="plan.id" :style="{ borderColor: LINE_COLORS[index % LINE_COLORS.length] }">{{ planName(plan, index) }} · {{ EQUIPMENT_UPGRADE_DATA.series.find(series => series.id === plan.seriesId)?.names[locale] }}<template v-if="plan.bonus"> · +{{ plan.bonus }}%</template></span></div>
    <div class="upgrade-actions">
      <button v-for="value in ['adjacent', 'cumulative']" :key="value" type="button" class="btn" :class="mode === value ? 'btn-primary' : 'btn-secondary'" :aria-pressed="mode === value" @click="mode = value">{{ t(value === 'adjacent' ? 'upgradeAdjacent' : 'upgradeCumulativeEhp') }}</button>
    </div>
    <p v-if="invalid" role="alert" class="upgrade-error">{{ t(invalid === 'data' ? 'upgradeDataError' : 'upgradeInputError') }}</p>
    <template v-else>
      <section class="card upgrade-chart-card">
        <h3>{{ t(mode === 'adjacent' ? 'upgradeAdjacent' : 'upgradeCumulativeEhp') }}</h3>

        <VChart class="upgrade-chart" :option="chartOption" :update-options="{ replaceMerge: ['series'] }" autoresize @datazoom="onZoom" @mouseover="onHover" @zr:globalout="hoverTarget = null" />
        <details class="upgrade-help"><summary>{{ t('upgradeHelp') }}</summary><p class="view-desc">{{ t('upgradeIntro') }}</p><p class="view-desc">{{ t('upgradeChartNote') }}</p><p class="view-desc">{{ t('upgradeCompareHint') }}</p><p class="view-desc">{{ t('upgradeScope') }}</p></details>
        <details><summary>{{ t('upgradeTable') }}</summary>
          <div class="upgrade-table-scroll"><table>
            <thead><tr><th>{{ t('upgradePlan') }}</th><th>{{ t('upgradeInterval') }}</th><th>{{ t('upgradeIncrement') }}</th><th>{{ t('upgradeEhp') }}</th><th>{{ t('upgradeReduction') }}</th><th>{{ t('upgradeMaterials') }}</th></tr></thead>
            <tbody><template v-for="entry in analyses" :key="entry.plan.id"><tr v-for="point in entry.result.points" :key="point.level">
              <td>{{ planName(entry.plan, entry.index) }}</td><td>{{ interval(mode === 'adjacent' ? point.from : 0, point.level) }}<small v-if="point.firstEquip"> · {{ t('upgradeFirst') }}</small></td>
              <td>{{ number(mode === 'adjacent' ? point.increment : point.totalIncrement) }}</td><td>{{ pct(point[mode].ehp) }}</td><td>{{ pct(point[mode].reduction) }}</td>
              <td>{{ materialsText(mode === 'adjacent' ? point.from : 0, point.level) }}</td>
            </tr></template></tbody>
          </table></div>
          <p class="view-desc">{{ t('upgradeMaterialNote') }}</p>
        </details>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkLineComponent, MarkPointComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getMoriTheme, LINE_COLORS } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'
import { DEFAULT_UPGRADE_PANEL, EQUIPMENT_UPGRADE_DATA, UPGRADE_STATS, CHARACTER_LEVEL_RANGE, buildEquipmentUpgrade, upgradeMaterials, equivalentUpgradeLevels } from '../engine/equipmentUpgradeCalc.js'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkLineComponent, MarkPointComponent])
const { t, locale } = useI18n()
const panel = reactive({ ...DEFAULT_UPGRADE_PANEL })
const sameLevel = ref(true)
const enemyLevel = ref(500)
let nextId = 3
const plans = ref(UPGRADE_STATS.map((stat, id) => ({ id, stat, seriesId: 12, bonus: 0 })))
const hoverTarget = ref(null)
const equipmentCap = computed(() => Number.isInteger(panel.level) ? Math.max(0, Math.min(1000, panel.level)) : 0)
const mode = ref('adjacent')
const zoom = ref({ start: 0, end: 100 })
const panelFields = [
  { key: 'level', label: 'upgradeLevel', level: true },
  ...UPGRADE_STATS.map(key => ({ key, label: `upgradePanel_${key}` })),
  { key: 'pen', label: 'upgradePen' }, { key: 'pmPen', label: 'upgradePmPen' },
]
const analyses = computed(() => plans.value.map((plan, index) => ({ plan, index, result: buildEquipmentUpgrade({ ...panel, enemyLevel: sameLevel.value ? panel.level : enemyLevel.value }, { ...plan, start: 0 }) })))
const invalid = computed(() => analyses.value.find(entry => !entry.result.valid)?.result.error)
const number = value => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(value)
const pct = value => `${new Intl.NumberFormat(locale.value, { maximumFractionDigits: 3, minimumFractionDigits: 3 }).format(value)}%`
const planName = (plan, index) => `${index + 1}. ${t(`upgrade_${plan.stat}`)}`
const interval = (from, to) => `${from} → ${to} (+${to - from})`
watch([analyses, mode], () => { hoverTarget.value = null })
function onHover(event) { if (event.componentType === 'series' && event.data?.point) hoverTarget.value = event.data.point[mode.value].ehp }
function equivalentText(entry, target) {
  const match = equivalentUpgradeLevels(entry.result.points, mode.value, target)
  const crossing = match.intersections.length ? match.intersections.map(level => '≈' + number(level)).join(' / ') : t('upgradeNoCrossing')
  return planName(entry.plan, entry.index) + ': ' + crossing + ' · ' + t('upgradeFirstReached') + ': ' + (match.firstReached ?? t('upgradeUnreached'))
}
function addPlan() { plans.value.push({ id: nextId++, stat: 'def', seriesId: 12, bonus: 0 }) }
function onZoom(event) { const v = event.batch?.[0] ?? event; if (Number.isFinite(v.start) && Number.isFinite(v.end)) zoom.value = { start: v.start, end: v.end } }
function materialsText(from, to) {
  const result = upgradeMaterials(from, to)
  return ['gold', 'water', 'potion'].map(key => `${t(`reinforcement_${key}`)} ${number(result.totals[key])}`).join(' / ') + ` / ${t('reinforcement_tickets')} ${number(result.tickets)}`
}
const chartOption = computed(() => {
  if (invalid.value) return {}
  const theme = getMoriTheme(currentTheme.value === 'dark')
  const series = analyses.value.map(entry => ({
    id: String(entry.plan.id), name: planName(entry.plan, entry.index), type: 'line', smooth: false, showSymbol: true, symbolSize: 4,
    itemStyle: { color: LINE_COLORS[entry.index % LINE_COLORS.length] },
    markLine: hoverTarget.value === null ? { data: [] } : { silent: true, symbol: 'none', lineStyle: { type: 'dashed', color: theme.textStyle.color }, label: { formatter: pct(hoverTarget.value), position: 'insideStartTop' }, data: entry.index === 0 ? [{ yAxis: hoverTarget.value }] : [] },
    markPoint: hoverTarget.value === null ? { data: [] } : { silent: true, symbol: 'circle', symbolSize: 7, label: { show: true, formatter: param => '≈' + number(param.value), position: entry.index % 2 ? 'bottom' : 'top', color: LINE_COLORS[entry.index % LINE_COLORS.length] }, data: equivalentUpgradeLevels(entry.result.points, mode.value, hoverTarget.value).intersections.map(level => ({ coord: [level, hoverTarget.value], value: level })) },
    data: entry.result.points.filter(point => mode.value === 'cumulative' || !point.firstEquip).map(point => ({ value: [point.level, point[mode.value].ehp], point, start: 0 })),
  }))
  const plottedLevels = series.flatMap(line => line.data.map(point => point.value[0]))
  const firstLevel = plottedLevels.length ? Math.min(...plottedLevels) : 0
  const lastLevel = plottedLevels.length ? Math.max(...plottedLevels) : Math.max(1, equipmentCap.value)
  // Keep a single available node visible without adding nonexistent equipment nodes.
  const axisMin = firstLevel === lastLevel ? Math.max(0, firstLevel - 10) : firstLevel
  return {
    animation: false,
    legend: { type: 'scroll', top: 4, textStyle: theme.textStyle },
    grid: { left: 12, right: 20, top: 72, bottom: 75, containLabel: true },
    tooltip: { ...theme.tooltip, trigger: 'item', confine: true, formatter: param => {
      const { point, start } = param.data
      const from = mode.value === 'adjacent' ? point.from : start
      return `${param.marker}${param.seriesName}<br/>${interval(from, point.level)}${point.firstEquip ? ` · ${t('upgradeFirst')}` : ''}<br/>${t('upgradeIncrement')}: ${number(mode.value === 'adjacent' ? point.increment : point.totalIncrement)}<br/>${t('upgradeEhp')}: ${pct(point[mode.value].ehp)}<br/>${t('upgradeReduction')}: ${pct(point[mode.value].reduction)}<br/><br/>${t('upgradeSameEhp')}: ${pct(point[mode.value].ehp)}<br/>${analyses.value.map(entry => equivalentText(entry, point[mode.value].ehp)).join('<br/>')}`
    } },
    xAxis: { type: 'value', min: axisMin, max: lastLevel, minInterval: 1, name: t('upgradeTarget'), nameLocation: 'middle', nameGap: 30, nameTextStyle: theme.textStyle, axisLabel: theme.axisLabel, axisLine: theme.axisLine, splitLine: theme.splitLine },
    yAxis: { type: 'value', name: t('upgradeEhp'), nameTextStyle: theme.textStyle, axisLabel: { ...theme.axisLabel, formatter: value => `${number(value)}%` }, axisLine: theme.axisLine, splitLine: theme.splitLine },
    dataZoom: [{ id: 'upgrade-slider', type: 'slider', bottom: 4, ...zoom.value }, { id: 'upgrade-inside', type: 'inside', ...zoom.value }],
    series,
  }
})
</script>

<style scoped>
.upgrade-panel { display: grid; gap: 18px; }
.upgrade-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
.card.upgrade-fields, .upgrade-plan, .upgrade-chart-card { padding: 20px; }
label { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.upgrade-check { flex-direction: row; align-items: center; }
.upgrade-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.upgrade-actions label { min-width: 180px; }
h3 { margin: 0 0 14px; font-size: 1.05rem; }
summary { cursor: pointer; color: var(--gold); padding: 8px 0; }
details label { max-width: 280px; }
.upgrade-chart { height: clamp(380px, 58vh, 640px); width: 100%; }
.upgrade-error { color: var(--danger, #d45c5c); }
.upgrade-table-scroll { overflow-x: auto; max-height: 500px; }
table { width: 100%; border-collapse: collapse; font-size: .85rem; }
th, td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(150,150,150,.2); min-width: 95px; }
@media(max-width: 600px) { .upgrade-fields { grid-template-columns: repeat(2,minmax(0,1fr)); } .card.upgrade-fields, .upgrade-plan, .upgrade-chart-card { padding: 12px; } .upgrade-chart { height: 380px; } }
.upgrade-config { padding: 12px 16px; }
.upgrade-config > summary { color: var(--gold); }
.upgrade-config-summary { margin-left: 16px; color: var(--text-muted); font-size: .8rem; font-weight: normal; line-height: 1.6; }
.upgrade-config-body { display: grid; gap: 12px; margin-top: 12px; }
.upgrade-config .card { box-shadow: none; padding: 12px; }
.upgrade-config .upgrade-fields { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.upgrade-config label { font-size: .8rem; gap: 4px; }
.upgrade-plan-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
.upgrade-plan .btn { align-self: end; }
.upgrade-plan-summary { display: flex; flex-wrap: wrap; gap: 8px; }
.upgrade-plan-summary > span { border-left: 3px solid; padding: 3px 10px; font-size: .8rem; }
.upgrade-help { margin-top: 8px; }
@media(max-width: 600px) { .upgrade-config-summary { display: block; margin: 6px 0 0; } .upgrade-plan-grid { grid-template-columns: 1fr; } }
</style>
