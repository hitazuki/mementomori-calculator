// src/views/TableExport.js
import { buildCrossTable } from '../engine/damageCalc.js'
import { TABLE_VARIABLES } from '../constants/presets.js'
import { getCoeffByLevel } from '../constants/levelTable.js'

let tableState = {
  xKey: 'def',
  yKey: 'pen',
  xVals: '1000000, 3000000, 5000000, 10000000, 20000000, 50000000',
  yVals: '0, 4950, 11950, 18950',
  baseParams: {
    baseAtk: 1_000_000, skillCoeff: 5.25, critMult: 1.5, factionBonus: 1.0,
    def: 5_000_000, pmDef: 5_000_000,
    pen: 11950, pmPen: 31200,
    cDef: 834953, cPen: 1725,
    cPmDef: 1382434, cPmPen: 16660,
    dmgBonus: 0.3, defDebuff: 0,
    damageType: 'phys',
    atkLevel: 500, defLevel: 500,
  },
  metric: 'dmgRatePct',
}

const METRICS = {
  dmgRatePct: { label: '综合伤害通过率%', fmt: v => `${v.toFixed(2)}%` },
  finalDmg:   { label: '最终伤害',   fmt: v => Math.round(v).toLocaleString() },
  defMitPct:  { label: '防御路减伤%', fmt: v => `${v.toFixed(2)}%` },
  pmMitPct:   { label: '物魔路减伤%', fmt: v => `${v.toFixed(2)}%` },
}

