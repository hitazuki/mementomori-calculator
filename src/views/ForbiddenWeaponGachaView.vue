<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('forbiddenWeaponGachaTitle') }}</h1>
    <p class="view-desc">{{ $t('forbiddenWeaponGachaDesc') }}</p>
  </div>

  <section class="weapon-banner-control animate-fadeup">
    <div class="card weapon-banner-card">
      <div class="card-title">武具召唤类型</div>
      <div class="segmented-control">
        <button
          v-for="banner in bannerOptions"
          :key="banner.key"
          class="btn btn-sm"
          :class="selectedBanner === banner.key ? 'btn-primary' : 'btn-ghost'"
          @click="selectedBanner = banner.key"
        >
          {{ banner.shortLabel }}
        </button>
      </div>
    </div>
  </section>

  <section class="weapon-layout animate-fadeup">
    <div class="weapon-main">
      <section class="weapon-summary">
        <div class="stat-box">
          <div class="stat-value">{{ fmtDiamonds(analysis.ticketValue) }}</div>
          <div class="stat-label">{{ analysis.config.costItem.label }}价值</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ fmtPercent(selected.sideRecoveryRate) }}</div>
          <div class="stat-label">副产物回收率</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ fmtDiamonds(selected.implicitCoreUnit) }}</div>
          <div class="stat-label">卷轴/魔书隐含单价</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ analysis.bestNode.pulls }} 抽</div>
          <div class="stat-label">最低隐含单价节点</div>
        </div>
      </section>

      <section class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">抽数与核心产物成本</div>
            <span class="tag tag-gold">累抽奖励已并入</span>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="implicitCostOption" autoresize />
        </div>
      </section>

      <section class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">抽数与预计产物数量</div>
            <span class="tag tag-purple">期望数量</span>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="quantityOption" autoresize />
        </div>
      </section>

      <section class="weapon-charts-row">
        <div class="card weapon-chart-card">
          <div class="chart-toolbar">
            <div class="card-title">成本拆解</div>
          </div>
          <div class="chart-frame weapon-chart-frame-sm">
            <v-chart class="chart" :option="costBreakdownOption" autoresize />
          </div>
        </div>

        <div class="card weapon-chart-card">
          <div class="chart-toolbar">
            <div class="card-title">副产物贡献</div>
          </div>
          <div class="chart-frame weapon-chart-frame-sm">
            <v-chart class="chart" :option="sideContributionOption" autoresize />
          </div>
        </div>
      </section>
    </div>

    <aside class="weapon-side">
      <div class="card">
        <div class="card-title">累计抽数</div>
        <div class="form-group">
          <label class="form-label">
            <span>用于结论计算</span>
            <span class="value-display">{{ selectedPulls }} 抽</span>
          </label>
          <input class="form-range" type="range" min="1" max="100" step="1" v-model.number="selectedPulls">
          <input class="form-input weapon-pull-input" type="number" min="1" max="100" v-model.number="selectedPulls">
        </div>
        <div class="weapon-preset-row">
          <button class="btn btn-sm" :class="selectedPulls === 10 ? 'btn-primary' : 'btn-ghost'" @click="selectedPulls = 10">10 抽</button>
          <button class="btn btn-sm" :class="selectedPulls === 20 ? 'btn-primary' : 'btn-ghost'" @click="selectedPulls = 20">20 抽</button>
          <button class="btn btn-sm" :class="selectedPulls === 50 ? 'btn-primary' : 'btn-ghost'" @click="selectedPulls = 50">50 抽</button>
          <button class="btn btn-sm" :class="selectedPulls === 100 ? 'btn-primary' : 'btn-ghost'" @click="selectedPulls = 100">100 抽</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">当前抽数结果</div>
        <div class="weapon-result-list">
          <div>
          <span>总成本</span>
            <b>{{ fmtDiamonds(selected.totalCost) }}</b>
          </div>
          <div>
            <span>副产物抵扣</span>
            <b>{{ fmtDiamonds(selected.sideValue) }}</b>
          </div>
          <div>
            <span>{{ coreScrollLabel }}预计数量</span>
            <b>{{ fmtQty(selected.coreCounts.scroll) }}</b>
          </div>
          <div>
            <span>{{ coreGrimoireLabel }}预计数量</span>
            <b>{{ fmtQty(selected.coreCounts.grimoire) }}</b>
          </div>
          <div>
            <span>核心产物总数</span>
            <b>{{ fmtQty(selected.totalCoreCount) }}</b>
          </div>
        </div>
      </div>

      <div class="card">
        <button class="btn btn-ghost weapon-formula-toggle" @click="showFormula = !showFormula">
          {{ showFormula ? '收起公式' : '查看公式计算流程' }}
        </button>
        <div v-show="showFormula" class="weapon-formula">
          <p>副产物价值来自道具评分表，卷轴/魔书不单独手填。</p>
          <p>副产物回收率 = 副产物期望价值 / {{ analysis.config.costItem.label }}总价值。</p>
          <p>卷轴/魔书隐含单价 = max(0, 总成本 - 副产物价值) / 预计核心产物数量。</p>
          <p>每 10 抽获得一次累计奖励，卷轴/魔书交替出现，不限次数；这些奖励已并入预计数量。</p>
        </div>
      </div>

      <div class="card">
        <div class="card-title">产物明细</div>
        <div class="weapon-detail-list">
          <div v-for="drop in selectedSideRows" :key="drop.key" class="weapon-detail-row">
            <span>{{ drop.label }}</span>
            <b>{{ fmtPercent(drop.rate) }}</b>
            <small>评分：{{ fmtScoreValue(drop.scoreMeta.score) }} 钻 / {{ drop.scoreMeta.batch.toLocaleString() }} 个</small>
            <small>当前预计：{{ fmtQty(drop.expectedQty) }} 个，价值 {{ fmtScoreValue(drop.expectedValue) }} 钻</small>
            <small>每抽贡献：{{ fmtScoreValue(drop.expectedValuePerPull) }} 钻</small>
          </div>
        </div>
      </div>
    </aside>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'

