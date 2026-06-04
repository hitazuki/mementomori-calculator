<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('compareTitle') }}</h1>
    <p class="view-desc">{{ $t('compareDesc') }}</p>
  </div>
  
  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <div class="flex-col gap-12">
      <!-- Common Params -->
      <div class="card">
        <div class="card-title">⚙ {{ $t('manualAdjust') }} {{ $t('ui_common') || '(Common)' }}</div>
        <div class="form-group">
          <label class="form-label">{{ $t('baseAtk') }}</label>
          <BigNumberInput class="form-input" v-model="store.baseAtk" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('skillCoeff') }} <span class="value-display">{{ (store.skillCoeff*100).toFixed(0) }}%</span></label>
          <input class="form-range" type="range" v-model.number="store.skillCoeff" min="1" max="20" step="0.25">
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('atkType') }}</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-sm" :class="store.damageType==='phys'?'btn-primary':'btn-ghost'" style="flex:1; font-size:11px; padding:6px 2px; letter-spacing:-0.5px;" @click="setDamageType('phys')">{{ $t('typePhys') }}</button>
            <button class="btn btn-sm" :class="store.damageType==='mag' ?'btn-primary':'btn-ghost'" style="flex:1; font-size:11px; padding:6px 2px; letter-spacing:-0.5px;" @click="setDamageType('mag')">{{ $t('typeMag') }}</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('atkLevel') }}</label>
          <input class="form-input" type="number" v-model.number="store.atkLevel" @input="onAtkLevelChange" min="1" max="999">
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('defLevel') || $t('defPresetLabel') }}</label>
          <input class="form-input" type="number" v-model.number="store.defLevel" @input="onDefLevelChange" min="1" max="999">
        </div>
      </div>

      <!-- Builds -->
      <div class="card">
        <div class="card-title">🔧 {{ $t('compareTitle') }} <span class="text-xs text-muted">{{ $t('ui_max6') || '(Max 6)' }}</span></div>
        <div class="flex-col gap-8">
          <div 
            v-for="(b, i) in cs.builds" 
            :key="b.id"
            :style="{ padding:'8px 10px', borderRadius:'6px', border:'1px solid ' + LINE_COLORS[i%LINE_COLORS.length] + '30', background: LINE_COLORS[i%LINE_COLORS.length] + '08', display:'flex', justifyContent:'space-between', alignItems:'center' }"
          >
            <div style="display:flex; flex-direction:column; gap:4px; overflow:hidden;">
              <span :style="{ color: LINE_COLORS[i%LINE_COLORS.length], fontWeight:600, fontSize:'12px', whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden' }">
                ▌ {{ b.name }}
              </span>
              <span style="font-size: 13px; color:var(--text-secondary); whiteSpace:nowrap;">
                PEN: {{ b.pen }} | P/M: {{ b.pmPen }}
              </span>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
              <button class="btn btn-secondary btn-sm" style="height:26px; padding:0 8px;" @click="editBuild(i)">✏️</button>
              <button class="btn btn-danger btn-sm" style="height:26px; padding:0 8px;" @click="removeBuild(i)">✖</button>
            </div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm mt-8 w-full" :disabled="cs.builds.length>=6" @click="addBuild">{{ $t('addBuild') }}</button>
      </div>

      <!-- Benchmarks -->
      <div class="card">
        <div class="card-title">🏹 {{ $t('targetDef') }}</div>
        <div class="flex-col gap-8">
          <div 
            v-for="(b, i) in cs.benchmarks" 
            :key="i"
            style="background: rgba(var(--color-invert-rgb), 0.02); border: 1px solid var(--border-subtle); padding: 10px; border-radius: 8px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 8px;"
          >
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <input type="text" v-model="b.label" style="background: transparent; border: none; border-bottom: 1px dashed var(--gold-dim); color: var(--gold); font-family: var(--font-mono); font-size: 14px; font-weight: 600; outline: none; width: 140px; padding: 2px 4px;" placeholder="Name">
              <button class="btn btn-ghost btn-sm" @click="removeBench(i)" style="padding: 0 8px; height: 24px; color: var(--danger); font-size: 14px; line-height: 1;">✕</button>
            </div>
            <div class="grid-2" style="gap: 8px;">
              <div class="flex-col">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 2px;">
                  <span style="font-size: 11px; color: var(--text-muted);">DEF</span>
                </div>
                <BigNumberInput class="form-input" v-model="b.def" style="min-width:0; padding:5px 8px; font-size:13px;" placeholder="DEF" />
              </div>
              <div class="flex-col">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 2px;">
                  <span style="font-size: 11px; color: var(--text-muted);">P/M.DEF</span>
                </div>
                <BigNumberInput class="form-input" v-model="b.pmDef" style="min-width:0; padding:5px 8px; font-size:13px;" placeholder="P/M.DEF" />
              </div>
            </div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm mt-8 w-full" @click="addBench">{{ $t('addBench') }}</button>
      </div>
    </div>

    <!-- Main Right Content -->
    <div class="flex-col gap-12" style="position: sticky; top: 24px; z-index: 10; min-width: 0;">
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm" :class="cs.chartMode==='bar'?'btn-primary':'btn-ghost'" @click="cs.chartMode='bar'">{{ $t('ui_bar') || 'Bar' }}</button>
            <button class="btn btn-sm" :class="cs.chartMode==='radar'?'btn-primary':'btn-ghost'" @click="cs.chartMode='radar'">{{ $t('ui_radar') || 'Radar' }}</button>
            <button class="btn btn-sm" :class="cs.chartMode==='table'?'btn-primary':'btn-ghost'" @click="cs.chartMode='table'">{{ $t('ui_table') || 'Table' }}</button>
          </div>
          <select class="form-select" v-model="cs.metric" style="width:160px">
            <option v-for="(v, k) in getMetrics()" :key="k" :value="k">{{ v.label }}</option>
          </select>
        </div>
      </div>

      <div class="card" style="min-height:420px">
        <div v-show="cs.chartMode !== 'table'" style="width:100%;height:400px;position:relative">
          <v-chart class="chart" :option="chartOption" :update-options="{ notMerge: true }" autoresize />
        </div>
        
        <div v-if="cs.chartMode === 'table'" style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ $t('buildName') }}</th>
                <th v-for="b in cs.benchmarks" :key="b.label">{{ b.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in results" :key="r.id">
                <td :style="{color: r.color}">{{ r.name }}</td>
                <td v-for="(br, bi) in r.benchResults" :key="bi">{{ getMetrics()[cs.metric].fmt(br[cs.metric]) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" v-if="results.length >= 2">
        <div class="card-title">📊 {{ $t('ui_vsBuild1') || 'vs Build 1 (Delta)' }}</div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ $t('ui_compare') || 'Compare' }}</th>
                <th v-for="b in cs.benchmarks" :key="b.label">{{ b.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, ri) in results.slice(1)" :key="r.id">
                <td :style="{color: r.color}">{{ r.name }} vs {{ results[0].name }}</td>
                <td v-for="(br, bi) in r.benchResults" :key="bi" :class="getDeltaClass(br[cs.metric] - results[0].benchResults[bi][cs.metric])">
                  {{ formatDelta(br[cs.metric] - results[0].benchResults[bi][cs.metric]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal for editing build -->
  <Teleport to="body">
    <div v-if="cs.editingBuildIdx !== null" style="position:fixed; inset:0; background:rgba(var(--color-base-rgb),0.85); z-index:9999; display:flex; align-items:center; justify-content:center; padding: 20px; box-sizing: border-box;" @mousedown.self="cs.editingBuildIdx = null">
      <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:8px; width:100%; max-width:400px; box-shadow:0 8px 32px rgba(var(--color-base-rgb),0.8); display:flex; flex-direction:column; max-height: 100%;">
      <div style="display:flex;justify-content:space-between;align-items:center; padding: 20px 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;">
        <h3 style="margin:0;font-size: 18px;color:var(--text-primary)">⚙ {{ $t('manualAdjust') }}</h3>
        <button class="btn btn-ghost btn-sm" @click="cs.editingBuildIdx = null" style="padding:0 8px">✕</button>
      </div>
      
      <div style="display:flex;flex-direction:column;gap:8px; padding: 0 20px 20px; overflow-y: auto;">
        <div class="form-group"><label class="form-label">{{ $t('buildName') }}</label>
          <input class="form-input" type="text" v-model="editingBuild.name"></div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">{{ $t('pen') }}</label>
            <BigNumberInput class="form-input" v-model="editingBuild.pen" /></div>
          <div class="form-group"><label class="form-label">{{ $t('pmPen') }}</label>
            <BigNumberInput class="form-input" v-model="editingBuild.pmPen" /></div>
        </div>
        <div class="grid-2">
            <div class="form-group">
              <label class="form-label">{{ $t('atkBonus') }}</label>
              <input class="form-input" type="number" v-model.number="editingBuild.atkBonusPct">
            </div>
            <div class="form-group">
              <label class="form-label">{{ $t('dmgBonus') }}</label>
              <input class="form-input" type="number" v-model.number="editingBuild.dmgBonusPct">
            </div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">{{ $t('eleAdvantage') }}</label>
            <div style="display:flex;align-items:center;height:32px"><input type="checkbox" v-model="editingBuild.eleAdvantage" style="width:16px;height:16px"></div></div>
          <div class="form-group"><label class="form-label">{{ $t('defBonus') }}%</label>
            <input class="form-input" type="number" v-model.number="editingBuild.defBonusPct"></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">{{ $t('pmDefBonus') }}%</label>
            <input class="form-input" type="number" v-model.number="editingBuild.pmDefBonusPct"></div>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BigNumberInput from '../components/BigNumberInput.vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, RadarChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'

import { calcDamage } from '../engine/damageCalc.js'
import { getDefBenchmarks, getCoeffByLevel } from '../constants/levelTable.js'
import { getCompareBuildsDefault } from '../constants/presets.js'
import { getMoriTheme, LINE_COLORS, baseChartOption } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'
import { useCalcStore } from '../store/calculator.js'

use([CanvasRenderer, BarChart, RadarChart, TooltipComponent, GridComponent, LegendComponent, TitleComponent])

const { t } = useI18n()
const store = useCalcStore()

const fmt = v => v >= 1e6 ? `${(v/1e6).toFixed(2)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(Math.round(v))

const getMetrics = () => ({
  dmgRatePct: { label: t('overallPenRate'), fmt: v=>`${v.toFixed(1)}%`,    unit:'%' },
  finalDmg:   { label: t('finalDmg'),       fmt: v=>fmt(v),                 unit:''  },
  defMitPct:  { label: t('defMitRate'),     fmt: v=>`${v?.toFixed(1)}%`,    unit:'%' },
  pmMitPct:   { label: t('pmMitRate'),      fmt: v=>`${v?.toFixed(1)}%`,    unit:'%' },
})

const cs = reactive({
  builds: getCompareBuildsDefault(),
  editingBuildIdx: null,
  benchmarks: getDefBenchmarks().slice(0, 4),
  chartMode: 'bar', 
  metric: 'dmgRatePct',
})

// Proxy for editing build percentages
const editingBuild = computed(() => {
  if (cs.editingBuildIdx === null) return null
  const b = cs.builds[cs.editingBuildIdx]
  return {
    get name() { return b.name }, set name(v) { b.name = v },
    get pen() { return b.pen }, set pen(v) { b.pen = v },
    get pmPen() { return b.pmPen }, set pmPen(v) { b.pmPen = v },
    get atkBonus() { return b.atkBonus }, set atkBonus(v) { b.atkBonus = v },
    get dmgBonus() { return b.dmgBonus }, set dmgBonus(v) { b.dmgBonus = v },
    get atkBonusPct() { return (b.atkBonus * 100).toFixed(0) }, set atkBonusPct(v) { b.atkBonus = parseFloat(v) / 100 || 0 },
    get dmgBonusPct() { return (b.dmgBonus * 100).toFixed(0) }, set dmgBonusPct(v) { b.dmgBonus = parseFloat(v) / 100 || 0 },
    get eleAdvantage() { return b.eleAdvantage }, set eleAdvantage(v) { b.eleAdvantage = v },
    get defBonusPct() { return (b.defBonus * 100).toFixed(0) }, set defBonusPct(v) { b.defBonus = parseFloat(v) / 100 || 0 },
    get pmDefBonusPct() { return (b.pmDefBonus * 100).toFixed(0) }, set pmDefBonusPct(v) { b.pmDefBonus = parseFloat(v) / 100 || 0 },
  }
})

function editBuild(idx) {
  cs.editingBuildIdx = idx
}

function removeBuild(idx) {
  cs.builds.splice(idx, 1)
}

function addBuild() {
  if (cs.builds.length >= 6) return
  cs.builds.push({ 
    id: Date.now(), 
    name: `${t('buildNamePrefix')} ${cs.builds.length + 1}`, 
    pen: 18950, 
    pmPen: 31200, 
    atkBonus: 0,
    dmgBonus: 0.3, 
    defBonus: 0, 
    pmDefBonus: 0, 
    eleAdvantage: false 
  })
}

function removeBench(idx) {
  cs.benchmarks.splice(idx, 1)
}

function addBench() {
  cs.benchmarks.push({ label: `${t('benchNamePrefix')} ${cs.benchmarks.length + 1}`, def: 5_000_000, pmDef: 5_000_000 })
}

function setDamageType(type) {
  store.damageType = type
  const p = getCoeffByLevel(store.defLevel)
  if (p) {
    store.cPmDef = type === 'mag' ? p.cMdef : p.cPdef
  }
}

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

const results = computed(() => {
  return cs.builds.map((build, bi) => ({
    ...build, 
    color: LINE_COLORS[bi % LINE_COLORS.length],
    benchResults: cs.benchmarks.map(bench => calcDamage({
      baseAtk: store.baseAtk, 
      skillCoeff: store.skillCoeff, 
      critMult: store.critMult, 
      eleAdvantage: build.eleAdvantage || false,
      def: bench.def, 
      pmDef: bench.pmDef,
      pen: build.pen, 
      pmPen: build.pmPen,
      cDef: store.cDef, 
      cPen: store.cPen,
      cPmDef: store.cPmDef, 
      cPmPen: store.cPmPen,
      atkBonus: build.atkBonus || 0,
      dmgBonus: build.dmgBonus, 
      defBonus: build.defBonus || 0, 
      pmDefBonus: build.pmDefBonus || 0,
    }))
  }))
})

const chartOption = computed(() => {
  if (cs.chartMode === 'table') return {}
  
  const METRICS = getMetrics()
  const metric = METRICS[cs.metric]
  const isDark = currentTheme.value === 'dark'
  const MORI_THEME = getMoriTheme(isDark)
  
  if (cs.chartMode === 'bar') {
    return {
      ...baseChartOption(t('compareTitle') + ' · ' + metric.label, '', isDark),
      xAxis: { type: 'category', data: cs.benchmarks.map(b => b.label), axisLabel: MORI_THEME.axisLabel, axisLine: MORI_THEME.axisLine },
      yAxis: { type: 'value', axisLabel: { ...MORI_THEME.axisLabel, formatter: v => `${v}${metric.unit}` }, splitLine: MORI_THEME.splitLine },
      legend: { ...MORI_THEME.legend, bottom: 4, left: 'center', data: results.value.map(r => ({ name: r.name, itemStyle: { color: r.color } })) },
      tooltip: { 
        ...MORI_THEME.tooltip, 
        trigger: 'axis', 
        formatter: params => {
          let s = `<b style="color:var(--gold)">${params[0].axisValue}</b><br>`
          params.forEach(p => s += `<span style="color:${p.color}">● ${p.seriesName}</span>: <b>${metric.fmt(p.value)}</b><br>`)
          return s
        }
      },
      series: results.value.map(r => ({
        name: r.name, 
        type: 'bar', 
        barMaxWidth: 36,
        itemStyle: { color: r.color, borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top', color: r.color, fontFamily: 'JetBrains Mono', fontSize: 10, formatter: p => metric.fmt(p.value) },
        data: r.benchResults.map(br => +(br[cs.metric]).toFixed(1)),
      }))
    }
  } else {
    // Radar mode
    const maxVal = Math.max(...results.value.flatMap(r => r.benchResults.map(br => br[cs.metric]))) * 1.1
      
    return {
      ...baseChartOption('Radar · ' + metric.label, '', isDark),
      radar: {
        indicator: cs.benchmarks.map(b => ({ name: b.label, max: maxVal })),
        axisName: { color: MORI_THEME.axisLabel.color, fontSize: 11 },
        axisLine: MORI_THEME.axisLine,
        splitLine: MORI_THEME.splitLine,
        splitArea: MORI_THEME.splitArea,
      },
      legend: { ...MORI_THEME.legend, bottom: 4, left: 'center', data: results.value.map(r => ({ name: r.name, itemStyle: { color: r.color } })) },
      tooltip: MORI_THEME.tooltip,
      series: [{ 
        type: 'radar', 
        data: results.value.map(r => ({
          name: r.name, 
          value: r.benchResults.map(br => +(br[cs.metric]).toFixed(1)),
          lineStyle: { color: r.color, width: 2 }, 
          areaStyle: { color: r.color + '22' }, 
          itemStyle: { color: r.color },
        }))
      }],
    }
  }
})

function formatDelta(delta) {
  return (delta >= 0 ? '+' : '') + getMetrics()[cs.metric].fmt(delta)
}

function getDeltaClass(delta) {
  return delta > 0 ? 'cell-high' : delta < 0 ? 'cell-low' : ''
}
</script>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
}
</style>
