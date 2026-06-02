// src/views/HeatmapChart.js
import { buildHeatmapData } from '../engine/damageCalc.js'
import { LEVEL_PRESETS } from '../constants/levelTable.js'
import { MORI_THEME, HEATMAP_COLORS, baseChartOption } from '../utils/chartTheme.js'

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
  container.innerHTML = `
  <div class="view-header animate-fadeup">
    <h1 class="view-title">🔥 贯通 × 防御 热力图</h1>
    <p class="view-desc">X轴=目标防御，Y轴=穿透值，颜色=该路的伤害通过率%。</p>
  </div>
  <div class="grid-sidebar-right animate-fadeup" style="height:calc(100vh - 110px)">
    <div class="card" style="height:100%;display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div class="card-title" style="margin:0">热力图 · 单路伤害通过率 %</div>
        <button class="btn btn-ghost btn-sm" id="hm-download">⬇ 保存PNG</button>
      </div>
      <div id="heatmap-chart" style="flex:1;min-height:480px"></div>
    </div>

    <div class="flex-col gap-12" style="overflow-y:auto">
      <div class="card">
        <div class="card-title">🛤 计算路线</div>
        <div style="display:flex;gap:8px">
          <button class="btn ${hs.mode==='phys'?'btn-primary':'btn-ghost'} btn-sm" data-mode="phys">防御穿透路 (DEF)</button>
          <button class="btn ${hs.mode==='mag' ?'btn-primary':'btn-ghost'} btn-sm" data-mode="mag">物魔穿透路 (P.DEF/M.DEF)</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🛡 防御轴（X）</div>
        <div class="form-group">
          <label class="form-label">最小防御 <span class="value-display" id="hv-defMin">${fmt(hs.defMin)}</span></label>
          <input class="form-range" type="range" id="hi-defMin" value="${hs.defMin}" min="0" max="5000000" step="100000">
        </div>
        <div class="form-group">
          <label class="form-label">最大防御 <span class="value-display" id="hv-defMax">${fmt(hs.defMax)}</span></label>
          <input class="form-range" type="range" id="hi-defMax" value="${hs.defMax}" min="1000000" max="100000000" step="1000000">
        </div>
        <div class="form-group">
          <label class="form-label">X格数 <span class="value-display" id="hv-defSteps">${hs.defSteps}</span></label>
          <input class="form-range" type="range" id="hi-defSteps" value="${hs.defSteps}" min="5" max="50" step="1">
        </div>
      </div>

      <div class="card">
        <div class="card-title">⚔ 穿透轴（Y）</div>
        <div class="form-group">
          <label class="form-label">最大穿透 <span class="value-display" id="hv-penMax">${fmt(hs.penMax)}</span></label>
          <input class="form-range" type="range" id="hi-penMax" value="${hs.penMax}" min="5000" max="150000" step="1000">
        </div>
        <div class="form-group">
          <label class="form-label">Y格数 <span class="value-display" id="hv-penSteps">${hs.penSteps}</span></label>
          <input class="form-range" type="range" id="hi-penSteps" value="${hs.penSteps}" min="5" max="40" step="1">
        </div>
      </div>

      <div class="card">
        <div class="card-title">⚙ 系数</div>
        <div class="form-group">
          <label class="form-label">攻击方等级预设</label>
          <select class="form-select" id="hi-atkLevelPreset">
            <option value="-1" ${hs.atkLevelPresetIdx===-1?'selected':''}>当前自定义系数</option>
            ${LEVEL_PRESETS.map((p,i)=>`<option value="${i}" ${hs.atkLevelPresetIdx===i?'selected':''}>${p.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label text-xs text-muted">生效贯通定数 <span class="value-display" id="hv-cpen">${hs.cPen}</span></label>
          <input class="form-input" type="number" id="hi-cPen" value="${hs.cPen}" min="1">
        </div>
        
        <div class="divider"></div>
        
        <div class="form-group">
          <label class="form-label">防守方等级预设</label>
          <select class="form-select" id="hi-defLevelPreset">
            <option value="-1" ${hs.defLevelPresetIdx===-1?'selected':''}>当前自定义系数</option>
            ${LEVEL_PRESETS.map((p,i)=>`<option value="${i}" ${hs.defLevelPresetIdx===i?'selected':''}>${p.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label text-xs text-muted">生效防御定数 <span class="value-display" id="hv-cdef">${hs.cDef.toLocaleString()}</span></label>
          <input class="form-input" type="number" id="hi-cDef" value="${hs.cDef}" min="1">
        </div>
        <button class="btn btn-primary w-full mt-8" id="hi-redraw">🔄 重新生成</button>
      </div>

      <div class="card">
        <div class="card-title">🎨 色阶</div>
        <div style="height:10px;border-radius:5px;background:linear-gradient(90deg,#1a1040,#5b2d8e,#c9a84c,#e07820,#ff2020);margin-bottom:6px"></div>
        <div class="flex justify-between text-xs text-muted"><span>0%（完全减伤）</span><span>100%（完全穿透）</span></div>
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
      text: `单路伤害通过率（${hs.mode==='phys'?'防御路':'物魔路'}）`,
      subtext: `C_def=${hs.cDef.toLocaleString()} | C_pen=${hs.cPen}`,
      textStyle: MORI_THEME.title.textStyle, subtextStyle: MORI_THEME.title.subtextStyle,
      top: 8, left: 14,
    },
    tooltip: { ...MORI_THEME.tooltip, formatter: p => {
      const def = xLabels[p.data[0]], pen = yLabels[p.data[1]], dmg = p.data[2]
      return `<b style="color:var(--gold)">目标防御: ${def?.toLocaleString()}</b><br>
              <b style="color:var(--purple-light)">攻击方穿透: ${pen?.toLocaleString()}</b><br>
              <b style="color:${dmg>60?'#2ecc71':dmg>30?'#c9a84c':'#e74c3c'}">伤害通过率: ${dmg}%</b><br>
              <span style="color:#888">本路减伤: ${(100-dmg).toFixed(1)}%</span>`
    }},
    grid: { top: 72, right: 110, bottom: 60, left: 88 },
    xAxis: {
      type: 'category', name: '目标防御', nameLocation: 'middle', nameGap: 32,
      nameTextStyle: { color: 'rgba(240,230,200,0.5)', fontSize: 11 },
      data: xLabels.map(fmt),
      axisLabel: { ...MORI_THEME.axisLabel, rotate: 35 },
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.01)','transparent'] }},
    },
    yAxis: {
      type: 'category', name: '穿透值', nameLocation: 'middle', nameGap: 52,
      nameTextStyle: { color: 'rgba(240,230,200,0.5)', fontSize: 11 },
      data: yLabels.map(fmt),
      axisLabel: MORI_THEME.axisLabel,
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.01)','transparent'] }},
    },
    visualMap: {
      type: 'continuous', min: 0, max: 100, calculable: true,
      orient: 'vertical', right: 8, top: 'middle',
      text: ['高穿', '低穿'], textStyle: { color: 'rgba(240,230,200,0.5)', fontSize: 10 },
      inRange: { color: HEATMAP_COLORS.map(c => c[1]) },
    },
    series: [{ name:'伤害通过率', type:'heatmap', data,
      label: { show: hs.defSteps <= 16 && hs.penSteps <= 16, fontSize:9, color:'#ffffff99', formatter: p=>`${p.data[2]}` },
      emphasis: { itemStyle: { borderWidth:2, borderColor:'#ffffff80', shadowBlur:8, shadowColor:'rgba(255,255,255,0.3)' }},
    }],
  }, true)
}
