// src/views/Calculator.js
import { calcDamage } from '../engine/damageCalc.js'
import { LEVEL_PRESETS } from '../constants/levelTable.js'
import { SCENARIO_PRESETS } from '../constants/presets.js'

const DEFAULT = {
  baseAtk: 1_000_000, skillCoeff: 5.25,
  def: 5_000_000, pmDef: 5_000_000,
  pen: 11950, pmPen: 31200,
  cDef: 834953, cPen: 1725,
  cPmDef: 1382434, cPmPen: 16660,
  dmgBonus: 0.3, defDebuff: 0, critMult: 1.5, factionBonus: 1.0,
  damageType: 'phys', // 'phys' for P.DEF, 'mag' for M.DEF
  atkLevelPresetIdx: 4, // 默认选中 Lv500
  defLevelPresetIdx: 4,
}

let s = null

function fmt(n) { return n >= 1e6 ? `${(n/1e6).toFixed(2)}M` : n >= 1e3 ? `${(n/1e3).toFixed(0)}K` : String(n) }
function fmtPct(v, d=1) { return `${(v*100).toFixed(d)}%` }

export function renderCalculator(container) {
  if (!s) s = { ...DEFAULT }

  container.innerHTML = `
  <div class="view-header animate-fadeup">
    <h1 class="view-title">🎯 单体伤害计算器</h1>
    <p class="view-desc">基于真实公式：effective_DEF = DEF × C_pen / (PEN + C_pen)，伤害率 = C_def / (effective_DEF + C_def)。物理魔法双路相乘。</p>
  </div>

  <div class="chip-row animate-fadeup" id="calc-presets">
    ${SCENARIO_PRESETS.map(p => `<button class="chip" data-preset="${p.id}" title="${p.desc}">${p.label}</button>`).join('')}
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <div class="flex-col gap-12">

      <!-- 攻击方 -->
      <div class="card">
        <div class="card-title">⚔ 攻击方参数</div>
        <div class="form-group">
          <label class="form-label">攻击方等级预设 (影响贯通定数)</label>
          <select class="form-select" id="fi-atkLevelPreset">
            <option value="-1" ${s.atkLevelPresetIdx===-1?'selected':''}>手动调整系数</option>
            ${LEVEL_PRESETS.map((p,i)=>`<option value="${i}" ${s.atkLevelPresetIdx===i?'selected':''}>${p.label} (C_pen=${p.cPen})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">面板攻击力 <span class="value-display" id="dv-atk">${fmt(s.baseAtk)}</span></label>
          <input class="form-input" type="number" id="fi-baseAtk" value="${s.baseAtk}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">技能倍率 <span class="value-display" id="dv-coeff">${fmtPct(s.skillCoeff/1,'0')}</span></label>
          <input class="form-range" type="range" id="fi-skillCoeff" value="${s.skillCoeff}" min="1" max="20" step="0.25">
        </div>
        <div class="form-group">
          <label class="form-label">攻击类型</label>
          <div style="display:flex;gap:8px">
            <button class="btn ${s.damageType==='phys'?'btn-primary':'btn-ghost'} btn-sm" style="flex:1" data-type="phys">物理攻击 (P.DEF)</button>
            <button class="btn ${s.damageType==='mag' ?'btn-primary':'btn-ghost'} btn-sm" style="flex:1" data-type="mag">魔法攻击 (M.DEF)</button>
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">防御贯通 <span class="value-display" id="dv-pen">${s.pen.toLocaleString()}</span></label>
            <input class="form-input" type="number" id="fi-pen" value="${s.pen}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">物魔防御贯通 <span class="value-display" id="dv-pmpen">${s.pmPen.toLocaleString()}</span></label>
            <input class="form-input" type="number" id="fi-pmPen" value="${s.pmPen}" min="0">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">增伤加成 <span class="value-display" id="dv-bonus">${fmtPct(s.dmgBonus)}</span></label>
          <input class="form-range" type="range" id="fi-dmgBonus" value="${s.dmgBonus}" min="0" max="3" step="0.05">
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">爆击倍率 <span class="value-display" id="dv-crit">${fmtPct(s.critMult)}</span></label>
            <input class="form-range" type="range" id="fi-critMult" value="${s.critMult}" min="1.5" max="5" step="0.1">
          </div>
          <div class="form-group">
            <label class="form-label">阵营克制 <span class="value-display" id="dv-faction">${fmtPct(s.factionBonus)}</span></label>
            <input class="form-range" type="range" id="fi-factionBonus" value="${s.factionBonus}" min="1" max="1.5" step="0.05">
          </div>
        </div>
        <div class="divider"></div>
        <div class="text-xs text-muted mb-8">贯通定数 (受攻击方等级影响，可手动微调)</div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">C_pen 定数 <span class="value-display" id="dv-cp">${s.cPen}</span></label>
            <input class="form-input" type="number" id="fi-cPen" value="${s.cPen}" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">C_pmpen 定数 <span class="value-display" id="dv-cmp">${s.cPmPen}</span></label>
            <input class="form-input" type="number" id="fi-cPmPen" value="${s.cPmPen}" min="1">
          </div>
        </div>
      </div>

      <!-- 防守方 -->
      <div class="card">
        <div class="card-title">🛡 防守方参数</div>
        <div class="form-group">
          <label class="form-label">防守方等级预设 (影响防御定数)</label>
          <select class="form-select" id="fi-defLevelPreset">
            <option value="-1" ${s.defLevelPresetIdx===-1?'selected':''}>手动调整系数</option>
            ${LEVEL_PRESETS.map((p,i)=>`<option value="${i}" ${s.defLevelPresetIdx===i?'selected':''}>${p.label} (C_def=${fmt(p.cDef)} / C_pm=${fmt(s.damageType==='mag'?p.cMdef:p.cPdef)})</option>`).join('')}
          </select>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">目标防御力 (DEF)</label>
            <input class="form-input" type="number" id="fi-def" value="${s.def}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">目标${s.damageType==='phys'?'物理':'魔法'}防御力</label>
            <input class="form-input" type="number" id="fi-pmDef" value="${s.pmDef}" min="0">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">减防Debuff <span class="value-display" id="dv-debuff">${fmtPct(s.defDebuff)}</span></label>
          <input class="form-range" type="range" id="fi-defDebuff" value="${s.defDebuff}" min="0" max="0.9" step="0.05">
        </div>
        <div class="divider"></div>
        <div class="text-xs text-muted mb-8">防御定数 (受防守方等级影响，可手动微调)</div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">C_def 定数 <span class="value-display" id="dv-cd">${s.cDef.toLocaleString()}</span></label>
            <input class="form-input" type="number" id="fi-cDef" value="${s.cDef}" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">C_pmdef 定数 <span class="value-display" id="dv-cmd">${s.cPmDef.toLocaleString()}</span></label>
            <input class="form-input" type="number" id="fi-cPmDef" value="${s.cPmDef}" min="1">
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧结果 -->
    <div class="flex-col gap-12">
      <div id="calc-stats" class="grid-2 gap-12"></div>
      <div class="card">
        <div class="card-title">📊 伤害拆解</div>
        <div id="calc-breakdown" class="breakdown-list"></div>
      </div>
      <div class="card">
        <div class="card-title">📐 快查：防御贯通 × 目标防御力</div>
        <div style="overflow-x:auto">
          <table class="data-table" id="quick-table"><thead></thead><tbody></tbody></table>
        </div>
        <p class="text-xs text-muted mt-8">固定当前系数和物魔路贯通，仅扫描防御贯通(DEF Break)</p>
      </div>
    </div>
  </div>`

  attachCalcListeners(container)
  updateCalcResults()
}

function attachCalcListeners(container) {
  const numFields = [
    { id:'fi-baseAtk', key:'baseAtk', disp:'dv-atk',   fmt:v=>fmt(v) },
    { id:'fi-pen',     key:'pen',     disp:'dv-pen',   fmt:v=>v.toLocaleString() },
    { id:'fi-pmPen',   key:'pmPen',   disp:'dv-pmpen', fmt:v=>v.toLocaleString() },
    { id:'fi-def',     key:'def',     disp:null },
    { id:'fi-pmDef',   key:'pmDef',   disp:null },
    { id:'fi-cDef',    key:'cDef',    disp:'dv-cd',    fmt:v=>v.toLocaleString() },
    { id:'fi-cPen',    key:'cPen',    disp:'dv-cp',    fmt:v=>v },
    { id:'fi-cPmDef',  key:'cPmDef',  disp:'dv-cmd',   fmt:v=>v.toLocaleString() },
    { id:'fi-cPmPen',  key:'cPmPen',  disp:'dv-cmp',   fmt:v=>v },
  ]
  const rangeFields = [
    { id:'fi-skillCoeff',   key:'skillCoeff',   disp:'dv-coeff',  fmt:v=>`${(v*100).toFixed(0)}%` },
    { id:'fi-dmgBonus',     key:'dmgBonus',     disp:'dv-bonus',  fmt:fmtPct },
    { id:'fi-critMult',     key:'critMult',     disp:'dv-crit',   fmt:v=>`${(v*100).toFixed(0)}%` },
    { id:'fi-factionBonus', key:'factionBonus', disp:'dv-faction',fmt:v=>`×${v.toFixed(2)}` },
    { id:'fi-defDebuff',    key:'defDebuff',    disp:'dv-debuff', fmt:fmtPct },
  ]

  ;[...numFields, ...rangeFields].forEach(({ id, key, disp, fmt: f }) => {
    const el = container.querySelector(`#${id}`); if (!el) return
    el.addEventListener('input', () => {
      s[key] = parseFloat(el.value) || 0
      if (disp && f) { const d = container.querySelector(`#${disp}`); if (d) d.textContent = f(s[key]) }
      // 如果手动修改系数，将预设选项调成自定义
      if (['cPen', 'cPmPen'].includes(key)) {
        s.atkLevelPresetIdx = -1
        const sel = container.querySelector('#fi-atkLevelPreset')
        if (sel) sel.value = "-1"
      }
      if (['cDef', 'cPmDef'].includes(key)) {
        s.defLevelPresetIdx = -1
        const sel = container.querySelector('#fi-defLevelPreset')
        if (sel) sel.value = "-1"
      }
      updateCalcResults()
    })
  })

  container.querySelectorAll('[data-type]').forEach(btn => {
    btn.addEventListener('click', e => {
      s.damageType = btn.dataset.type
      container.querySelectorAll('[data-type]').forEach(b => b.className = b.className.replace('btn-primary','btn-ghost'))
      btn.className = btn.className.replace('btn-ghost','btn-primary')

      const titleEl = container.querySelector('#fi-pmDef').previousElementSibling
      if (titleEl) titleEl.textContent = `目标${s.damageType==='phys'?'物理':'魔法'}防御力`

      // 重新加载对应的预设系数 (仅防守方定数受影响)
      if (s.defLevelPresetIdx !== -1) {
        const p = LEVEL_PRESETS[s.defLevelPresetIdx]
        if (p) {
          s.cPmDef = s.damageType === 'mag' ? p.cMdef : p.cPdef
          const cmdEl = container.querySelector('#fi-cPmDef'); if (cmdEl) cmdEl.value = s.cPmDef
          const cmdDisp = container.querySelector('#dv-cmd'); if (cmdDisp) cmdDisp.textContent = s.cPmDef.toLocaleString()
          
          // 更新 select 里的 label (C_pm=xxx)
          const sel = container.querySelector('#fi-defLevelPreset')
          if (sel) {
            sel.innerHTML = `<option value="-1" ${s.defLevelPresetIdx===-1?'selected':''}>手动调整系数</option>` +
              LEVEL_PRESETS.map((p,i)=>`<option value="${i}" ${s.defLevelPresetIdx===i?'selected':''}>${p.label} (C_def=${fmt(p.cDef)} / C_pm=${fmt(s.damageType==='mag'?p.cMdef:p.cPdef)})</option>`).join('')
          }
        }
      }
      updateCalcResults()
    })
  })

  container.querySelector('#fi-atkLevelPreset')?.addEventListener('change', e => {
    const idx = parseInt(e.target.value)
    s.atkLevelPresetIdx = idx
    if (idx === -1) return
    const p = LEVEL_PRESETS[idx]
    if (!p) return
    s.cPen = p.cPen; s.cPmPen = p.cPmPen
    
    const elCPen = container.querySelector('#fi-cPen'); if (elCPen) elCPen.value = s.cPen
    const elCPmPen = container.querySelector('#fi-cPmPen'); if (elCPmPen) elCPmPen.value = s.cPmPen
    const d2 = container.querySelector('#dv-cp'); if(d2) d2.textContent = s.cPen
    const d4 = container.querySelector('#dv-cmp'); if(d4) d4.textContent = s.cPmPen
    updateCalcResults()
  })

  container.querySelector('#fi-defLevelPreset')?.addEventListener('change', e => {
    const idx = parseInt(e.target.value)
    s.defLevelPresetIdx = idx
    if (idx === -1) return
    const p = LEVEL_PRESETS[idx]
    if (!p) return
    s.cDef = p.cDef; s.cPmDef = s.damageType === 'mag' ? p.cMdef : p.cPdef
    
    const elCDef = container.querySelector('#fi-cDef'); if (elCDef) elCDef.value = s.cDef
    const elCPmDef = container.querySelector('#fi-cPmDef'); if (elCPmDef) elCPmDef.value = s.cPmDef
    const d1 = container.querySelector('#dv-cd'); if(d1) d1.textContent = s.cDef.toLocaleString()
    const d3 = container.querySelector('#dv-cmd'); if(d3) d3.textContent = s.cPmDef.toLocaleString()
    updateCalcResults()
  })

  container.querySelector('#calc-presets')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-preset]')
    if (!btn) return
    const preset = SCENARIO_PRESETS.find(p => p.id === btn.dataset.preset)
    if (preset) {
      s = { ...s, ...preset.params }
      s.atkLevelPresetIdx = -1
      s.defLevelPresetIdx = -1
      renderCalculator(container)
    }
  })
}

