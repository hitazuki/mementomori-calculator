import { t } from '../i18n/index.js'
import { calculateMysteriumRankings } from '../engine/mysteriumCalc.js'
import charactersRaw from '../constants/characters.json'
import mysteriumRaw from '../constants/mysterium_data.json'

const defaultScoringTemplate = [
  { group: 'grp_base', key: 'appLevelCap', ctype: 1, baseVal: 5, score: 50 },
  
  { group: 'grp_stats', key: 'appBasicStr', ctype: 3, baseVal: 30, score: 4 },
  { group: 'grp_stats', key: 'appBasicDex', ctype: 3, baseVal: 30, score: 4 },
  { group: 'grp_stats', key: 'appBasicMag', ctype: 3, baseVal: 30, score: 4 },
  { group: 'grp_stats', key: 'appBasicStm', ctype: 3, baseVal: 30, score: 4 },
  
  { group: 'grp_core', key: '[BattleParameterTypeAttackPower]', ctype: 1, baseVal: 5000, score: 0 },
  { group: 'grp_core', key: '[BattleParameterTypeAttackPower]', ctype: 2, baseVal: 0.02, score: 20 },
  { group: 'grp_core', key: '[BattleParameterTypeHp]', ctype: 2, baseVal: 0.05, score: 50 },
  { group: 'grp_core', key: '[BattleParameterTypeDefense]', ctype: 2, baseVal: 0.01, score: 10 },
  { group: 'grp_core', key: '[BattleParameterTypeDefense]', ctype: 3, baseVal: 15, score: 1 },
  { group: 'grp_core', key: '[BattleParameterTypePhysicalDamageRelax]', ctype: 1, baseVal: 3000, score: 0 },
  { group: 'grp_core', key: '[BattleParameterTypePhysicalDamageRelax]', ctype: 2, baseVal: 0.02, score: 10 },
  { group: 'grp_core', key: '[BattleParameterTypeMagicDamageRelax]', ctype: 1, baseVal: 3000, score: 0 },
  { group: 'grp_core', key: '[BattleParameterTypeMagicDamageRelax]', ctype: 2, baseVal: 0.02, score: 10 },

  { group: 'grp_pen', key: '[BattleParameterTypeDefensePenetration]', ctype: 1, baseVal: 200, score: 10 },
  { group: 'grp_pen', key: '[BattleParameterTypeDamageEnhance]', ctype: 1, baseVal: 250, score: 5 },

  { group: 'grp_crit', key: '[BattleParameterTypeCritical]', ctype: 3, baseVal: 70, score: 5 },
  { group: 'grp_crit', key: '[BattleParameterTypeCriticalDamageEnhance]', ctype: 2, baseVal: 0.1, score: 120 },
  { group: 'grp_crit', key: '[BattleParameterTypeCriticalResist]', ctype: 1, baseVal: 1500, score: 0 },
  { group: 'grp_crit', key: '[BattleParameterTypeCriticalResist]', ctype: 3, baseVal: 70, score: 5 },
  { group: 'grp_crit', key: '[BattleParameterTypePhysicalCriticalDamageRelax]', ctype: 2, baseVal: 0.1, score: 80 },
  { group: 'grp_crit', key: '[BattleParameterTypeMagicCriticalDamageRelax]', ctype: 2, baseVal: 0.1, score: 80 },

  { group: 'grp_hit', key: '[BattleParameterTypeHit]', ctype: 1, baseVal: 1500, score: 0 },
  { group: 'grp_hit', key: '[BattleParameterTypeHit]', ctype: 3, baseVal: 70, score: 3 },
  { group: 'grp_hit', key: '[BattleParameterTypeHit]', ctype: 2, baseVal: 0.015, score: 15 },
  { group: 'grp_hit', key: '[BattleParameterTypeAvoidance]', ctype: 1, baseVal: 1500, score: 0 },
  { group: 'grp_hit', key: '[BattleParameterTypeAvoidance]', ctype: 3, baseVal: 50, score: 2 },

  { group: 'grp_debuff', key: '[BattleParameterTypeDebuffHit]', ctype: 2, baseVal: 0.015, score: 5 },
  { group: 'grp_debuff', key: '[BattleParameterTypeDebuffHit]', ctype: 3, baseVal: 70, score: 2 },
  { group: 'grp_debuff', key: '[BattleParameterTypeDebuffResist]', ctype: 1, baseVal: 1500, score: 0 },
  { group: 'grp_debuff', key: '[BattleParameterTypeDebuffResist]', ctype: 3, baseVal: 70, score: 2 },

  { group: 'grp_special', key: '[BattleParameterTypeHpDrain]', ctype: 2, baseVal: 0.05, score: 100 },
  { group: 'grp_special', key: '[BattleParameterTypeDamageReflect]', ctype: 2, baseVal: 0.03, score: 60 }
]

