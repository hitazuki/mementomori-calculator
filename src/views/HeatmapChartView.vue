<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('heatmapTitle') }}</h1>
    <p class="view-desc">{{ $t('heatmapDesc') }}</p>
  </div>
  <div class="grid-sidebar-right animate-fadeup" style="height:calc(100vh - 110px)">
    <div class="card" style="height:100%;display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div class="card-title" style="margin:0">{{ $t('heatmapTitle') }} · %</div>
        <button class="btn btn-ghost btn-sm" @click="downloadChart">⬇ PNG</button>
      </div>
      <div style="flex:1;min-height:480px;position:relative">
        <v-chart ref="chartRef" class="chart" :option="chartOption" autoresize />
      </div>
    </div>

    <div class="flex-col gap-12" style="overflow-y:auto; padding-bottom: 24px;">
      <div class="card">
        <div class="card-title">🛤 {{ $t('hmCalcMode') }}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-sm" :class="hs.mode==='phys'?'btn-primary':'btn-ghost'" style="flex:1" @click="setMode('phys')">DEF</button>
          <button class="btn btn-sm" :class="hs.mode==='mag' ?'btn-primary':'btn-ghost'" style="flex:1" @click="setMode('mag')">P.DEF / M.DEF</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🛡 {{ $t('defRange') }}</div>
        <div class="form-group">
          <label class="form-label">
            {{ $t('minVar', {var: $t('targetDef')}) }} 
            <span class="value-display">{{ fmt(hs.defMin) }}</span>
          </label>
          <input class="form-range" type="range" v-model.number="hs.defMin" min="0" max="5000000" step="100000">
        </div>
        <div class="form-group">
          <label class="form-label">
            {{ $t('maxVar', {var: $t('targetDef')}) }} 
            <span class="value-display">{{ fmt(hs.defMax) }}</span>
          </label>
          <input class="form-range" type="range" v-model.number="hs.defMax" min="1000000" max="100000000" step="1000000">
        </div>
        <div class="form-group">
          <label class="form-label">
            {{ $t('defStep') }} (Count) 
            <span class="value-display">{{ hs.defSteps }}</span>
          </label>
          <input class="form-range" type="range" v-model.number="hs.defSteps" min="5" max="50" step="1">
        </div>
      </div>

      <div class="card">
        <div class="card-title">⚔ {{ $t('penRange') }}</div>
        <div class="form-group">
          <label class="form-label">
            {{ $t('maxVar', {var: $t('pen')}) }} 
            <span class="value-display">{{ fmt(hs.penMax) }}</span>
          </label>
          <input class="form-range" type="range" v-model.number="hs.penMax" min="5000" max="150000" step="1000">
        </div>
        <div class="form-group">
          <label class="form-label">
            {{ $t('penStep') }} (Count) 
            <span class="value-display">{{ hs.penSteps }}</span>
          </label>
          <input class="form-range" type="range" v-model.number="hs.penSteps" min="5" max="40" step="1">
        </div>
      </div>

      <div class="card">
        <div class="card-title">⚙ {{ $t('manualAdjust') }}</div>
        <div class="form-group">
          <label class="form-label" style="display:flex;justify-content:space-between">
            <span>{{ $t('atkLevel') }}</span>
            <span class="text-xs text-muted" v-show="isAtkCustom">{{ $t('ui_custom') || '(Custom)' }}</span>
          </label>
          <input class="form-input" type="number" v-model.number="hs.atkLevel" @input="onAtkLevelChange" min="1" max="999">
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label text-xs text-muted">{{ $t('cPenConst') }} <span class="value-display">{{ hs.cPen }}</span></label>
          <input class="form-input" type="number" v-model.number="hs.cPen" min="1">
        </div>
        
        <div class="divider"></div>
        
        <div class="form-group">
          <label class="form-label" style="display:flex;justify-content:space-between">
            <span>{{ $t('defLevel') || $t('defPresetLabel') }}</span>
            <span class="text-xs text-muted" v-show="isDefCustom">{{ $t('ui_custom') || '(Custom)' }}</span>
          </label>
          <input class="form-input" type="number" v-model.number="hs.defLevel" @input="onDefLevelChange" min="1" max="999">
        </div>
        <div class="form-group">
          <label class="form-label text-xs text-muted">{{ $t('cDefConst') }} <span class="value-display">{{ hs.cDef.toLocaleString() }}</span></label>
          <input class="form-input" type="number" v-model.number="hs.cDef" min="1">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { HeatmapChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, VisualMapComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'

import { buildHeatmapData } from '../engine/damageCalc.js'
import { getCoeffByLevel } from '../constants/levelTable.js'
import { MORI_THEME, HEATMAP_COLORS } from '../utils/chartTheme.js'
import { useCalcStore } from '../store/calculator.js'

use([CanvasRenderer, HeatmapChart, TooltipComponent, GridComponent, VisualMapComponent, TitleComponent])

const { t } = useI18n()
const store = useCalcStore()

const chartRef = ref(null)

const fmt = v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)

