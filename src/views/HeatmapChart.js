// src/views/HeatmapChart.js
import { buildHeatmapData } from '../engine/damageCalc.js'
import { getLevelPresets } from '../constants/levelTable.js'
import { MORI_THEME, HEATMAP_COLORS, baseChartOption } from '../utils/chartTheme.js'
import { t } from '../i18n/index.js'

let heatChart = null
let hs = {
  defMin: 0, defMax: 20_000_000, defSteps: 28,
  penMin: 0, penMax: 70000,      penSteps: 24,
  cDef: 834953, cPen: 1725,
  mode: 'phys', // 'phys' for DEF vs DEF Break, 'mag' for P.DEF/M.DEF vs PM.DEF Break
  atkLevelPresetIdx: 4,
  defLevelPresetIdx: 4,
}

const fmt = v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)

export function renderHeatmap(container) {
  const LEVEL_PRESETS = getLevelPresets()

  container.innerHTML = `
  <div class="view-header animate-fadeup">
    <h1 class="view-title">${t('heatmapTitle')}</h1>
    <p class="view-desc">${t('heatmapDesc')}</p>
  </div>
  <div class="grid-sidebar-right animate-fadeup" style="height:calc(100vh - 110px)">
    <div class="card" style="height:100%;display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div class="card-title" style="margin:0">${t('heatmapTitle')} · %</div>
        <button class="btn btn-ghost btn-sm" id="hm-download">⬇ PNG</button>
      </div>
      <div id="heatmap-chart" style="flex:1;min-height:480px"></div>
    </div>

    <div class="flex-col gap-12" style="overflow-y:auto">
      <div class="card">
        <div class="card-title">🛤 计算路线</div>
        <div style="display:flex;gap:8px">
          <button class="btn ${hs.mode==='phys'?'btn-primary':'btn-ghost'} btn-sm" data-mode="phys">DEF</button>
          <button class="btn ${hs.mode==='mag' ?'btn-primary':'btn-ghost'} btn-sm" data-mode="mag">P.DEF / M.DEF</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🛡 ${t('defRange')}</div>
        <div class="form-group">
          <label class="form-label">${t('minVar', {var: t('targetDef')})} <span class="value-display" id="hv-defMin">${fmt(hs.defMin)}</span></label>
          <input class="form-range" type="range" id="hi-defMin" value="${hs.defMin}" min="0" max="5000000" step="100000">
        </div>
        <div class="form-group">
          <label class="form-label">${t('maxVar', {var: t('targetDef')})} <span class="value-display" id="hv-defMax">${fmt(hs.defMax)}</span></label>
          <input class="form-range" type="range" id="hi-defMax" value="${hs.defMax}" min="1000000" max="100000000" step="1000000">
        </div>
        <div class="form-group">
          <label class="form-label">${t('defStep')} (Count) <span class="value-display" id="hv-defSteps">${hs.defSteps}</span></label>
          <input class="form-range" type="range" id="hi-defSteps" value="${hs.defSteps}" min="5" max="50" step="1">
        </div>
      </div>

      <div class="card">
        <div class="card-title">⚔ ${t('penRange')}</div>
        <div class="form-group">
          <label class="form-label">${t('maxVar', {var: t('pen')})} <span class="value-display" id="hv-penMax">${fmt(hs.penMax)}</span></label>
          <input class="form-range" type="range" id="hi-penMax" value="${hs.penMax}" min="5000" max="150000" step="1000">
        </div>
        <div class="form-group">
          <label class="form-label">${t('penStep')} (Count) <span class="value-display" id="hv-penSteps">${hs.penSteps}</span></label>
          <input class="form-range" type="range" id="hi-penSteps" value="${hs.penSteps}" min="5" max="40" step="1">
        </div>
      </div>

      <div class="card">
        <div class="card-title">⚙ ${t('manualAdjust')}</div>
        <div class="form-group">
          <label class="form-label">${t('atkPresetLabel')}</label>
          <select class="form-select" id="hi-atkLevelPreset">
            <option value="-1" ${hs.atkLevelPresetIdx===-1?'selected':''}>${t('manualAdjust')}</option>
            ${LEVEL_PRESETS.map((p,i)=>`<option value="${i}" ${hs.atkLevelPresetIdx===i?'selected':''}>${p.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label text-xs text-muted">${t('cPenConst')} <span class="value-display" id="hv-cpen">${hs.cPen}</span></label>
          <input class="form-input" type="number" id="hi-cPen" value="${hs.cPen}" min="1">
        </div>
        
        <div class="divider"></div>
        
        <div class="form-group">
          <label class="form-label">${t('defPresetLabel')}</label>
          <select class="form-select" id="hi-defLevelPreset">
            <option value="-1" ${hs.defLevelPresetIdx===-1?'selected':''}>${t('manualAdjust')}</option>
            ${LEVEL_PRESETS.map((p,i)=>`<option value="${i}" ${hs.defLevelPresetIdx===i?'selected':''}>${p.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label text-xs text-muted">${t('cDefConst')} <span class="value-display" id="hv-cdef">${hs.cDef.toLocaleString()}</span></label>
          <input class="form-input" type="number" id="hi-cDef" value="${hs.cDef}" min="1">
        </div>
        <button class="btn btn-primary w-full mt-8" id="hi-redraw">🔄 ${t('genHeatmap')}</button>
      </div>
    </div>
  </div>`

  const chartEl = container.querySelector('#heatmap-chart')
  if (chartEl && window.echarts) { if (heatChart) heatChart.dispose(); heatChart = window.echarts.init(chartEl) }
  attachHeatmapListeners(container)
  drawHeatmap()
}

function attachHeatmapListeners(container) {
  container.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      hs.mode = btn.dataset.mode
      container.querySelectorAll('[data-mode]').forEach(b => b.className = b.className.replace('btn-primary','btn-ghost'))
      btn.className = btn.className.replace('btn-ghost','btn-primary')
      
      const LEVEL_PRESETS = getLevelPresets()
      if (hs.atkLevelPresetIdx !== -1) {
        const p = LEVEL_PRESETS[hs.atkLevelPresetIdx]
        if (p) {
          hs.cPen = hs.mode === 'phys' ? p.cPen : p.cPmPen
          container.querySelector('#hi-cPen').value = hs.cPen
          container.querySelector('#hv-cpen').textContent = hs.cPen
        }
      }
      if (hs.defLevelPresetIdx !== -1) {
        const p = LEVEL_PRESETS[hs.defLevelPresetIdx]
        if (p) {
          hs.cDef = hs.mode === 'phys' ? p.cDef : p.cPdef
          container.querySelector('#hi-cDef').value = hs.cDef
          container.querySelector('#hv-cdef').textContent = hs.cDef.toLocaleString()
        }
      }
      drawHeatmap()
    })
  })

  const sliders = [
    { id:'hi-defMin',   key:'defMin',   disp:'hv-defMin',   f:fmt },
    { id:'hi-defMax',   key:'defMax',   disp:'hv-defMax',   f:fmt },
    { id:'hi-defSteps', key:'defSteps', disp:'hv-defSteps', f:v=>v },
    { id:'hi-penMax',   key:'penMax',   disp:'hv-penMax',   f:fmt },
    { id:'hi-penSteps', key:'penSteps', disp:'hv-penSteps', f:v=>v },
  ]
  sliders.forEach(({ id, key, disp, f }) => {
    container.querySelector(`#${id}`)?.addEventListener('input', e => {
      hs[key] = parseInt(e.target.value)
      const d = container.querySelector(`#${disp}`); if (d) d.textContent = f(hs[key])
    })
  })

  container.querySelector('#hi-cDef')?.addEventListener('input', e => {
    hs.cDef = parseInt(e.target.value) || 1
    const d = container.querySelector('#hv-cdef'); if (d) d.textContent = hs.cDef.toLocaleString()
    hs.defLevelPresetIdx = -1
    const sel = container.querySelector('#hi-defLevelPreset'); if (sel) sel.value = "-1"
  })
  container.querySelector('#hi-cPen')?.addEventListener('input', e => {
    hs.cPen = parseInt(e.target.value) || 1
    const d = container.querySelector('#hv-cpen'); if (d) d.textContent = hs.cPen
    hs.atkLevelPresetIdx = -1
    const sel = container.querySelector('#hi-atkLevelPreset'); if (sel) sel.value = "-1"
  })

  container.querySelector('#hi-atkLevelPreset')?.addEventListener('change', e => {
    const idx = parseInt(e.target.value)
    hs.atkLevelPresetIdx = idx
    if (idx === -1) return
    const LEVEL_PRESETS = getLevelPresets()
    const p = LEVEL_PRESETS[idx]
    if (!p) return
    hs.cPen = hs.mode === 'phys' ? p.cPen : p.cPmPen
    const cpenEl = container.querySelector('#hi-cPen'); if (cpenEl) cpenEl.value = hs.cPen
    const d2 = container.querySelector('#hv-cpen'); if (d2) d2.textContent = hs.cPen
  })

  container.querySelector('#hi-defLevelPreset')?.addEventListener('change', e => {
    const idx = parseInt(e.target.value)
    hs.defLevelPresetIdx = idx
    if (idx === -1) return
    const LEVEL_PRESETS = getLevelPresets()
    const p = LEVEL_PRESETS[idx]
    if (!p) return
    hs.cDef = hs.mode === 'phys' ? p.cDef : p.cPdef
    const cdefEl = container.querySelector('#hi-cDef'); if (cdefEl) cdefEl.value = hs.cDef
    const d1 = container.querySelector('#hv-cdef'); if (d1) d1.textContent = hs.cDef.toLocaleString()
  })

  container.querySelector('#hi-redraw')?.addEventListener('click', drawHeatmap)
  container.querySelector('#hm-download')?.addEventListener('click', () => {
    if (!heatChart) return
    const url = heatChart.getDataURL({ type:'png', pixelRatio:2, backgroundColor:'#0d0b14' })
    const a = document.createElement('a'); a.href = url
    a.download = `mmt-heatmap-cdef${hs.cDef}.png`; a.click()
  })
}

