<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('sweepTitle') }}</h1>
    <p class="view-desc">{{ $t('sweepDesc') }}</p>
  </div>
  <div class="grid-sidebar-right animate-fadeup" style="height:calc(100vh - 110px)">
    <div class="card" style="height:100%;display:flex;flex-direction:column">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <select class="form-select" v-model="ss.metric" style="width:160px;margin:0">
          <option v-for="(v, k) in getMetrics()" :key="k" :value="k">{{ v.label }}</option>
        </select>
        <button class="btn btn-ghost btn-sm" @click="downloadChart">⬇ PNG</button>
      </div>
      <div style="flex:1;min-height:400px;position:relative">
        <v-chart ref="chartRef" class="chart" :option="chartOption" autoresize />
      </div>
    </div>
    
    <div class="flex-col gap-12" style="overflow-y:auto; padding-bottom: 24px;">
      <div class="card">
        <div class="card-title">🔍 {{ $t('scanRange') }}</div>
        <div class="form-group">
          <label class="form-label">{{ $t('scanRange') }}</label>
          <select class="form-select" v-model="ss.sweepKey" @change="onSweepKeyChange">
            <option v-for="v in SWEEP_VARIABLES" :key="v.key" :value="v.key">{{ v.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">
            <span>{{ $t('minVar', {var: currentSweepVarLabel}) }}</span> 
            <span class="value-display">{{ fmt(ss.min, currentSweepVar.value?.isBonus) }}</span>
          </label>
          <input class="form-input" type="number" v-model.number="ss.min" :step="currentSweepVar.value?.isBonus ? 0.05 : 100">
        </div>
        <div class="form-group">
          <label class="form-label">
            <span>{{ $t('maxVar', {var: currentSweepVarLabel}) }}</span> 
            <span class="value-display">{{ fmt(ss.max, currentSweepVar.value?.isBonus) }}</span>
          </label>
          <input class="form-input" type="number" v-model.number="ss.max" :step="currentSweepVar.value?.isBonus ? 0.05 : 100">
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('stepSpan') }} <span class="value-display">{{ ss.steps }}</span></label>
          <input class="form-range" type="range" v-model.number="ss.steps" min="5" max="100">
        </div>
      </div>

      <div class="card">
        <div class="card-title">⚙ {{ $t('manualAdjust') }}</div>
        <div class="form-group">
          <label class="form-label">{{ $t('atkType') }}</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-sm" :class="ss.baseParams.damageType==='phys'?'btn-primary':'btn-ghost'" style="flex:1; font-size:11px; padding:6px 2px; letter-spacing:-0.5px;" @click="setDamageType('phys')">{{ $t('typePhys') }}</button>
            <button class="btn btn-sm" :class="ss.baseParams.damageType==='mag' ?'btn-primary':'btn-ghost'" style="flex:1; font-size:11px; padding:6px 2px; letter-spacing:-0.5px;" @click="setDamageType('mag')">{{ $t('typeMag') }}</button>
          </div>
        </div>
        <div class="form-group" v-show="ss.sweepKey !== 'atkLevel'">
          <label class="form-label" style="display:flex;justify-content:space-between;align-items:center;">
            <span>{{ $t('atkLevel') }}</span>
            <div style="display:flex;align-items:center;gap:4px">
              <span class="text-xs text-muted" v-show="isAtkCustom">{{ $t('ui_custom') || '(Custom)' }}</span>
              <input class="form-input" type="number" v-model.number="ss.atkLevel" @input="onAtkLevelChange" min="1" max="999" style="width: 80px; padding: 2px 4px; font-size: 12px; height: 24px; text-align:right;">
            </div>
          </label>
          <input class="form-range" type="range" v-model.number="ss.atkLevel" @input="onAtkLevelChange" min="1" max="999" step="1">
        </div>

        <div class="form-group" v-show="ss.sweepKey !== 'defLevel'">
          <label class="form-label" style="display:flex;justify-content:space-between;align-items:center;">
            <span>{{ $t('defLevel') || $t('defPresetLabel') }}</span>
            <div style="display:flex;align-items:center;gap:4px">
              <span class="text-xs text-muted" v-show="isDefCustom">{{ $t('ui_custom') || '(Custom)' }}</span>
              <input class="form-input" type="number" v-model.number="ss.defLevel" @input="onDefLevelChange" min="1" max="999" style="width: 80px; padding: 2px 4px; font-size: 12px; height: 24px; text-align:right;">
            </div>
          </label>
          <input class="form-range" type="range" v-model.number="ss.defLevel" @input="onDefLevelChange" min="1" max="999" step="1">
        </div>

        
        <div class="form-group" v-show="ss.sweepKey !== 'def'">
          <label class="form-label" style="display:flex;justify-content:space-between;align-items:center;">
            <span>{{ $t('targetDef') }}</span>
            <BigNumberInput class="form-input" v-model="ss.baseParams.def" style="width: 80px; padding: 2px 4px; font-size: 12px; height: 24px; text-align:right;" />
          </label>
          <input class="form-range" type="range" v-model.number="ss.baseParams.def" min="0" max="20000000" step="10000">
        </div>
        <div class="form-group" v-show="ss.sweepKey !== 'pmDef'">
          <label class="form-label" style="display:flex;justify-content:space-between;align-items:center;">
            <span>{{ ss.baseParams.damageType==='phys' ? $t('targetPhysDef') : $t('targetMagDef') }}</span>
            <BigNumberInput class="form-input" v-model="ss.baseParams.pmDef" style="width: 80px; padding: 2px 4px; font-size: 12px; height: 24px; text-align:right;" />
          </label>
          <input class="form-range" type="range" v-model.number="ss.baseParams.pmDef" min="0" max="20000000" step="10000">
        </div>
        <div class="form-group" v-show="ss.sweepKey !== 'pen'">
          <label class="form-label" style="display:flex;justify-content:space-between;align-items:center;">
            <span>{{ $t('pen') }}</span>
            <BigNumberInput class="form-input" v-model="ss.baseParams.pen" style="width: 80px; padding: 2px 4px; font-size: 12px; height: 24px; text-align:right;" />
          </label>
          <input class="form-range" type="range" v-model.number="ss.baseParams.pen" min="0" max="30000" step="100">
        </div>
        <div class="form-group" v-show="ss.sweepKey !== 'pmPen'">
          <label class="form-label" style="display:flex;justify-content:space-between;align-items:center;">
            <span>{{ $t('pmPen') }}</span>
            <BigNumberInput class="form-input" v-model="ss.baseParams.pmPen" style="width: 80px; padding: 2px 4px; font-size: 12px; height: 24px; text-align:right;" />
          </label>
          <input class="form-range" type="range" v-model.number="ss.baseParams.pmPen" min="0" max="80000" step="100">
        </div>
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
import { LineChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, GraphicComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import VChart from 'vue-echarts'

import { buildSweepData } from '../engine/damageCalc.js'
import { getSweepVariables } from '../constants/presets.js'
import { getCoeffByLevel } from '../constants/levelTable.js'
import { getMoriTheme, LINE_COLORS, baseChartOption } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'
import { useCalcStore } from '../store/calculator.js'

use([CanvasRenderer, LineChart, TooltipComponent, GridComponent, GraphicComponent])

const { t } = useI18n()
const store = useCalcStore()

const chartRef = ref(null)
const SWEEP_VARIABLES = computed(() => getSweepVariables(t))
const currentSweepVar = computed(() => SWEEP_VARIABLES.value.find(v=>v.key===ss.sweepKey))

const fmt = (v, isBonus) => {
  if (isBonus) return +(v * 100).toFixed(1) + '%'
  return v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(Math.round(v))
}

const getMetrics = () => ({
  dmgRatePct: { label: t('overallPenRate'), fmt: v=>`${v.toFixed(1)}%`,    unit:'%' },
  finalDmg:   { label: t('finalDmg'),       fmt: v=>fmt(v),                 unit:''  },
  defMitPct:  { label: t('defMitRate'),     fmt: v=>`${v?.toFixed(1)}%`,    unit:'%' },
  pmMitPct:   { label: t('pmMitRate'),      fmt: v=>`${v?.toFixed(1)}%`,    unit:'%' },
})

// Local reactive state initialized from Pinia store
const ss = reactive({
  sweepKey: 'pen',
  metric: 'dmgRatePct',
  min: 0, max: 20000, steps: 21,
  baseParams: { ...store.$state },
  atkLevel: store.atkLevel,
  defLevel: store.defLevel,
})

const currentSweepVarLabel = computed(() => SWEEP_VARIABLES.value.find(v=>v.key===ss.sweepKey)?.label || ss.sweepKey)

function onSweepKeyChange() {
  const preset = SWEEP_VARIABLES.value.find(v => v.key === ss.sweepKey)
  if (preset) {
    ss.min = preset.min
    ss.max = preset.max
  }
}

function setDamageType(type) {
  const custom = isDefCustom.value
  ss.baseParams.damageType = type
  const p = getCoeffByLevel(ss.defLevel)
  if (p && !custom) {
    ss.baseParams.cPmDef = type === 'mag' ? p.cMdef : p.cPdef
  }
}

function onAtkLevelChange() {
  const p = getCoeffByLevel(ss.atkLevel)
  if (p) {
    ss.baseParams.cPen = p.cPen
    ss.baseParams.cPmPen = p.cPmPen
  }
}

function onDefLevelChange() {
  const p = getCoeffByLevel(ss.defLevel)
  if (p) {
    ss.baseParams.cDef = p.cDef
    ss.baseParams.cPmDef = ss.baseParams.damageType === 'mag' ? p.cMdef : p.cPdef
  }
}

const isAtkCustom = computed(() => {
  const pA = getCoeffByLevel(ss.atkLevel)
  return ss.baseParams.cPen !== pA.cPen || ss.baseParams.cPmPen !== pA.cPmPen
})

const isDefCustom = computed(() => {
  const pD = getCoeffByLevel(ss.defLevel)
  return ss.baseParams.cDef !== pD.cDef || ss.baseParams.cPmDef !== (ss.baseParams.damageType === 'mag' ? pD.cMdef : pD.cPdef)
})

const chartOption = computed(() => {
  const { xData, yData } = buildSweepData(ss)
  const varLabel = currentSweepVarLabel.value
  const metric = getMetrics()[ss.metric]

  const seriesData = yData.map(r => r[ss.metric])
  const yAxisMax = ss.metric === 'finalDmg' ? null : 100
  const isDark = currentTheme.value === 'dark'
  const MORI_THEME = getMoriTheme(isDark)

  return {
    ...baseChartOption(varLabel, isDark),
    tooltip: { 
      ...MORI_THEME.tooltip, 
      trigger: 'axis', 
      formatter: p => {
        let s = `<b style="color:var(--gold)">${varLabel}: ${currentSweepVar.value?.isBonus ? p[0].axisValue : fmt(p[0].axisValue)}</b><br>`
        p.forEach(pp => s += `<span style="color:${pp.color}">● ${pp.seriesName}</span>: <b>${metric.fmt(pp.value)}</b><br>`)
        return s
      }
    },
    xAxis: { 
      type: 'category', 
      data: xData.map(v=>currentSweepVar.value?.isBonus ? v + '%' : fmt(v)), 
      axisLabel: MORI_THEME.axisLabel, 
      axisLine: MORI_THEME.axisLine, 
      splitLine:{show:true,lineStyle:{color:isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}} 
    },
    yAxis: { 
      type: 'value', 
      min: ss.metric === 'finalDmg' ? null : 'dataMin', 
      max: yAxisMax, 
      axisLabel: { ...MORI_THEME.axisLabel, formatter: `{value}${metric.unit}` }, 
      splitLine: MORI_THEME.splitLine 
    },
    series: [
      { 
        name: metric.label, 
        type: 'line', 
        smooth: true, 
        symbol: 'circle', 
        symbolSize: 6,
        itemStyle: { color: LINE_COLORS[0] }, 
        lineStyle: { width: 3, shadowBlur: 8, shadowColor: LINE_COLORS[0]+'80' },
        areaStyle: { 
          color: new echarts.graphic.LinearGradient(0,0,0,1, [
            {offset:0,color:LINE_COLORS[0]+'66'},
            {offset:1,color:LINE_COLORS[0]+'00'}
          ]) 
        },
        data: seriesData
      }
    ]
  }
})

function downloadChart() {
  if (chartRef.value) {
    const url = chartRef.value.getDataURL({type:'png',pixelRatio:2,backgroundColor:'#0d0b14'})
    const a = document.createElement('a')
    a.href = url
    a.download = `mmt-sweep-${ss.sweepKey}.png`
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