function updateCalcResults() {
  const r = calcDamage(s)
  const statsEl = document.querySelector('#calc-stats')
  if (statsEl) statsEl.innerHTML = `
    <div class="stat-box"><div class="stat-value is-danger">${fmt(r.finalDmg)}</div><div class="stat-label">最终伤害</div></div>
    <div class="stat-box"><div class="stat-value">${r.dmgRatePct}%</div><div class="stat-label">综合穿透率 (伤害通过率)</div></div>
    <div class="stat-box"><div class="stat-value is-purple">${r.defMitPct}%</div><div class="stat-label">防御路减伤率</div></div>
    <div class="stat-box"><div class="stat-value is-info">${r.pmMitPct}%</div><div class="stat-label">物魔路减伤率</div></div>
    <div class="stat-box"><div class="stat-value">${fmt(r.rawDmg)}</div><div class="stat-label">技能原始伤害</div></div>
    <div class="stat-box"><div class="stat-value is-success">${r.totalMitPct}%</div><div class="stat-label">综合防御减伤率</div></div>
    <div class="stat-box"><div class="stat-value">${fmt(r.effectiveDef)}</div><div class="stat-label">有效防御 (防御路)</div></div>
    <div class="stat-box"><div class="stat-value">${fmt(r.effectivePmDef)}</div><div class="stat-label">有效物魔防御 (物魔路)</div></div>
  `

  const bkEl = document.querySelector('#calc-breakdown')
  if (bkEl) {
    const base = r.rawDmg
    const afterBonus = base * (1 + s.dmgBonus)
    const afterDef   = afterBonus * r.drDef
    const afterPm    = afterDef   * r.drPm
    const afterCrit  = afterPm    * s.critMult
    const final      = afterCrit  * s.factionBonus

    const steps = [
      { label: '技能原始伤害', val: base,       color: '#c9a84c' },
      { label: `+ 增伤 (+${fmtPct(s.dmgBonus)})`, val: afterBonus, color: '#e8c96a' },
      { label: `× 防御通过 (${r.defDmgPct}%)`, val: afterDef, color: '#9b59b6' },
      { label: `× 物魔防御通过 (${r.pmDmgPct}%)`,  val: afterPm,  color: '#3498db' },
      { label: `× 爆击 (${fmtPct(s.critMult)})`, val: afterCrit, color: '#e07820' },
      { label: `× 阵营克制 (×${s.factionBonus.toFixed(2)})`, val: final, color: '#2ecc71' },
    ]
    bkEl.innerHTML = steps.map((st, i) => `
      <div class="breakdown-item">
        <span class="breakdown-label"><span style="width:8px;height:8px;border-radius:50%;background:${st.color};display:inline-block;flex-shrink:0"></span>${st.label}</span>
        <span class="breakdown-value" style="color:${st.color}">${fmt(Math.round(st.val))}</span>
      </div>
      ${i<steps.length-1?`<div class="breakdown-bar" style="width:${Math.min(100,(st.val/base*100))}%;background:linear-gradient(90deg,${st.color},transparent)"></div>`:''}
    `).join('')
  }

  const penVals = [0, 4950, 11950, 18950]
  const defVals = [1e6, 3e6, 5e6, 10e6, 20e6]
  const table = document.querySelector('#quick-table')
  if (table) {
    table.querySelector('thead').innerHTML = `<tr><th>防御贯通↓/目标防御→</th>${defVals.map(d=>`<th>${fmt(d)}</th>`).join('')}</tr>`
    table.querySelector('tbody').innerHTML = penVals.map(pen => `
      <tr><td>${pen.toLocaleString()}</td>${defVals.map(d=>{
        const rr = calcDamage({...s, pen, def:d})
        const cls = rr.defMitPct < 40 ? 'cell-high' : rr.defMitPct > 70 ? 'cell-low' : ''
        return `<td class="${cls}">减${rr.defMitPct}%</td>`
      }).join('')}</tr>
    `).join('')
  }
}
