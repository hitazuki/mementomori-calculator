<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('tornadoTitle') }}</h1>
    <p class="view-desc">{{ $t('tornadoDesc') }}</p>
  </div>
  
  <div class="grid-sidebar chart-page-shell animate-fadeup" style="align-items:start;gap:16px">
    <div class="flex-col gap-12 chart-control-panel">
      <!-- Base Params (Shared from Store) -->
      <div class="card">
        <details :open="isBaseOpen" @toggle="e => isBaseOpen = e.target.open" style="outline: none;">
          <summary class="card-title" style="cursor: pointer; user-select: none; outline: none; margin-bottom: 0; display: flex; align-items: center; gap: 8px; width: 100%;">
            ⚙️ {{ $t('basePanelStats') }}
            <span style="margin-left: auto; font-size: var(--fs-xs); color: var(--gold); transition: transform 0.2s;" :style="{ transform: isBaseOpen ? 'rotate(180deg)' : 'rotate(0deg)' }">▼</span>
          </summary>
          <div class="grid-2" style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--border-subtle);">
            <div class="form-group">
              <label class="form-label">{{ $t('atkType') }}</label>
              <div class="segmented-control">
                <button class="btn btn-sm" :class="store.damageType === 'phys' ? 'btn-primary' : 'btn-ghost'" @click="setDamageType('phys')">{{ $t('typePhys') }}</button>
                <button class="btn btn-sm" :class="store.damageType === 'mag' ? 'btn-primary' : 'btn-ghost'" @click="setDamageType('mag')">{{ $t('typeMag') }}</button>
              </div>
            </div>
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
            <div class="form-group">
              <label class="form-label" style="display:flex;justify-content:space-between">
                <span>{{ $t('atkBonus') }}</span>
                <span class="value-display">{{ +(store.atkBonus*100).toFixed(0) }}%</span>
              </label>
              <input class="form-range" type="range" v-model.number="store.atkBonus" min="-1" max="2.5" step="0.05">
            </div>
            <div class="form-group">
              <label class="form-label" style="display:flex;justify-content:space-between">
                <span>{{ $t('dmgBonus') }}</span>
                <span class="value-display">{{ +(store.dmgBonus*100).toFixed(0) }}%</span>
              </label>
              <input class="form-range" type="range" v-model.number="store.dmgBonus" min="-1" max="2" step="0.05">
            </div>
            <div class="form-group">
              <label class="form-label" style="display:flex;justify-content:space-between">
                <span>{{ $t('defBonus') }}</span>
                <span class="value-display">{{ +(store.defBonus*100).toFixed(0) }}%</span>
              </label>
              <input class="form-range" type="range" v-model.number="store.defBonus" min="-1" max="2.5" step="0.05">
            </div>
            <div class="form-group">
              <label class="form-label" style="display:flex;justify-content:space-between">
                <span>{{ $t('pmDefBonus') }}</span>
                <span class="value-display">{{ +(store.pmDefBonus*100).toFixed(0) }}%</span>
              </label>
              <input class="form-range" type="range" v-model.number="store.pmDefBonus" min="-1" max="2.5" step="0.05">
            </div>
            <div class="form-group" style="display:flex;align-items:center;justify-content:flex-start;height:32px;padding-top:4px;">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin:0;">
                <input type="checkbox" v-model="store.eleAdvantage" style="width:16px;height:16px;">
                <span class="form-label" style="margin:0;">{{ $t('eleAdvantage') }}</span>
              </label>
            </div>
          </div>
        </details>
      </div>

      <!-- Delta Increments (Available for both charts) -->
      <div class="card">
        <div class="card-title">{{ $t('upgradesToTest') }}</div>
        <div class="flex-col gap-8">
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between;align-items:center;">
              <span>{{ $t('baseAtk') }} {{ $t('increment') }}</span>
              <BigNumberInput class="form-input chart-control-input chart-control-input-wide" v-model="deltas.baseAtk" />
            </label>
            <input class="form-range" type="range" v-model.number="deltas.baseAtk" min="0" max="10000000" step="10000">
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between;align-items:center;">
              <span>{{ $t('pen') }} {{ $t('increment') }}</span>
              <BigNumberInput class="form-input chart-control-input chart-control-input-wide" v-model="deltas.pen" />
            </label>
            <input class="form-range" type="range" v-model.number="deltas.pen" min="0" max="30000" step="100">
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between;align-items:center;">
              <span>{{ $t('pmPen') }} {{ $t('increment') }}</span>
              <BigNumberInput class="form-input chart-control-input chart-control-input-wide" v-model="deltas.pmPen" />
            </label>
            <input class="form-range" type="range" v-model.number="deltas.pmPen" min="0" max="80000" step="100">
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
    <div class="flex-col gap-12 chart-main-card mobile-static-panel" style="position: sticky; top: 24px; z-index: 10;">
      <!-- Tabs & Actions -->
      <div class="card chart-tabs-toolbar" style="display:flex;justify-content:space-between;align-items:center;padding:12px 24px">
        <div class="chart-tabs">
          <button class="tab-btn" :class="{active: activeTab==='tornado'}" @click="activeTab='tornado'">{{ $t('tabTornado') }}</button>
          <button class="tab-btn" :class="{active: activeTab==='waterfall'}" @click="activeTab='waterfall'">{{ $t('tabWaterfall') }}</button>
        </div>
        <div class="chart-base-summary" style="display:flex;align-items:center;gap:16px">
          <div style="font-size:var(--fs-sm)">
            {{ $t('baseDmgDisplay') }} <b style="color:var(--gold);font-size:18px">{{ fmt(baseResult.finalDmg) }}</b>
            <span style="color:var(--text-muted);margin-left:8px">{{ $t('basePassRateDisplay') }} {{ baseResult.dmgRatePct.toFixed(1) }}%</span>
          </div>
          <button class="btn btn-ghost btn-sm" @click="downloadChart">⬇ PNG</button>
        </div>
      </div>

      <!-- Instructions for Tornado -->
      <div class="card chart-info-card animate-fadeup" v-show="activeTab === 'tornado'" style="padding:16px 24px; border-left:4px solid #3498db; background:rgba(52,152,219,0.05)">
        <div style="font-size:var(--fs-sm); font-weight:bold; color:#3498db; margin-bottom:6px">{{ $t('tornadoInstTitle') }}</div>
        <p style="font-size:var(--fs-xs); color:var(--text-muted); margin:0; line-height:1.5" v-html="$t('tornadoInstDesc')"></p>
      </div>

      <!-- Instructions for Waterfall -->
      <div class="card chart-info-card animate-fadeup" v-show="activeTab === 'waterfall'" style="padding:16px 24px; border-left:4px solid #2ecc71; background:rgba(46,204,113,0.05)">
        <div style="font-size:var(--fs-sm); font-weight:bold; color:#2ecc71; margin-bottom:6px">{{ $t('waterfallInstTitle') }}</div>
        <p style="font-size:var(--fs-xs); color:var(--text-muted); margin:0; line-height:1.5" v-html="$t('waterfallInstDesc')"></p>
      </div>

      <div class="card mobile-chart-panel mobile-chart-frame" style="height:500px;position:relative">
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
import { getMoriTheme, baseChartOption } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'
import { useCalcStore } from '../store/calculator.js'
import { useDamageParams } from '../composables/useDamageParams.js'

