<template>
  <section class="upgrade-panel">
    <p class="view-desc">{{ t('upgradeIntro') }}</p>
    <div class="card upgrade-fields">
      <label v-for="field in panelFields" :key="field.key">{{ t(field.label) }}
        <input v-model.number="panel[field.key]" class="form-input" type="number" :min="field.level ? CHARACTER_LEVEL_RANGE[0] : 0" :max="field.level ? CHARACTER_LEVEL_RANGE[1] : undefined" step="1">
      </label>
      <label class="upgrade-check"><input v-model="sameLevel" type="checkbox">{{ t('upgradeSameLevel') }}</label>
      <label v-if="!sameLevel">{{ t('upgradeEnemyLevel') }}<input v-model.number="enemyLevel" class="form-input" type="number" :min="CHARACTER_LEVEL_RANGE[0]" :max="CHARACTER_LEVEL_RANGE[1]" step="1"></label>
    </div>
    <div class="upgrade-actions">
      <button type="button" class="btn btn-secondary" @click="addPlan">{{ t('upgradeAdd') }}</button>
      <button type="button" class="btn btn-secondary" @click="loadExample">{{ t('upgradeExample') }}</button>
    </div>
    <div v-for="(plan, index) in plans" :key="plan.id" class="card upgrade-plan">
      <h3 :style="{ color: LINE_COLORS[index % LINE_COLORS.length] }">{{ planName(plan, index) }}</h3>
      <div class="upgrade-fields">
        <label>{{ t('upgradeStat') }}<select v-model="plan.stat" class="form-input" @change="normalizeStart(plan)"><option v-for="stat in UPGRADE_STATS" :key="stat" :value="stat">{{ t(`upgrade_${stat}`) }}</option></select></label>
        <label>{{ t('upgradeSeries') }}<select v-model.number="plan.seriesId" class="form-input" @change="normalizeStart(plan)"><option v-for="series in EQUIPMENT_UPGRADE_DATA.series" :key="series.id" :value="series.id">{{ series.names[locale] || series.names.en }}</option></select></label>
        <label>{{ t('upgradeStart') }}<input v-model.number="plan.start" class="form-input" type="number" min="0" max="1000" step="10" :aria-invalid="!levels(plan).includes(plan.start)"></label>
        <button v-if="plans.length > 1" type="button" class="btn btn-secondary" @click="plans.splice(index, 1)">{{ t('upgradeRemove') }}</button>
      </div>
      <input class="upgrade-slider" type="range" min="0" :max="levels(plan).length - 1" step="1" :value="Math.max(0, levels(plan).indexOf(plan.start))" :aria-label="`${planName(plan, index)} · ${t('upgradeStart')}`" :aria-valuetext="String(plan.start)" @input="plan.start = levels(plan)[Number($event.target.value)]">
      <p v-if="plan.reset" role="status" class="view-desc">{{ t('upgradeReset') }}</p>
      <details><summary>{{ t('upgradeAdvanced') }}</summary><label>{{ t('upgradeBonus') }}<input v-model.number="plan.bonus" class="form-input" type="number" min="0" step="0.1"></label></details>
    </div>
    <p class="view-desc">{{ t('upgradeScope') }}</p>
    <div class="upgrade-actions">
      <label>{{ t('upgradeDamage') }}<select v-model="damageType" class="form-input"><option value="phys">{{ t('upgradePhys') }}</option><option value="mag">{{ t('upgradeMag') }}</option></select></label>
      <label>{{ t('upgradeMode') }}<select v-model="mode" class="form-input"><option value="adjacent">{{ t('upgradeAdjacent') }}</option><option value="cumulative">{{ t('upgradeCumulative') }}</option></select></label>
    </div>
    <p v-if="invalid" role="alert" class="upgrade-error">{{ t(invalid === 'data' ? 'upgradeDataError' : 'upgradeInputError') }}</p>
    <template v-else>
      <section class="card upgrade-results">
        <h3>{{ t('upgradeNext') }}</h3>
        <p class="view-desc">{{ t('upgradeSpans') }}</p>
        <div v-for="entry in ranked" :key="entry.plan.id" class="upgrade-result-row">
          <strong>{{ planName(entry.plan, entry.index) }}</strong>
          <span v-if="entry.result.next">{{ interval(entry.result.next.from, entry.result.next.level) }} · {{ t('upgradeEhp') }} +{{ pct(entry.result.next.adjacent.ehp) }}</span>
          <span v-else>{{ t('upgradeEnd') }}</span>
        </div>
        <details v-if="analyses.some(entry => entry.result.firstEquip)"><summary>{{ t('upgradeFirst') }}</summary>
          <div v-for="entry in analyses.filter(entry => entry.result.firstEquip)" :key="entry.plan.id" class="upgrade-result-row">
            <strong>{{ planName(entry.plan, entry.index) }}</strong><span>0 → {{ entry.result.firstEquip.level }} · +{{ pct(entry.result.firstEquip.adjacent.ehp) }}</span>
          </div>
        </details>
      </section>
      <section class="card upgrade-chart-card">
        <h3>{{ t(mode === 'adjacent' ? 'upgradeAdjacent' : 'upgradeCumulative') }}</h3>
        <p class="view-desc">{{ t('upgradeChartNote') }}</p>
        <VChart class="upgrade-chart" :option="chartOption" autoresize @datazoom="onZoom" />
        <details><summary>{{ t('upgradeTable') }}</summary>
          <div class="upgrade-table-scroll"><table>
            <thead><tr><th>{{ t('upgradePlan') }}</th><th>{{ t('upgradeInterval') }}</th><th>{{ t('upgradeIncrement') }}</th><th>{{ t('upgradeEhp') }}</th><th>{{ t('upgradeReduction') }}</th><th>{{ t('upgradeMaterials') }}</th></tr></thead>
            <tbody><template v-for="entry in analyses" :key="entry.plan.id"><tr v-for="point in entry.result.points" :key="point.level">
              <td>{{ planName(entry.plan, entry.index) }}</td><td>{{ interval(mode === 'adjacent' ? point.from : entry.plan.start, point.level) }}<small v-if="point.firstEquip"> · {{ t('upgradeFirst') }}</small></td>
              <td>{{ number(mode === 'adjacent' ? point.increment : point.totalIncrement) }}</td><td>{{ pct(point[mode].ehp) }}</td><td>{{ pct(point[mode].reduction) }}</td>
              <td>{{ materialsText(mode === 'adjacent' ? point.from : entry.plan.start, point.level) }}</td>
            </tr></template></tbody>
          </table></div>
          <p class="view-desc">{{ t('upgradeMaterialNote') }}</p>
        </details>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getMoriTheme, LINE_COLORS } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'
