<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('heatmapTitle') }}</h1>
    <p class="view-desc">{{ $t('heatmapDesc') }}</p>
  </div>
  <div class="grid-sidebar-right chart-page-shell animate-fadeup" style="height:calc(100vh - 110px)">
    <div class="card chart-main-card" style="height:100%;display:flex;flex-direction:column">
      <div class="chart-toolbar">
        <div class="chart-toolbar-main">
          <div class="card-title" style="margin:0">{{ currentYVar?.label }} × {{ currentXVar?.label }}</div>
          <select class="form-select btn-sm" v-model="hs.metric" style="width:160px;margin:0;">
            <option v-for="(v, k) in getMetrics()" :key="k" :value="k">{{ v.label }}</option>
          </select>
        </div>
        <button class="btn btn-ghost btn-sm" @click="downloadChart">⬇ PNG</button>
      </div>
      <div class="chart-frame" style="min-height:480px;">
        <v-chart ref="chartRef" class="chart" :option="chartOption" autoresize />
      </div>
    </div>

    <div class="flex-col gap-12 chart-control-panel" style="overflow-y:auto; padding-bottom: 24px;">
      
      <div class="card">
        <div class="card-title">🔀 {{ $t('hmAxisConfig') }}</div>
        
        <div class="form-group">
          <label class="form-label text-purple-light">{{ $t('yAxisConfig') }}</label>
          <select class="form-select" v-model="hs.yKey" @change="onYKeyChange">
            <option v-for="v in availableVariables" :key="v.key" :value="v.key" :disabled="v.key === hs.xKey">{{ v.label }}</option>
          </select>
          <div style="margin-top:8px">
            <label class="form-label text-xs">
              {{ $t('minVar', {var: ''}) }} <span class="value-display">{{ fmt(hs.yMin, currentYVar) }}</span>
            </label>
            <input class="form-range" type="range" v-model.number="hs.yMin" :min="currentYVar?.rangeMin" :max="currentYVar?.rangeMax" :step="currentYVar?.step">
          </div>
          <div style="margin-top:4px">
            <label class="form-label text-xs">
              {{ $t('maxVar', {var: ''}) }} <span class="value-display">{{ fmt(hs.yMax, currentYVar) }}</span>
            </label>
            <input class="form-range" type="range" v-model.number="hs.yMax" :min="currentYVar?.rangeMin" :max="currentYVar?.rangeMax" :step="currentYVar?.step">
          </div>
          <div style="margin-top:4px">
            <label class="form-label text-xs">{{ $t('stepSpan') }} <span class="value-display">{{ hs.ySteps }}</span></label>
            <input class="form-range" type="range" v-model.number="hs.ySteps" min="5" max="40" step="1">
          </div>
        </div>

        <div class="divider"></div>

        <div class="form-group">
          <label class="form-label text-gold">{{ $t('xAxisConfig') }}</label>
          <select class="form-select" v-model="hs.xKey" @change="onXKeyChange">
            <option v-for="v in availableVariables" :key="v.key" :value="v.key" :disabled="v.key === hs.yKey">{{ v.label }}</option>
          </select>
          <div style="margin-top:8px">
            <label class="form-label text-xs">
              {{ $t('minVar', {var: ''}) }} <span class="value-display">{{ fmt(hs.xMin, currentXVar) }}</span>
            </label>
            <input class="form-range" type="range" v-model.number="hs.xMin" :min="currentXVar?.rangeMin" :max="currentXVar?.rangeMax" :step="currentXVar?.step">
          </div>
          <div style="margin-top:4px">
            <label class="form-label text-xs">
              {{ $t('maxVar', {var: ''}) }} <span class="value-display">{{ fmt(hs.xMax, currentXVar) }}</span>
            </label>
            <input class="form-range" type="range" v-model.number="hs.xMax" :min="currentXVar?.rangeMin" :max="currentXVar?.rangeMax" :step="currentXVar?.step">
          </div>
          <div style="margin-top:4px">
            <label class="form-label text-xs">{{ $t('stepSpan') }} <span class="value-display">{{ hs.xSteps }}</span></label>
            <input class="form-range" type="range" v-model.number="hs.xSteps" min="5" max="40" step="1">
          </div>
        </div>

      </div>

      <div class="card">
        <div class="card-title">⚙️ {{ $t('basePanelStats') }}</div>
        
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label text-xs">{{ $t('atkType') }}</label>
          <div class="segmented-control">
            <button class="btn btn-sm" :class="store.damageType === 'phys' ? 'btn-primary' : 'btn-ghost'" @click="setDamageType('phys')">{{ $t('typePhys') }}</button>
            <button class="btn btn-sm" :class="store.damageType === 'mag' ? 'btn-primary' : 'btn-ghost'" @click="setDamageType('mag')">{{ $t('typeMag') }}</button>
          </div>
        </div>

        <div class="form-group" v-for="v in fixedVariables" :key="v.key" style="margin-bottom:8px">
          <label class="form-label text-xs">
            {{ v.label }} 
            <span class="value-display">{{ fmt(store[v.key], v) }}</span>
          </label>
          <input class="form-range" type="range" v-model.number="store[v.key]" :min="v.rangeMin" :max="v.rangeMax" :step="v.step">
        </div>

        <!-- Collapsible non-sweepable stats -->
        <details class="advanced-panel-details" style="margin-top: 12px; border-top: 1px dashed var(--border-subtle); padding-top: 12px;">
          <summary style="font-size: var(--fs-sm); color: var(--gold); cursor: pointer; user-select: none; font-weight: 500; outline:none;">
            ⚙️ {{ $t('baseCoefficients') }}
          </summary>
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
            <div class="form-group">
              <label class="form-label text-xs" style="display:flex;justify-content:space-between;align-items:center;">
                <span>{{ $t('baseAtk') }}</span>
                <BigNumberInput class="form-input chart-control-input" v-model="store.baseAtk" />
              </label>
              <input class="form-range" type="range" v-model.number="store.baseAtk" min="10000" max="200000000" step="10000">
            </div>
            <div class="form-group">
              <label class="form-label text-xs" style="display:flex;justify-content:space-between;align-items:center;">
                <span>{{ $t('skillCoeff') }}</span>
                <div style="display:flex;align-items:center;gap:1px">
                  <input class="inline-num chart-inline-percent" type="number" step="0.5" :value="+(store.skillCoeff*100).toFixed(1)" @change="e => store.skillCoeff = parseFloat(e.target.value)/100||0">
                  <span class="value-display">%</span>
                </div>
              </label>
              <input class="form-range" type="range" v-model.number="store.skillCoeff" min="0.1" max="25" step="0.1">
            </div>
            <div class="form-group">
              <label class="form-label text-xs" style="display:flex;justify-content:space-between;align-items:center;">
                <span>{{ $t('critMult') }}</span>
                <div style="display:flex;align-items:center;gap:1px">
                  <input class="inline-num chart-inline-percent" type="number" step="0.5" :value="+(store.critMult*100).toFixed(1)" @change="e => store.critMult = parseFloat(e.target.value)/100||0">
                  <span class="value-display">%</span>
                </div>
              </label>
              <input class="form-range" type="range" v-model.number="store.critMult" min="1" max="5" step="0.05">
            </div>
            <div class="form-group">
              <label class="form-label text-xs" style="display:flex;justify-content:space-between;align-items:center;">
                <span>{{ $t('atkBonus') }}</span>
                <div style="display:flex;align-items:center;gap:1px">
                  <input class="inline-num chart-inline-percent" type="number" step="0.5" :value="+(store.atkBonus*100).toFixed(1)" @change="e => store.atkBonus = parseFloat(e.target.value)/100||0">
                  <span class="value-display">%</span>
                </div>
              </label>
              <input class="form-range" type="range" v-model.number="store.atkBonus" min="-1" max="2.5" step="0.05">
            </div>
            <div class="form-group">
              <label class="form-label text-xs" style="display:flex;justify-content:space-between;align-items:center;">
                <span>{{ $t('dmgBonus') }}</span>
                <div style="display:flex;align-items:center;gap:1px">
                  <input class="inline-num chart-inline-percent" type="number" step="0.5" :value="+(store.dmgBonus*100).toFixed(1)" @change="e => store.dmgBonus = parseFloat(e.target.value)/100||0">
                  <span class="value-display">%</span>
                </div>
              </label>
              <input class="form-range" type="range" v-model.number="store.dmgBonus" min="-1" max="2" step="0.05">
            </div>
            <div class="form-group" style="display:flex;flex-direction:row;align-items:center;gap:8px;padding-top:4px;">
              <input type="checkbox" v-model="store.eleAdvantage" id="heatmap-ele" style="width:16px;height:16px;">
              <label for="heatmap-ele" class="form-label text-xs" style="margin:0;cursor:pointer;">{{ $t('eleAdvantage') }}</label>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BigNumberInput from '../components/BigNumberInput.vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { HeatmapChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, VisualMapComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'

