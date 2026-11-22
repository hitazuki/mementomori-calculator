<template>
  <section class="upgrade-panel">
    <details class="card upgrade-config">
      <summary><strong>{{ t('upgradeConfig') }}</strong><span class="upgrade-config-summary">{{ t(panelMode === 'cordie' ? 'upgradeCordie' : 'upgradeCustom') }} · {{ t('upgradeLevel') }} {{ panel.level }} · {{ t('upgrade_hp') }} {{ number(baseline.hp) }}</span></summary>
      <div class="upgrade-config-body">
    <div class="card upgrade-fields">
      <label>{{ t('upgradePanelSource') }}
        <select v-model="panelMode" class="form-select">
          <option value="cordie">{{ t('upgradeCordie') }}</option>
          <option value="custom">{{ t('upgradeCustom') }}</option>
        </select>
      </label>
      <label>{{ t('upgradeLevel') }}
        <input v-model.number="panel.level" class="form-input" type="number" :min="CHARACTER_LEVEL_RANGE[0]" :max="CHARACTER_LEVEL_RANGE[1]" step="1">
      </label>
      <label v-for="stat in comparisonStats" :key="stat">
        {{ t(`upgrade_${stat}`) }}
        <input v-if="panelMode === 'custom'" v-model.number="custom[stat]" class="form-input" type="number" :min="stat === 'hp' ? 1 : 0" step="1">
        <output v-else>{{ number(baseline[stat]) }}</output>
      </label>
      <label v-for="field in sharedFields" :key="field.key">{{ t(field.label) }}
        <input v-model.number="panel[field.key]" class="form-input" type="number" min="0" :step="field.step">
      </label>
      <label class="upgrade-check"><input v-model="sameLevel" type="checkbox">{{ t('upgradeSameLevel') }}</label>
      <label v-if="!sameLevel">{{ t('upgradeEnemyLevel') }}<input v-model.number="enemyLevel" class="form-input" type="number" :min="CHARACTER_LEVEL_RANGE[0]" :max="CHARACTER_LEVEL_RANGE[1]" step="1"></label>
    </div>
    <p v-if="panelMode === 'cordie'" class="upgrade-preset-stats">
      <span v-for="stat in FOUR_STATS" :key="stat">{{ t(`upgrade_${stat}`) }} {{ number(baseline[stat]) }}</span>
    </p>
    <p class="view-desc upgrade-panel-hint">{{ t(panelMode === 'cordie' ? 'upgradePresetHint' : 'upgradeCustomHint') }}</p>
    <div class="upgrade-actions">
      <button type="button" class="btn btn-secondary" @click="addPlan">{{ t('upgradeAdd') }}</button>
    </div>
    <div class="upgrade-plan-grid">
    <div v-for="(plan, index) in plans" :key="plan.id" class="card upgrade-plan">
      <h3 :style="{ color: LINE_COLORS[index % LINE_COLORS.length] }">{{ planName(plan, index) }}</h3>
      <div class="upgrade-fields">
        <label>{{ t('upgradeSlot') }}<select v-model="plan.slot" class="form-select" @change="plan.outsideBonus = slotBonus(plan.slot).outsideBonus"><option v-for="(_, slot) in EQUIPMENT_SLOTS" :key="slot" :value="slot">{{ t(`upgradeSlot_${slot}`) }}</option></select></label>
        <label>{{ t('upgradeSeries') }}<select v-model.number="plan.seriesId" class="form-select"><option v-for="series in EQUIPMENT_UPGRADE_DATA.series" :key="series.id" :value="series.id">{{ series.names[locale] || series.names.en }}</option></select></label>
        <button v-if="plans.length > 1" type="button" class="btn btn-secondary" @click="plans.splice(index, 1)">{{ t('upgradeRemove') }}</button>
      </div>
      <div class="upgrade-toggles">
        <label class="upgrade-check"><input v-model="plan.applyBase" type="checkbox">{{ t('upgradeApplyBase') }}</label>
        <label class="upgrade-check"><input v-model="plan.applyFourStats" type="checkbox">{{ t('upgradeApplyFour') }}</label>
      </div>
      <details v-if="plan.applyFourStats">
        <summary>{{ t('upgradeReforge') }} · {{ plan.shares.map(share => number(share)).join(' / ') }}%</summary>
        <label>{{ t('upgradeReforgeMode') }}
          <select v-model="plan.reforgeMode" class="form-select" @change="plan.shares = adjustReforge(plan.shares, plan.reforgeMode)">
            <option value="gold">{{ t('upgradeReforgeGold') }}</option>
            <option value="locked">{{ t('upgradeReforgeLocked') }}</option>
          </select>
        </label>
        <label v-for="(stat, i) in FOUR_STATS" :key="stat" class="upgrade-range">
          <span>{{ t(`upgrade_${stat}`) }} <output>{{ number(plan.shares[i]) }}%</output></span>
          <input type="range" :min="reforgeMinimum(plan.reforgeMode)" max="60" step="any" :value="plan.shares[i]" :aria-valuetext="`${number(plan.shares[i])}%`" @input="plan.shares = adjustReforge(plan.shares, plan.reforgeMode, i, $event.target.valueAsNumber)">
        </label>
        <p class="view-desc">{{ t('upgradeReforgeHint') }}</p>
      </details>
      <details v-if="UPGRADE_STATS.includes(EQUIPMENT_SLOTS[plan.slot])"><summary>{{ t('upgradeAdvanced') }}</summary><div class="upgrade-fields"><label>{{ t('upgradeOutsideBonus') }}<input v-model.number="plan.outsideBonus" class="form-input" type="number" min="0" step="0.1"><small class="view-desc">{{ t('upgradeOutsideHint') }}</small></label><label>{{ t('upgradeInsideBonus') }}<input v-model.number="plan.insideBonus" class="form-input" type="number" step="0.1"></label></div><p class="view-desc">{{ t('upgradeBonusFormula') }}</p></details>
    </div>
    </div>
      </div>
    </details>
    <div class="upgrade-plan-summary"><span v-for="(plan, index) in plans" :key="plan.id" :style="{ borderColor: LINE_COLORS[index % LINE_COLORS.length] }">{{ planName(plan, index) }} · {{ seriesName(plan.seriesId) }}</span></div>
    <div class="upgrade-actions">
      <label>{{ t('upgradeDamage') }}
        <select v-model="damageType" class="form-select">
          <option value="phys">{{ t('upgradePhys') }}</option>
          <option value="mag">{{ t('upgradeMag') }}</option>
        </select>
      </label>
      <button v-for="value in ['adjacent', 'cumulative', 'efficiency']" :key="value" type="button" class="btn" :class="mode === value ? 'btn-primary' : 'btn-secondary'" :aria-pressed="mode === value" @click="mode = value">{{ t(modeLabels[value]) }}</button>
    </div>
    <p v-if="invalid" role="alert" class="upgrade-error">{{ t(invalid === 'data' ? 'upgradeDataError' : 'upgradeInputError') }}</p>
    <template v-else>
      <section class="card upgrade-chart-card">
        <h3>{{ t(modeLabels[mode]) }}</h3>

        <p v-if="mode === 'efficiency'" class="view-desc">{{ t('upgradeEfficiencyNote') }}</p>
        <VChart class="upgrade-chart" :option="chartOption" :update-options="{ replaceMerge: ['series'] }" autoresize @datazoom="onZoom" @mouseover="onHover" @zr:globalout="hoverTarget = null" />
        <details class="upgrade-help"><summary>{{ t('upgradeHelp') }}</summary><p class="view-desc">{{ t('upgradeIntro') }}</p><p class="view-desc">{{ t('upgradeChartNote') }}</p><p class="view-desc">{{ t('upgradeCompareHint') }}</p><p class="view-desc">{{ t('upgradeScope') }}</p></details>
        <details :open="showTable" @toggle="showTable = $event.target.open"><summary>{{ t('upgradeTable') }}</summary>
          <div v-if="showTable" class="upgrade-table-scroll"><table>
            <thead><tr><th>{{ t('upgradePlan') }}</th><th>{{ t('upgradeInterval') }}</th><th>{{ t('upgradeIncrement') }}</th><th>{{ t('upgradeEhp') }}</th><th>{{ t('upgradeReduction') }}</th><th>{{ t('upgradeFragments') }}</th><th>{{ t('upgradeEfficiency') }}</th><th>{{ t('upgradeMaterials') }}</th></tr></thead>
            <tbody><template v-for="entry in analyses" :key="entry.plan.id"><tr v-for="point in entry.result.points" :key="point.level">
              <td>{{ planName(entry.plan, entry.index) }}</td><td>{{ interval(mode !== 'cumulative' ? point.from : 0, point.level) }}<small v-if="point.firstEquip"> · {{ t('upgradeFirst') }}</small></td>
              <td class="upgrade-row-stats"><div v-for="line in statLines(point)" :key="line">{{ line }}</div></td>
              <td>{{ pct(point[gainMode].ehp) }}<small class="upgrade-effective-life">{{ t('upgradeEffectiveLife') }} {{ number(point.effectiveHp) }}</small></td><td>{{ pct(point[gainMode].reduction) }}</td>
              <td>{{ point.fragmentCost ?? '—' }}</td><td>{{ point.efficiency.ehp === null ? '—' : efficiencyText(point.efficiency.ehp) }}</td><td>{{ materialsText(mode !== 'cumulative' ? point.from : 0, point.level, entry.plan.slot) }}</td>
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
import VChart from './ActiveChart.vue'
import { getMoriTheme, LINE_COLORS } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'
import {
  DEFAULT_UPGRADE_PANEL, DEFAULT_UPGRADE_BONUSES, EQUIPMENT_UPGRADE_DATA, UPGRADE_STATS, CHARACTER_LEVEL_RANGE,
  EQUIPMENT_SLOTS, FOUR_STATS, EQUAL_REFORGE, adjustReforge, reforgeMinimum, cordiePanel,
  buildEquipmentUpgrade, upgradeMaterials, equivalentUpgradeLevels,
} from '../engine/equipmentUpgradeCalc.js'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkLineComponent, MarkPointComponent])
const { t, locale } = useI18n()
const panel = reactive({ level: DEFAULT_UPGRADE_PANEL.level, pen: DEFAULT_UPGRADE_PANEL.pen, pmPen: DEFAULT_UPGRADE_PANEL.pmPen, staminaBonus: 0, hpBonus: 0 })
const custom = reactive({ hp: 75000000, def: DEFAULT_UPGRADE_PANEL.def, pdef: DEFAULT_UPGRADE_PANEL.pdef, mdef: DEFAULT_UPGRADE_PANEL.mdef })
const panelMode = ref('cordie')
const baseline = computed(() => panelMode.value === 'cordie' ? cordiePanel(panel.level, panel.staminaBonus, panel.hpBonus) ?? {} : custom)
const damageType = ref('phys')
const sameLevel = ref(true)
const enemyLevel = ref(500)
let nextId = 0
const slotBonus = slot => DEFAULT_UPGRADE_BONUSES[EQUIPMENT_SLOTS[slot]] ?? { outsideBonus: 0, insideBonus: 0 }
function newPlan(slot) {
  return { id: nextId++, slot, seriesId: 12, ...slotBonus(slot), applyBase: true, applyFourStats: true, reforgeMode: 'gold', shares: [...EQUAL_REFORGE] }
}
const plans = ref(['hands', 'head', 'body'].map(newPlan))
const hoverTarget = ref(null)
const equipmentCap = computed(() => Number.isInteger(panel.level) ? Math.max(0, Math.min(1000, panel.level)) : 0)
const mode = ref('adjacent')
const showTable = ref(false)
const gainMode = computed(() => mode.value === 'cumulative' ? 'cumulative' : 'adjacent')
const modeLabels = { adjacent: 'upgradeAdjacent', cumulative: 'upgradeCumulativeEhp', efficiency: 'upgradeEfficiency' }
const efficiencyText = value => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 5 }).format(value) + ' ' + t('upgradeEfficiencyUnit')
const chartValue = value => mode.value === 'efficiency' ? efficiencyText(value) : pct(value)
const zoom = ref({ start: 0, end: 100 })
const comparisonStats = ['hp', ...UPGRADE_STATS]
const sharedFields = [
  { key: 'staminaBonus', label: 'upgradeStaminaBonus', step: 0.1 }, { key: 'hpBonus', label: 'upgradeHpBonus', step: 0.1 },
  { key: 'pen', label: 'upgradePen', step: 1 }, { key: 'pmPen', label: 'upgradePmPen', step: 1 },
]
const analyses = computed(() => {
  const input = { ...panel, ...baseline.value, enemyLevel: sameLevel.value ? panel.level : enemyLevel.value }
  return plans.value.map((plan, index) => ({ plan, index, result: buildEquipmentUpgrade(input, { ...plan, start: 0 }, damageType.value) }))
})
const invalid = computed(() => analyses.value.find(entry => !entry.result.valid)?.result.error)
const numberFormat = computed(() => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }))
const number = value => Number.isFinite(value) ? numberFormat.value.format(value) : '—'
const pct = value => `${new Intl.NumberFormat(locale.value, { maximumFractionDigits: 3, minimumFractionDigits: 3 }).format(value)}%`
const planName = (plan, index) => `${index + 1}. ${t(`upgradeSlot_${plan.slot}`)}`
function seriesName(id) {
  const names = EQUIPMENT_UPGRADE_DATA.series.find(series => series.id === id)?.names
  return names?.[locale.value] ?? names?.en
}
function statLines(point) {
  const stats = gainMode.value === 'cumulative' ? point.totals : point.increments
  return [FOUR_STATS, comparisonStats, ['atk', 'critRes', 'debuffRes'], ['debuffHit', 'hit', 'evade', 'crit']].map(group =>
    group.map(key => `${t(`upgrade_${key}`)} ${number(stats[key])}`).join(' · '))
}
const interval = (from, to) => `${from} → ${to} (+${to - from})`
watch([analyses, mode], () => { hoverTarget.value = null })
function onHover(event) {
  const value = event.data?.point?.[mode.value]?.ehp
  if (event.componentType === 'series' && Number.isFinite(value)) hoverTarget.value = value
}
function equivalentText(entry, target) {
  const match = equivalentUpgradeLevels(entry.result.points, mode.value, target)
  const crossing = match.intersections.length ? match.intersections.map(level => '≈' + number(level)).join(' / ') : t('upgradeNoCrossing')
  return planName(entry.plan, entry.index) + ': ' + crossing + ' · ' + t('upgradeFirstReached') + ': ' + (match.firstReached ?? t('upgradeUnreached'))
}
function addPlan() { plans.value.push(newPlan('hands')) }
function onZoom(event) { const v = event.batch?.[0] ?? event; if (Number.isFinite(v.start) && Number.isFinite(v.end)) zoom.value = { start: v.start, end: v.end } }
function materialsText(from, to, slot) {
  const result = upgradeMaterials(from, to, slot)
  return ['gold', 'water', 'potion'].map(key => `${t(`reinforcement_${key}`)} ${number(result.totals[key])}`).join(' / ') + ` / ${t('reinforcement_tickets')} ${number(result.tickets)}`
}
const chartOption = computed(() => {
  if (invalid.value) return {}
  const theme = getMoriTheme(currentTheme.value === 'dark')
  const series = analyses.value.map(entry => ({
    id: String(entry.plan.id), name: planName(entry.plan, entry.index), type: 'line', smooth: false, showSymbol: true, symbolSize: 4,
    itemStyle: { color: LINE_COLORS[entry.index % LINE_COLORS.length] },
    // ECharts defaults to rounding axis mark lines to 2 decimals; preserve the hovered coordinate.
    markLine: hoverTarget.value === null ? { data: [] } : { precision: -1, silent: true, symbol: 'none', lineStyle: { type: 'dashed', color: theme.textStyle.color }, label: { formatter: chartValue(hoverTarget.value), position: 'insideStartTop' }, data: entry.index === 0 ? [{ yAxis: hoverTarget.value }] : [] },
    markPoint: hoverTarget.value === null ? { data: [] } : { silent: true, symbol: 'circle', symbolSize: 7, label: { show: true, formatter: param => '≈' + number(param.value), position: entry.index % 2 ? 'bottom' : 'top', color: LINE_COLORS[entry.index % LINE_COLORS.length] }, data: equivalentUpgradeLevels(entry.result.points, mode.value, hoverTarget.value).intersections.map(level => ({ coord: [level, hoverTarget.value], value: level })) },
    data: entry.result.points.filter(point => mode.value === 'cumulative' || !point.firstEquip).map(point => ({ value: [point.level, point[mode.value].ehp], point })),
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
      const { point } = param.data
      if (!Number.isFinite(point[mode.value].ehp)) return ''
      const from = mode.value === 'cumulative' ? 0 : point.from
      return `<div style="max-width:min(450px,70vw);white-space:normal">${param.marker}${param.seriesName}<br/>${interval(from, point.level)}${point.firstEquip ? ` · ${t('upgradeFirst')}` : ''}<br/>${statLines(point).join('<br/>')}<br/>${t('upgradeEffectiveLife')} ${number(point.effectiveHp)}<br/>${t('upgradeEhp')}: ${pct(point[gainMode.value].ehp)}<br/>${t('upgradeReduction')}: ${pct(point[gainMode.value].reduction)}<br/>${t('upgradeFragments')}: ${point.fragmentCost ?? '—'}<br/>${t('upgradeEfficiency')}: ${point.efficiency.ehp === null ? '—' : efficiencyText(point.efficiency.ehp)}<br/><br/>${t(mode.value === 'efficiency' ? 'upgradeSameEfficiency' : 'upgradeSameEhp')}: ${chartValue(point[mode.value].ehp)}<br/>${analyses.value.map(entry => equivalentText(entry, point[mode.value].ehp)).join('<br/>')}</div>`
    } },
    xAxis: { type: 'value', min: axisMin, max: lastLevel, minInterval: 1, name: t('upgradeTarget'), nameLocation: 'middle', nameGap: 30, nameTextStyle: theme.textStyle, axisLabel: theme.axisLabel, axisLine: theme.axisLine, splitLine: theme.splitLine },
    yAxis: { type: 'value', name: t(mode.value === 'efficiency' ? 'upgradeEfficiencyUnit' : 'upgradeEhp'), nameTextStyle: theme.textStyle, axisLabel: { ...theme.axisLabel, formatter: value => mode.value === 'efficiency' ? new Intl.NumberFormat(locale.value, { maximumFractionDigits: 4 }).format(value) : `${number(value)}%` }, axisLine: theme.axisLine, splitLine: theme.splitLine },
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
.upgrade-actions { display: flex; flex-wrap: wrap; align-items: end; gap: 12px; }
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
.upgrade-preset-stats, .upgrade-toggles { display: flex; flex-wrap: wrap; gap: 8px 16px; }
.upgrade-preset-stats, .upgrade-panel-hint { margin: 0; }
.upgrade-toggles { margin-top: 12px; }
.upgrade-range { margin-top: 8px; }
.upgrade-range span { display: flex; justify-content: space-between; }
.upgrade-range input { width: 100%; margin: 0; accent-color: var(--gold); }
.upgrade-row-stats { min-width: 18rem; }
.upgrade-effective-life { display: block; margin-top: 4px; }
@media(max-width: 600px) { .upgrade-config-summary { display: block; margin: 6px 0 0; } .upgrade-plan-grid { grid-template-columns: 1fr; } }
</style>