import { DEFAULT_UPGRADE_PANEL, EQUIPMENT_UPGRADE_DATA, UPGRADE_STATS, CHARACTER_LEVEL_RANGE, upgradeLevels, buildEquipmentUpgrade, upgradeMaterials } from '../engine/equipmentUpgradeCalc.js'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent])
const { t, locale } = useI18n()
const panel = reactive({ ...DEFAULT_UPGRADE_PANEL })
const sameLevel = ref(true)
const enemyLevel = ref(500)
let nextId = 3
const plans = ref(UPGRADE_STATS.map((stat, id) => ({ id, stat, seriesId: 12, start: 0, bonus: 0, reset: false })))
const damageType = ref('phys')
const mode = ref('adjacent')
const zoom = ref({ start: 0, end: 100 })
const panelFields = [
  { key: 'level', label: 'upgradeLevel', level: true },
  ...UPGRADE_STATS.map(key => ({ key, label: `upgradePanel_${key}` })),
  { key: 'pen', label: 'upgradePen' }, { key: 'pmPen', label: 'upgradePmPen' },
]
const analyses = computed(() => plans.value.map((plan, index) => ({ plan, index, result: buildEquipmentUpgrade({ ...panel, enemyLevel: sameLevel.value ? panel.level : enemyLevel.value }, plan, damageType.value) })))
const invalid = computed(() => analyses.value.find(entry => !entry.result.valid)?.result.error)
const ranked = computed(() => [...analyses.value].sort((a, b) => (b.result.next?.adjacent.ehp ?? -1) - (a.result.next?.adjacent.ehp ?? -1)))
const levels = plan => upgradeLevels(plan.seriesId, plan.stat)
const number = value => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(value)
const pct = value => `${new Intl.NumberFormat(locale.value, { maximumFractionDigits: 3, minimumFractionDigits: 3 }).format(value)}%`
const planName = (plan, index) => `${index + 1}. ${t(`upgrade_${plan.stat}`)}`
const interval = (from, to) => `${from} → ${to} (+${to - from})`
function normalizeStart(plan) { plan.reset = !levels(plan).includes(plan.start); if (plan.reset) plan.start = 0 }
function addPlan() { plans.value.push({ id: nextId++, stat: 'def', seriesId: 12, start: 0, bonus: 0, reset: false }) }
function loadExample() {
  Object.assign(panel, DEFAULT_UPGRADE_PANEL, { level: 470, def: 3286996, pdef: 4477977, mdef: 5218753 })
  sameLevel.value = true
  damageType.value = 'phys'
  plans.value = [{ id: nextId++, stat: 'pdef', seriesId: 12, start: 380, bonus: 0 }, { id: nextId++, stat: 'def', seriesId: 12, start: 420, bonus: 0 }]
}
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
    data: entry.result.points.filter(point => mode.value === 'cumulative' || !point.firstEquip).map(point => ({ value: [point.level, point[mode.value].ehp], point, start: entry.plan.start })),
  }))
  return {
    animation: false,
    legend: { type: 'scroll', top: 4, textStyle: theme.textStyle },
    grid: { left: 12, right: 20, top: 72, bottom: 75, containLabel: true },
    tooltip: { ...theme.tooltip, trigger: 'axis', confine: true, formatter: params => params.map(param => {
      const { point, start } = param.data
      const from = mode.value === 'adjacent' ? point.from : start
      return `${param.marker}${param.seriesName}<br/>${interval(from, point.level)}${point.firstEquip ? ` · ${t('upgradeFirst')}` : ''}<br/>${t('upgradeIncrement')}: ${number(mode.value === 'adjacent' ? point.increment : point.totalIncrement)}<br/>${t('upgradeEhp')}: ${pct(point[mode.value].ehp)}<br/>${t('upgradeReduction')}: ${pct(point[mode.value].reduction)}`
    }).join('<br/><br/>') },
    xAxis: { type: 'value', min: 0, max: 1000, name: t('upgradeTarget'), nameLocation: 'middle', nameGap: 30, nameTextStyle: theme.textStyle, axisLabel: theme.axisLabel, axisLine: theme.axisLine, splitLine: theme.splitLine },
    yAxis: { type: 'value', name: t('upgradeEhp'), nameTextStyle: theme.textStyle, axisLabel: { ...theme.axisLabel, formatter: value => `${number(value)}%` }, axisLine: theme.axisLine, splitLine: theme.splitLine },
    dataZoom: [{ id: 'upgrade-slider', type: 'slider', bottom: 4, ...zoom.value }, { id: 'upgrade-inside', type: 'inside', ...zoom.value }],
    series,
  }
})
</script>

