<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('tableTitle') }}</h1>
    <p class="view-desc">{{ $t('tableDesc') }}</p>
  </div>

  <div class="grid-sidebar export-layout animate-fadeup">
    <div class="flex-col gap-12 export-sidebar">
      <!-- Variables -->
      <div class="card">
        <div class="card-title">{{ $t('exportVariables') }}</div>
        
        <div class="form-group">
          <label class="form-label">{{ $t('exportXAxis') }}</label>
          <select class="form-select" v-model="ts.xKey" @change="onXKeyChange">
            <option v-for="v in TABLE_VARIABLES" :key="v.key" :value="v.key">{{ v.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('exportXValues') }} <span class="text-xs text-muted">{{ $t('exportCommaSeparated') }}</span></label>
          <textarea class="form-input" v-model="ts.xValsStr" rows="2" style="resize:vertical"></textarea>
        </div>

        <div class="divider"></div>

        <div class="form-group">
          <label class="form-label">{{ $t('exportYAxis') }}</label>
          <select class="form-select" v-model="ts.yKey" @change="onYKeyChange">
            <option v-for="v in TABLE_VARIABLES" :key="v.key" :value="v.key">{{ v.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('exportYValues') }} <span class="text-xs text-muted">{{ $t('exportCommaSeparated') }}</span></label>
          <textarea class="form-input" v-model="ts.yValsStr" rows="2" style="resize:vertical"></textarea>
        </div>

        <div class="divider"></div>

        <div class="form-group">
          <label class="form-label">{{ $t('exportTableTitle') }}</label>
          <input 
            class="form-input" 
            v-model="displayTitle" 
            :placeholder="defaultTitle"
          >
        </div>
      </div>

      <!-- Builds Configuration -->
      <div class="card">
        <div class="card-title">{{ $t('exportBuildsConfig') }}</div>
        <div class="flex-col gap-8">
          <div 
            v-for="(b, i) in ts.builds" 
            :key="b.id"
            class="export-build-card"
            style="padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:6px;"
          >
            <div class="export-build-head" :style="{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: b._expanded ? '12px' : '0' }">
              <input class="form-input export-build-name" v-model="b.name">
              <div style="display:flex;gap:4px">
                <button class="btn btn-secondary btn-sm" @click="b._expanded = !b._expanded" style="padding:4px 8px;">
                  {{ b._expanded ? '▲' : '▼ ' + $t('ui_details') }}
                </button>
                <button v-if="ts.builds.length > 1" class="btn btn-ghost btn-sm" @click="removeBuild(i)" style="padding:4px 8px">🗑</button>
              </div>
            </div>
            
            <div v-show="b._expanded" class="export-build-detail" style="padding-top:12px;border-top:1px dashed rgba(255,255,255,0.1);display:flex;flex-direction:column;gap:8px;">
              <div class="export-build-detail-head">
                <strong>{{ b.name }}</strong>
                <button class="modal-close" @click="b._expanded = false">&times;</button>
              </div>
              <!-- 攻击类型 + 面板攻击力 -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:end;">
                <div class="form-group">
                  <label class="form-label text-xs">{{ $t('atkType') }}</label>
                  <div class="segmented-control">
                    <button class="btn btn-sm" :class="b.params.damageType === 'phys' ? 'btn-primary' : 'btn-ghost'" @click="setBuildDamageType(b, 'phys')">{{ $t('typePhys') }}</button>
                    <button class="btn btn-sm" :class="b.params.damageType === 'mag' ? 'btn-primary' : 'btn-ghost'" @click="setBuildDamageType(b, 'mag')">{{ $t('typeMag') }}</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label text-xs">{{ $t('baseAtk') }}</label>
                  <BigNumberInput class="form-input" v-model="b.params.baseAtk" />
                </div>
              </div>
              <!-- 等级 -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div class="form-group"><label class="form-label text-xs">{{ $t('atkLevel') }}</label>
                  <input class="form-input" type="number" v-model.number="b.params.atkLevel" @input="onBuildAtkLevelChange(b)"></div>
                <div class="form-group"><label class="form-label text-xs">{{ $t('defLevel') }}</label>
                  <input class="form-input" type="number" v-model.number="b.params.defLevel" @input="onBuildDefLevelChange(b)"></div>
              </div>
              <!-- 防御力 -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div class="form-group"><label class="form-label text-xs">{{ $t('targetDef') }}</label><BigNumberInput class="form-input" v-model="b.params.def" /></div>
                <div class="form-group"><label class="form-label text-xs">{{ b.params.damageType === 'phys' ? $t('targetPhysDef') : $t('targetMagDef') }}</label><BigNumberInput class="form-input" v-model="b.params.pmDef" /></div>
              </div>
              <!-- 贯通 -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div class="form-group"><label class="form-label text-xs">{{ $t('pen') }}</label><BigNumberInput class="form-input" v-model="b.params.pen" /></div>
                <div class="form-group"><label class="form-label text-xs">{{ $t('pmPen') }}</label><BigNumberInput class="form-input" v-model="b.params.pmPen" /></div>
              </div>
              <!-- 加成 -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div class="form-group"><label class="form-label text-xs">{{ $t('atkBonus') }}(%)</label>
                  <input class="form-input" type="number" :value="(b.params.atkBonus*100).toFixed(0)" @input="e => b.params.atkBonus = parseFloat(e.target.value)/100||0"></div>
                <div class="form-group"><label class="form-label text-xs">{{ $t('dmgBonus') }}(%)</label>
                  <input class="form-input" type="number" :value="(b.params.dmgBonus*100).toFixed(0)" @input="e => b.params.dmgBonus = parseFloat(e.target.value)/100||0"></div>
              </div>
              <!-- 防御 -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div class="form-group"><label class="form-label text-xs">{{ $t('defBonus') }}(%)</label>
                  <input class="form-input" type="number" :value="(b.params.defBonus*100).toFixed(0)" @input="e => b.params.defBonus = parseFloat(e.target.value)/100||0"></div>
                <div class="form-group"><label class="form-label text-xs">{{ $t('pmDefBonus') }}(%)</label>
                  <input class="form-input" type="number" :value="(b.params.pmDefBonus*100).toFixed(0)" @input="e => b.params.pmDefBonus = parseFloat(e.target.value)/100||0"></div>
              </div>
              <!-- 暴击倍率 + 技能倍率 -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div class="form-group"><label class="form-label text-xs">{{ $t('critMult') }}(%)</label>
                  <input class="form-input" type="number" :value="(b.params.critMult*100).toFixed(0)" @input="e => b.params.critMult = parseFloat(e.target.value)/100||0"></div>
                <div class="form-group"><label class="form-label text-xs">{{ $t('skillCoeff') }}(%)</label>
                  <input class="form-input" type="number" :value="(b.params.skillCoeff*100).toFixed(0)" @input="e => b.params.skillCoeff = parseFloat(e.target.value)/100||0"></div>
              </div>
              <!-- 属性克制 -->
              <div style="display:flex;align-items:center;gap:8px;padding-top:4px;">
                <input type="checkbox" v-model="b.params.eleAdvantage" :id="'export-ele-' + b.id" style="width:16px;height:16px;">
                <label :for="'export-ele-' + b.id" class="form-label text-xs" style="margin:0;cursor:pointer;">{{ $t('eleAdvantage') }}</label>
              </div>
            </div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm w-full mt-8" @click="addBuild">+ {{ $t('addBuild') }}</button>
        <button class="btn btn-ghost btn-sm w-full mt-4" @click="importCurrentBuild">{{ $t('importCurrentParams') }}</button>
        <button class="btn btn-ghost btn-sm w-full mt-4" @click="resetDefault">{{ $t('exportResetDefault') }}</button>
      </div>
    </div>

    <!-- Main Output -->
    <div class="flex-col gap-12 export-main" style="min-width:0">
      <div class="card" style="display:flex; flex-direction:column;">
        <div class="flex justify-between items-center mb-12 export-toolbar" style="flex-wrap:wrap; gap:12px;">
          <div class="export-title-row" style="display:flex;align-items:center;gap:12px;flex:1;min-width:240px;">
            <span style="font-size: 18px;">📊</span>
            <input 
              class="table-title-input" 
              v-model="displayTitle" 
              :placeholder="defaultTitle"
              :title="$t('tooltipEditTableTitle')"
            />
            <select class="form-select export-metric-select" v-model="ts.metric" style="width:140px;padding:4px 8px;min-height:var(--control-h-sm);margin-left:4px;">
              <option v-for="(v, k) in getMetrics()" :key="k" :value="k">{{ v.label }}</option>
            </select>
          </div>
          <div class="export-actions" style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost btn-sm" @click="copyMarkdown">Markdown</button>
            <button class="btn btn-ghost btn-sm" @click="downloadCsv">{{ $t('copyCSV') }}</button>
          </div>
        </div>
        
        <div class="export-table-list mobile-table-scroll" style="display:flex;flex-direction:column;gap:32px;overflow-x:auto" v-if="tableData">
          <div 
            v-for="(tData, index) in tableData.allTables" 
            :key="index"
            style="background:rgba(0,0,0,0.1); border-radius:8px; padding:12px; border:1px solid rgba(255,255,255,0.05)"
          >
            <div class="export-table-heading" style="font-weight:600;margin-bottom:12px">
              <span v-if="tData.isDiff" style="color:var(--purple-light)">⚖ {{ tData.name }}</span>
              <span v-else style="color:var(--gold)">📊 {{ tData.build.name }}</span>
            </div>
            <div class="table-scroll-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="min-width:120px;color:var(--gold)">
                      {{ yLabel }} ↓<br><span style="color:#888">{{ xLabel }} →</span>
                    </th>
                    <th v-for="x in tableData.xVals" :key="x">{{ x.toLocaleString() }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, ri) in tData.rows" :key="ri">
                    <td style="font-weight:600">{{ r.yVal.toLocaleString() }}</td>
                    <td 
                      v-for="(c, ci) in r.cols" 
                      :key="ci"
                      :style="getCellStyle(c[ts.metric], tData.isDiff)"
                    >
                      {{ getCellText(c[ts.metric], tData.isDiff) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BigNumberInput from '../components/BigNumberInput.vue'
import { buildCrossTable } from '../engine/damageCalc.js'
import { getTableVariables } from '../constants/presets.js'
import { useCalcStore } from '../store/calculator.js'

const { t } = useI18n()
const store = useCalcStore()

const TABLE_VARIABLES = computed(() => getTableVariables(t))

const getMetrics = () => ({
  dmgRatePct: { label: t('overallPenRate'), fmt: v => `${v.toFixed(2)}%` },
  finalDmg:   { label: t('finalDmg'),   fmt: v => Math.round(v).toLocaleString() },
  defMitRate: { label: t('defMitRate'), fmt: v => `${v.toFixed(2)}%` },
  pmMitRate:  { label: t('pmMitRate'), fmt: v => `${v.toFixed(2)}%` },
})

const DEFAULT_TABLE_PARAMS = {
  baseAtk: 1_000_000,
  skillCoeff: 5.25,
  def: 5_000_000,
  pmDef: 5_000_000,
  pen: 11950,
  pmPen: 31200,
  atkBonus: 0,
  dmgBonus: 0.3,
  defBonus: 0,
  pmDefBonus: 0,
  critMult: 1.5,
  eleAdvantage: false,
  damageType: 'phys',
  atkLevel: 500,
  defLevel: 500,
}

const clone = value => JSON.parse(JSON.stringify(value))

const getCurrentParams = () => {
  const p = { ...store.$state }
  delete p.cPen
  delete p.cPmPen
  delete p.cDef
  delete p.cPmDef
  return p
}

function createDefaultBuilds() {
  const baseId = Date.now()
  const baseParams = clone(DEFAULT_TABLE_PARAMS)
  const compareParams = {
    ...baseParams,
    pen: 4950,
    pmPen: 47700,
  }

  return [
    {
      id: baseId,
      name: t('buildNamePrefix') + ' 1',
      params: baseParams,
      _expanded: false
    },
    {
      id: baseId + 1,
      name: t('buildNamePrefix') + ' 2',
      params: compareParams,
      _expanded: false
    }
  ]
}

const ts = reactive({
  xKey: 'def',
  yKey: 'pen',
  xValsStr: '1000000, 3000000, 5000000, 10000000, 20000000, 50000000',
  yValsStr: '0, 4950, 11950, 18950',
  builds: createDefaultBuilds(),
  metric: 'dmgRatePct',
  customTitle: '',
  isTitleTouched: false,
})

const xLabel = computed(() => TABLE_VARIABLES.value.find(v => v.key === ts.xKey)?.label || ts.xKey)
const yLabel = computed(() => TABLE_VARIABLES.value.find(v => v.key === ts.yKey)?.label || ts.yKey)

const defaultTitle = computed(() => {
  return t('defaultTableTitle', { y: yLabel.value, x: xLabel.value })
})

const displayTitle = computed({
  get() {
    return (ts.isTitleTouched && ts.customTitle.trim()) ? ts.customTitle : defaultTitle.value
  },
  set(val) {
    if (!val || !val.trim()) {
      ts.customTitle = ''
      ts.isTitleTouched = false
    } else {
      ts.customTitle = val
      ts.isTitleTouched = true
    }
  }
})

function onXKeyChange() {
  const preset = TABLE_VARIABLES.value.find(v => v.key === ts.xKey)
  if (preset) ts.xValsStr = preset.defaultValues
}

function onYKeyChange() {
  const preset = TABLE_VARIABLES.value.find(v => v.key === ts.yKey)
  if (preset) ts.yValsStr = preset.defaultValues
}

function onBuildAtkLevelChange(build) {
  // Calculated internally
}

function onBuildDefLevelChange(build) {
  // Calculated internally
}

function setBuildDamageType(build, type) {
  build.params.damageType = type
}

function addBuild() {
  const baseParams = JSON.parse(JSON.stringify(ts.builds[ts.builds.length-1].params))
  ts.builds.push({
    id: Date.now(),
    name: `${t('buildNamePrefix')} ${ts.builds.length + 1}`,
    params: baseParams,
    _expanded: false
  })
}

function importCurrentBuild() {
  ts.builds.push({
    id: Date.now(),
    name: `${t('buildNamePrefix')} ${ts.builds.length + 1}`,
    params: getCurrentParams(),
    _expanded: true
  })
}

function removeBuild(idx) {
  ts.builds.splice(idx, 1)
}

function resetDefault() {
  ts.customTitle = ''
  ts.isTitleTouched = false
  ts.builds = createDefaultBuilds()
}

function parseVals(str) {
  return str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
}

const tableData = computed(() => {
  const xVals = parseVals(ts.xValsStr)
  const yVals = parseVals(ts.yValsStr)
  if (!xVals.length || !yVals.length || ts.builds.length === 0) return null
  
  const tables = ts.builds.map(b => {
    return {
      build: b,
      rows: buildCrossTable(xVals, yVals, ts.xKey, ts.yKey, b.params),
      isDiff: false
    }
  })
  
  const diffTables = []
  if (tables.length > 1) {
    const baseTable = tables[0]
    for (let i = 1; i < tables.length; i++) {
      const cmpTable = tables[i]
      const diffRows = cmpTable.rows.map((row, rIdx) => {
        const baseRow = baseTable.rows[rIdx]
        return {
          yVal: row.yVal,
          cols: row.cols.map((col, cIdx) => {
            const baseCol = baseRow.cols[cIdx]
            const diffCols = {}
            for (const key of Object.keys(col)) {
              if (typeof col[key] === 'number') {
                diffCols[key] = col[key] - baseCol[key]
              }
            }
            return diffCols
          })
        }
      })
      diffTables.push({
        name: `Diff: ${cmpTable.build.name} - ${baseTable.build.name}`,
        rows: diffRows,
        isDiff: true
      })
    }
  }

  return { xVals, yVals, tables, diffTables, allTables: [...tables, ...diffTables] }
})

function getCellStyle(val, isDiff) {
  if (!isDiff) return {}
  const color = val > 0 ? '#2ecc71' : val < 0 ? '#e74c3c' : '#888'
  const fontWeight = val !== 0 ? '600' : 'normal'
  return { color, fontWeight }
}

function getCellText(val, isDiff) {
  const metric = getMetrics()[ts.metric]
  if (isDiff) {
    const sign = val > 0 ? '+' : ''
    return `${sign}${metric.fmt(val)}`
  }
  return metric.fmt(val)
}

function copyMarkdown() {
  const data = tableData.value
  if (!data) return
  const METRICS = getMetrics()
  
  let md = `# ${displayTitle.value}\n\n`
  data.allTables.forEach(tData => {
    md += `### ${tData.isDiff ? tData.name : tData.build.name}\n`
    md += `| ${yLabel.value} ↓ \\ ${xLabel.value} → | ` + data.xVals.join(' | ') + ' |\n'
    md += '| :--- | ' + data.xVals.map(() => ':---').join(' | ') + ' |\n'
    tData.rows.forEach(r => {
      md += `| **${r.yVal}** | ` + r.cols.map(c => {
        let v = METRICS[ts.metric].fmt(c[ts.metric])
        if (tData.isDiff && c[ts.metric] > 0) v = '+' + v
        return v
      }).join(' | ') + ' |\n'
    })
    md += '\n'
  })
  navigator.clipboard.writeText(md).then(() => alert(t('copied')))
}

function downloadCsv() {
  const data = tableData.value
  if (!data) return
  
  let csv = `"${displayTitle.value}"\n\n`
  data.allTables.forEach(tData => {
    csv += `${tData.isDiff ? tData.name : tData.build.name}\n`
    csv += `${yLabel.value} \\ ${xLabel.value},` + data.xVals.join(',') + '\n'
    tData.rows.forEach(r => {
      csv += `${r.yVal},` + r.cols.map(c => c[ts.metric]).join(',') + '\n'
    })
    csv += '\n'
  })
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeFilename = displayTitle.value.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_')
  a.download = `${safeFilename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.grid-2 .form-group {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}
.table-title-input {
  font-size: var(--fs-base);
  font-weight: 600;
  color: var(--gold);
  background: transparent;
  border: 1px solid transparent;
  border-bottom: 1px dashed rgba(212, 175, 55, 0.2);
  padding: 2px 4px;
  width: 100%;
  max-width: 320px;
  outline: none;
  transition: all 0.2s ease;
}
.export-build-name {
  width: 130px;
  padding: 2px 8px;
  font-size: var(--fs-base);
  font-weight: bold;
}
.export-metric-select {
  font-size: var(--fs-sm);
}
.export-table-heading {
  font-size: var(--fs-lg);
}
.export-build-detail-head {
  display: none;
}
.table-title-input:hover {
  border-bottom: 1px dashed var(--gold);
}
.table-title-input:focus {
  border-bottom: 1px solid var(--gold);
  background: rgba(255, 255, 255, 0.03);
}

/* Layout scroll rules */
@media (min-width: 1025px) {
  .export-layout {
    height: calc(100vh - 130px);
    overflow: hidden;
    align-items: stretch !important;
  }
  .export-sidebar {
    max-height: 100%;
    overflow-y: auto;
    padding-right: 6px;
  }
  .export-main {
    max-height: 100%;
    overflow-y: auto;
    overflow-x: auto;
    padding-right: 6px;
  }
  .table-scroll-container {
    overflow: visible;
    max-height: none;
  }
}

@media (max-width: 1024px) {
  .table-scroll-container {
    overflow-x: auto;
    overflow-y: visible;
    max-height: none;
    border: 1px solid rgba(255, 255, 255, 0.03);
    border-radius: 6px;
  }
}

@media (max-width: 560px) {
  .export-layout {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .export-sidebar,
  .export-main {
    min-width: 0;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
  .export-build-name {
    flex: 1;
    width: auto;
    min-width: 0;
  }
  .export-build-head {
    margin-bottom: 0 !important;
  }
  .export-build-detail {
    position: fixed;
    inset: 0;
    z-index: 1200;
    max-height: 100dvh;
    overflow-y: auto;
    padding: 0 14px max(18px, env(safe-area-inset-bottom)) !important;
    border-top: none !important;
    background: var(--bg-surface);
    box-shadow: 0 0 0 1px var(--border-subtle);
  }
  .export-build-detail-head {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 0 -14px 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-subtle);
    background: var(--bg-surface);
  }
  .export-build-detail-head strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--gold);
    font-size: var(--fs-md);
  }
  .export-build-detail > div:not(.export-build-detail-head) {
    grid-template-columns: 1fr !important;
  }
  .export-toolbar,
  .export-title-row,
  .export-actions {
    align-items: stretch !important;
    flex-direction: column;
    width: 100%;
  }
  .export-title-row {
    gap: 8px !important;
    min-width: 0 !important;
  }
  .table-title-input {
    max-width: none;
    min-height: var(--control-h-sm);
  }
  .export-metric-select {
    width: 100% !important;
    min-height: var(--control-h-sm) !important;
    margin-left: 0 !important;
    padding: 5px 30px 5px 10px !important;
  }
  .export-actions .btn {
    width: 100%;
  }
  .export-table-list {
    gap: 18px !important;
    overflow-x: visible !important;
  }
  .table-scroll-container {
    -webkit-overflow-scrolling: touch;
  }
  :deep(.data-table) {
    min-width: 720px;
  }
}

/* Enable sticky table headers and solid backgrounds */
:deep(.data-table) {
  border-collapse: separate;
  border-spacing: 0;
}

:deep(.data-table th) {
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(rgba(201, 168, 76, 0.12), rgba(201, 168, 76, 0.12)), var(--bg-card);
  box-shadow: inset 0 -1px 0 var(--border-subtle);
  border-bottom: none;
}

/* Enable sticky first column (Y-axis labels) */
:deep(.data-table th:first-child),
:deep(.data-table td:first-child) {
  position: sticky;
  left: 0;
  z-index: 5;
  background: var(--bg-card);
  box-shadow: inset -1px 0 0 rgba(var(--color-invert-rgb), 0.08);
}

:deep(.data-table th:first-child) {
  z-index: 15;
  background: linear-gradient(rgba(201, 168, 76, 0.12), rgba(201, 168, 76, 0.12)), var(--bg-card);
  box-shadow: inset -1px -1px 0 var(--border-subtle);
}

/* Row Hover styles with solid sticky background overlays */
:deep(.data-table tr:hover td) {
  background: rgba(var(--color-invert-rgb), 0.03);
}

:deep(.data-table tr:hover td:first-child) {
  background: linear-gradient(rgba(var(--color-invert-rgb), 0.03), rgba(var(--color-invert-rgb), 0.03)), var(--bg-card);
}
</style>

<style>
/* Global style to disable view scrolling when Table Export page is active */
@media (min-width: 1025px) {
  .app-shell:has(.export-layout) .view {
    overflow: hidden !important;
  }
}
</style>
