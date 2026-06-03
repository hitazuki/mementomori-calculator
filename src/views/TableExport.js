// src/views/TableExport.js
import { buildCrossTable } from '../engine/damageCalc.js'
import { getTableVariables } from '../constants/presets.js'
import { getCoeffByLevel } from '../constants/levelTable.js'
import { t } from '../i18n/index.js'

let tableState = {
  xKey: 'def',
  yKey: 'pen',
  xVals: '1000000, 3000000, 5000000, 10000000, 20000000, 50000000',
  yVals: '0, 4950, 11950, 18950',
  builds: [
    {
      id: 1,
      name: t('buildNamePrefix') + ' 1',
      params: {
        baseAtk: 1_000_000, skillCoeff: 5.25, critMult: 1.5, eleAdvantage: false,
        def: 5_000_000, pmDef: 5_000_000,
        pen: 11950, pmPen: 31200,
        cDef: 834953, cPen: 1725,
        cPmDef: 1382434, cPmPen: 16660,
        dmgBonus: 0.3, defBonus: 0, pmDefBonus: 0,
        damageType: 'phys',
        atkLevel: 500, defLevel: 500,
      }
    }
  ],
  metric: 'dmgRatePct',
}

const getMetrics = () => ({
  dmgRatePct: { label: t('overallPenRate'), fmt: v => `${v.toFixed(2)}%` },
  finalDmg:   { label: t('finalDmg'),   fmt: v => Math.round(v).toLocaleString() },
  defMitRate: { label: t('defMitRate'), fmt: v => `${v.toFixed(2)}%` },
  pmMitRate:  { label: t('pmMitRate'), fmt: v => `${v.toFixed(2)}%` },
})