const getCtypeStr = (ctype) => {
  if (ctype === 1) return t('ui_fixed')
  if (ctype === 2) return t('ui_percent')
  if (ctype === 3) return t('ui_growth')
  return ''
}

export function renderMysterium(container) {
  let algo = 3
  let mainTab = 'colls'
  let collSortBy = 'ce'
  let collSortDesc = true
  // Copy default template to state
  const stateTemplate = JSON.parse(JSON.stringify(defaultScoringTemplate))

  const grouped = {}
  stateTemplate.forEach(item => {
    if (!grouped[item.group]) grouped[item.group] = []
    grouped[item.group].push(item)
  })

  const renderScoringInputs = () => {
    let html = ''
    for (const [group, items] of Object.entries(grouped)) {
      html += `
        <div class="panel" style="margin-bottom: 12px; padding: 12px;">
          <h3 class="panel-title" style="margin-bottom: 8px; font-size: 13px;">${t(group)}</h3>
          <div class="form-group" style="gap: 4px;">
            ${items.map(item => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 2px 0; font-size: 12px; gap: 8px;">
                <div style="display: flex; gap: 6px; overflow: hidden; white-space: nowrap; flex: 1;">
                  <span style="overflow:hidden; text-overflow:ellipsis;" title="${item.key === 'appLevelCap' ? t('appLevelCap') : t(item.key)} ${getCtypeStr(item.ctype)}">
                    ${item.key === 'appLevelCap' ? t('appLevelCap') : t(item.key)} <span style="color:var(--text-muted); font-size: 11px;">${getCtypeStr(item.ctype)}</span>
                  </span>
                  <span style="color:var(--gold); flex-shrink: 0;">+${item.ctype === 2 ? item.baseVal*100+'%' : item.baseVal}</span>
                </div>
                <input class="form-input score-input" data-key="${item.key}" data-ctype="${item.ctype}" type="number" step="1" value="${item.score}" style="width:48px; text-align:center; padding: 2px 4px; height: 24px; flex-shrink: 0;">
              </div>
            `).join('')}
          </div>
        </div>
      `
    }
    return html
  }

  container.innerHTML = `
    <header class="header">
      <h1 class="title">${t('mysteriumTitle')}</h1>
      <p class="desc">${t('mysteriumDesc')}</p>
    </header>

    <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px;">
      <!-- Left Sidebar: Scoring Settings -->
      <div style="display: flex; flex-direction: column; max-height: calc(100vh - 120px);">
        <div class="panel" style="margin-bottom: 16px; background: rgba(201,168,76,0.1); border-color: rgba(201,168,76,0.3);">
          <h3 class="panel-title" style="color: var(--gold);">${t('ui_weight_title')}</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
            ${t('ui_weight_desc')}
          </p>
        </div>
        <div style="flex:1; overflow-y: auto; padding-right: 4px; padding-bottom: 32px;">
          ${renderScoringInputs()}
        </div>
      </div>

      <!-- Right Main: Results -->
      <div style="display: flex; flex-direction: column; gap: 16px; max-height: calc(100vh - 120px);">
        <div class="panel" style="padding-bottom: 0; border-bottom: none;">
          <div style="display: flex; gap: 16px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
            <button class="btn ${mainTab === 'colls' ? 'btn-primary' : 'btn-ghost'} btn-sm" data-maintab="colls">${t('ui_tab_colls')}</button>
            <button class="btn ${mainTab === 'chars' ? 'btn-primary' : 'btn-ghost'} btn-sm" data-maintab="chars">${t('ui_tab_chars')}</button>
          </div>
          <div id="algo-tabs-container" style="display: ${mainTab === 'chars' ? 'flex' : 'none'}; flex-direction: column; gap: 8px; padding-top: 12px; padding-bottom: 12px;">
            <div style="display: flex; gap: 8px;">
              <button class="btn ${algo === 1 ? 'btn-primary' : 'btn-ghost'} btn-sm" data-algo="1">${t('ui_algo1')}</button>
              <button class="btn ${algo === 2 ? 'btn-primary' : 'btn-ghost'} btn-sm" data-algo="2">${t('ui_algo2')}</button>
              <button class="btn ${algo === 3 ? 'btn-primary' : 'btn-ghost'} btn-sm" data-algo="3">${t('ui_algo3')}</button>
            </div>
            <div id="algo-desc-box" style="font-size: 12px; color: var(--text-muted); background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px; border-left: 2px solid var(--gold); margin-top: 4px; line-height: 1.5; animation: fadeIn 0.3s ease;">
              ${t('ui_algo' + algo + '_desc')}
            </div>
          </div>
        </div>
        
        <div class="panel" style="flex: 1; overflow-y: auto;">
          <div id="mysterium-results"></div>
        </div>
      </div>
    </div>
  `

  const resultsContainer = container.querySelector('#mysterium-results')

  const renderResults = () => {
    const result = calculateMysteriumRankings(charactersRaw, mysteriumRaw, stateTemplate, algo)
    const tLevelCap = stateTemplate.find(t => t.key === 'appLevelCap')
    
    const getDetailRow = (r, i, colspan) => {
      const charsCount = r.chars ? r.chars.length : 1
      let cardsHtml = `
        <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="font-weight: bold; margin-bottom: 6px; font-size: 13px; color: var(--text-primary);">🏰 <span style="font-size: 11px; color: var(--gold); font-weight: normal; margin-left: 4px;">⭐ ${(charsCount * tLevelCap.score).toFixed(1)}</span></div>
          <div style="font-size: 12px; color: var(--text-secondary); display: flex; justify-content: space-between;">
            <span>${t('appLevelCap')} +${charsCount * tLevelCap.baseVal}</span>
            <span style="opacity: 0.6;">${(charsCount * tLevelCap.score).toFixed(1)}</span>
          </div>
        </div>
      `
      
      const activatedList = r.activated || []
      activatedList.forEach(act => {
        const col = act.col || act
        const displayScore = act.score !== undefined ? act.score : col.totalScore
        const portionStr = act.portion !== undefined && act.portion < 1 ? ` <span style="font-size: 10px; color: var(--text-muted);">x${act.portion.toFixed(2)}</span>` : ''
        
        let detailsHtml = ''
        col.details.forEach(d => {
          const shortVal = d.ctype === 2 ? '+' + (d.val * 100) + '%' : (d.ctype === 3 ? '📈+' + d.val : '+' + d.val)
          const dScore = act.portion !== undefined ? d.score * act.portion : d.score
          detailsHtml += `
            <div style="font-size: 12px; color: var(--text-secondary); display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>${t(d.nameKey)} ${shortVal}</span>
              <span style="opacity: 0.6;">${dScore.toFixed(1)}</span>
            </div>
          `
        })
        
        cardsHtml += `
          <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="font-weight: bold; margin-bottom: 6px; font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${t(col.nameKey)}">${t(col.nameKey)}${portionStr} <span style="font-size: 11px; color: var(--gold); font-weight: normal; margin-left: 4px;">⭐ ${displayScore.toFixed(1)}</span></div>
            ${detailsHtml}
          </div>
        `
      })
      
      return `
        <tr style="display: none; background: rgba(0,0,0,0.2);">
          <td colspan="${colspan}" style="padding: 16px; border-bottom: 1px solid var(--border-subtle);">
            <div style="display: flex; flex-direction: column; gap: 12px; text-align: left; animation: fadeIn 0.3s ease;">
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">
                ${cardsHtml}
              </div>
            </div>
          </td>
        </tr>
      `
    }
    
    let html = '<table class="data-table"><thead><tr>'
    
    if (mainTab === 'colls') {
      let sortedColls = [...result.collections]
      sortedColls.sort((a, b) => {
        let valA = collSortBy === 'ce' ? a.ce : a.totalScore
        let valB = collSortBy === 'ce' ? b.ce : b.totalScore
        return collSortDesc ? valB - valA : valA - valB
      })

      const getSortIcon = (key) => {
        if (collSortBy !== key) return '<span style="opacity:0.3;font-size:10px;margin-left:4px;">↕</span>'
        return collSortDesc ? '<span style="font-size:10px;color:var(--gold);margin-left:4px;">▼</span>' : '<span style="font-size:10px;color:var(--gold);margin-left:4px;">▲</span>'
      }

      html += `
        <th>${t('ui_rank')}</th>
        <th>${t('ui_collection')}</th>
        <th>${t('ui_characters')}</th>
        <th>${t('ui_cost')}</th>
        <th class="sortable-th" data-sort="score" style="cursor:pointer;">${t('ui_score')} ${getSortIcon('score')}</th>
        <th class="sortable-th" data-sort="ce" style="cursor:pointer;">${t('ui_ce')} ${getSortIcon('ce')}</th>
      </tr></thead><tbody>
      `
      
      sortedColls.forEach((c, i) => {
        const charNames = c.chars.map(ch => t(ch.nameKey)).join(' + ')
        const dummyR = { chars: c.chars, activated: [{ col: c, portion: 1, score: c.totalScore }] }

        html += `
          <tr style="cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background=''" onclick="const n=this.nextElementSibling; n.style.display = n.style.display === 'none' ? 'table-row' : 'none'">
            <td>${i + 1}</td>
            <td style="color: var(--text-primary); font-weight: bold;">${t(c.nameKey)}</td>
            <td style="font-size: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${charNames}">${charNames}</td>
            <td>${c.cost}</td>
            <td>${c.totalScore.toFixed(1)}</td>
            <td style="color:var(--gold); font-weight:bold;">${c.ce === Infinity ? '∞' : c.ce.toFixed(2)}</td>
          </tr>
          ${getDetailRow(dummyR, i, 6)}
        `
      })
      html += '</tbody></table>'
      resultsContainer.innerHTML = html
      
      resultsContainer.querySelectorAll('.sortable-th').forEach(th => {
        th.addEventListener('click', () => {
          const key = th.dataset.sort
          if (collSortBy === key) {
            collSortDesc = !collSortDesc
          } else {
            collSortBy = key
            collSortDesc = true
          }
          renderResults()
        })
      })
      return
    }

    if (algo === 1) {
      html += `
        <th>${t('ui_rank')}</th>
        <th>${t('ui_characters')}</th>
        <th>${t('ui_cost')}</th>
        <th>${t('ui_score')}</th>
        <th>${t('ui_ce')} <span style="font-size: 10px; color: var(--text-muted); font-weight: normal; margin-left: 4px;">▼</span></th>
      </tr></thead><tbody>
      `
      result.rankings.forEach((r, i) => {
        const name = t(r.nameKey) + (r.name2Key ? ` (${t(r.name2Key)})` : '')
        html += `
          <tr style="cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background=''" onclick="const n=this.nextElementSibling; n.style.display = n.style.display === 'none' ? 'table-row' : 'none'">
            <td>${i + 1}</td>
            <td style="color: var(--text-primary); font-weight: bold;">${name}</td>
            <td>${r.cost}</td>
            <td>${r.score.toFixed(1)}</td>
            <td style="color:var(--gold); font-weight:bold;">${r.ce.toFixed(2)}</td>
          </tr>
          ${getDetailRow(r, i, 5)}
        `
      })
    } else if (algo === 2) {
      html += `
        <th>${t('ui_rank')}</th>
        <th>${t('ui_characters')}</th>
        <th>${t('ui_cost')}</th>
        <th>${t('ui_score')}</th>
        <th>${t('ui_ce')} <span style="font-size: 10px; color: var(--text-muted); font-weight: normal; margin-left: 4px;">▼</span></th>
      </tr></thead><tbody>
      `
      result.rankings.forEach((r, i) => {
        const names = r.chars.map(c => t(c.nameKey)).join(' + ')
        html += `
          <tr style="cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background=''" onclick="const n=this.nextElementSibling; n.style.display = n.style.display === 'none' ? 'table-row' : 'none'">
            <td>${i + 1}</td>
            <td style="color: var(--text-primary); font-weight: bold;">${names}</td>
            <td>${r.cost}</td>
            <td>${r.score.toFixed(1)}</td>
            <td style="color:var(--gold); font-weight:bold;">${r.ce.toFixed(2)}</td>
          </tr>
          ${getDetailRow(r, i, 5)}
        `
      })
    } else if (algo === 3) {
      html += `
        <th>${t('ui_rank')}</th>
        <th>${t('ui_characters')}</th>
        <th>${t('ui_cost')}</th>
        <th>${t('ui_score')}</th>
        <th>${t('ui_ce')}</th>
        <th>${t('ui_marginal_ce')}</th>
        <th>${t('ui_bottleneck')} <span style="font-size: 10px; color: var(--text-muted); font-weight: normal; margin-left: 4px;">▼</span></th>
      </tr></thead><tbody>
      `
      
      result.rankings.forEach((r, i) => {
        const names = r.chars.map(c => t(c.nameKey)).join(' + ')
        const bottleneck = r.bottleneck.length > 0 ? r.bottleneck.map(c => t(c.nameKey)).join('+') : '-'
        html += `
          <tr style="cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background=''" onclick="const n=this.nextElementSibling; n.style.display = n.style.display === 'none' ? 'table-row' : 'none'">
            <td>${i + 1}</td>
            <td style="color: var(--text-primary); font-weight: bold;">${names}</td>
            <td>${r.cost}</td>
            <td>${r.score.toFixed(1)}</td>
            <td>${r.ce.toFixed(2)}</td>
            <td style="color:var(--success); font-weight:bold;">${r.marginalCe.toFixed(2)}</td>
            <td style="font-size:11px; color:var(--text-muted)">${bottleneck}</td>
          </tr>
          ${getDetailRow(r, i, 7)}
        `
      })
    }
    
    html += '</tbody></table>'
    resultsContainer.innerHTML = html
  }

  renderResults()

  // Bind Events
  container.querySelectorAll('[data-maintab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      mainTab = e.target.dataset.maintab
      container.querySelectorAll('[data-maintab]').forEach(b => b.className = b.className.replace('btn-primary', 'btn-ghost'))
      e.target.className = e.target.className.replace('btn-ghost', 'btn-primary')
      
      const algoTabs = container.querySelector('#algo-tabs-container')
      if (algoTabs) algoTabs.style.display = mainTab === 'chars' ? 'flex' : 'none'
      
      renderResults()
    })
  })

  container.querySelectorAll('[data-algo]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      algo = parseInt(e.target.dataset.algo)
      container.querySelectorAll('[data-algo]').forEach(b => b.className = b.className.replace('btn-primary', 'btn-ghost'))
      e.target.className = e.target.className.replace('btn-ghost', 'btn-primary')
      
      const descBox = container.querySelector('#algo-desc-box')
      if (descBox) descBox.innerHTML = t('ui_algo' + algo + '_desc')
      
      renderResults()
    })
  })

  container.querySelectorAll('.score-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const key = e.target.dataset.key
      const ctype = parseInt(e.target.dataset.ctype)
      const val = parseFloat(e.target.value) || 0
      
      const item = stateTemplate.find(t => t.key === key && t.ctype === ctype)
      if (item) {
        item.score = val
        renderResults()
      }
    })
  })
}