import { buildForbiddenWeaponGachaAnalysis, WEAPON_GACHA_CONFIGS } from '../engine/forbiddenWeaponGachaCalc.js'
import { normalizeScores } from '../engine/packCalc.js'
import { editableScores } from '../store/itemScores.js'
import { baseChartOption, getMoriTheme, LINE_COLORS } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'

use([CanvasRenderer, BarChart, LineChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent])

useI18n()

const selectedBanner = ref('forbidden')
const selectedPulls = ref(20)
const showFormula = ref(false)
const bannerOptions = Object.values(WEAPON_GACHA_CONFIGS)

const normalizedScores = computed(() => normalizeScores(editableScores))
const analysis = computed(() => buildForbiddenWeaponGachaAnalysis(normalizedScores.value, {
  bannerKey: selectedBanner.value,
  selectedPulls: selectedPulls.value,
  maxPulls: 100,
}))
const selected = computed(() => analysis.value.selected)
const coreScrollLabel = computed(() => analysis.value.config.coreDrops.find(drop => drop.key === 'scroll')?.label || '卷轴')
const coreGrimoireLabel = computed(() => analysis.value.config.coreDrops.find(drop => drop.key === 'grimoire')?.label || '魔书')

const fmtDiamonds = value => `${Math.round(value).toLocaleString()} 钻`
const fmtScoreValue = value => {
  if (Math.abs(value) > 0 && Math.abs(value) < 1) return value.toFixed(3)
  if (Math.abs(value) < 10) return value.toFixed(2)
  return Math.round(value).toLocaleString()
}
const fmtPercent = value => `${(value * 100).toFixed(1)}%`
const fmtQty = value => value >= 10 ? value.toFixed(1) : value.toFixed(2)

const selectedSideRows = computed(() => analysis.value.sideDrops.map(drop => ({
  ...drop,
  expectedQty: selected.value.sideQuantities[drop.key] || 0,
  expectedValue: selected.value.sideValues[drop.key] || 0,
})))