use([CanvasRenderer, BarChart, TooltipComponent, GridComponent, GraphicComponent, TitleComponent, LegendComponent])

const { t } = useI18n()
const store = useCalcStore()
const chartRef = ref(null)

const activeTab = ref('tornado') // 'tornado' | 'waterfall'
const isBaseOpen = ref(false)

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

const {
  onAtkLevelChange,
  onDefLevelChange,
  setDamageType,
} = useDamageParams(store)

const baseResult = computed(() => {
  const p = { ...store.$state }
  delete p.cPen
  delete p.cPmPen
  delete p.cDef
  delete p.cPmDef
  return calcDamage(p)
})

// --- Tornado Chart Logic ---
const tornadoResults = computed(() => {
  const baseParams = { ...store.$state }
  delete baseParams.cPen
  delete baseParams.cPmPen
  delete baseParams.cDef
  delete baseParams.cPmDef
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
  delete params.cPen
  delete params.cPmPen
  delete params.cDef
  delete params.cPmDef
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
  const barLabelStyle = {
    color: isDark ? '#ffffff' : '#1a1614',
    textBorderColor: isDark ? '#000000' : '#ffffff',
    textBorderWidth: 2,
    fontFamily: 'JetBrains Mono',
  }

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
          ...barLabelStyle, fontSize: 12, fontWeight: 'bold'
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
          label: { show: true, position: 'top', formatter: p => p.value !== '-' ? fmt(p.value) : '', ...barLabelStyle, fontSize: 10 },
          data: positive 
        },
        { 
          name: 'Loss', type: 'bar', stack: 'Total', barMaxWidth: 40, 
          itemStyle: { color: '#e74c3c', borderRadius: 2 },
          label: { show: true, position: 'bottom', formatter: p => p.value !== '-' ? `-${fmt(p.value)}` : '', ...barLabelStyle, fontSize: 10 },
          data: negative 
        }
      ]
    }
  }
})

function downloadChart() {
  if (chartRef.value) {
    const bg = currentTheme.value === 'dark' ? '#0d0b14' : '#f4f3ee'
    const url = chartRef.value.getDataURL({type:'png',pixelRatio:2,backgroundColor:bg})
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
.tab-btn { background: transparent; border: none; color: var(--text-muted); padding: 6px 16px; border-radius: 6px; cursor: pointer; transition: 0.2s; font-size: var(--fs-sm); font-weight: 500; }
.tab-btn:hover { background: rgba(255,255,255,0.05); color: var(--text-base); }
.tab-btn.active { background: rgba(201,168,76,0.15); color: var(--gold); border-bottom: 2px solid var(--gold); border-radius: 6px 6px 0 0; }
.grid-2 .form-group { display: flex; flex-direction: column; justify-content: space-between; height: 100%; }
summary::-webkit-details-marker {
  display: none;
}
summary {
  list-style: none;
}
</style>
