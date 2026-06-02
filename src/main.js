// src/main.js — 入口，路由
import { renderCalculator } from './views/Calculator.js'
import { renderSweepChart } from './views/SweepChart.js'
import { renderHeatmap }    from './views/HeatmapChart.js'
import { renderCompare }    from './views/ComparePanel.js'
import { renderTableExport } from './views/TableExport.js'

const views = {
  calculator: renderCalculator,
  sweep:      renderSweepChart,
  heatmap:    renderHeatmap,
  compare:    renderCompare,
  table:      renderTableExport,
}

let currentView = 'calculator'
const rendered = new Set()

function switchView(name) {
  if (!(name in views)) return

  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'))
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'))

  document.getElementById(`view-${name}`)?.classList.add('active')
  document.querySelector(`[data-view="${name}"]`)?.classList.add('active')

  currentView = name

  if (!rendered.has(name)) {
    const container = document.getElementById(`view-${name}`)
    if (container) {
      views[name](container)
      rendered.add(name)
    }
  }
}

function init() {
  document.getElementById('nav-list')?.addEventListener('click', e => {
    const item = e.target.closest('.nav-item')
    if (item?.dataset.view) switchView(item.dataset.view)
  })

  // Hide the old formula toggle if it exists
  const formulaToggle = document.getElementById('formula-toggle')
  if (formulaToggle) {
    formulaToggle.style.display = 'none'
  }
  const formulaDisplay = document.getElementById('formula-display')
  if (formulaDisplay) {
    formulaDisplay.style.display = 'none'
  }

  switchView('calculator')
}

init()
