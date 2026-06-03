<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('calcTitle') }}</h1>
    <p class="view-desc">{{ $t('calcDesc') }}</p>
  </div>

  <div class="chip-row animate-fadeup">
    <button 
      v-for="preset in scenarioPresets" 
      :key="preset.id"
      class="chip" 
      :title="preset.desc"
      @click="applyPreset(preset)"
    >
      {{ preset.label }}
    </button>
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <div class="flex-col gap-12">
      <!-- 攻击方 -->
      <div class="card">
        <div class="card-title">{{ $t('atkParams') }}</div>
        
        <div class="form-group">
          <label class="form-label" style="display:flex;justify-content:space-between">
            <span>{{ $t('atkLevel') }}</span>
            <span class="text-xs text-muted" v-show="isAtkCustom">(Custom)</span>
          </label>
          <input class="form-input" type="number" v-model.number="store.atkLevel" @input="onAtkLevelChange" min="1" max="999">
        </div>
        
        <div class="text-xs text-muted mb-8">{{ $t('cPenDefLabel') }}</div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">{{ $t('cPenConst') }} <span class="value-display">{{ store.cPen }}</span></label>
            <input class="form-input" type="number" v-model.number="store.cPen" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('cPmPenConst') }} <span class="value-display">{{ store.cPmPen }}</span></label>
            <input class="form-input" type="number" v-model.number="store.cPmPen" min="1">
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="form-group">
          <label class="form-label">{{ $t('baseAtk') }} <span class="value-display">{{ fmt(store.baseAtk) }}</span></label>
          <input class="form-input" type="number" v-model.number="store.baseAtk" min="0">
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ $t('skillCoeff') }} <span class="value-display">{{ fmtPct(store.skillCoeff, 0) }}</span></label>
          <input class="form-range" type="range" v-model.number="store.skillCoeff" min="1" max="20" step="0.25">
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ $t('atkType') }}</label>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm" :class="store.damageType === 'phys' ? 'btn-primary' : 'btn-ghost'" style="flex:1" @click="setDamageType('phys')">{{ $t('typePhys') }}</button>
            <button class="btn btn-sm" :class="store.damageType === 'mag' ? 'btn-primary' : 'btn-ghost'" style="flex:1" @click="setDamageType('mag')">{{ $t('typeMag') }}</button>
          </div>
        </div>
        
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">{{ $t('pen') }} <span class="value-display">{{ store.pen.toLocaleString() }}</span></label>
            <input class="form-input" type="number" v-model.number="store.pen" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('pmPen') }} <span class="value-display">{{ store.pmPen.toLocaleString() }}</span></label>
            <input class="form-input" type="number" v-model.number="store.pmPen" min="0">
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ $t('dmgBonus') }} <span class="value-display">{{ fmtPct(store.dmgBonus) }}</span></label>
          <input class="form-range" type="range" v-model.number="store.dmgBonus" min="-1.0" max="2.0" step="0.05">
        </div>
        
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">{{ $t('critMult') }} <span class="value-display">{{ fmtPct(store.critMult) }}</span></label>
            <input class="form-range" type="range" v-model.number="store.critMult" min="1.0" max="5" step="0.1">
          </div>
          <div class="form-group" style="display:flex;align-items:center;padding-top:28px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" v-model="store.eleAdvantage" style="width:18px;height:18px">
              <span class="form-label" style="margin:0">{{ $t('eleAdvantage') }} (+25%)</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 防守方 -->
      <div class="card">
        <div class="card-title">{{ $t('defParams') }}</div>
        
        <div class="form-group">
          <label class="form-label" style="display:flex;justify-content:space-between">
            <span>{{ $t('defLevel') || $t('defPresetLabel') }}</span>
            <span class="text-xs text-muted" v-show="isDefCustom">(Custom)</span>
          </label>
          <input class="form-input" type="number" v-model.number="store.defLevel" @input="onDefLevelChange" min="1" max="999">
        </div>
        
        <div class="text-xs text-muted mb-8">{{ $t('cDefDefLabel') }}</div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">{{ $t('cDefConst') }} <span class="value-display">{{ store.cDef.toLocaleString() }}</span></label>
            <input class="form-input" type="number" v-model.number="store.cDef" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('cPmDefConst') }} <span class="value-display">{{ store.cPmDef.toLocaleString() }}</span></label>
            <input class="form-input" type="number" v-model.number="store.cPmDef" min="1">
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">{{ $t('targetDef') }}</label>
            <input class="form-input" type="number" v-model.number="store.def" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">{{ store.damageType === 'phys' ? $t('targetPhysDef') : $t('targetMagDef') }}</label>
            <input class="form-input" type="number" v-model.number="store.pmDef" min="0">
          </div>
        </div>
        
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">{{ $t('defBonus') }} <span class="value-display">{{ fmtPct(store.defBonus) }}</span></label>
            <input class="form-range" type="range" v-model.number="store.defBonus" min="-1.0" max="2.5" step="0.05">
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('pmDefBonus') }} <span class="value-display">{{ fmtPct(store.pmDefBonus) }}</span></label>
            <input class="form-range" type="range" v-model.number="store.pmDefBonus" min="-1.0" max="2.5" step="0.05">
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧结果 -->
    <div class="flex-col gap-12">
      <div class="grid-2 gap-12">
        <div class="stat-box"><div class="stat-value is-danger">{{ fmt(results.finalDmg) }}</div><div class="stat-label">{{ $t('finalDmg') }}</div></div>
        <div class="stat-box"><div class="stat-value">{{ results.dmgRatePct }}%</div><div class="stat-label">{{ $t('overallPenRate') }}</div></div>
        <div class="stat-box"><div class="stat-value is-purple">{{ results.defMitPct }}%</div><div class="stat-label">{{ $t('defMitRate') }}</div></div>
        <div class="stat-box"><div class="stat-value is-info">{{ results.pmMitPct }}%</div><div class="stat-label">{{ $t('pmMitRate') }}</div></div>
        <div class="stat-box"><div class="stat-value">{{ fmt(results.rawDmg) }}</div><div class="stat-label">{{ $t('rawDmg') }}</div></div>
        <div class="stat-box"><div class="stat-value is-success">{{ results.totalMitPct }}%</div><div class="stat-label">{{ $t('totalMitRate') }}</div></div>
        <div class="stat-box"><div class="stat-value">{{ fmt(results.effectiveDef) }}</div><div class="stat-label">{{ $t('effDef') }}</div></div>
        <div class="stat-box"><div class="stat-value">{{ fmt(results.effectivePmDef) }}</div><div class="stat-label">{{ $t('effPmDef') }}</div></div>
      </div>

      <div class="card">
        <div class="card-title">{{ $t('dmgBreakdown') }}</div>
        <div class="breakdown-list">
          <template v-for="(step, i) in breakdownSteps" :key="i">
            <div class="breakdown-item">
              <span class="breakdown-label">
                <span :style="{width:'8px',height:'8px',borderRadius:'50%',background:step.color,display:'inline-block',flexShrink:0}"></span>
                {{ step.label }}
              </span>
              <span class="breakdown-value" :style="{color:step.color}">{{ fmt(Math.round(step.val)) }}</span>
            </div>
            <div v-if="i < breakdownSteps.length - 1" class="breakdown-bar" :style="{width: Math.min(100, (step.val/results.rawDmg*100)) + '%', background: 'linear-gradient(90deg,'+step.color+',transparent)'}"></div>
          </template>
        </div>
      </div>

      <div class="card">
        <div class="card-title">{{ $t('quickTableTitle') }}</div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ $t('quickTableHeadX') }}</th>
                <th v-for="d in defVals" :key="d">{{ fmt(d) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pen in penVals" :key="pen">
                <td>{{ pen.toLocaleString() }}</td>
                <td v-for="d in defVals" :key="d" :class="getCellClass(getQuickDmg(pen, d).defMitPct)">
                  {{ getQuickDmg(pen, d).defMitPct }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="card-title mt-12" style="margin-top:16px">{{ $t('quickTablePmTitle') }}</div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ $t('quickTableHeadXPm') || $t('quickTableHeadX') }}</th>
                <th v-for="d in pmDefVals" :key="d">{{ fmt(d) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pmPen in pmPenVals" :key="pmPen">
                <td>{{ pmPen.toLocaleString() }}</td>
                <td v-for="d in pmDefVals" :key="d" :class="getCellClass(getQuickPmDmg(pmPen, d).pmMitPct)">
                  {{ getQuickPmDmg(pmPen, d).pmMitPct }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-muted mt-8">{{ $t('quickTableDesc') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCalcStore } from '../store/calculator.js'
import { calcDamage } from '../engine/damageCalc.js'
import { getCoeffByLevel } from '../constants/levelTable.js'
import { getScenarioPresets } from '../constants/presets.js'

const { t } = useI18n()
const store = useCalcStore()

const scenarioPresets = getScenarioPresets()

function fmt(n) { return n >= 1e6 ? `${(n/1e6).toFixed(2)}M` : n >= 1e3 ? `${(n/1e3).toFixed(0)}K` : String(n) }
function fmtPct(v, d=1) { return `${(v*100).toFixed(d)}%` }

// Computed Results
const results = computed(() => calcDamage(store.$state))

const isAtkCustom = computed(() => {
  const pA = getCoeffByLevel(store.atkLevel)
  return store.cPen !== pA.cPen || store.cPmPen !== pA.cPmPen
})

const isDefCustom = computed(() => {
  const pD = getCoeffByLevel(store.defLevel)
  return store.cDef !== pD.cDef || store.cPmDef !== (store.damageType === 'mag' ? pD.cMdef : pD.cPdef)
})

const breakdownSteps = computed(() => {
  const base = results.value.rawDmg
  const actualDmgBonus = store.dmgBonus + (store.eleAdvantage ? 0.25 : 0)
  const afterBonus = base * (1 + actualDmgBonus)
  const afterDef   = afterBonus * results.value.drDef
  const afterPm    = afterDef   * results.value.drPm
  const afterCrit  = afterPm    * store.critMult

  return [
    { label: t('rawDmg'), val: base, color: '#c9a84c' },
    { label: `${t('addBonus')} (+${fmtPct(actualDmgBonus)})`, val: afterBonus, color: '#e8c96a' },
    { label: `${t('mulDefPass')} (${results.value.defDmgPct}%)`, val: afterDef, color: '#9b59b6' },
    { label: `${t('mulPmPass')} (${results.value.pmDmgPct}%)`, val: afterPm, color: '#3498db' },
    { label: `${t('mulCrit')} (${fmtPct(store.critMult)})`, val: afterCrit, color: '#e07820' },
  ]
})

// Methods
function applyPreset(preset) {
  store.$patch(preset.params)
  if (!preset.params.atkLevel) store.atkLevel = 500
  if (!preset.params.defLevel) store.defLevel = 500
}

function setDamageType(type) {
  store.damageType = type
  const p = getCoeffByLevel(store.defLevel)
  if (p) {
    if (!isDefCustom.value) {
      store.cPmDef = type === 'mag' ? p.cMdef : p.cPdef
    }
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

// Tables
const penVals = [0, 4950, 11950, 18950]
const defVals = [1e6, 3e6, 5e6, 10e6, 20e6]
const pmPenVals = [0, 18750, 31200, 47700, 65700]
const pmDefVals = [1e6, 5e6, 10e6, 20e6, 50e6]

function getQuickDmg(pen, def) {
  return calcDamage({ ...store.$state, pen, def })
}

function getQuickPmDmg(pmPen, pmDef) {
  return calcDamage({ ...store.$state, pmPen, pmDef })
}

function getCellClass(val) {
  if (val < 40) return 'cell-high'
  if (val > 70) return 'cell-low'
  return ''
}
</script>