export function renderTableExport(container) {
  container.innerHTML = `
  <div class="view-header animate-fadeup">
    <h1 class="view-title">📋 交叉表与导出</h1>
    <p class="view-desc">设置任意两个变量范围，生成交叉分析表并导出为CSV/Markdown</p>
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start">
    <div class="flex-col gap-12">
      <div class="card">
        <div class="card-title">📐 变量设置</div>
        
        <div class="form-group">
          <label class="form-label">X轴（列）变量</label>
          <select class="form-select" id="te-xKey">
            ${TABLE_VARIABLES.map(v => `<option value="${v.key}" ${tableState.xKey===v.key?'selected':''}>${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">X轴 取值列表 <span class="text-xs text-muted">（英文逗号分隔）</span></label>
          <textarea class="form-input" id="te-xVals" rows="2" style="resize:vertical">${tableState.xVals}</textarea>
        </div>

        <div class="divider"></div>

        <div class="form-group">
          <label class="form-label">Y轴（行）变量</label>
          <select class="form-select" id="te-yKey">
            ${TABLE_VARIABLES.map(v => `<option value="${v.key}" ${tableState.yKey===v.key?'selected':''}>${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Y轴 取值列表 <span class="text-xs text-muted">（英文逗号分隔）</span></label>
          <textarea class="form-input" id="te-yVals" rows="2" style="resize:vertical">${tableState.yVals}</textarea>
        </div>
      </div>

      <div class="card">
        <div class="card-title">⚙ 固定参数 (未扫描变量时生效)</div>
        <div class="grid-2" id="te-params">
          <div class="form-group"><label class="form-label text-xs">面板攻击</label><input class="form-input" type="number" data-param="baseAtk" value="${tableState.baseParams.baseAtk}"></div>
          <div class="form-group"><label class="form-label text-xs">增伤加成(%)</label><input class="form-input" type="number" data-param="dmgBonus" value="${(tableState.baseParams.dmgBonus*100).toFixed(0)}"></div>
          <div class="form-group"><label class="form-label text-xs">目标防御</label><input class="form-input" type="number" data-param="def" value="${tableState.baseParams.def}"></div>
          <div class="form-group"><label class="form-label text-xs">减防(%)</label><input class="form-input" type="number" data-param="defDebuff" value="${(tableState.baseParams.defDebuff*100).toFixed(0)}"></div>
          <div class="form-group"><label class="form-label text-xs">防御贯通</label><input class="form-input" type="number" data-param="pen" value="${tableState.baseParams.pen}"></div>
          <div class="form-group"><label class="form-label text-xs">物魔贯通</label><input class="form-input" type="number" data-param="pmPen" value="${tableState.baseParams.pmPen}"></div>
          <div class="form-group"><label class="form-label text-xs">攻击方等级</label><input class="form-input" type="number" data-param="atkLevel" value="${tableState.baseParams.atkLevel}"></div>
          <div class="form-group"><label class="form-label text-xs">防守方等级</label><input class="form-input" type="number" data-param="defLevel" value="${tableState.baseParams.defLevel}"></div>
        </div>
        <button class="btn btn-ghost btn-sm w-full mt-4" id="te-resetDefault">恢复初始默认 (Lv500标准)</button>
      </div>
    </div>

    <div class="flex-col gap-12">
      <div class="card">
        <div class="flex justify-between items-center mb-12">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:14px;font-weight:600;color:var(--gold)">📊 数据表</span>
            <select class="form-select" id="te-metric" style="width:140px;padding:4px 8px;font-size:12px;min-height:28px">
              ${Object.entries(METRICS).map(([k,v]) => `<option value="${k}" ${tableState.metric===k?'selected':''}>${v.label}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary btn-sm" id="te-btnGen">生成表格</button>
            <button class="btn btn-ghost btn-sm" id="te-btnMd">复制 Markdown</button>
            <button class="btn btn-ghost btn-sm" id="te-btnCsv">导出 CSV</button>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table" id="te-tableContainer">
            <thead></thead><tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`

  attachTableListeners(container)
  generateTable()
}

function parseVals(str) {
  return str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
}

function attachTableListeners(container) {
  const q = s => container.querySelector(s)

  q('#te-xKey')?.addEventListener('change', e => {
    tableState.xKey = e.target.value
    const preset = TABLE_VARIABLES.find(v => v.key === tableState.xKey)
    if (preset) { tableState.xVals = preset.defaultValues; q('#te-xVals').value = preset.defaultValues }
  })
  q('#te-yKey')?.addEventListener('change', e => {
    tableState.yKey = e.target.value
    const preset = TABLE_VARIABLES.find(v => v.key === tableState.yKey)
    if (preset) { tableState.yVals = preset.defaultValues; q('#te-yVals').value = preset.defaultValues }
  })

  q('#te-xVals')?.addEventListener('input', e => tableState.xVals = e.target.value)
  q('#te-yVals')?.addEventListener('input', e => tableState.yVals = e.target.value)
  q('#te-metric')?.addEventListener('change', e => { tableState.metric = e.target.value; generateTable() })

  q('#te-btnGen')?.addEventListener('click', generateTable)

  q('#te-params')?.addEventListener('input', e => {
    const p = e.target.dataset.param; if (!p) return
    let val = parseFloat(e.target.value) || 0
    if (p === 'dmgBonus' || p === 'defDebuff') val = val / 100
    tableState.baseParams[p] = val

    if (p === 'atkLevel') {
      const c = getCoeffByLevel(Math.round(val))
      tableState.baseParams.cPen = c.cPen; tableState.baseParams.cPmPen = c.cPmPen
    } else if (p === 'defLevel') {
      const c = getCoeffByLevel(Math.round(val))
      tableState.baseParams.cDef = c.cDef; tableState.baseParams.cPmDef = tableState.baseParams.damageType === 'mag' ? c.cMdef : c.cPdef
    }
  })

  q('#te-resetDefault')?.addEventListener('click', () => {
    tableState.baseParams = {
      baseAtk: 1_000_000, skillCoeff: 5.25, critMult: 1.5, factionBonus: 1.0,
      def: 5_000_000, pmDef: 5_000_000, pen: 11950, pmPen: 31200,
      cDef: 834953, cPen: 1725, cPmDef: 1382434, cPmPen: 16660,
      dmgBonus: 0.3, defDebuff: 0, damageType: 'phys', atkLevel: 500, defLevel: 500
    }
    renderTableExport(container)
  })

  q('#te-btnMd')?.addEventListener('click', () => {
    const tableData = doCalc()
    if (!tableData) return
    let md = `| ${tableState.yKey} ↓ \\ ${tableState.xKey} → | ` + tableData.xVals.join(' | ') + ' |\n'
    md += '| :--- | ' + tableData.xVals.map(() => ':---').join(' | ') + ' |\n'
    tableData.rows.forEach(r => {
      md += `| **${r.yVal}** | ` + r.cols.map(c => METRICS[tableState.metric].fmt(c[tableState.metric])).join(' | ') + ' |\n'
    })
    navigator.clipboard.writeText(md).then(() => alert('Markdown 已复制到剪贴板'))
  })

  q('#te-btnCsv')?.addEventListener('click', () => {
    const tableData = doCalc()
    if (!tableData) return
    let csv = `${tableState.yKey} \\ ${tableState.xKey},` + tableData.xVals.join(',') + '\n'
    tableData.rows.forEach(r => {
      csv += `${r.yVal},` + r.cols.map(c => c[tableState.metric]).join(',') + '\n'
    })
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `mmt_export_${tableState.xKey}_${tableState.yKey}.csv`; a.click()
    URL.revokeObjectURL(url)
  })
}

function doCalc() {
  const xVals = parseVals(tableState.xVals)
  const yVals = parseVals(tableState.yVals)
  if (!xVals.length || !yVals.length) return null
  const rows = buildCrossTable(xVals, yVals, tableState.xKey, tableState.yKey, tableState.baseParams)
  return { xVals, yVals, rows }
}

function generateTable() {
  const tableData = doCalc()
  const tableEl = document.querySelector('#te-tableContainer')
  if (!tableData || !tableEl) return

  const metric = METRICS[tableState.metric]
  tableEl.querySelector('thead').innerHTML = `
    <tr>
      <th style="min-width:120px;color:var(--gold)">${tableState.yKey} ↓<br><span style="color:#888">${tableState.xKey} →</span></th>
      ${tableData.xVals.map(x => `<th>${x.toLocaleString()}</th>`).join('')}
    </tr>`

  tableEl.querySelector('tbody').innerHTML = tableData.rows.map(r => `
    <tr>
      <td style="font-weight:600">${r.yVal.toLocaleString()}</td>
      ${r.cols.map(c => `<td>${metric.fmt(c[tableState.metric])}</td>`).join('')}
    </tr>
  `).join('')
}