<style scoped>
.upgrade-panel { display: grid; gap: 18px; }
.upgrade-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
.card.upgrade-fields, .upgrade-plan, .upgrade-results, .upgrade-chart-card { padding: 20px; }
label { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.upgrade-check { flex-direction: row; align-items: center; }
.upgrade-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.upgrade-actions label { min-width: 180px; }
h3 { margin: 0 0 14px; font-size: 1.05rem; }
.upgrade-slider { width: 100%; margin: 18px 0; accent-color: var(--gold); }
summary { cursor: pointer; color: var(--gold); padding: 8px 0; }
details label { max-width: 280px; }
.upgrade-result-row { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 12px 0; border-bottom: 1px solid rgba(150,150,150,.18); }
.upgrade-chart { height: 440px; width: 100%; }
.upgrade-error { color: var(--danger, #d45c5c); }
.upgrade-table-scroll { overflow-x: auto; max-height: 500px; }
table { width: 100%; border-collapse: collapse; font-size: .85rem; }
th, td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(150,150,150,.2); min-width: 95px; }
@media(max-width: 600px) { .upgrade-fields { grid-template-columns: repeat(2,minmax(0,1fr)); } .card.upgrade-fields, .upgrade-plan, .upgrade-results, .upgrade-chart-card { padding: 12px; } .upgrade-chart { height: 380px; } }
</style>