import { buildDynamicHeatmapData } from '../engine/damageCalc.js'
import { getMoriTheme, HEATMAP_COLORS, baseChartOption } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'
import { useCalcStore } from '../store/calculator.js'
import { useDamageParams } from '../composables/useDamageParams.js'

use([CanvasRenderer, HeatmapChart, TooltipComponent, GridComponent, VisualMapComponent, TitleComponent])

const { t } = useI18n()
const store = useCalcStore()

const chartRef = ref(null)

const availableVariables = computed(() => [
  { key: 'def',        label: t('targetDef'),     rangeMin: 0, rangeMax: 50_000_000, step: 100_000, defaultMin: 0, defaultMax: 20_000_000 },
  { key: 'pmDef',      label: store.damageType === 'phys' ? t('targetPhysDef') : t('targetMagDef'), rangeMin: 0, rangeMax: 50_000_000, step: 100_000, defaultMin: 0, defaultMax: 20_000_000 },
  { key: 'pen',        label: t('pen'),           rangeMin: 0, rangeMax: 150_000,    step: 1_000,   defaultMin: 0, defaultMax: 70_000 },
  { key: 'pmPen',      label: t('pmPen'),         rangeMin: 0, rangeMax: 150_000,    step: 1_000,   defaultMin: 0, defaultMax: 70_000 },
  { key: 'atkLevel',   label: t('atkLevel'),      rangeMin: 1, rangeMax: 999,        step: 1,       defaultMin: 200, defaultMax: 600 },
  { key: 'defLevel',   label: t('defLevel'),      rangeMin: 1, rangeMax: 999,        step: 1,       defaultMin: 200, defaultMax: 600 },
  { key: 'defBonus',   label: t('defBonus'),      rangeMin: -1, rangeMax: 2.5,       step: 0.05,    defaultMin: -0.6, defaultMax: 0, isBonus: true },
  { key: 'pmDefBonus', label: t('pmDefBonus'),    rangeMin: -1, rangeMax: 2.5,       step: 0.05,    defaultMin: -0.6, defaultMax: 0, isBonus: true },
])