const chartTooltip = (rows, title, fields) => (params) => {
  const list = Array.isArray(params) ? params : [params]
  const row = rows[list[0].dataIndex]
  let html = `<b style="color:var(--gold)">${title}：${row.pulls} 抽</b><br>`
  list.forEach(item => {
    html += `<span style="color:${item.color}">● ${item.seriesName}</span>：<b>${item.value}</b><br>`
  })
  fields?.forEach(field => {
    html += `${field.label}：<b>${field.format(row)}</b><br>`
  })
  return html
}

const implicitCostOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = analysis.value.rows
  const milestonePoints = rows
    .filter(row => row.pulls % analysis.value.config.milestone.interval === 0)
    .map(row => ({
      name: `${row.pulls}抽`,
      coord: [row.pulls, Math.round(row.implicitCoreUnit)],
      value: String(row.pulls),
    }))

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      formatter: chartTooltip(rows, '累计抽数', [
        { label: '副产物回收率', format: row => fmtPercent(row.sideRecoveryRate) },
        { label: '预计核心产物', format: row => fmtQty(row.totalCoreCount) },
      ]),
    },
    legend: { ...theme.legend, top: 8, right: 16 },
    xAxis: {
      type: 'category',
      data: rows.map(row => row.pulls),
      axisLabel: theme.axisLabel,
      axisLine: theme.axisLine,
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...theme.axisLabel, formatter: '{value} 钻' },
      splitLine: theme.splitLine,
    },
    series: [
      {
        name: '卷轴/魔书隐含单价',
        type: 'line',
        smooth: true,
        symbolSize: 4,
        markPoint: {
          symbolSize: 34,
          data: milestonePoints,
          itemStyle: { color: LINE_COLORS[0] },
        },
        lineStyle: { width: 3, color: LINE_COLORS[0] },
        itemStyle: { color: LINE_COLORS[0] },
        data: rows.map(row => Math.round(row.implicitCoreUnit)),
      },
    ],
  }
})

const quantityOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = analysis.value.rows

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      formatter: chartTooltip(rows, '累计抽数', [
        { label: '强化水', format: row => `${Math.round(row.sideQuantities.water).toLocaleString()}` },
        { label: '符石兑换券', format: row => fmtQty(row.sideQuantities.rune) },
        { label: '首领挑战券', format: row => fmtQty(row.sideQuantities.boss1 + row.sideQuantities.boss3) },
      ]),
    },
    legend: { ...theme.legend, top: 8, right: 16 },
    xAxis: {
      type: 'category',
      data: rows.map(row => row.pulls),
      axisLabel: theme.axisLabel,
      axisLine: theme.axisLine,
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...theme.axisLabel },
      splitLine: theme.splitLine,
    },
    series: [
      {
        name: coreScrollLabel.value,
        type: 'line',
        smooth: true,
        lineStyle: { width: 3, color: LINE_COLORS[0] },
        itemStyle: { color: LINE_COLORS[0] },
        data: rows.map(row => +row.coreCounts.scroll.toFixed(2)),
      },
      {
        name: coreGrimoireLabel.value,
        type: 'line',
        smooth: true,
        lineStyle: { width: 3, color: LINE_COLORS[1] },
        itemStyle: { color: LINE_COLORS[1] },
        data: rows.map(row => +row.coreCounts.grimoire.toFixed(2)),
      },
      {
        name: '首领挑战券',
        type: 'line',
        smooth: true,
        lineStyle: { width: 2, color: LINE_COLORS[2], type: 'dashed' },
        itemStyle: { color: LINE_COLORS[2] },
        data: rows.map(row => +(row.sideQuantities.boss1 + row.sideQuantities.boss3).toFixed(2)),
      },
      {
        name: '符石兑换券',
        type: 'line',
        smooth: true,
        lineStyle: { width: 2, color: LINE_COLORS[3], type: 'dashed' },
        itemStyle: { color: LINE_COLORS[3] },
        data: rows.map(row => +row.sideQuantities.rune.toFixed(2)),
      },
      {
        name: '强化水(千瓶)',
        type: 'line',
        smooth: true,
        lineStyle: { width: 2, color: LINE_COLORS[4], type: 'dashed' },
        itemStyle: { color: LINE_COLORS[4] },
        data: rows.map(row => +(row.sideQuantities.water / 1000).toFixed(2)),
      },
    ],
  }
})

const costBreakdownOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = analysis.value.compareRows

  return {
    ...baseChartOption('', '', isDark),
    tooltip: { ...theme.tooltip, trigger: 'axis', formatter: chartTooltip(rows, '成本拆解') },
    legend: { ...theme.legend, top: 8, right: 16 },
    xAxis: {
      type: 'category',
      data: rows.map(row => `${row.pulls}抽`),
      axisLabel: theme.axisLabel,
      axisLine: theme.axisLine,
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...theme.axisLabel, formatter: '{value} 钻' },
      splitLine: theme.splitLine,
    },
    series: [
      {
        name: '副产物抵扣',
        type: 'bar',
        stack: 'cost',
        itemStyle: { color: LINE_COLORS[2] },
        data: rows.map(row => Math.round(row.sideValue)),
      },
      {
        name: '卷轴/魔书隐含成本',
        type: 'bar',
        stack: 'cost',
        itemStyle: { color: LINE_COLORS[0] },
        data: rows.map(row => Math.round(row.coreBudget)),
      },
    ],
  }
})

const sideContributionOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = analysis.value.sideDrops

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      formatter: params => {
        const item = params[0]
        const row = rows[item.dataIndex]
        return `<b style="color:var(--gold)">${row.label}</b><br>概率：${fmtPercent(row.rate)}<br>评分：${fmtScoreValue(row.scoreMeta.score)} 钻 / ${row.scoreMeta.batch.toLocaleString()} 个<br>期望贡献：<b>${fmtScoreValue(row.expectedValuePerPull)} 钻 / 抽</b>`
      },
    },
    grid: { top: 36, right: 16, bottom: 70, left: 58 },
    xAxis: {
      type: 'category',
      data: rows.map(row => row.label),
      axisLabel: { ...theme.axisLabel, rotate: 24 },
      axisLine: theme.axisLine,
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...theme.axisLabel, formatter: '{value}' },
      splitLine: theme.splitLine,
    },
    series: [
      {
        name: '期望贡献',
        type: 'bar',
        barMaxWidth: 34,
        itemStyle: { color: LINE_COLORS[0] },
        data: rows.map(row => +row.expectedValuePerPull.toFixed(3)),
      },
    ],
  }
})
</script>

<style scoped>
.weapon-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 14px;
  align-items: start;
}

.weapon-banner-control {
  margin-bottom: 14px;
}

.weapon-banner-card {
  max-width: 420px;
}

.weapon-main,
.weapon-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.weapon-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.weapon-charts-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.weapon-chart-card {
  min-width: 0;
}

.weapon-chart-frame {
  height: 380px;
  min-height: 380px;
}

.weapon-chart-frame-sm {
  height: 300px;
  min-height: 300px;
}

.weapon-pull-input {
  margin-top: 10px;
  text-align: center;
}

.weapon-preset-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.weapon-result-list,
.weapon-detail-list {
  display: grid;
  gap: 8px;
}

.weapon-result-list div,
.weapon-detail-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  background: rgba(var(--color-invert-rgb), 0.035);
}

.weapon-result-list span,
.weapon-detail-row span {
  color: var(--text-secondary);
  min-width: 0;
}

.weapon-result-list b,
.weapon-detail-row b {
  color: var(--gold);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.weapon-detail-row small {
  grid-column: 1 / -1;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}

.weapon-formula-toggle {
  width: 100%;
}

.weapon-formula {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-subtle);
  color: var(--text-muted);
  font-size: var(--fs-sm);
  line-height: 1.55;
}

.weapon-formula p + p {
  margin-top: 8px;
}

@media (max-width: 1100px) {
  .weapon-layout,
  .weapon-charts-row {
    grid-template-columns: 1fr;
  }

  .weapon-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .weapon-layout,
  .weapon-main,
  .weapon-side,
  .weapon-charts-row,
  .weapon-summary {
    gap: 12px;
  }

  .weapon-summary {
    grid-template-columns: 1fr;
  }

  .weapon-chart-frame,
  .weapon-chart-frame-sm {
    height: 340px;
    min-height: 340px;
  }
}
</style>
