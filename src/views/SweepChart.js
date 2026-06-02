// src/views/SweepChart.js
import { buildSweepData } from '../engine/damageCalc.js'
import { getSweepVariables } from '../constants/presets.js'
import { getLevelPresets } from '../constants/levelTable.js'
import { MORI_THEME, LINE_COLORS, baseChartOption } from '../utils/chartTheme.js'
import { t } from '../i18n/index.js'

let sweepChart = null

const DEFAULT_PARAMS = {
  baseAtk: 1_000_000, skillCoeff: 5.25,
  def: 5_000_000, pmDef: 5_000_000,
  pen: 11950, pmPen: 31200,
  cDef: 834953, cPmDef: 1382434, cPen: 1725, cPmPen: 16660,
  dmgBonus: 0.3, defDebuff: 0, critMult: 1.5, factionBonus: 1.0, damageType: 'phys',
}
let ss = {
  sweepKey: 'pen',
  min: 0, max: 20000, steps: 21,
  baseParams: { ...DEFAULT_PARAMS },
  showMit: true,
  atkLevelPresetIdx: 4, // 默认 Lv500
  defLevelPresetIdx: 4,
}

const fmt = v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(Math.round(v))

export function renderSweepChart(container) {
  const SWEEP_VARIABLES = getSweepVariables()
  const LEVEL_PRESETS = getLevelPresets()

  container.innerHTML = `
  <div class="view-header animate-fadeup">
    <h1 class="view-title">${t('sweepTitle')}</h1>
    <p class="view-desc">${t('sweepDesc')}</p>
  </div>
  <div class="grid-sidebar-right animate-fadeup" style="height:calc(100vh - 110px)">
    <div class="card" style="height:100%;display:flex;flex-direction:column">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="card-title" style="margin:0">${t('overallPenRate')}</div>
        <button class="btn btn-ghost btn-sm" id="sc-download">⬇ PNG</button>
      </div>
      <div id="sweep-chart" style="flex:1;min-height:400px"></div>
    </div>
    
    <div class="flex-col gap-12" style="overflow-y:auto">
      <div class="card">
        <div class="card-title">🔍 ${t('scanRange')}</div>
        <div class="form-group">
          <label class="form-label">${t('scanRange')}</label>
          <select class="form-select" id="sc-sweepKey">
            ${SWEEP_VARIABLES.map(v => `<option value="${v.key}" ${ss.sweepKey===v.key?'selected':''}>${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('minPen')} <span class="value-display" id="sc-vMin">${fmt(ss.min)}</span></label>
          <input class="form-input" type="number" id="sc-min" value="${ss.min}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('maxPen')} <span class="value-display" id="sc-vMax">${fmt(ss.max)}</span></label>
          <input class="form-input" type="number" id="sc-max" value="${ss.max}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('stepSpan')} <span class="value-display" id="sc-vSteps">${ss.steps}</span></label>
          <input class="form-range" type="range" id="sc-steps" value="${ss.steps}" min="5" max="100">
        </div>
      </div>

      <div class="card">
        <div class="card-title">⚙ ${t('manualAdjust')}</div>
        <div class="form-group">
          <label class="form-label">${t('atkType')}</label>
          <div style="display:flex;gap:8px">
            <button class="btn ${ss.baseParams.damageType==='phys'?'btn-primary':'btn-ghost'} btn-sm" style="flex:1" data-type="phys">${t('typePhys')}</button>
            <button class="btn ${ss.baseParams.damageType==='mag' ?'btn-primary':'btn-ghost'} btn-sm" style="flex:1" data-type="mag">${t('typeMag')}</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${t('atkPresetLabel')}</label>
          <select class="form-select" id="sc-atkLevelPreset">
            <option value="-1" ${ss.atkLevelPresetIdx===-1?'selected':''}>${t('manualAdjust')}</option>
            ${LEVEL_PRESETS.map((p,i)=>`<option value="${i}" ${ss.atkLevelPresetIdx===i?'selected':''}>${p.label} (C_pen=${p.cPen})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('defPresetLabel')}</label>
          <select class="form-select" id="sc-defLevelPreset">
            <option value="-1" ${ss.defLevelPresetIdx===-1?'selected':''}>${t('manualAdjust')}</option>
            ${LEVEL_PRESETS.map((p,i)=>`<option value="${i}" ${ss.defLevelPresetIdx===i?'selected':''}>${p.label} (C_def=${fmt(p.cDef)})</option>`).join('')}
          </select>
        </div>
        
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">${t('targetDef')} <span class="value-display" id="sc-vDef">${fmt(ss.baseParams.def)}</span></label>
            <input class="form-input" type="number" id="sc-baseDef" value="${ss.baseParams.def}">
          </div>
          <div class="form-group">
            <label class="form-label" id="lbl-pmDef">${ss.baseParams.damageType==='phys'?t('targetPhysDef'):t('targetMagDef')} <span class="value-display" id="sc-vPmDef">${fmt(ss.baseParams.pmDef)}</span></label>
            <input class="form-input" type="number" id="sc-basePmDef" value="${ss.baseParams.pmDef}">
          </div>
          <div class="form-group">
            <label class="form-label">${t('pen')} <span class="value-display" id="sc-vPen">${fmt(ss.baseParams.pen)}</span></label>
            <input class="form-input" type="number" id="sc-basePen" value="${ss.baseParams.pen}">
          </div>
          <div class="form-group">
            <label class="form-label">${t('pmPen')} <span class="value-display" id="sc-vPmPen">${fmt(ss.baseParams.pmPen)}</span></label>
            <input class="form-input" type="number" id="sc-basePmPen" value="${ss.baseParams.pmPen}">
          </div>
        </div>
        
        <div class="text-xs text-muted mb-4 mt-8">${t('cPenDefLabel')}</div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">C_pen</label><input class="form-input" type="number" id="sc-cPen" value="${ss.baseParams.cPen}"></div>
          <div class="form-group"><label class="form-label">C_pmpen</label><input class="form-input" type="number" id="sc-cPmPen" value="${ss.baseParams.cPmPen}"></div>
        </div>
        <div class="text-xs text-muted mb-4 mt-4">${t('cDefDefLabel')}</div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">C_def</label><input class="form-input" type="number" id="sc-cDef" value="${ss.baseParams.cDef}"></div>
          <div class="form-group"><label class="form-label">C_pmdef</label><input class="form-input" type="number" id="sc-cPmDef" value="${ss.baseParams.cPmDef}"></div>
        </div>
      </div>
    </div>
  </div>`

  const chartEl = container.querySelector('#sweep-chart')
  if (chartEl && window.echarts) { if(sweepChart) sweepChart.dispose(); sweepChart = window.echarts.init(chartEl) }
  attachSweepListeners(container)
  drawSweep()
}

function attachSweepListeners(container) {
  const q = s => container.querySelector(s)
  
  q('#sc-sweepKey')?.addEventListener('change', e => {
    ss.sweepKey = e.target.value
    const SWEEP_VARIABLES = getSweepVariables()
    const preset = SWEEP_VARIABLES.find(v => v.key === ss.sweepKey)
    if (preset) {
      ss.min = preset.min; ss.max = preset.max;
      q('#sc-min').value = ss.min; q('#sc-max').value = ss.max
      q('#sc-vMin').textContent = fmt(ss.min); q('#sc-vMax').textContent = fmt(ss.max)
    }
    drawSweep()
  })

  q('#sc-min')?.addEventListener('input', e => { ss.min = parseFloat(e.target.value)||0; q('#sc-vMin').textContent=fmt(ss.min); drawSweep() })
  q('#sc-max')?.addEventListener('input', e => { ss.max = parseFloat(e.target.value)||0; q('#sc-vMax').textContent=fmt(ss.max); drawSweep() })
  q('#sc-steps')?.addEventListener('input', e => { ss.steps = parseInt(e.target.value)||20; q('#sc-vSteps').textContent=ss.steps; drawSweep() })

  const baseBinds = [
    { id:'sc-baseDef', key:'def', disp:'sc-vDef' },
    { id:'sc-basePmDef', key:'pmDef', disp:'sc-vPmDef' },
    { id:'sc-basePen', key:'pen', disp:'sc-vPen' },
    { id:'sc-basePmPen', key:'pmPen', disp:'sc-vPmPen' },
    { id:'sc-cDef', key:'cDef' },
    { id:'sc-cPmDef', key:'cPmDef' },
    { id:'sc-cPen', key:'cPen' },
    { id:'sc-cPmPen', key:'cPmPen' },
  ]
  baseBinds.forEach(b => q(`#${b.id}`)?.addEventListener('input', e => {
    ss.baseParams[b.key] = parseFloat(e.target.value)||0
    if (b.disp) { q(`#${b.disp}`).textContent = fmt(ss.baseParams[b.key]) }
    // 如果修改了常数，取消选中预设
    if (['cPen', 'cPmPen'].includes(b.key)) {
      ss.atkLevelPresetIdx = -1
      const sel = q('#sc-atkLevelPreset'); if (sel) sel.value = "-1"
    }
    if (['cDef', 'cPmDef'].includes(b.key)) {
      ss.defLevelPresetIdx = -1
      const sel = q('#sc-defLevelPreset'); if (sel) sel.value = "-1"
    }
    drawSweep()
  }))

  container.querySelectorAll('[data-type]').forEach(btn => {
    btn.addEventListener('click', e => {
      ss.baseParams.damageType = btn.dataset.type
      container.querySelectorAll('[data-type]').forEach(b => b.className = b.className.replace('btn-primary','btn-ghost'))
      btn.className = btn.className.replace('btn-ghost','btn-primary')

      const LEVEL_PRESETS = getLevelPresets()
      if (ss.defLevelPresetIdx !== -1) {
        const p = LEVEL_PRESETS[ss.defLevelPresetIdx]
        if (p) {
          ss.baseParams.cPmDef = ss.baseParams.damageType === 'mag' ? p.cMdef : p.cPdef
          const cmdEl = q('#sc-cPmDef'); if (cmdEl) cmdEl.value = ss.baseParams.cPmDef
        }
      }
      
      const titleEl = container.querySelector('#lbl-pmDef')
      if (titleEl) {
        const titleSpan = titleEl.querySelector('span');
        titleEl.textContent = ss.baseParams.damageType==='phys'?t('targetPhysDef'):t('targetMagDef')
        titleEl.appendChild(document.createTextNode(' '))
        titleEl.appendChild(titleSpan)
      }

      drawSweep()
    })
  })

  q('#sc-atkLevelPreset')?.addEventListener('change', e => {
    const idx = parseInt(e.target.value)
    ss.atkLevelPresetIdx = idx
    if (idx === -1) return
    const LEVEL_PRESETS = getLevelPresets()
    const p = LEVEL_PRESETS[idx]
    if (!p) return
    ss.baseParams.cPen = p.cPen; ss.baseParams.cPmPen = p.cPmPen
    
    const els = { cPen: '#sc-cPen', cPmPen: '#sc-cPmPen' }
    for (const [k, s] of Object.entries(els)) {
      const el = q(s); if (el) el.value = ss.baseParams[k]
    }
    drawSweep()
  })

  q('#sc-defLevelPreset')?.addEventListener('change', e => {
    const idx = parseInt(e.target.value)
    ss.defLevelPresetIdx = idx
    if (idx === -1) return
    const LEVEL_PRESETS = getLevelPresets()
    const p = LEVEL_PRESETS[idx]
    if (!p) return
    ss.baseParams.cDef = p.cDef
    ss.baseParams.cPmDef = ss.baseParams.damageType === 'mag' ? p.cMdef : p.cPdef
    
    const els = { cDef: '#sc-cDef', cPmDef: '#sc-cPmDef' }
    for (const [k, s] of Object.entries(els)) {
      const el = q(s); if (el) el.value = ss.baseParams[k]
    }
    drawSweep()
  })

  q('#sc-download')?.addEventListener('click', () => {
    if(!sweepChart) return
    const url = sweepChart.getDataURL({type:'png',pixelRatio:2,backgroundColor:'#0d0b14'})
    const a = document.createElement('a'); a.href=url; a.download=`mmt-sweep-${ss.sweepKey}.png`; a.click()
  })
}

function drawSweep() {
  if (!sweepChart) return
  const { xData, yData } = buildSweepData(ss)
  const SWEEP_VARIABLES = getSweepVariables()
  const varLabel = SWEEP_VARIABLES.find(v=>v.key===ss.sweepKey)?.label || ss.sweepKey

  sweepChart.setOption({
    ...baseChartOption(varLabel),
    tooltip: { ...MORI_THEME.tooltip, trigger: 'axis', formatter: p => {
      let s = `<b style="color:var(--gold)">${varLabel}: ${fmt(p[0].axisValue)}</b><br>`
      p.forEach(pp => s += `<span style="color:${pp.color}">● ${pp.seriesName}</span>: <b>${pp.value}%</b><br>`)
      return s
    }},
    xAxis: { type: 'category', data: xData.map(v=>fmt(v)), axisLabel: MORI_THEME.axisLabel, axisLine: MORI_THEME.axisLine, splitLine:{show:true,lineStyle:{color:'rgba(255,255,255,0.02)'}} },
    yAxis: { type: 'value', min: 'dataMin', max: 100, axisLabel: { ...MORI_THEME.axisLabel, formatter: '{value}%' }, splitLine: MORI_THEME.splitLine },
    series: [
      { name: t('overallPenRate'), type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
        itemStyle: { color: LINE_COLORS[0] }, lineStyle: { width: 3, shadowBlur: 8, shadowColor: LINE_COLORS[0]+'80' },
        areaStyle: { color: new window.echarts.graphic.LinearGradient(0,0,0,1, [{offset:0,color:LINE_COLORS[0]+'66'},{offset:1,color:LINE_COLORS[0]+'00'}]) },
        data: yData
      }
    ]
  }, true)
}