function drawHeatmap() {
  if (!heatChart) return
  const { data, xLabels, yLabels } = buildHeatmapData({
    defMin: hs.defMin, defMax: hs.defMax, defSteps: hs.defSteps,
    penMin: hs.penMin, penMax: hs.penMax, penSteps: hs.penSteps,
    cDef: hs.cDef, cPen: hs.cPen,
  })

  heatChart.setOption({
    backgroundColor: 'transparent',
    title: {
      text: t('heatmapTitle') + `（${hs.mode==='phys'?'DEF':'P.DEF/M.DEF'}）`,
      subtext: `C_def=${hs.cDef.toLocaleString()} | C_pen=${hs.cPen}`,
      textStyle: MORI_THEME.title.textStyle, subtextStyle: MORI_THEME.title.subtextStyle,
      top: 8, left: 14,
    },
    tooltip: { ...MORI_THEME.tooltip, formatter: p => {
      const def = xLabels[p.data[0]], pen = yLabels[p.data[1]], dmg = p.data[2]
      return `<b style="color:var(--gold)">${t('targetDef')}: ${def?.toLocaleString()}</b><br>
              <b style="color:var(--purple-light)">${t('pen')}: ${pen?.toLocaleString()}</b><br>
              <b style="color:${dmg>60?'#2ecc71':dmg>30?'#c9a84c':'#e74c3c'}">${t('overallPenRate')}: ${dmg}%</b>`
    }},
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
    series: [{ name:t('overallPenRate'), type:'heatmap', data,
      label: { show: hs.defSteps <= 16 && hs.penSteps <= 16, fontSize:9, color:'#ffffff99', formatter: p=>`${p.data[2]}` },
      emphasis: { itemStyle: { borderWidth:2, borderColor:'#ffffff80', shadowBlur:8, shadowColor:'rgba(255,255,255,0.3)' }},
    }],
  }, true)
}