const fmt = (v, varObj) => {
  if (varObj?.isBonus) return +(v * 100).toFixed(1) + '%'
  return v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(Math.round(v))
}

const getMetrics = () => ({
  dmgRatePct: { label: t('overallPenRate'), fmt: v=>`${v.toFixed(1)}%`,    unit:'%' },
  finalDmg:   { label: t('finalDmg'),       fmt: v=>fmt(v),                 unit:''  },
  defMitPct:  { label: t('defMitRate'),     fmt: v=>`${v?.toFixed(1)}%`,    unit:'%' },
  pmMitPct:   { label: t('pmMitRate'),      fmt: v=>`${v?.toFixed(1)}%`,    unit:'%' },
})

const hs = reactive({
  metric: 'dmgRatePct',
  xKey: 'def',
  xMin: 0, xMax: 20_000_000, xSteps: 28,
  
  yKey: 'pen',
  yMin: 0, yMax: 70_000, ySteps: 24,
})

const currentXVar = computed(() => availableVariables.value.find(v => v.key === hs.xKey))
const currentYVar = computed(() => availableVariables.value.find(v => v.key === hs.yKey))

const fixedVariables = computed(() => 
  availableVariables.value.filter(v => v.key !== hs.xKey && v.key !== hs.yKey)
)

function onXKeyChange() {
  if (currentXVar.value) {
    hs.xMin = currentXVar.value.defaultMin
    hs.xMax = currentXVar.value.defaultMax
  }
}
function onYKeyChange() {
  if (currentYVar.value) {
    hs.yMin = currentYVar.value.defaultMin
    hs.yMax = currentYVar.value.defaultMax
  }
}

const { setDamageType } = useDamageParams(store)

