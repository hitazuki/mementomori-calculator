// src/views/ComparePanel.js
import { calcDamage } from '../engine/damageCalc.js'
import { getDefBenchmarks, getLevelPresets } from '../constants/levelTable.js'
import { getCompareBuildsDefault } from '../constants/presets.js'
import { MORI_THEME, LINE_COLORS, baseChartOption } from '../utils/chartTheme.js'
import { t } from '../i18n/index.js'

let compareChart = null
const fmt = v => v >= 1e6 ? `${(v/1e6).toFixed(2)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(Math.round(v))

let cs = {
  builds: getCompareBuildsDefault(),
  benchmarks: getDefBenchmarks().slice(0,4),
  baseAtk: 1_000_000, skillCoeff: 5.25, critMult: 1.5, factionBonus: 1.0,
  cDef: 834953, cPen: 1725,
  cPmDef: 1382434, cPmPen: 16660,
  damageType: 'phys',
  chartMode: 'bar', metric: 'dmgRatePct',
  atkLevelPresetIdx: 4,
  defLevelPresetIdx: 4,
}

const getMetrics = () => ({
  dmgRatePct: { label: t('overallPenRate'), fmt: v=>`${v.toFixed(1)}%`,    unit:'%' },
  finalDmg:   { label: t('finalDmg'),       fmt: v=>fmt(v),                 unit:''  },
  defMitRate: { label: t('defMitRate'),     fmt: v=>`${v.toFixed(1)}%`,    unit:'%' },
  pmMitRate:  { label: t('pmMitRate'),      fmt: v=>`${v.toFixed(1)}%`,    unit:'%' },
})

export function renderCompare(container) {
  const LEVEL_PRESETS = getLevelPresets()
  const METRICS = getMetrics()

  container.innerHTML = `
  <div class="view-header animate-fadeup">
    <h1 class="view-title">${t('compareTitle')}</h1>
    <p class="view-desc">${t('compareDesc')}</p>
  </div>
  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <div class="flex-col gap-12">
      <div class="card">
        <div class="card-title">⚙ ${t('manualAdjust')} (Common)</div>
        <div class="form-group">
          <label class="form-label">${t('baseAtk')} <span class="value-display" id="cv-atk">${fmt(cs.baseAtk)}</span></label>
          <input class="form-input" type="number" id="ci-baseAtk" value="${cs.baseAtk}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">${t('skillCoeff')} <span class="value-display" id="cv-coeff">${(cs.skillCoeff*100).toFixed(0)}%</span></label>
          <input class="form-range" type="range" id="ci-skillCoeff" value="${cs.skillCoeff}" min="1" max="20" step="0.25">
        </div>
        <div class="form-group">
          <label class="form-label">${t('atkType')}</label>
          <div style="display:flex;gap:8px">
            <button class="btn ${cs.damageType==='phys'?'btn-primary':'btn-ghost'} btn-sm" style="flex:1" data-type="phys">${t('typePhys')}</button>
            <button class="btn ${cs.damageType==='mag' ?'btn-primary':'btn-ghost'} btn-sm" style="flex:1" data-type="mag">${t('typeMag')}</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${t('atkPresetLabel')}</label>
          <select class="form-select" id="ci-atkLevelPreset">
            <option value="-1" ${cs.atkLevelPresetIdx===-1?'selected':''}>${t('manualAdjust')}</option>
            ${LEVEL_PRESETS.map((p,i)=>`<option value="${i}" ${cs.atkLevelPresetIdx===i?'selected':''}>${p.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('defPresetLabel')}</label>
          <select class="form-select" id="ci-defLevelPreset">
            <option value="-1" ${cs.defLevelPresetIdx===-1?'selected':''}>${t('manualAdjust')}</option>
            ${LEVEL_PRESETS.map((p,i)=>`<option value="${i}" ${cs.defLevelPresetIdx===i?'selected':''}>${p.label}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🔧 ${t('compareTitle')} <span class="text-xs text-muted">(Max 6)</span></div>
        <div id="cmp-builds" class="flex-col gap-8"></div>
        <button class="btn btn-secondary btn-sm mt-8 w-full" id="cmp-addBuild" ${cs.builds.length>=6?'disabled':''}>${t('addBuild')}</button>
      </div>

      <div class="card">
        <div class="card-title">🏹 ${t('targetDef')}</div>
        <div id="cmp-benchmarks" class="flex-col gap-8"></div>
        <button class="btn btn-ghost btn-sm mt-8 w-full" id="cmp-addBench">${t('addBench')}</button>
      </div>
    </div>

    <div class="flex-col gap-12">
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div style="display:flex;gap:6px">
            ${['bar','radar','table'].map(m=>`<button class="btn ${cs.chartMode===m?'btn-primary':'btn-ghost'} btn-sm" data-mode="${m}">${{bar:'Bar',radar:'Radar',table:'Table'}[m]}</button>`).join('')}
          </div>
          <select class="form-select" id="ci-metric" style="width:160px">
            ${Object.entries(METRICS).map(([k,v])=>`<option value="${k}" ${cs.metric===k?'selected':''}>${v.label}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="card" style="min-height:420px">
        <div id="cmp-chart" style="width:100%;height:400px;${cs.chartMode==='table'?'display:none':''}"></div>
        <div id="cmp-table" style="${cs.chartMode!=='table'?'display:none':''}overflow-x:auto"></div>
      </div>

      <div class="card">
        <div class="card-title">📊 vs Build 1 (Delta)</div>
        <div id="cmp-delta" style="overflow-x:auto"></div>
      </div>
    </div>
  </div>`

  renderBuildCards(container)
  renderBenchRows(container)
  const el = container.querySelector('#cmp-chart')
  if (el && window.echarts) { if (compareChart) compareChart.dispose(); compareChart = window.echarts.init(el) }
  attachCompareListeners(container)
  refreshCompare()
}

function renderBuildCards(container) {
  const el = container.querySelector('#cmp-builds'); if (!el) return
  el.innerHTML = cs.builds.map((b,i) => `
    <div style="padding:10px;border-radius:8px;border:1px solid ${LINE_COLORS[i%LINE_COLORS.length]}30;background:${LINE_COLORS[i%LINE_COLORS.length]}08">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="color:${LINE_COLORS[i%LINE_COLORS.length]};font-size:12px;font-weight:600">▌ ${b.name}</span>
        <button class="btn btn-danger btn-sm" data-remove-build="${i}">×</button>
      </div>
      <div class="grid-2">
        <div class="form-group"><label class="form-label">${t('buildName')}</label>
          <input class="form-input" type="text" data-build="${i}" data-field="name" value="${b.name}"></div>
        <div class="form-group"><label class="form-label">${t('dmgBonus')}%</label>
          <input class="form-input" type="number" data-build="${i}" data-field="dmgBonus" value="${(b.dmgBonus*100).toFixed(0)}" min="0"></div>
        <div class="form-group"><label class="form-label">${t('pen')}</label>
          <input class="form-input" type="number" data-build="${i}" data-field="pen" value="${b.pen}" min="0"></div>
        <div class="form-group"><label class="form-label">${t('pmPen')}</label>
          <input class="form-input" type="number" data-build="${i}" data-field="pmPen" value="${b.pmPen}" min="0"></div>
        <div class="form-group"><label class="form-label">${t('defBonus')}%</label>
          <input class="form-input" type="number" data-build="${i}" data-field="defBonus" value="${(b.defBonus*100).toFixed(0)}"></div>
        <div class="form-group"><label class="form-label">${t('pmDefBonus')}%</label>
          <input class="form-input" type="number" data-build="${i}" data-field="pmDefBonus" value="${(b.pmDefBonus*100).toFixed(0)}"></div>
        <div class="form-group"><label class="form-label">${t('factionBonus')}</label>
          <input class="form-input" type="number" data-build="${i}" data-field="factionBonus" value="${b.factionBonus||1}" step="0.05" min="1"></div>
      </div>
    </div>
  `).join('')
}

function renderBenchRows(container) {
  const el = container.querySelector('#cmp-benchmarks'); if (!el) return
  el.innerHTML = cs.benchmarks.map((b,i) => `
    <div class="flex items-center gap-8">
      <span class="text-gold text-mono text-xs" style="width:70px;flex-shrink:0">${b.label}</span>
      <input class="form-input" type="number" data-bench="${i}" data-field="def" value="${b.def}" style="flex:1" placeholder="${t('targetDef')}">
      <input class="form-input" type="number" data-bench="${i}" data-field="pmDef" value="${b.pmDef}" style="flex:1" placeholder="${t('targetPhysDef')}/${t('targetMagDef')}">
      <button class="btn btn-danger btn-sm" data-remove-bench="${i}">×</button>
    </div>
  `).join('')
}

function attachCompareListeners(container) {
  container.querySelector('#ci-baseAtk')?.addEventListener('input', e => {
    cs.baseAtk = parseInt(e.target.value)||1; const d=container.querySelector('#cv-atk'); if(d) d.textContent=fmt(cs.baseAtk); refreshCompare()
  })
  container.querySelector('#ci-skillCoeff')?.addEventListener('input', e => {
    cs.skillCoeff = parseFloat(e.target.value); const d=container.querySelector('#cv-coeff'); if(d) d.textContent=`${(cs.skillCoeff*100).toFixed(0)}%`; refreshCompare()
  })
  
  container.querySelectorAll('[data-type]').forEach(btn => btn.addEventListener('click', () => {
    cs.damageType = btn.dataset.type
    container.querySelectorAll('[data-type]').forEach(b => b.className=b.className.replace('btn-primary','btn-ghost'))
    btn.className = btn.className.replace('btn-ghost','btn-primary')
    
    if (cs.defLevelPresetIdx !== -1) {
      const LEVEL_PRESETS = getLevelPresets()
      const p = LEVEL_PRESETS[cs.defLevelPresetIdx]
      if (p) cs.cPmDef = cs.damageType === 'mag' ? p.cMdef : p.cPdef
    }
    refreshCompare()
  }))

  container.querySelector('#ci-atkLevelPreset')?.addEventListener('change', e => {
    const idx = parseInt(e.target.value); cs.atkLevelPresetIdx = idx; if(idx===-1) return
    const LEVEL_PRESETS = getLevelPresets()
    const p = LEVEL_PRESETS[idx]; if(!p) return
    cs.cPen = p.cPen; cs.cPmPen = p.cPmPen;
    refreshCompare()
  })

  container.querySelector('#ci-defLevelPreset')?.addEventListener('change', e => {
    const idx = parseInt(e.target.value); cs.defLevelPresetIdx = idx; if(idx===-1) return
    const LEVEL_PRESETS = getLevelPresets()
    const p = LEVEL_PRESETS[idx]; if(!p) return
    cs.cDef = p.cDef; cs.cPmDef = cs.damageType === 'mag' ? p.cMdef : p.cPdef;
    refreshCompare()
  })
  container.querySelector('#ci-metric')?.addEventListener('change', e => { cs.metric=e.target.value; refreshCompare() })

  container.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => {
    cs.chartMode = btn.dataset.mode
    container.querySelectorAll('[data-mode]').forEach(b => b.className=b.className.replace('btn-primary','btn-ghost'))
    btn.className = btn.className.replace('btn-ghost','btn-primary')
    const chartDiv = container.querySelector('#cmp-chart'), tableDiv = container.querySelector('#cmp-table')
    if (cs.chartMode==='table') { chartDiv.style.display='none'; tableDiv.style.display='' }
    else { chartDiv.style.display=''; tableDiv.style.display='none' }
    refreshCompare()
  }))

  container.querySelector('#cmp-builds')?.addEventListener('input', e => {
    const i=parseInt(e.target.dataset.build), field=e.target.dataset.field
    if(isNaN(i)||!field) return
    if(field==='name') cs.builds[i][field]=e.target.value
    else if(['dmgBonus','defBonus','pmDefBonus'].includes(field)) cs.builds[i][field]=parseFloat(e.target.value)/100||0
    else cs.builds[i][field]=parseFloat(e.target.value)||0
    refreshCompare()
  })
  container.querySelector('#cmp-builds')?.addEventListener('click', e => {
    const btn=e.target.closest('[data-remove-build]'); if(!btn) return
    cs.builds.splice(parseInt(btn.dataset.removeBuild),1); renderBuildCards(container); refreshCompare()
  })
  container.querySelector('#cmp-addBuild')?.addEventListener('click', () => {
    if(cs.builds.length>=6) return
    cs.builds.push({ id:Date.now(), name:`${t('buildNamePrefix')} ${cs.builds.length+1}`, pen:18950, pmPen:31200, dmgBonus:0.3, defBonus:0, pmDefBonus:0, factionBonus:1.0 })
    renderBuildCards(container); refreshCompare()
  })

  container.querySelector('#cmp-benchmarks')?.addEventListener('input', e => {
    const i=parseInt(e.target.dataset.bench), field=e.target.dataset.field
    if(!isNaN(i)&&field) { cs.benchmarks[i][field]=parseInt(e.target.value)||0; refreshCompare() }
  })
  container.querySelector('#cmp-benchmarks')?.addEventListener('click', e => {
    const btn=e.target.closest('[data-remove-bench]'); if(!btn) return
    cs.benchmarks.splice(parseInt(btn.dataset.removeBench),1); renderBenchRows(container); refreshCompare()
  })
  container.querySelector('#cmp-addBench')?.addEventListener('click', () => {
    cs.benchmarks.push({ label:`${t('benchNamePrefix')} ${cs.benchmarks.length+1}`, def:5_000_000, pmDef:5_000_000 })
    renderBenchRows(container); refreshCompare()
  })
}

function calcAll() {
  return cs.builds.map((build, bi) => ({
    ...build, color: LINE_COLORS[bi%LINE_COLORS.length],
    benchResults: cs.benchmarks.map(bench => calcDamage({
      baseAtk:cs.baseAtk, skillCoeff:cs.skillCoeff, critMult:cs.critMult, factionBonus:build.factionBonus||1,
      def:bench.def, pmDef:bench.pmDef,
      pen:build.pen, pmPen:build.pmPen,
      cDef:cs.cDef, cPen:cs.cPen,
      cPmDef:cs.cPmDef, cPmPen:cs.cPmPen,
      dmgBonus:build.dmgBonus, defBonus:build.defBonus||0, pmDefBonus:build.pmDefBonus||0,
    })),
  }))
}

function refreshCompare() {
  const results = calcAll()
  const METRICS = getMetrics()
  const metric = METRICS[cs.metric]

  if (cs.chartMode === 'table') {
    const tableDiv = document.querySelector('#cmp-table'); if (!tableDiv) return
    const hdrs = cs.benchmarks.map(b=>`<th>${b.label}</th>`).join('')
    tableDiv.innerHTML = `<table class="data-table"><thead><tr><th>${t('buildName')}</th>${hdrs}</tr></thead><tbody>${
      results.map((r,bi)=>`<tr><td style="color:${r.color}">${r.name}</td>${r.benchResults.map(br=>`<td>${metric.fmt(br[cs.metric])}</td>`).join('')}</tr>`).join('')
    }</tbody></table>`
    renderDelta(results, metric); return
  }

  if (!compareChart) return
  if (cs.chartMode === 'bar') {
    compareChart.setOption({
      ...baseChartOption(t('compareTitle') + ' · ' + metric.label),
      xAxis: { type:'category', data:cs.benchmarks.map(b=>b.label), axisLabel:MORI_THEME.axisLabel, axisLine:MORI_THEME.axisLine },
      yAxis: { type:'value', axisLabel:{...MORI_THEME.axisLabel,formatter:v=>`${v}${metric.unit}`}, splitLine:MORI_THEME.splitLine },
      legend: { ...MORI_THEME.legend, bottom:4, left:'center', data:results.map(r=>({name:r.name,itemStyle:{color:r.color}})) },
      tooltip: { ...MORI_THEME.tooltip, trigger:'axis', formatter: params => {
        let s = `<b style="color:var(--gold)">${params[0].axisValue}</b><br>`
        params.forEach(p => s += `<span style="color:${p.color}">● ${p.seriesName}</span>: <b>${metric.fmt(p.value)}</b><br>`)
        return s
      }},
      series: results.map(r => ({
        name:r.name, type:'bar', barMaxWidth:36,
        itemStyle:{color:r.color,borderRadius:[4,4,0,0]},
        label:{show:true,position:'top',color:r.color,fontFamily:'JetBrains Mono',fontSize:10,formatter:p=>metric.fmt(p.value)},
        data:r.benchResults.map(br=>+br[cs.metric].toFixed(1)),
      })),
    }, true)
  } else {
    const maxVal = cs.metric==='finalDmg'
      ? Math.max(...results.flatMap(r=>r.benchResults.map(x=>x.finalDmg)))*1.1 : 100
    compareChart.setOption({
      ...baseChartOption('Radar · ' + metric.label),
      radar: {
        indicator: cs.benchmarks.map(b=>({name:b.label,max:maxVal})),
        name:{textStyle:{color:'rgba(240,230,200,0.5)',fontSize:11}},
        axisLine:{lineStyle:{color:'rgba(201,168,76,0.15)'}},
        splitLine:{lineStyle:{color:'rgba(201,168,76,0.1)'}},
        splitArea:{areaStyle:{color:['rgba(201,168,76,0.02)','transparent']}},
      },
      legend:{...MORI_THEME.legend,bottom:4,left:'center',data:results.map(r=>({name:r.name,itemStyle:{color:r.color}}))},
      tooltip:MORI_THEME.tooltip,
      series:[{type:'radar',data:results.map(r=>({
        name:r.name, value:r.benchResults.map(br=>+br[cs.metric].toFixed(1)),
        lineStyle:{color:r.color,width:2}, areaStyle:{color:r.color+'22'}, itemStyle:{color:r.color},
      }))}],
    }, true)
  }
  renderDelta(results, metric)
}

function renderDelta(results, metric) {
  const el = document.querySelector('#cmp-delta'); if (!el || results.length < 2) return
  const base = results[0]
  const hdrs = cs.benchmarks.map(b=>`<th>${b.label}</th>`).join('')
  el.innerHTML = `<table class="data-table"><thead><tr><th>Compare</th>${hdrs}</tr></thead><tbody>${
    results.slice(1).map(r=>`<tr><td style="color:${r.color}">${r.name} vs ${base.name}</td>${
      r.benchResults.map((br,bi)=>{
        const delta = br[cs.metric] - base.benchResults[bi][cs.metric]
        const cls = delta>0?'cell-high':delta<0?'cell-low':''
        return `<td class="${cls}">${delta>=0?'+':''}${metric.fmt(delta)}</td>`
      }).join('')
    }</tr>`).join('')
  }</tbody></table>`
}