const hs = reactive({
  defMin: 0, defMax: 20_000_000, defSteps: 28,
  penMin: 0, penMax: 70000,      penSteps: 24,
  cDef: store.damageType === 'mag' ? store.cPmDef : store.cDef, 
  cPen: store.damageType === 'mag' ? store.cPmPen : store.cPen,
  mode: store.damageType, // 'phys' for DEF vs DEF Break, 'mag' for P.DEF/M.DEF vs PM.DEF Break
  atkLevel: store.atkLevel,
  defLevel: store.defLevel,
})

function setMode(mode) {
  hs.mode = mode
  const pA = getCoeffByLevel(hs.atkLevel)
  if (pA) {
    hs.cPen = mode === 'phys' ? pA.cPen : pA.cPmPen
  }
  const pD = getCoeffByLevel(hs.defLevel)
  if (pD) {
    hs.cDef = mode === 'phys' ? pD.cDef : pD.cPdef
  }
}

function onAtkLevelChange() {
  const pA = getCoeffByLevel(hs.atkLevel)
  if (pA) {
    hs.cPen = hs.mode === 'phys' ? pA.cPen : pA.cPmPen
  }
}

function onDefLevelChange() {
  const pD = getCoeffByLevel(hs.defLevel)
  if (pD) {
    hs.cDef = hs.mode === 'phys' ? pD.cDef : pD.cPdef
  }
}

const isAtkCustom = computed(() => {
  const pA = getCoeffByLevel(hs.atkLevel)
  if(!pA) return true
  return hs.cPen !== (hs.mode === 'phys' ? pA.cPen : pA.cPmPen)
})

const isDefCustom = computed(() => {
  const pD = getCoeffByLevel(hs.defLevel)
  if(!pD) return true
  return hs.cDef !== (hs.mode === 'phys' ? pD.cDef : pD.cPdef)
})

const chartOption = computed(() => {
  const { data, xLabels, yLabels } = buildHeatmapData({
    defMin: hs.defMin, defMax: hs.defMax, defSteps: hs.defSteps,
    penMin: hs.penMin, penMax: hs.penMax, penSteps: hs.penSteps,
    cDef: hs.cDef, cPen: hs.cPen,
  })

  return {
    backgroundColor: 'transparent',
    title: {
      text: t('heatmapTitle') + `（${hs.mode==='phys'?'DEF':'P.DEF/M.DEF'}）`,
      subtext: `C_def=${hs.cDef.toLocaleString()} | C_pen=${hs.cPen}`,
      textStyle: MORI_THEME.title.textStyle, 
      subtextStyle: MORI_THEME.title.subtextStyle,
      top: 8, left: 14,
    },
    tooltip: { 
      ...MORI_THEME.tooltip, 
      formatter: p => {
        const def = xLabels[p.data[0]], pen = yLabels[p.data[1]], dmg = p.data[2]
        return `<b style="color:var(--gold)">${t('targetDef')}: ${def?.toLocaleString()}</b><br>
                <b style="color:var(--purple-light)">${t('pen')}: ${pen?.toLocaleString()}</b><br>
                <b style="color:${dmg>60?'#2ecc71':dmg>30?'#c9a84c':'#e74c3c'}">${t('overallPenRate')}: ${dmg}%</b>`
      }
    },
    grid: { top: 72, right: 110, bottom: 60, left: 88 },
    xAxis: {
      type: 'category', name: t('yAxisDef'), nameLocation: 'middle', nameGap: 32,
      nameTextStyle: { color: 'rgba(240,230,200,0.5)', fontSize: 11 },
      data: xLabels.map(fmt),
      axisLabel: { ...MORI_THEME.axisLabel, rotate: 35 },
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.01)','transparent'] }},
    },
    yAxis: {
      type: 'category', name: t('xAxisPen'), nameLocation: 'middle', nameGap: 52,
      nameTextStyle: { color: 'rgba(240,230,200,0.5)', fontSize: 11 },
      data: yLabels.map(fmt),
      axisLabel: MORI_THEME.axisLabel,
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.01)','transparent'] }},
    },
    visualMap: {
      type: 'continuous', min: 0, max: 100, calculable: true,
      orient: 'vertical', right: 8, top: 'middle',
      text: ['MAX', 'MIN'], textStyle: { color: 'rgba(240,230,200,0.5)', fontSize: 10 },
      inRange: { color: HEATMAP_COLORS.map(c => c[1]) },
    },
    series: [{ 
      name: t('overallPenRate'), 
      type: 'heatmap', 
      data,
      label: { 
        show: hs.defSteps <= 16 && hs.penSteps <= 16, 
        fontSize: 9, 
        color: '#ffffff99', 
        formatter: p => `${p.data[2]}` 
      },
      emphasis: { 
        itemStyle: { borderWidth: 2, borderColor: '#ffffff80', shadowBlur: 8, shadowColor: 'rgba(255,255,255,0.3)' }
      },
    }],
  }
})

function downloadChart() {
  if (chartRef.value) {
    const url = chartRef.value.getDataURL({ type:'png', pixelRatio:2, backgroundColor:'#0d0b14' })
    const a = document.createElement('a')
    a.href = url
    a.download = `mmt-heatmap-cdef${hs.cDef}.png`
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