export function renderTableExport(container) {
  const TABLE_VARIABLES = getTableVariables()
  
  container.innerHTML = `
  <div class="view-header animate-fadeup">
    <h1 class="view-title">${t('tableTitle')}</h1>
    <p class="view-desc">${t('tableDesc')}</p>
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start">
    <div class="flex-col gap-12">
      <div class="card">
        <div class="card-title">📐 Variables</div>
        
        <div class="form-group">
          <label class="form-label">X Axis</label>
          <select class="form-select" id="te-xKey">
            ${TABLE_VARIABLES.map(v => `<option value="${v.key}" ${tableState.xKey===v.key?'selected':''}>${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">X Values <span class="text-xs text-muted">(comma separated)</span></label>
          <textarea class="form-input" id="te-xVals" rows="2" style="resize:vertical">${tableState.xVals}</textarea>
        </div>

        <div class="divider"></div>

        <div class="form-group">
          <label class="form-label">Y Axis</label>
          <select class="form-select" id="te-yKey">
            ${TABLE_VARIABLES.map(v => `<option value="${v.key}" ${tableState.yKey===v.key?'selected':''}>${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Y Values <span class="text-xs text-muted">(comma separated)</span></label>
          <textarea class="form-input" id="te-yVals" rows="2" style="resize:vertical">${tableState.yVals}</textarea>
        </div>
      </div>

      <div class="card">
        <div class="card-title">⚙ Builds Configuration</div>
        <div id="te-builds-container" class="flex-col gap-8"></div>
        <button class="btn btn-secondary btn-sm w-full mt-8" id="te-addBuild">+ ${t('addBuild') || 'Add Build'}</button>
        <button class="btn btn-ghost btn-sm w-full mt-4" id="te-resetDefault">Reset to Default</button>
      </div>
    </div>

    <div class="flex-col gap-12" style="min-width:0">
      <div class="card" style="overflow:hidden; display:flex; flex-direction:column;">
        <div class="flex justify-between items-center mb-12" style="flex-wrap:wrap; gap:12px;">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:14px;font-weight:600;color:var(--gold)">📊 ${t('tableTitle')}</span>
            <select class="form-select" id="te-metric" style="width:140px;padding:4px 8px;font-size:12px;min-height:28px">
              ${Object.entries(getMetrics()).map(([k,v]) => `<option value="${k}" ${tableState.metric===k?'selected':''}>${v.label}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" id="te-btnGen">${t('genTable')}</button>
            <button class="btn btn-ghost btn-sm" id="te-btnMd">Markdown</button>
            <button class="btn btn-ghost btn-sm" id="te-btnCsv">${t('copyCSV')}</button>
          </div>
        </div>
        <div id="te-tables-wrapper" style="display:flex;flex-direction:column;gap:32px;overflow-x:auto"></div>
      </div>
    </div>
  </div>`

  attachTableListeners(container)
  renderBuildsList(container)
  generateTable()
}

function parseVals(str) {
  return str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
}

function renderBuildsList(container) {
  const cont = container.querySelector('#te-builds-container')
  if (!cont) return
  cont.innerHTML = tableState.builds.map((b, i) => `
    <div style="padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:6px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${b._expanded ? '12px' : '0'}">
        <input class="form-input" style="font-weight:bold;width:130px;padding:2px 8px;font-size:14px" data-bidx="${i}" data-key="name" value="${b.name}">
        <div style="display:flex;gap:4px">
          <button class="btn btn-secondary btn-sm" data-toggle="${i}" style="padding:4px 8px;font-size:12px">${b._expanded ? '▲' : '▼ ' + (t('ui_details') || 'Details')}</button>
          ${tableState.builds.length > 1 ? `<button class="btn btn-ghost btn-sm" data-remove="${i}" style="padding:4px 8px">🗑</button>` : ''}
        </div>
      </div>
      <div class="grid-2" style="display:${b._expanded ? 'grid' : 'none'};padding-top:12px;border-top:1px dashed rgba(255,255,255,0.1)">
        <div class="form-group"><label class="form-label text-xs">${t('baseAtk')}</label><input class="form-input" type="number" data-bidx="${i}" data-param="baseAtk" value="${b.params.baseAtk}"></div>
        <div class="form-group"><label class="form-label text-xs">${t('dmgBonus')}(%)</label><input class="form-input" type="number" data-bidx="${i}" data-param="dmgBonus" value="${(b.params.dmgBonus*100).toFixed(0)}"></div>
        <div class="form-group"><label class="form-label text-xs">${t('targetDef')}</label><input class="form-input" type="number" data-bidx="${i}" data-param="def" value="${b.params.def}"></div>
        <div class="form-group"><label class="form-label text-xs">${t('defBonus')}(%)</label><input class="form-input" type="number" data-bidx="${i}" data-param="defBonus" value="${(b.params.defBonus*100).toFixed(0)}"></div>
        <div class="form-group"><label class="form-label text-xs">${t('pmDefBonus')}(%)</label><input class="form-input" type="number" data-bidx="${i}" data-param="pmDefBonus" value="${(b.params.pmDefBonus*100).toFixed(0)}"></div>
        <div class="form-group"><label class="form-label text-xs">${t('pen')}</label><input class="form-input" type="number" data-bidx="${i}" data-param="pen" value="${b.params.pen}"></div>
        <div class="form-group"><label class="form-label text-xs">${t('pmPen')}</label><input class="form-input" type="number" data-bidx="${i}" data-param="pmPen" value="${b.params.pmPen}"></div>
        <div class="form-group"><label class="form-label text-xs">${t('atkLevel')}</label><input class="form-input" type="number" data-bidx="${i}" data-param="atkLevel" value="${b.params.atkLevel}"></div>
        <div class="form-group"><label class="form-label text-xs">${t('defLevel')}</label><input class="form-input" type="number" data-bidx="${i}" data-param="defLevel" value="${b.params.defLevel}"></div>
      </div>
    </div>
  `).join('')
}

function attachTableListeners(container) {
  const q = s => container.querySelector(s)

  q('#te-xKey')?.addEventListener('change', e => {
    tableState.xKey = e.target.value
    const TABLE_VARIABLES = getTableVariables()
    const preset = TABLE_VARIABLES.find(v => v.key === tableState.xKey)
    if (preset) { tableState.xVals = preset.defaultValues; q('#te-xVals').value = preset.defaultValues }
  })
  q('#te-yKey')?.addEventListener('change', e => {
    tableState.yKey = e.target.value
    const TABLE_VARIABLES = getTableVariables()
    const preset = TABLE_VARIABLES.find(v => v.key === tableState.yKey)
    if (preset) { tableState.yVals = preset.defaultValues; q('#te-yVals').value = preset.defaultValues }
  })

  q('#te-xVals')?.addEventListener('input', e => { tableState.xVals = e.target.value; generateTable() })
  q('#te-yVals')?.addEventListener('input', e => { tableState.yVals = e.target.value; generateTable() })
  q('#te-metric')?.addEventListener('change', e => { tableState.metric = e.target.value; generateTable() })

  q('#te-btnGen')?.addEventListener('click', generateTable)

  q('#te-builds-container')?.addEventListener('input', e => {
    const idx = e.target.dataset.bidx
    if (idx === undefined) return
    const build = tableState.builds[idx]
    if (e.target.dataset.key === 'name') {
      build.name = e.target.value
      generateTable()
      return
    }
    const p = e.target.dataset.param; if (!p) return
    let val = parseFloat(e.target.value) || 0
    if (p === 'dmgBonus' || p === 'defBonus' || p === 'pmDefBonus') val = val / 100
    build.params[p] = val

    if (p === 'atkLevel') {
      const c = getCoeffByLevel(Math.round(val))
      if (c) { build.params.cPen = c.cPen; build.params.cPmPen = c.cPmPen }
    } else if (p === 'defLevel') {
      const c = getCoeffByLevel(Math.round(val))
      if (c) { build.params.cDef = c.cDef; build.params.cPmDef = build.params.damageType === 'mag' ? c.cMdef : c.cPdef }
    }
    
    generateTable()
  })

  q('#te-builds-container')?.addEventListener('click', e => {
    const btnToggle = e.target.closest('[data-toggle]')
    if (btnToggle) {
      const idx = parseInt(btnToggle.dataset.toggle)
      const build = tableState.builds[idx]
      build._expanded = !build._expanded
      renderBuildsList(container)
      return
    }

    const btn = e.target.closest('[data-remove]')
    if (btn) {
      const idx = parseInt(btn.dataset.remove)
      tableState.builds.splice(idx, 1)
      renderBuildsList(container)
      generateTable()
    }
  })

  q('#te-addBuild')?.addEventListener('click', () => {
    const base = JSON.parse(JSON.stringify(tableState.builds[tableState.builds.length-1].params))
    tableState.builds.push({
      id: Date.now(),
      name: `${t('buildNamePrefix')} ${tableState.builds.length + 1}`,
      params: base
    })
    renderBuildsList(container)
    generateTable()
  })

  q('#te-resetDefault')?.addEventListener('click', () => {
    tableState.builds = [{
      id: Date.now(),
      name: t('buildNamePrefix') + ' 1',
      params: {
        baseAtk: 1_000_000, skillCoeff: 5.25, critMult: 1.5, eleAdvantage: false,
        def: 5_000_000, pmDef: 5_000_000, pen: 11950, pmPen: 31200,
        cDef: 834953, cPen: 1725, cPmDef: 1382434, cPmPen: 16660,
        dmgBonus: 0.3, defBonus: 0, pmDefBonus: 0, damageType: 'phys', atkLevel: 500, defLevel: 500
      }
    }]
    renderBuildsList(container)
    generateTable()
  })

  q('#te-btnMd')?.addEventListener('click', () => {
    const data = doCalc()
    if (!data) return
    const TABLE_VARIABLES = getTableVariables()
    const xLabel = TABLE_VARIABLES.find(v => v.key === tableState.xKey)?.label || tableState.xKey
    const yLabel = TABLE_VARIABLES.find(v => v.key === tableState.yKey)?.label || tableState.yKey
    const METRICS = getMetrics()
    
    let md = ''
    const allTables = [...data.tables, ...data.diffTables]
    allTables.forEach(tData => {
      md += `### ${tData.isDiff ? tData.name : tData.build.name}\n`
      md += `| ${yLabel} ↓ \\ ${xLabel} → | ` + data.xVals.join(' | ') + ' |\n'
      md += '| :--- | ' + data.xVals.map(() => ':---').join(' | ') + ' |\n'
      tData.rows.forEach(r => {
        md += `| **${r.yVal}** | ` + r.cols.map(c => {
          let v = METRICS[tableState.metric].fmt(c[tableState.metric])
          if (tData.isDiff && c[tableState.metric] > 0) v = '+' + v
          return v
        }).join(' | ') + ' |\n'
      })
      md += '\n'
    })
    navigator.clipboard.writeText(md).then(() => alert(t('copied')))
  })

  q('#te-btnCsv')?.addEventListener('click', () => {
    const data = doCalc()
    if (!data) return
    const TABLE_VARIABLES = getTableVariables()
    const xLabel = TABLE_VARIABLES.find(v => v.key === tableState.xKey)?.label || tableState.xKey
    const yLabel = TABLE_VARIABLES.find(v => v.key === tableState.yKey)?.label || tableState.yKey
    
    let csv = ''
    const allTables = [...data.tables, ...data.diffTables]
    allTables.forEach(tData => {
      csv += `${tData.isDiff ? tData.name : tData.build.name}\n`
      csv += `${yLabel} \\ ${xLabel},` + data.xVals.join(',') + '\n'
      tData.rows.forEach(r => {
        csv += `${r.yVal},` + r.cols.map(c => c[tableState.metric]).join(',') + '\n'
      })
      csv += '\n'
    })
    const blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `mmt_export_${tableState.xKey}_${tableState.yKey}.csv`; a.click()
    URL.revokeObjectURL(url)
  })
}

