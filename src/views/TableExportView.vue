<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('tableTitle') }}</h1>
    <p class="view-desc">{{ $t('tableDesc') }}</p>
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start">
    <div class="flex-col gap-12">
      <!-- Variables -->
      <div class="card">
        <div class="card-title">{{ $t('exportVariables') || '📐 Variables' }}</div>
        
        <div class="form-group">
          <label class="form-label">{{ $t('exportXAxis') || 'X Axis' }}</label>
          <select class="form-select" v-model="ts.xKey" @change="onXKeyChange">
            <option v-for="v in TABLE_VARIABLES" :key="v.key" :value="v.key">{{ v.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('exportXValues') || 'X Values' }} <span class="text-xs text-muted">{{ $t('exportCommaSeparated') || '(comma separated)' }}</span></label>
          <textarea class="form-input" v-model="ts.xValsStr" rows="2" style="resize:vertical"></textarea>
        </div>

        <div class="divider"></div>

        <div class="form-group">
          <label class="form-label">{{ $t('exportYAxis') || 'Y Axis' }}</label>
          <select class="form-select" v-model="ts.yKey" @change="onYKeyChange">
            <option v-for="v in TABLE_VARIABLES" :key="v.key" :value="v.key">{{ v.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('exportYValues') || 'Y Values' }} <span class="text-xs text-muted">{{ $t('exportCommaSeparated') || '(comma separated)' }}</span></label>
          <textarea class="form-input" v-model="ts.yValsStr" rows="2" style="resize:vertical"></textarea>
        </div>
      </div>

      <!-- Builds Configuration -->
      <div class="card">
        <div class="card-title">{{ $t('exportBuildsConfig') || '⚙ Builds Configuration' }}</div>
        <div class="flex-col gap-8">
          <div 
            v-for="(b, i) in ts.builds" 
            :key="b.id"
            style="padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:6px;"
          >
            <div :style="{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: b._expanded ? '12px' : '0' }">
              <input class="form-input" style="font-weight:bold;width:130px;padding:2px 8px;font-size: 16px" v-model="b.name">
              <div style="display:flex;gap:4px">
                <button class="btn btn-secondary btn-sm" @click="b._expanded = !b._expanded" style="padding:4px 8px;font-size: 14px">
                  {{ b._expanded ? '▲' : '▼ ' + ($t('ui_details') || 'Details') }}
                </button>
                <button v-if="ts.builds.length > 1" class="btn btn-ghost btn-sm" @click="removeBuild(i)" style="padding:4px 8px">🗑</button>
              </div>
            </div>
            
            <div v-show="b._expanded" style="padding-top:12px;border-top:1px dashed rgba(255,255,255,0.1);display:flex;flex-direction:column;gap:8px;">
              <!-- 攻击类型 + 面板攻击力 -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:end;">
                <div class="form-group">
                  <label class="form-label text-xs">{{ $t('atkType') }}</label>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-sm" :class="b.params.damageType === 'phys' ? 'btn-primary' : 'btn-ghost'" style="flex:1;font-size:11px;padding:5px 2px;" @click="setBuildDamageType(b, 'phys')">{{ $t('typePhys') }}</button>
                    <button class="btn btn-sm" :class="b.params.damageType === 'mag' ? 'btn-primary' : 'btn-ghost'" style="flex:1;font-size:11px;padding:5px 2px;" @click="setBuildDamageType(b, 'mag')">{{ $t('typeMag') }}</button>
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
        <button class="btn btn-secondary btn-sm w-full mt-8" @click="addBuild">+ {{ $t('addBuild') || 'Add Build' }}</button>
        <button class="btn btn-ghost btn-sm w-full mt-4" @click="resetDefault">{{ $t('exportResetDefault') || 'Reset to Default' }}</button>
      </div>
    </div>

    <!-- Main Output -->
    <div class="flex-col gap-12" style="min-width:0">
      <div class="card" style="overflow:hidden; display:flex; flex-direction:column;">
        <div class="flex justify-between items-center mb-12" style="flex-wrap:wrap; gap:12px;">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size: 16px;font-weight:600;color:var(--gold)">📊 {{ $t('tableTitle') }}</span>
            <select class="form-select" v-model="ts.metric" style="width:140px;padding:4px 8px;font-size: 14px;min-height:28px">
              <option v-for="(v, k) in getMetrics()" :key="k" :value="k">{{ v.label }}</option>
            </select>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost btn-sm" @click="copyMarkdown">Markdown</button>
            <button class="btn btn-ghost btn-sm" @click="downloadCsv">{{ $t('copyCSV') }}</button>
          </div>
        </div>
        
        <div style="display:flex;flex-direction:column;gap:32px;overflow-x:auto" v-if="tableData">
          <div 
            v-for="(tData, index) in tableData.allTables" 
            :key="index"
            style="background:rgba(0,0,0,0.1); border-radius:8px; padding:12px; border:1px solid rgba(255,255,255,0.05)"
          >
            <div style="font-size: 17px;font-weight:600;margin-bottom:12px">
              <span v-if="tData.isDiff" style="color:var(--purple-light)">⚖ {{ tData.name }}</span>
              <span v-else style="color:var(--gold)">📊 {{ tData.build.name }}</span>
            </div>
            <div style="overflow-x:auto">
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
import { getCoeffByLevel } from '../constants/levelTable.js'
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

const getBaseParams = () => {
  const p = { ...store.$state }
  delete p.cPen
  delete p.cPmPen
  delete p.cDef
  delete p.cPmDef
  return p
}

const ts = reactive({
  xKey: 'def',
  yKey: 'pen',
  xValsStr: '1000000, 3000000, 5000000, 10000000, 20000000, 50000000',
  yValsStr: '0, 4950, 11950, 18950',
  builds: [
    {
      id: Date.now(),
      name: t('buildNamePrefix') + ' 1',
      params: getBaseParams(),
      _expanded: false
    },
    {
      id: Date.now() + 1,
      name: t('buildNamePrefix') + ' 2',
      params: { ...getBaseParams(), pmPen: 47700 },
      _expanded: false
    }
  ],
  metric: 'dmgRatePct',
})

const xLabel = computed(() => TABLE_VARIABLES.value.find(v => v.key === ts.xKey)?.label || ts.xKey)
const yLabel = computed(() => TABLE_VARIABLES.value.find(v => v.key === ts.yKey)?.label || ts.yKey)

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

function removeBuild(idx) {
  ts.builds.splice(idx, 1)
}

function resetDefault() {
  ts.builds = [
    {
      id: Date.now(),
      name: t('buildNamePrefix') + ' 1',
      params: getBaseParams(),
      _expanded: false
    },
    {
      id: Date.now() + 1,
      name: t('buildNamePrefix') + ' 2',
      params: { ...getBaseParams(), pmPen: 47700 },
      _expanded: false
    }
  ]
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
  
  let md = ''
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
  navigator.clipboard.writeText(md).then(() => alert(t('copied') || 'Copied!'))
}

function downloadCsv() {
  const data = tableData.value
  if (!data) return
  
  let csv = ''
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
  a.download = `mmt_export_${ts.xKey}_${ts.yKey}.csv`
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
</style>
