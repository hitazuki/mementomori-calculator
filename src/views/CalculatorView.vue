<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('calcTitle') }}</h1>
    <p class="view-desc">{{ $t('calcDesc') }}</p>
    
    <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 12px;">
      <button class="btn btn-secondary btn-sm" @click="showFormulaModal = true">
        <span style="font-size: 16px;">💡</span> {{ $t('calcFormulaBtn') }}
      </button>
      <button 
        v-for="preset in scenarioPresets" 
        :key="preset.id"
        class="chip" 
        :title="preset.desc"
        @click="applyPreset(preset)"
      >
        {{ preset.label }}
      </button>

      <div style="width: 1px; height: 14px; background: var(--border-subtle); margin: 0 4px;"></div>
      
      <span style="font-size: var(--fs-xs); opacity: 0.8;">
        🔗 {{ $t('pveDataEntry') }}: <a href="https://mmmr.huijiwiki.com" target="_blank" rel="noopener noreferrer" style="color:var(--gold);text-decoration:underline;">https://mmmr.huijiwiki.com</a>
      </span>
    </div>
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <div class="flex-col gap-12">
      <!-- 攻击方 -->
      <div class="card">
        <div class="card-title">{{ $t('atkParams') }}</div>
        
        <div class="form-group">
          <label class="form-label" style="display:flex;justify-content:space-between">
            <span>{{ $t('atkLevel') }}</span>
            <span class="text-xs text-muted" v-show="isAtkCustom">{{ $t('ui_custom') }}</span>
          </label>
          <input class="form-input" type="number" v-model.number="store.atkLevel" @input="onAtkLevelChange" min="1" max="999">
        </div>
        
        <div class="text-xs text-muted mb-8">{{ $t('cPenDefLabel') }}</div>
        <div class="grid-2 items-end">
          <div class="form-group">
            <label class="form-label">{{ $t('cPenConst') }}</label>
            <BigNumberInput class="form-input" v-model="store.cPen" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('cPmPenConst') }}</label>
            <BigNumberInput class="form-input" v-model="store.cPmPen" />
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="form-group">
          <label class="form-label">{{ $t('baseAtk') }}</label>
          <BigNumberInput class="form-input" v-model="store.baseAtk" />
        </div>
        
        <div class="form-group">
          <label class="form-label" style="display:flex;justify-content:space-between">
            <span>{{ $t('skillCoeff') }}</span>
            <div style="display:flex;align-items:center;gap:1px">
              <input class="inline-num" type="number" step="0.5" :value="+(store.skillCoeff*100).toFixed(1)" @change="e => store.skillCoeff = parseFloat(e.target.value)/100||0">
              <span class="value-display">%</span>
            </div>
          </label>
          <input class="form-range" type="range" v-model.number="store.skillCoeff" min="1" max="20" step="0.05">
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ $t('atkType') }}</label>
          <div class="segmented-control">
            <button class="btn btn-sm" :class="store.damageType === 'phys' ? 'btn-primary' : 'btn-ghost'" @click="setDamageType('phys')">{{ $t('typePhys') }}</button>
            <button class="btn btn-sm" :class="store.damageType === 'mag' ? 'btn-primary' : 'btn-ghost'" @click="setDamageType('mag')">{{ $t('typeMag') }}</button>
          </div>
        </div>
        
        <div class="grid-2 items-end">
          <div class="form-group">
            <label class="form-label">{{ $t('pen') }}</label>
            <BigNumberInput class="form-input" v-model="store.pen" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('pmPen') }}</label>
            <BigNumberInput class="form-input" v-model="store.pmPen" />
          </div>
        </div>
        
        <div class="grid-2 items-end">
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between">
              <span>{{ $t('atkBonus') }}</span>
              <div style="display:flex;align-items:center;gap:1px">
                <input class="inline-num" type="number" step="0.5" :value="+(store.atkBonus*100).toFixed(1)" @change="e => store.atkBonus = parseFloat(e.target.value)/100||0">
                <span class="value-display">%</span>
              </div>
            </label>
            <input class="form-range" type="range" v-model.number="store.atkBonus" min="-1.0" max="2.5" step="0.05">
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between">
              <span>{{ $t('dmgBonus') }}</span>
              <div style="display:flex;align-items:center;gap:1px">
                <input class="inline-num" type="number" step="0.5" :value="+(store.dmgBonus*100).toFixed(1)" @change="e => store.dmgBonus = parseFloat(e.target.value)/100||0">
                <span class="value-display">%</span>
              </div>
            </label>
            <input class="form-range" type="range" v-model.number="store.dmgBonus" min="-1.0" max="2.0" step="0.05">
          </div>
        </div>
        
        <div class="grid-2 items-end">
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between">
              <span>{{ $t('critMult') }}</span>
              <div style="display:flex;align-items:center;gap:1px">
                <input class="inline-num" type="number" step="0.5" :value="+(store.critMult*100).toFixed(1)" @change="e => store.critMult = parseFloat(e.target.value)/100||0">
                <span class="value-display">%</span>
              </div>
            </label>
            <input class="form-range" type="range" v-model.number="store.critMult" min="1.0" max="5" step="0.05">
          </div>
          <div class="form-group" style="display:flex;align-items:center;padding-bottom:6px">
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
            <span class="text-xs text-muted" v-show="isDefCustom">{{ $t('ui_custom') }}</span>
          </label>
          <input class="form-input" type="number" v-model.number="store.defLevel" @input="onDefLevelChange" min="1" max="999">
        </div>
        
        <div class="text-xs text-muted mb-8">{{ $t('cDefDefLabel') }}</div>
        <div class="grid-2 items-end">
          <div class="form-group">
            <label class="form-label">{{ $t('cDefConst') }}</label>
            <BigNumberInput class="form-input" v-model="store.cDef" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('cPmDefConst') }}</label>
            <BigNumberInput class="form-input" v-model="store.cPmDef" />
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="grid-2 items-end">
          <div class="form-group">
            <label class="form-label">{{ $t('targetDef') }}</label>
            <BigNumberInput class="form-input" v-model="store.def" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ store.damageType === 'phys' ? $t('targetPhysDef') : $t('targetMagDef') }}</label>
            <BigNumberInput class="form-input" v-model="store.pmDef" />
          </div>
        </div>
        
        <div class="grid-2 items-end">
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between">
              <span>{{ $t('defBonus') }}</span>
              <div style="display:flex;align-items:center;gap:1px">
                <input class="inline-num" type="number" step="0.5" :value="+(store.defBonus*100).toFixed(1)" @change="e => store.defBonus = parseFloat(e.target.value)/100||0">
                <span class="value-display">%</span>
              </div>
            </label>
            <input class="form-range" type="range" v-model.number="store.defBonus" min="-1.0" max="2.5" step="0.05">
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between">
              <span>{{ $t('pmDefBonus') }}</span>
              <div style="display:flex;align-items:center;gap:1px">
                <input class="inline-num" type="number" step="0.5" :value="+(store.pmDefBonus*100).toFixed(1)" @change="e => store.pmDefBonus = parseFloat(e.target.value)/100||0">
                <span class="value-display">%</span>
              </div>
            </label>
            <input class="form-range" type="range" v-model.number="store.pmDefBonus" min="-1.0" max="2.5" step="0.05">
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧结果 -->
    <div class="flex-col gap-12 mobile-static-panel">
      <div class="card mobile-summary-card">
        <div class="mobile-summary-grid">
          <div class="mobile-summary-primary">
            <div class="mobile-summary-value">{{ fmt(results.finalDmg) }}</div>
            <div class="mobile-summary-label">{{ $t('finalDmg') }}</div>
          </div>
          <div class="mobile-summary-secondary">
            <div class="mobile-summary-chip">
              <b>{{ results.dmgRatePct }}%</b>
              <span>{{ $t('overallPenRate') }}</span>
            </div>
            <div class="mobile-summary-chip">
              <b>{{ results.totalMitPct }}%</b>
              <span>{{ $t('totalMitRate') }}</span>
            </div>
            <div class="mobile-summary-chip">
              <b>{{ fmt(results.rawDmg) }}</b>
              <span>{{ $t('rawDmg') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-2 gap-12 desktop-summary-grid">
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
        <div class="quick-mobile-grid">
          <div v-for="item in quickDefHighlights" :key="`def-${item.pen}-${item.def}`" class="quick-mobile-cell" :class="getCellClass(item.value)">
            <b>{{ item.value }}%</b>
            <span>{{ $t('pen') }} {{ item.pen.toLocaleString() }} · {{ $t('targetDef') }} {{ fmt(item.def) }}</span>
          </div>
        </div>
        <div class="mobile-table-scroll quick-desktop-table" style="overflow-x:auto">
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
        <div class="quick-mobile-grid">
          <div v-for="item in quickPmHighlights" :key="`pm-${item.pmPen}-${item.pmDef}`" class="quick-mobile-cell" :class="getCellClass(item.value)">
            <b>{{ item.value }}%</b>
            <span>{{ $t('pmPen') }} {{ item.pmPen.toLocaleString() }} · {{ store.damageType === 'phys' ? $t('targetPhysDef') : $t('targetMagDef') }} {{ fmt(item.pmDef) }}</span>
          </div>
        </div>
        <div class="mobile-table-scroll quick-desktop-table" style="overflow-x:auto">
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

  <!-- Formula Explanation Modal -->
  <Teleport to="body">
    <div class="modal-overlay" :class="{ active: showFormulaModal }" @click.self="showFormulaModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">{{ $t('formulaModalTitle') }}</div>
          <button class="modal-close" @click="showFormulaModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ $t('formulaModalP1') }}</p>
          
          <h3>{{ $t('formulaModalH1') }}</h3>
          <ul style="list-style-type:none; margin-left:0; padding-left:12px; border-left:2px solid var(--border-subtle); margin-bottom: 20px;">
            <li><code>ATK</code> : {{ $t('baseAtk') }}</li>
            <li><code>S_coeff</code> : {{ $t('skillCoeff') }}</li>
            <li><code>ATK_bonus</code> : {{ $t('atkBonus') }}</li>
            <li><code>D_raw</code> : {{ $t('rawDmg') }}</li>
            <li><code>Bonus</code> : {{ $t('dmgBonus') }}</li>
            <li><code>Ele_Adv</code> : {{ $t('eleAdvantage') }} ({{ $t('formulaModalEleTrigger') }})</li>
            <li><code>B_dmg</code> : {{ $t('formulaModalBdmgDesc') }}</li>
            <li><code>C_dmg</code> : {{ $t('critMult') }}</li>
            <li><code>DEF</code> / <code>PM_DEF</code> : {{ $t('targetDef') }} / {{ $t('formulaModalTargetPmDef') }}</li>
            <li><code>PEN</code> / <code>PM_PEN</code> : {{ $t('pen') }} / {{ $t('pmPen') }}</li>
            <li><code>C_def</code> / <code>C_pmdef</code> : {{ $t('cDefConst') }} / {{ $t('cPmDefConst') }}</li>
            <li><code>C_pen</code> / <code>C_pmpen</code> : {{ $t('cPenConst') }} / {{ $t('cPmPenConst') }}</li>
            <li><code>DEF_eff</code> / <code>PM_DEF_eff</code> : {{ $t('effDef') }} / {{ $t('effPmDef') }}</li>
            <li><code>R_def</code> / <code>R_pmdef</code> : {{ $t('formulaModalRdefDesc') }}</li>
            <li><code>R_total</code> : {{ $t('formulaModalRtotalDesc') }}</li>
            <li><code>D_final</code> : {{ $t('finalDmg') }}</li>
          </ul>
          
          <h3>{{ $t('formulaModalH2') }}</h3>
          <code class="formula-highlight">D_raw = ATK × (1 + ATK_bonus) × S_coeff</code>
          <code class="formula-highlight">B_dmg = 1 + Bonus + (Ele_Adv × 0.25)</code>
          
          <h3>{{ $t('formulaModalH3') }}</h3>
          <code class="formula-highlight">DEF_eff = DEF × [ C_pen / (PEN + C_pen) ]</code>
          <code class="formula-highlight">R_def = C_def / (DEF_eff + C_def)</code>
          
          <h3>{{ $t('formulaModalH4') }}</h3>
          <code class="formula-highlight">PM_DEF_eff = PM_DEF × [ C_pmpen / (PM_PEN + C_pmpen) ]</code>
          <code class="formula-highlight">R_pmdef = C_pmdef / (PM_DEF_eff + C_pmdef)</code>
          
          <h3>{{ $t('formulaModalH5') }}</h3>
          <code class="formula-highlight">R_total = R_def × R_pmdef</code>
          <code class="formula-highlight">D_final = D_raw × B_dmg × C_dmg × R_total</code>
          
          <p style="margin-top:16px; font-size: var(--fs-sm); color:var(--text-muted);">{{ $t('formulaModalNote') }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BigNumberInput from '../components/BigNumberInput.vue'
import { useCalcStore } from '../store/calculator.js'
import { calcDamage } from '../engine/damageCalc.js'
import { getScenarioPresets } from '../constants/presets.js'
import { useDamageParams } from '../composables/useDamageParams.js'

const { t } = useI18n()
const store = useCalcStore()

const showFormulaModal = ref(false)

const scenarioPresets = computed(() => getScenarioPresets())

function fmt(n) { return n >= 1e6 ? `${(n/1e6).toFixed(2)}M` : n >= 1e3 ? `${(n/1e3).toFixed(0)}K` : String(n) }
function fmtPct(v, d=1) { return `${(v*100).toFixed(d)}%` }

// Computed Results
const results = computed(() => calcDamage(store.$state))

const {
  isAtkCustom,
  isDefCustom,
  onAtkLevelChange,
  onDefLevelChange,
  setDamageType,
} = useDamageParams(store)

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

const quickDefHighlights = computed(() => {
  const pairs = [
    { pen: store.pen, def: store.def },
    { pen: 0, def: store.def },
    { pen: 11950, def: 5e6 },
    { pen: 18950, def: 10e6 },
  ]
  return pairs.map(item => ({ ...item, value: getQuickDmg(item.pen, item.def).defMitPct }))
})

const quickPmHighlights = computed(() => {
  const pairs = [
    { pmPen: store.pmPen, pmDef: store.pmDef },
    { pmPen: 0, pmDef: store.pmDef },
    { pmPen: 31200, pmDef: 10e6 },
    { pmPen: 47700, pmDef: 20e6 },
  ]
  return pairs.map(item => ({ ...item, value: getQuickPmDmg(item.pmPen, item.pmDef).pmMitPct }))
})

function getCellClass(val) {
  if (val < 40) return 'cell-high'
  if (val > 70) return 'cell-low'
  return ''
}
</script>

<style scoped>
.quick-mobile-grid {
  display: none;
}

@media (max-width: 560px) {
  .quick-desktop-table {
    display: none;
  }
  .quick-mobile-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .quick-mobile-cell {
    min-width: 0;
    padding: 9px 10px;
    border-radius: var(--r-sm);
    background: rgba(var(--color-invert-rgb), 0.035);
    border: 1px solid rgba(var(--color-invert-rgb), 0.05);
  }
  .quick-mobile-cell b {
    display: block;
    color: var(--gold);
    font-family: var(--font-mono);
    font-size: var(--fs-md);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }
  .quick-mobile-cell span {
    display: block;
    margin-top: 3px;
    color: var(--text-muted);
    font-size: var(--fs-xs);
    line-height: 1.35;
  }
}
</style>