const chartOption = computed(() => {
  const { data, xLabels, yLabels, zMin, zMax } = buildDynamicHeatmapData({
    xKey: hs.xKey, yKey: hs.yKey, zKey: hs.metric,
    xMin: hs.xMin, xMax: hs.xMax, xSteps: hs.xSteps,
    yMin: hs.yMin, yMax: hs.yMax, ySteps: hs.ySteps,
    baseParams: store.$state,
  })

  const isDark = currentTheme.value === 'dark'
  const MORI_THEME = getMoriTheme(isDark)
  const metricObj = getMetrics()[hs.metric]
  const titleText = `${currentYVar.value?.label} × ${currentXVar.value?.label} - ${metricObj.label}`

  const vMin = hs.metric === 'finalDmg' ? zMin : 0
  const vMax = hs.metric === 'finalDmg' ? zMax : 100

  return {
    ...baseChartOption(titleText, '', isDark),
    title: {
      text: titleText,
      subtext: t('heatmapDesc'),
      textStyle: MORI_THEME.title.textStyle, 
      subtextStyle: MORI_THEME.title.subtextStyle,
      top: 8, left: 14,
    },
    tooltip: { 
      ...MORI_THEME.tooltip, 
      formatter: p => {
        const xVal = xLabels[p.data[0]]
        const yVal = yLabels[p.data[1]]
        const dmg = p.data[2]
        
        const xDisp = currentXVar.value?.isBonus ? xVal + '%' : xVal?.toLocaleString()
        const yDisp = currentYVar.value?.isBonus ? yVal + '%' : yVal?.toLocaleString()

        return `<b style="color:var(--purple-light)">${currentYVar.value?.label}: ${yDisp}</b><br>
                <b style="color:var(--gold)">${currentXVar.value?.label}: ${xDisp}</b><br>
                <b>${metricObj.label}: ${metricObj.fmt(dmg)}</b>`
      }
    },
    grid: { top: 72, right: 110, bottom: 60, left: 88 },
    xAxis: {
      type: 'category', name: currentXVar.value?.label, nameLocation: 'middle', nameGap: 32,
      nameTextStyle: { color: MORI_THEME.axisLabel.color, fontSize: 11 },
      data: xLabels.map(v => fmt(currentXVar.value?.isBonus ? v/100 : v, currentXVar.value)),
      axisLabel: { ...MORI_THEME.axisLabel, rotate: 35 },
      splitArea: { show: true, areaStyle: { color: [isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)','transparent'] }},
    },
    yAxis: {
      type: 'category', name: currentYVar.value?.label, nameLocation: 'middle', nameGap: 52,
      nameTextStyle: { color: MORI_THEME.axisLabel.color, fontSize: 11 },
      data: yLabels.map(v => fmt(currentYVar.value?.isBonus ? v/100 : v, currentYVar.value)),
      axisLabel: MORI_THEME.axisLabel,
      splitArea: { show: true, areaStyle: { color: [isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)','transparent'] }},
    },
    visualMap: {
      type: 'continuous', min: vMin, max: vMax, calculable: true,
      orient: 'vertical', right: 8, top: 'middle',
      text: [hs.metric === 'finalDmg' ? 'MAX' : '100%', hs.metric === 'finalDmg' ? 'MIN' : '0%'], textStyle: { color: MORI_THEME.axisLabel.color, fontSize: 10 },
      inRange: { color: HEATMAP_COLORS.map(c => c[1]) },
    },
    series: [{ 
      name: metricObj.label, 
      type: 'heatmap', 
      data,
      label: { 
        show: hs.xSteps <= 16 && hs.ySteps <= 16, 
        fontSize: 9, 
        color: MORI_THEME.textStyle.color, 
        formatter: p => hs.metric === 'finalDmg' ? fmt(p.data[2]) : `${p.data[2]}` 
      },
      emphasis: { 
        itemStyle: { borderWidth: 2, borderColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', shadowBlur: 8, shadowColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }
      },
    }],
  }
})

function downloadChart() {
  if (chartRef.value) {
    const bg = currentTheme.value === 'dark' ? '#0d0b14' : '#f4f3ee'
    const url = chartRef.value.getDataURL({ type:'png', pixelRatio:2, backgroundColor:bg })
    const a = document.createElement('a')
    a.href = url
    a.download = `mmt-heatmap-${hs.xKey}-${hs.yKey}.png`
    a.click()
  }
}
</script>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
}
</style>
