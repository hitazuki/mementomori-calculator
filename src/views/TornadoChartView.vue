<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('tornadoTitle') || '🌪 边际收益分析' }}</h1>
    <p class="view-desc">{{ $t('tornadoDesc') || '横向对比各项属性增量（或减量）对最终伤害产生的百分比影响，寻找性价比最高的升级方案。' }}</p>
  </div>
  
  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <div class="flex-col gap-12">
      <!-- Base Params (Shared from Store) -->
      <div class="card">
        <div class="card-title">{{ $t('baseState') }}</div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">{{ $t('baseAtk') }}</label>
            <BigNumberInput class="form-input" v-model="store.baseAtk" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('skillCoeff') }}</label>
            <input class="form-input" type="number" v-model.number="store.skillCoeff" min="0" step="0.1">
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('critMult') }}</label>
            <input class="form-input" type="number" v-model.number="store.critMult" min="1" step="0.1">
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('pen') }}</label>
            <BigNumberInput class="form-input" v-model="store.pen" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('pmPen') }}</label>
            <BigNumberInput class="form-input" v-model="store.pmPen" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('targetDef') }}</label>
            <BigNumberInput class="form-input" v-model="store.def" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ store.damageType==='phys' ? $t('targetPhysDef') : $t('targetMagDef') }}</label>
            <BigNumberInput class="form-input" v-model="store.pmDef" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('atkLevel') }}</label>
            <input class="form-input" type="number" v-model.number="store.atkLevel" @input="onAtkLevelChange" min="1" max="999">
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('defLevel') }}</label>
            <input class="form-input" type="number" v-model.number="store.defLevel" @input="onDefLevelChange" min="1" max="999">
          </div>
        </div>
      </div>

      <!-- Delta Increments (Available for both charts) -->
      <div class="card">
        <div class="card-title">{{ $t('upgradesToTest') }}</div>
        <div class="flex-col gap-8">
          <div class="form-group">
            <label class="form-label">{{ $t('baseAtk') }} {{ $t('increment') }}</label>
            <BigNumberInput class="form-input" v-model="deltas.baseAtk" />
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">{{ $t('pen') }} {{ $t('increment') }}</label>
              <BigNumberInput class="form-input" v-model="deltas.pen" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ $t('pmPen') }} {{ $t('increment') }}</label>
              <BigNumberInput class="form-input" v-model="deltas.pmPen" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between">
              <span>{{ $t('atkBonus') }} {{ $t('increment') }}</span>
              <div style="display:flex;align-items:center;gap:1px">
                <span class="value-display" :class="deltas.atkBonus >= 0 ? 'text-success' : 'text-danger'" v-show="deltas.atkBonus > 0">+</span>
                <input class="inline-num" type="number" step="0.5" :class="deltas.atkBonus >= 0 ? 'text-success' : 'text-danger'" :value="+(deltas.atkBonus*100).toFixed(1)" @change="e => deltas.atkBonus = parseFloat(e.target.value)/100||0">
                <span class="value-display" :class="deltas.atkBonus >= 0 ? 'text-success' : 'text-danger'">%</span>
              </div>
            </label>
            <input class="form-range" type="range" v-model.number="deltas.atkBonus" min="-1" max="2.5" step="0.05">
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between">
              <span>{{ $t('dmgBonus') }} {{ $t('increment') }}</span>
              <div style="display:flex;align-items:center;gap:1px">
                <span class="value-display" :class="deltas.dmgBonus >= 0 ? 'text-success' : 'text-danger'" v-show="deltas.dmgBonus > 0">+</span>
                <input class="inline-num" type="number" step="0.5" :class="deltas.dmgBonus >= 0 ? 'text-success' : 'text-danger'" :value="+(deltas.dmgBonus*100).toFixed(1)" @change="e => deltas.dmgBonus = parseFloat(e.target.value)/100||0">
                <span class="value-display" :class="deltas.dmgBonus >= 0 ? 'text-success' : 'text-danger'">%</span>
              </div>
            </label>
            <input class="form-range" type="range" v-model.number="deltas.dmgBonus" min="-1" max="2.5" step="0.05">
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between">
              <span>{{ $t('critMult') }} {{ $t('increment') }}</span>
              <div style="display:flex;align-items:center;gap:1px">
                <span class="value-display" :class="deltas.critMult >= 0 ? 'text-success' : 'text-danger'" v-show="deltas.critMult > 0">+</span>
                <input class="inline-num" type="number" step="0.5" :class="deltas.critMult >= 0 ? 'text-success' : 'text-danger'" :value="+(deltas.critMult*100).toFixed(1)" @change="e => deltas.critMult = parseFloat(e.target.value)/100||0">
                <span class="value-display" :class="deltas.critMult >= 0 ? 'text-success' : 'text-danger'">%</span>
              </div>
            </label>
            <input class="form-range" type="range" v-model.number="deltas.critMult" min="-0.5" max="3" step="0.05">
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between">
              <span>{{ $t('defBonus') }} {{ $t('increment') }}</span>
              <div style="display:flex;align-items:center;gap:1px">
                <span class="value-display" :class="deltas.defBonus < 0 ? 'text-success' : 'text-danger'" v-show="deltas.defBonus > 0">+</span>
                <input class="inline-num" type="number" step="0.5" :class="deltas.defBonus < 0 ? 'text-success' : 'text-danger'" :value="+(deltas.defBonus*100).toFixed(1)" @change="e => deltas.defBonus = parseFloat(e.target.value)/100||0">
                <span class="value-display" :class="deltas.defBonus < 0 ? 'text-success' : 'text-danger'">%</span>
              </div>
            </label>
            <input class="form-range" type="range" v-model.number="deltas.defBonus" min="-1" max="2.5" step="0.05">
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between">
              <span>{{ $t('pmDefBonus') }} {{ $t('increment') }}</span>
              <div style="display:flex;align-items:center;gap:1px">
                <span class="value-display" :class="deltas.pmDefBonus < 0 ? 'text-success' : 'text-danger'" v-show="deltas.pmDefBonus > 0">+</span>
                <input class="inline-num" type="number" step="0.5" :class="deltas.pmDefBonus < 0 ? 'text-success' : 'text-danger'" :value="+(deltas.pmDefBonus*100).toFixed(1)" @change="e => deltas.pmDefBonus = parseFloat(e.target.value)/100||0">
                <span class="value-display" :class="deltas.pmDefBonus < 0 ? 'text-success' : 'text-danger'">%</span>
              </div>
            </label>
            <input class="form-range" type="range" v-model.number="deltas.pmDefBonus" min="-1" max="2.5" step="0.05">
          </div>
        </div>
      </div>
    </div>

    <!-- Main Right Content -->
    <div class="flex-col gap-12" style="position: sticky; top: 24px; z-index: 10;">
      <!-- Tabs & Actions -->
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:12px 24px">
        <div class="chart-tabs">
          <button class="tab-btn" :class="{active: activeTab==='tornado'}" @click="activeTab='tornado'">{{ $t('tabTornado') || '🌪 龙卷风图 (Tornado)' }}</button>
          <button class="tab-btn" :class="{active: activeTab==='waterfall'}" @click="activeTab='waterfall'">{{ $t('tabWaterfall') || '🌊 瀑布图 (Waterfall)' }}</button>
        </div>
        <div style="display:flex;align-items:center;gap:16px">
          <div style="font-size:14px">
            {{ $t('baseDmgDisplay') }} <b style="color:var(--gold);font-size:18px">{{ fmt(baseResult.finalDmg) }}</b>
            <span style="color:var(--text-muted);margin-left:8px">{{ $t('basePassRateDisplay') }} {{ baseResult.dmgRatePct.toFixed(1) }}%</span>
          </div>
          <button class="btn btn-ghost btn-sm" @click="downloadChart">⬇ PNG</button>
        </div>
      </div>

      <!-- Instructions for Tornado -->
      <div class="card animate-fadeup" v-show="activeTab === 'tornado'" style="padding:16px 24px; border-left:4px solid #3498db; background:rgba(52,152,219,0.05)">
        <div style="font-size:14px; font-weight:bold; color:#3498db; margin-bottom:6px">{{ $t('tornadoInstTitle') }}</div>
        <p style="font-size:13px; color:var(--text-muted); margin:0; line-height:1.5" v-html="$t('tornadoInstDesc')"></p>
      </div>

      <!-- Instructions for Waterfall -->
      <div class="card animate-fadeup" v-show="activeTab === 'waterfall'" style="padding:16px 24px; border-left:4px solid #2ecc71; background:rgba(46,204,113,0.05)">
        <div style="font-size:14px; font-weight:bold; color:#2ecc71; margin-bottom:6px">{{ $t('waterfallInstTitle') }}</div>
        <p style="font-size:13px; color:var(--text-muted); margin:0; line-height:1.5" v-html="$t('waterfallInstDesc')"></p>
      </div>

      <div class="card" style="height:500px;position:relative">
        <v-chart ref="chartRef" class="chart" :option="chartOption" :update-options="{ notMerge: true }" autoresize />
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
import { BarChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, GraphicComponent, TitleComponent, LegendComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import VChart from 'vue-echarts'

import { calcDamage } from '../engine/damageCalc.js'
import { getCoeffByLevel } from '../constants/levelTable.js'
import { getMoriTheme, baseChartOption } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'
import { useCalcStore } from '../store/calculator.js'

use([CanvasRenderer, BarChart, TooltipComponent, GridComponent, GraphicComponent, TitleComponent, LegendComponent])

const { t } = useI18n()
const store = useCalcStore()
const chartRef = ref(null)

const activeTab = ref('tornado') // 'tornado' | 'waterfall'

const fmt = v => v >= 1e6 ? `${(v/1e6).toFixed(2)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(Math.round(v))

const deltas = reactive({
  baseAtk: 1000000,
  pen: 4000,
  pmPen: 6000,
  atkBonus: 0.1,
  dmgBonus: 0.1,
  critMult: 0.5,
  defBonus: -0.2,
  pmDefBonus: -0.2,
})

function onAtkLevelChange() {
  const p = getCoeffByLevel(store.atkLevel)
  if (p) {
    store.cPen = p.cPen
    store.cPmPen = p.cPmPen
  }
}

function onDefLevelChange() {
  const p = getCoeffByLevel(store.defLevel)
  if (p) {
    store.cDef = p.cDef
    store.cPmDef = store.damageType === 'mag' ? p.cMdef : p.cPdef
  }
}

const baseResult = computed(() => calcDamage({ ...store.$state }))

// --- Tornado Chart Logic ---
const tornadoResults = computed(() => {
  const baseParams = store.$state
  const bd = baseResult.value.finalDmg
  if (bd <= 0) return []

  const scenarios = [
    { key: 'baseAtk', label: `${t('baseAtk')} +${fmt(deltas.baseAtk)}`, params: { ...baseParams, baseAtk: baseParams.baseAtk + deltas.baseAtk } },
    { key: 'atkBonus', label: `${t('atkBonus')} ${(deltas.atkBonus>0?'+':'')}${+(deltas.atkBonus*100).toFixed(1)}%`, params: { ...baseParams, atkBonus: baseParams.atkBonus + deltas.atkBonus } },
    { key: 'dmgBonus', label: `${t('dmgBonus')} ${(deltas.dmgBonus>0?'+':'')}${+(deltas.dmgBonus*100).toFixed(1)}%`, params: { ...baseParams, dmgBonus: baseParams.dmgBonus + deltas.dmgBonus } },
    { key: 'critMult', label: `${t('critMult')} +${+(deltas.critMult*100).toFixed(0)}%`, params: { ...baseParams, critMult: baseParams.critMult + deltas.critMult } },
    { key: 'pen', label: `${t('pen')} +${fmt(deltas.pen)}`, params: { ...baseParams, pen: baseParams.pen + deltas.pen } },
    { key: 'pmPen', label: `${t('pmPen')} +${fmt(deltas.pmPen)}`, params: { ...baseParams, pmPen: baseParams.pmPen + deltas.pmPen } },
    { key: 'defBonus', label: `${t('defBonus')} ${(deltas.defBonus>0?'+':'')}${+(deltas.defBonus*100).toFixed(1)}%`, params: { ...baseParams, defBonus: baseParams.defBonus + deltas.defBonus } },
    { key: 'pmDefBonus', label: `${t('pmDefBonus')} ${(deltas.pmDefBonus>0?'+':'')}${+(deltas.pmDefBonus*100).toFixed(1)}%`, params: { ...baseParams, pmDefBonus: baseParams.pmDefBonus + deltas.pmDefBonus } },
  ]

  return scenarios.map(s => {
    const res = calcDamage(s.params)
    const pct = (res.finalDmg - bd) / bd * 100
    return { ...s, newDmg: res.finalDmg, pct }
  }).sort((a, b) => a.pct - b.pct)
})

// --- Waterfall Chart Logic ---
const waterfallData = computed(() => {
  const params = {
    ...store.$state,
    baseAtk: store.baseAtk + deltas.baseAtk,
    atkBonus: store.atkBonus + deltas.atkBonus,
    dmgBonus: store.dmgBonus + deltas.dmgBonus,
    critMult: store.critMult + deltas.critMult,
    pen: store.pen + deltas.pen,
    pmPen: store.pmPen + deltas.pmPen,
    defBonus: store.defBonus + deltas.defBonus,
    pmDefBonus: store.pmDefBonus + deltas.pmDefBonus
  }
  const res = calcDamage(params)
  
  const rawDmg = Math.round(params.baseAtk * params.skillCoeff)
  const atkBonusGain = Math.round(rawDmg * params.atkBonus)
  const rawWithAtk = rawDmg + atkBonusGain
  
  const actDmgBonus = params.dmgBonus + (params.eleAdvantage ? 0.25 : 0)
  const dmgBonusGain = Math.round(rawWithAtk * actDmgBonus)
  const rawWithDmg = rawWithAtk + dmgBonusGain
  
  const critGain = Math.round(rawWithDmg * (params.critMult - 1))
  const preDefDmg = rawWithDmg + critGain
  
  const defLoss = Math.round(preDefDmg * (1 - res.drDef))
  const prePmDmg = preDefDmg - defLoss
  const pmLoss = Math.round(prePmDmg * (1 - res.drPm))
  
  const finalDmg = res.finalDmg

  const categories = [t('wfCatBase'), t('wfCatAtkBonus'), t('wfCatDmgBonus'), t('wfCatCrit'), t('wfCatDefMit'), t('wfCatPmDefMit'), t('wfCatFinal')]
  
  const placeholder = [0, rawDmg, rawWithAtk, rawWithDmg, preDefDmg - defLoss, finalDmg, 0]
  const positive = [rawDmg, atkBonusGain, dmgBonusGain, critGain, '-', '-', finalDmg]
  const negative = ['-', '-', '-', '-', defLoss, pmLoss, '-']

  return { categories, placeholder, positive, negative }
})

// --- Option Switcher ---
const chartOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const MORI_THEME = getMoriTheme(isDark)

  if (activeTab.value === 'tornado') {
    const yData = tornadoResults.value.map(r => r.label)
    const xData = tornadoResults.value.map(r => r.pct)
    return {
      ...baseChartOption('', '', isDark),
      tooltip: {
        ...MORI_THEME.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: p => {
          const item = tornadoResults.value[p[0].dataIndex]
          const color = item.pct >= 0 ? '#2ecc71' : '#e74c3c'
          return `<b style="color:var(--gold)">${item.label}</b><br/>${t('tooltipFinalDmg')} <b>${fmt(item.newDmg)}</b><br/>${t('tooltipIncrease')} <b style="color:${color}">${item.pct > 0 ? '+' : ''}${item.pct.toFixed(2)}%</b>`
        }
      },
      grid: { left: 180, right: 60, top: 20, bottom: 40 },
      xAxis: { type: 'value', axisLabel: { ...MORI_THEME.axisLabel, formatter: '{value}%' }, splitLine: MORI_THEME.splitLine, axisLine: MORI_THEME.axisLine },
      yAxis: { type: 'category', data: yData, axisLabel: { ...MORI_THEME.axisLabel, width: 160, overflow: 'break' }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{
        type: 'bar',
        data: xData.map(v => ({ value: v, label: { position: v >= 0 ? 'right' : 'left' } })),
        barMaxWidth: 32,
        itemStyle: {
          borderRadius: 4,
          color: p => {
            if (p.value < 0) return '#e74c3c'
            const isMax = p.value === Math.max(...xData)
            return isMax ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#c9a84c' }, { offset: 1, color: '#f1c40f' }]) 
                         : new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#2980b9' }, { offset: 1, color: '#3498db' }])
          }
        },
        label: {
          show: true, formatter: p => `${p.value > 0 ? '+' : ''}${p.value.toFixed(1)}%`,
          color: '#ffffff', textBorderColor: '#000000', textBorderWidth: 2, fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 'bold'
        }
      }]
    }
  } else {
    // Waterfall
    const { categories, placeholder, positive, negative } = waterfallData.value
    return {
      ...baseChartOption('', '', isDark),
      tooltip: {
        ...MORI_THEME.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: p => {
          let str = `<b style="color:var(--gold)">${p[0].name}</b><br/>`
          p.forEach(s => {
            if (s.seriesName !== 'Placeholder' && s.value !== '-') {
              const sign = s.seriesName === 'Loss' ? '-' : (s.name===t('wfCatBase')||s.name===t('wfCatFinal')) ? '' : '+'
              str += `${s.marker} ${s.seriesName}: <b>${sign}${fmt(s.value)}</b><br/>`
            }
          })
          return str
        }
      },
      legend: { ...MORI_THEME.legend, data: ['Gain', 'Loss'] },
      grid: { left: 80, right: 40, top: 60, bottom: 60 },
      xAxis: { type: 'category', data: categories, axisLabel: { ...MORI_THEME.axisLabel, interval: 0, width: 80, overflow: 'break' }, axisTick: { show: false } },
      yAxis: { type: 'value', axisLabel: { ...MORI_THEME.axisLabel, formatter: v => fmt(v) }, splitLine: MORI_THEME.splitLine },
      series: [
        { name: 'Placeholder', type: 'bar', stack: 'Total', itemStyle: { borderColor: 'transparent', color: 'transparent' }, emphasis: { itemStyle: { borderColor: 'transparent', color: 'transparent' } }, label: { show: false }, data: placeholder },
        { 
          name: 'Gain', type: 'bar', stack: 'Total', barMaxWidth: 40, 
          itemStyle: { color: p => (p.name === t('wfCatBase') || p.name === t('wfCatFinal')) ? '#c9a84c' : '#2ecc71', borderRadius: 2 },
          label: { show: true, position: 'top', formatter: p => p.value !== '-' ? fmt(p.value) : '', color: '#fff', textBorderColor: '#000', textBorderWidth: 2, fontSize: 10, fontFamily: 'JetBrains Mono' },
          data: positive 
        },
        { 
          name: 'Loss', type: 'bar', stack: 'Total', barMaxWidth: 40, 
          itemStyle: { color: '#e74c3c', borderRadius: 2 },
          label: { show: true, position: 'bottom', formatter: p => p.value !== '-' ? `-${fmt(p.value)}` : '', color: '#fff', textBorderColor: '#000', textBorderWidth: 2, fontSize: 10, fontFamily: 'JetBrains Mono' },
          data: negative 
        }
      ]
    }
  }
})

function downloadChart() {
  if (chartRef.value) {
    const url = chartRef.value.getDataURL({type:'png',pixelRatio:2,backgroundColor:'#0d0b14'})
    const a = document.createElement('a')
    a.href = url
    a.download = `mmt-${activeTab.value}.png`
    a.click()
  }
}
</script>

<style scoped>
.chart { width: 100%; height: 100%; }
.chart-tabs { display: flex; gap: 8px; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 8px; border: 1px solid var(--border-subtle); }
.tab-btn { background: transparent; border: none; color: var(--text-muted); padding: 6px 16px; border-radius: 6px; cursor: pointer; transition: 0.2s; font-size: 14px; font-weight: 500; }
.tab-btn:hover { background: rgba(255,255,255,0.05); color: var(--text-base); }
.tab-btn.active { background: rgba(201,168,76,0.15); color: var(--gold); border-bottom: 2px solid var(--gold); border-radius: 6px 6px 0 0; }
.grid-2 .form-group { display: flex; flex-direction: column; justify-content: space-between; height: 100%; }
</style>
