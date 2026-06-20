<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('tableTitle') }}</h1>
    <p class="view-desc">{{ $t('tableDesc') }}</p>
  </div>

  <div class="grid-sidebar export-layout animate-fadeup">
    <div class="flex-col gap-12 export-sidebar">
      <!-- Variables -->
      <div class="card">
        <div class="card-title">{{ $t('exportTableTitle') }}</div>
        <div class="form-group">
          <label class="form-label">{{ $t('exportTableTitle') }}</label>
          <input 
            class="form-input" 
            v-model="displayTitle" 
            :placeholder="defaultTitle"
          >
        </div>
      </div>

      <div class="card">
        <div class="card-title">📌 {{ $t('compareSummaryFields') }}</div>
        <div class="export-summary-picker">
          <label
            v-for="field in SUMMARY_FIELDS"
            :key="field.key"
            class="export-summary-option"
          >
            <input type="checkbox" :value="field.key" v-model="ts.summaryFields">
            <span>{{ field.label }}</span>
          </label>
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
          >
            <div class="export-build-head" :class="{ expanded: b._expanded }">
              <input class="form-input export-build-name" v-model="b.name">
              <div class="export-build-actions">
                <button class="btn btn-secondary btn-sm export-icon-btn" @click="b._expanded = !b._expanded" :title="$t('ui_details')">
                  {{ b._expanded ? '▲' : '▼' }}
                </button>
                <button class="btn btn-secondary btn-sm export-icon-btn" @click="copyBuild(i)" :title="$t('compareCopySuffix')">⧉</button>
                <button v-if="ts.builds.length > 1" class="btn btn-ghost btn-sm export-icon-btn" @click="removeBuild(i)" title="Remove">🗑</button>
              </div>
            </div>
            
            <div v-show="b._expanded" class="export-build-detail" style="padding-top:12px;border-top:1px dashed rgba(255,255,255,0.1);display:flex;flex-direction:column;gap:8px;">
              <div class="export-build-detail-head">
                <strong>{{ b.name }}</strong>
                <button class="modal-close" @click="b._expanded = false">&times;</button>
              </div>
              <!-- 联动轴 -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div class="form-group">
                  <label class="form-label text-xs">{{ $t('exportXAxis') }}</label>
                  <select class="form-select" v-model="b.xKey" @change="onBuildXKeyChange(b)">
                    <option v-for="v in TABLE_VARIABLES" :key="v.key" :value="v.key" :disabled="v.key === b.yKey">{{ v.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label text-xs">{{ $t('exportYAxis') }}</label>
                  <select class="form-select" v-model="b.yKey" @change="onBuildYKeyChange(b)">
                    <option v-for="v in TABLE_VARIABLES" :key="v.key" :value="v.key" :disabled="v.key === b.xKey">{{ v.label }}</option>
                  </select>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div class="form-group">
                  <label class="form-label text-xs">{{ $t('exportXValues') }} <span class="text-xs text-muted">{{ $t('exportCommaSeparated') }}</span></label>
                  <textarea class="form-input" v-model="b.xValsStr" rows="2" style="resize:vertical"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label text-xs">{{ $t('exportYValues') }} <span class="text-xs text-muted">{{ $t('exportCommaSeparated') }}</span></label>
                  <textarea class="form-input" v-model="b.yValsStr" rows="2" style="resize:vertical"></textarea>
                </div>
              </div>
              <div class="divider"></div>
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
              <div v-if="!tData.isDiff" class="export-table-summary">{{ buildSummaryText(tData.build) }}</div>
            </div>
            <div class="mobile-export-highlights">
              <div
                v-for="cell in getTableHighlights(tData)"
                :key="`${cell.yVal}-${cell.xVal}-${cell.text}`"
                class="mobile-export-cell"
                :style="getCellStyle(cell.value, tData.isDiff)"
              >
                <div class="mobile-export-cell-value">{{ cell.text }}</div>
                <div class="mobile-export-cell-label">{{ tData.yLabel }} {{ cell.yVal.toLocaleString() }} · {{ tData.xLabel }} {{ cell.xVal.toLocaleString() }}</div>
              </div>
            </div>
            <div class="table-scroll-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="min-width:120px;color:var(--gold)">
                      {{ tData.yLabel }} ↓<br><span style="color:#888">{{ tData.xLabel }} →</span>
                    </th>
                    <th v-for="x in tData.xVals" :key="x">{{ x.toLocaleString() }}</th>
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

const { t } = useI18n()

const TABLE_VARIABLES = computed(() => getTableVariables(t))

const getMetrics = () => ({
  dmgRatePct: { label: t('overallPenRate'), fmt: v => `${v.toFixed(2)}%` },
  finalDmg:   { label: t('finalDmg'),   fmt: v => Math.round(v).toLocaleString() },
  defMitRate: { label: t('defMitRate'), fmt: v => `${v.toFixed(2)}%` },
  pmMitRate:  { label: t('pmMitRate'), fmt: v => `${v.toFixed(2)}%` },
})

const SUMMARY_FIELDS = computed(() => [
  { key: 'damageType', label: t('atkType'), fmt: v => `${t('atkType')} ${v === 'mag' ? t('typeMag') : t('typePhys')}` },
  { key: 'pen', label: t('pen'), fmt: v => `PEN ${formatNumber(v)}` },
  { key: 'pmPen', label: t('pmPen'), fmt: v => `PM ${formatNumber(v)}` },
  { key: 'baseAtk', label: t('baseAtk'), fmt: v => `${t('baseAtk')} ${formatNumber(v)}` },
  { key: 'skillCoeff', label: t('skillCoeff'), fmt: v => `${t('skillCoeff')} ${formatPercentValue(v, 1)}` },
  { key: 'atkLevel', label: t('atkLevel'), fmt: v => `${t('atkLevel')} ${formatNumber(v)}` },
  { key: 'defLevel', label: t('defLevel'), fmt: v => `${t('defLevel')} ${formatNumber(v)}` },
  { key: 'def', label: t('targetDef'), fmt: v => `${t('targetDef')} ${formatNumber(v)}` },
  { key: 'pmDef', label: t('targetPmDef'), fmt: v => `${t('targetPmDef')} ${formatNumber(v)}` },
  { key: 'atkBonus', label: t('atkBonus'), fmt: v => `${t('atkBonus')} ${formatPercentValue(v)}` },
  { key: 'dmgBonus', label: t('dmgBonus'), fmt: v => `${t('dmgBonus')} ${formatPercentValue(v)}` },
  { key: 'defBonus', label: t('defBonus'), fmt: v => `${t('defBonus')} ${formatPercentValue(v)}` },
  { key: 'pmDefBonus', label: t('pmDefBonus'), fmt: v => `${t('pmDefBonus')} ${formatPercentValue(v)}` },
  { key: 'critMult', label: t('critMult'), fmt: v => `${t('critMult')} ${formatPercentValue(v, 1)}` },
  { key: 'eleAdvantage', label: t('eleAdvantage'), fmt: v => v ? t('eleAdvantage') : t('compareNoEleAdvantage') },
])

const DEFAULT_AXIS_CONFIG = {
  xKey: 'def',
  yKey: 'pen',
  xValsStr: '1000000, 3000000, 5000000, 10000000, 20000000, 50000000',
  yValsStr: '0, 4950, 11950, 18950',
}

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

const formatNumber = value => Number(value || 0).toLocaleString()

function formatPercentValue(value, fallback = 0) {
  const n = Number.isFinite(Number(value)) ? Number(value) : fallback
  return `${+(n * 100).toFixed(1)}%`
}

function normalizeBuild(build) {
  return {
    ...DEFAULT_AXIS_CONFIG,
    ...build,
  }
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
    normalizeBuild({
      id: baseId,
      name: t('buildNamePrefix') + ' 1',
      params: baseParams,
      _expanded: false
    }),
    normalizeBuild({
      id: baseId + 1,
      name: t('buildNamePrefix') + ' 2',
      params: compareParams,
      _expanded: false
    })
  ]
}

const ts = reactive({
  builds: createDefaultBuilds(),
  metric: 'dmgRatePct',
  summaryFields: ['pen', 'pmPen'],
  customTitle: '',
  isTitleTouched: false,
})

function getVariableLabel(key) {
  return TABLE_VARIABLES.value.find(v => v.key === key)?.label || key
}

const defaultTitle = computed(() => {
  const firstBuild = ts.builds[0] || DEFAULT_AXIS_CONFIG
  return t('defaultTableTitle', {
    y: getVariableLabel(firstBuild.yKey),
    x: getVariableLabel(firstBuild.xKey),
  })
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

function onBuildAtkLevelChange(build) {
  // Calculated internally
}

function onBuildDefLevelChange(build) {
  // Calculated internally
}

function setBuildDamageType(build, type) {
  build.params.damageType = type
}

function applyBuildAxisDefault(build, axis) {
  const key = axis === 'x' ? build.xKey : build.yKey
  const preset = TABLE_VARIABLES.value.find(v => v.key === key)
  if (!preset) return
  if (axis === 'x') build.xValsStr = preset.defaultValues
  else build.yValsStr = preset.defaultValues
}

function onBuildXKeyChange(build) {
  applyBuildAxisDefault(build, 'x')
}

function onBuildYKeyChange(build) {
  applyBuildAxisDefault(build, 'y')
}

function addBuild() {
  const source = ts.builds[ts.builds.length - 1]
  ts.builds.push(normalizeBuild({
    id: Date.now(),
    name: `${t('buildNamePrefix')} ${ts.builds.length + 1}`,
    params: clone(source.params),
    xKey: source.xKey,
    yKey: source.yKey,
    xValsStr: source.xValsStr,
    yValsStr: source.yValsStr,
    _expanded: false
  }))
}

function copyBuild(idx) {
  const source = ts.builds[idx]
  ts.builds.push({
    ...clone(source),
    id: Date.now(),
    name: `${source.name} ${t('compareCopySuffix')}`,
    _expanded: false,
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
  return String(str || '').split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
}

function axisSignature(build) {
  const xVals = parseVals(build.xValsStr)
  const yVals = parseVals(build.yValsStr)
  if (!xVals.length || !yVals.length || build.xKey === build.yKey) return null
  return [build.xKey, build.yKey, xVals.join(','), yVals.join(',')].join('|')
}

function buildSummaryText(build) {
  return ts.summaryFields
    .map(key => {
      const field = SUMMARY_FIELDS.value.find(f => f.key === key)
      if (!field) return ''
      return field.fmt(build.params[key])
    })
    .filter(Boolean)
    .join(' · ')
}

function percentDelta(compareVal, baseVal) {
  if (!Number.isFinite(compareVal) || !Number.isFinite(baseVal) || baseVal === 0) return null
  return ((compareVal - baseVal) / Math.abs(baseVal)) * 100
}

const tableData = computed(() => {
  if (ts.builds.length === 0) return null
  
  const tables = ts.builds.map(b => {
    const xVals = parseVals(b.xValsStr)
    const yVals = parseVals(b.yValsStr)
    if (!xVals.length || !yVals.length || b.xKey === b.yKey) return null
    return {
      build: b,
      xKey: b.xKey,
      yKey: b.yKey,
      xVals,
      yVals,
      xLabel: getVariableLabel(b.xKey),
      yLabel: getVariableLabel(b.yKey),
      signature: axisSignature(b),
      rows: buildCrossTable(xVals, yVals, b.xKey, b.yKey, b.params),
      isDiff: false,
    }
  }).filter(Boolean)
  if (!tables.length) return null
  
  const diffTables = []
  const grouped = new Map()
  for (const table of tables) {
    if (!table.signature) continue
    if (!grouped.has(table.signature)) grouped.set(table.signature, [])
    grouped.get(table.signature).push(table)
  }

  for (const groupTables of grouped.values()) {
    if (groupTables.length < 2) continue
    const baseTable = groupTables[0]
    for (let i = 1; i < groupTables.length; i++) {
      const cmpTable = groupTables[i]
      const diffRows = cmpTable.rows.map((row, rIdx) => {
        const baseRow = baseTable.rows[rIdx]
        return {
          yVal: row.yVal,
          cols: row.cols.map((col, cIdx) => {
            const baseCol = baseRow.cols[cIdx]
            const diffCols = {}
            for (const key of Object.keys(col)) {
              if (typeof col[key] === 'number') {
                diffCols[key] = percentDelta(col[key], baseCol[key])
              }
            }
            return diffCols
          })
        }
      })
      diffTables.push({
        name: `Diff: ${cmpTable.build.name} / ${baseTable.build.name}`,
        xKey: baseTable.xKey,
        yKey: baseTable.yKey,
        xVals: baseTable.xVals,
        yVals: baseTable.yVals,
        xLabel: baseTable.xLabel,
        yLabel: baseTable.yLabel,
        rows: diffRows,
        isDiff: true
      })
    }
  }

  return { tables, diffTables, allTables: [...tables, ...diffTables] }
})

function getCellStyle(val, isDiff) {
  if (!isDiff) return {}
  if (val === null || val === undefined || !Number.isFinite(val)) return { color: '#888' }
  const color = val > 0 ? '#2ecc71' : val < 0 ? '#e74c3c' : '#888'
  const fontWeight = val !== 0 ? '600' : 'normal'
  return { color, fontWeight }
}

function getCellText(val, isDiff) {
  const metric = getMetrics()[ts.metric]
  if (isDiff) {
    if (val === null || val === undefined || !Number.isFinite(val)) return '—'
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`
  }
  return metric.fmt(val)
}

function getTableHighlights(tData) {
  const cells = []
  for (const row of tData.rows) {
    row.cols.forEach((col, index) => {
      const value = col[ts.metric]
      if (typeof value !== 'number' || !Number.isFinite(value)) return
      if (tData.isDiff && value === 0) return
      cells.push({
        yVal: row.yVal,
        xVal: tData.xVals[index],
        value,
        text: getCellText(value, tData.isDiff),
        score: tData.isDiff ? Math.abs(value) : value,
      })
    })
  }
  return cells
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
}

function copyMarkdown() {
  const data = tableData.value
  if (!data) return
  
  let md = `# ${displayTitle.value}\n\n`
  data.allTables.forEach(tData => {
    md += `### ${tData.isDiff ? tData.name : tData.build.name}\n`
    if (!tData.isDiff) {
      const summary = buildSummaryText(tData.build)
      if (summary) md += `${summary}\n\n`
    }
    md += `| ${tData.yLabel} ↓ \\ ${tData.xLabel} → | ` + tData.xVals.join(' | ') + ' |\n'
    md += '| :--- | ' + tData.xVals.map(() => ':---').join(' | ') + ' |\n'
    tData.rows.forEach(r => {
      md += `| **${r.yVal}** | ` + r.cols.map(c => {
        return getCellText(c[ts.metric], tData.isDiff)
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
    if (!tData.isDiff) {
      const summary = buildSummaryText(tData.build)
      if (summary) csv += `${summary}\n`
    }
    csv += `${tData.yLabel} \\ ${tData.xLabel},` + tData.xVals.join(',') + '\n'
    tData.rows.forEach(r => {
      csv += `${r.yVal},` + r.cols.map(c => getCellText(c[ts.metric], tData.isDiff)).join(',') + '\n'
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
.export-table-summary {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary);
  font-size: var(--fs-xs);
}
.export-summary-picker {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.export-summary-option {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  color: var(--text-secondary);
  font-size: var(--fs-xs);
  cursor: pointer;
}
.export-summary-option input {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.export-metric-select {
  font-size: var(--fs-sm);
}
.export-table-heading {
  font-size: var(--fs-lg);
}
.mobile-export-highlights {
  display: none;
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
.export-build-card {
  padding: 10px;
  background: rgba(var(--color-invert-rgb), 0.03);
  border: 1px solid rgba(var(--color-invert-rgb), 0.06);
  border-radius: var(--r-sm);
}
.export-build-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}
.export-build-head.expanded {
  margin-bottom: 12px;
}
.export-build-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.export-icon-btn {
  width: 34px;
  min-width: 34px;
  min-height: 34px;
  padding: 0 !important;
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
    width: auto;
    min-width: 0;
  }
  .export-summary-picker {
    grid-template-columns: 1fr;
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
  .mobile-export-highlights {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }
  .mobile-export-cell {
    min-width: 0;
    padding: 9px 10px;
    border-radius: var(--r-sm);
    background: rgba(var(--color-invert-rgb), 0.035);
    border: 1px solid rgba(var(--color-invert-rgb), 0.05);
  }
  .mobile-export-cell-value {
    font-family: var(--font-mono);
    font-weight: 800;
    font-size: var(--fs-md);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }
  .mobile-export-cell-label {
    margin-top: 3px;
    color: var(--text-muted);
    font-size: var(--fs-xs);
    line-height: 1.35;
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