function doCalc() {
  const xVals = parseVals(tableState.xVals)
  const yVals = parseVals(tableState.yVals)
  if (!xVals.length || !yVals.length || tableState.builds.length === 0) return null
  
  const tables = tableState.builds.map(b => {
    return {
      build: b,
      rows: buildCrossTable(xVals, yVals, tableState.xKey, tableState.yKey, b.params),
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

  return { xVals, yVals, tables, diffTables }
}

function generateTable() {
  const data = doCalc()
  const wrapper = document.querySelector('#te-tables-wrapper')
  if (!data || !wrapper) return

  const TABLE_VARIABLES = getTableVariables()
  const xLabel = TABLE_VARIABLES.find(v => v.key === tableState.xKey)?.label || tableState.xKey
  const yLabel = TABLE_VARIABLES.find(v => v.key === tableState.yKey)?.label || tableState.yKey
  const METRICS = getMetrics()
  const metric = METRICS[tableState.metric]

  const allTables = [...data.tables, ...data.diffTables]
  
  wrapper.innerHTML = allTables.map(tData => {
    const title = tData.isDiff 
      ? `<span style="color:var(--purple-light)">⚖ ${tData.name}</span>` 
      : `<span style="color:var(--gold)">📊 ${tData.build.name}</span>`
    
    return `
      <div style="background:rgba(0,0,0,0.1); border-radius:8px; padding:12px; border:1px solid rgba(255,255,255,0.05)">
        <div style="font-size:15px;font-weight:600;margin-bottom:12px">${title}</div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th style="min-width:120px;color:var(--gold)">${yLabel} ↓<br><span style="color:#888">${xLabel} →</span></th>
                ${data.xVals.map(x => `<th>${x.toLocaleString()}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tData.rows.map(r => `
                <tr>
                  <td style="font-weight:600">${r.yVal.toLocaleString()}</td>
                  ${r.cols.map(c => {
                    const val = c[tableState.metric]
                    if (tData.isDiff) {
                      const color = val > 0 ? '#2ecc71' : val < 0 ? '#e74c3c' : '#888'
                      const sign = val > 0 ? '+' : ''
                      return `<td style="color:${color}; font-weight:${val !== 0 ? '600' : 'normal'}">${sign}${metric.fmt(val)}</td>`
                    } else {
                      return `<td>${metric.fmt(val)}</td>`
                    }
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  }).join('')
}
