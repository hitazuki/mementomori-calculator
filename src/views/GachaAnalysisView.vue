<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('gachaTitle') }}</h1>
    <p class="view-desc">{{ $t('gachaDesc') }}</p>
  </div>

  <section class="gacha-controls animate-fadeup">
    <div class="card gacha-filter-card">
      <div class="gacha-filter-row">
        <div class="gacha-filter-label">召唤类型</div>
        <div class="segmented-control">
          <button
            v-for="banner in bannerOptions"
            :key="banner.key"
            class="btn btn-sm"
            :class="selectedBanner === banner.key ? 'btn-primary' : 'btn-ghost'"
            @click="selectedBanner = banner.key"
          >
            {{ banner.label }}
          </button>
        </div>
      </div>
      <div class="gacha-filter-row">
        <div class="gacha-filter-label">角色属性</div>
        <div class="segmented-control">
          <button
            v-for="type in typeOptions"
            :key="type.key"
            class="btn btn-sm"
            :class="selectedType === type.key ? 'btn-primary' : 'btn-ghost'"
            @click="selectedType = type.key"
          >
            {{ type.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="card gacha-rule-card">
      <div class="gacha-rule-header">
        <div class="card-title">当前规则</div>
        <details class="gacha-rule-details">
          <summary>计价口径</summary>
          <div class="gacha-rule-detail-body">
            <template v-if="selectedBanner === 'pickup'">
              <span>规则：{{ analysis.config.note }}</span>
              <span>SR：扣除限定/光暗常驻 → 魔女的来信(SR)</span>
              <span>光暗常驻 → 魔女的邀请函</span>
              <span>R → 魔女的来信(R)</span>
              <span>N → 0.5 魔女的心片(SR)</span>
              <span>累抽：20/50 符石；300 整抽邀请函；其余整百 SR心片 x80</span>
            </template>
            <template v-else>
              <span>规则：{{ analysis.config.note }}</span>
              <span>副产物 → 道具评分表</span>
              <span>30000钻大奖 → 30000 钻</span>
              <span>圣德芬卷轴/魔书 → 天光武具隐含单价</span>
              <span>亚斯塔禄卷轴/魔书 → 禁忌武具隐含单价</span>
              <span>净成本/净预算：已扣副产物回收</span>
            </template>
          </div>
        </details>
      </div>
      <div class="gacha-rule-grid">
        <div class="gacha-rule-cell">
          <span>卡池</span>
          <b>{{ analysis.config.bannerLabel }} / {{ analysis.config.typeLabel }}</b>
        </div>
        <div class="gacha-rule-cell">
          <span>单抽</span>
          <b>{{ analysis.config.costPerPull.toLocaleString() }} 钻</b>
        </div>
        <div class="gacha-rule-cell">
          <span>基础</span>
          <b>{{ fmtPercent(analysis.config.baseRate, 4) }}</b>
        </div>
        <div class="gacha-rule-cell gacha-rule-cell-wide">
          <span>保底</span>
          <b :title="analysis.config.note">{{ rulePityText }}</b>
        </div>
      </div>
    </div>
  </section>

  <section class="gacha-summary animate-fadeup">
    <div class="stat-box">
      <div class="stat-value">{{ fmtPulls(analysis.expectedPulls) }}</div>
      <div class="stat-label">平均出货</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">{{ hasSideReturn ? fmtPercent(analysis.sideRecoveryRate) : fmtDiamonds(analysis.expectedNetCost) }}</div>
      <div class="stat-label">{{ hasSideReturn ? '副产物回收率' : selectedBanner === 'destiny' ? '期望净成本' : '期望成本' }}</div>
    </div>
    <div v-if="hasSideReturn" class="stat-box">
      <div class="stat-value">{{ fmtDiamonds(analysis.expectedGrossCost) }}</div>
      <div class="stat-label">期望总成本</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">{{ hasSideReturn ? fmtDiamonds(analysis.expectedNetCost) : fmtDiamonds(quantileGrossCost('p50')) }}</div>
      <div class="stat-label">{{ hasSideReturn ? '期望净成本' : '50%预算' }}</div>
    </div>
    <div v-if="hasSideReturn" class="stat-box">
      <div class="stat-value">{{ fmtDiamonds(quantileGrossCost('p90')) }}</div>
      <div class="stat-label">90%总预算</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">{{ fmtDiamonds(hasSideReturn ? quantileNetCost('p90') : quantileGrossCost('p90')) }}</div>
      <div class="stat-label">{{ hasSideReturn ? '90%净预算' : '90%预算' }}</div>
    </div>
  </section>

  <section class="gacha-main animate-fadeup">
    <div class="card gacha-chart-card">
      <div class="chart-toolbar">
        <div class="chart-toolbar-main">
          <div class="card-title">预算达成概率</div>
          <span class="tag tag-gold">指定限定</span>
        </div>
      </div>
      <div class="chart-frame gacha-chart-frame">
        <v-chart class="chart" :option="cumulativeChartOption" autoresize />
      </div>
    </div>

    <div class="card gacha-budget-card">
      <div class="card-title">关键抽数</div>
      <div class="gacha-budget-list">
        <div class="gacha-budget-head" :class="{ 'has-net': hasSideReturn }">
          <span>抽数</span>
          <span>成功率</span>
          <span>总预算</span>
          <span v-if="hasSideReturn">净预算</span>
        </div>
        <div v-for="row in budgetRows" :key="row.pull" class="gacha-budget-row" :class="{ 'has-net': hasSideReturn }">
          <span>{{ row.pull }}抽</span>
          <b>{{ fmtPercent(row.limitedRate) }}</b>
          <small>{{ fmtDiamonds(row.diamonds) }}</small>
          <small v-if="hasSideReturn">{{ fmtDiamonds(row.netCost) }}</small>
        </div>
      </div>
      <div class="gacha-side-note">
        <b>预算口径</b>
        <template v-if="hasSideReturn">
          <template v-if="selectedBanner === 'pickup'">
            净预算 = 总预算 - 副产物估值；300 抽内副产物估值 {{ fmtDiamonds(detailSideSummary.sideValue) }}。
          </template>
          <template v-else>
            净预算 = 总预算 - 副产物估值；每抽期望回收 {{ fmtDiamondValue(analysis.sideValuePerPull) }}，平均出货前合计 {{ fmtDiamonds(analysis.expectedSideValue) }}。
          </template>
          <span v-if="probabilityCheckNotice">{{ probabilityCheckNotice }}</span>
        </template>
        <template v-else-if="selectedBanner === 'destiny'">
          30000 钻大奖：抽到出货为止的期望返钻约 {{ fmtDiamonds(analysis.expectedDiamondPrize) }}；满 {{ analysis.config.maxPulls }} 抽至少中一次概率 {{ fmtPercent(analysis.diamondPrizeChanceAtCeiling) }}。
        </template>
        <template v-else>
          光暗常驻按持续抽满计算：100 抽至少中一次 {{ fmtPercent(analysis.permanentChanceAtCeiling) }}，300 抽至少中一次 {{ fmtPercent(analysis.permanentChanceAtInvitation) }}。魔女的邀请函成本为 {{ fmtDiamonds(invitationCost) }}。
        </template>
      </div>
    </div>
  </section>

  <section class="gacha-secondary animate-fadeup">
    <div class="card gacha-chart-card">
      <div class="chart-toolbar">
        <div class="card-title">首次命中分布</div>
      </div>
      <div class="chart-frame gacha-chart-frame-sm">
        <v-chart class="chart" :option="distributionChartOption" autoresize />
      </div>
    </div>

    <div class="card gacha-chart-card">
      <div class="chart-toolbar">
        <div class="card-title">逐抽条件概率</div>
      </div>
      <div class="chart-frame gacha-chart-frame-sm">
        <v-chart class="chart" :option="rateChartOption" autoresize />
      </div>
    </div>
  </section>

  <section v-if="hasSideReturn" class="gacha-side-analysis animate-fadeup">
    <div class="card gacha-chart-card">
      <div class="chart-toolbar">
        <div class="chart-toolbar-main">
          <div class="card-title">副产物价值贡献</div>
          <span class="tag tag-purple">每抽期望</span>
        </div>
      </div>
      <div class="chart-frame gacha-chart-frame-sm">
        <v-chart class="chart" :option="sideContributionOption" autoresize />
      </div>
    </div>

    <div class="card gacha-side-detail-card">
      <div class="chart-toolbar">
        <div class="chart-toolbar-main">
          <div class="card-title">副产物评分明细</div>
          <span class="tag tag-gold">来自评分表</span>
        </div>
      </div>
      <div class="gacha-side-detail-list">
        <div v-for="drop in sideDetailRows" :key="drop.key" class="gacha-side-detail-row">
          <div>
            <span>{{ drop.label }}</span>
            <small>{{ drop.rateText }}，{{ sideDetailPulls }} 抽期望 {{ fmtQty(drop.expectedQtyAtCeiling) }} 个</small>
          </div>
          <b v-if="drop.isPriced">{{ fmtDiamondValue(drop.expectedValuePerPull) }}/抽</b>
          <b v-else>未计价</b>
          <small v-if="drop.isPriced">{{ scoreSourceText(drop) }}</small>
          <small v-else>专属产物</small>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import VChart from 'vue-echarts'

import { buildGachaAnalysis, calcAtLeastOne, GACHA_BANNERS, GACHA_TYPES } from '../engine/gachaCalc.js'
import { normalizeScores } from '../engine/packCalc.js'
import { applyDerivedScores } from '../engine/derivedScores.js'
import { editableScores } from '../store/itemScores.js'
import { baseChartOption, getMoriTheme, LINE_COLORS } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'

use([CanvasRenderer, BarChart, LineChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent])

useI18n()

const selectedBanner = ref('destiny')
const selectedType = ref('fourElements')

const bannerOptions = Object.values(GACHA_BANNERS).map(({ key, label }) => ({ key, label }))
const typeOptions = Object.values(GACHA_TYPES)

const normalizedScores = computed(() => applyDerivedScores(normalizeScores(editableScores)))
const analysis = computed(() => buildGachaAnalysis(selectedBanner.value, selectedType.value, normalizedScores.value))
const hasSideReturn = computed(() => analysis.value.sideDrops.length > 0)

const fmtPercent = (value, digits = 2) => `${(value * 100).toFixed(digits)}%`
const fmtPulls = (value) => `${value.toFixed(1)} 抽`
const fmtDiamonds = (value) => `${Math.round(value).toLocaleString()} 钻`
const fmtDiamondValue = value => `${(value >= 100 ? Math.round(value) : Number(value).toFixed(value >= 10 ? 1 : 2)).toLocaleString()} 钻`
const fmtScore = value => value >= 10 ? value.toFixed(1) : value.toFixed(2)
const fmtQty = value => value >= 10 ? value.toFixed(1) : value.toFixed(2)
const scoreSourceText = drop => drop.referenceLabel
  ? `${drop.referenceLabel}，单个 ${fmtScore(drop.unitScore)} 钻`
  : `单个 ${fmtScore(drop.unitScore)} 钻`

const probabilityCheckNotice = computed(() => {
  if (!hasSideReturn.value || selectedBanner.value !== 'destiny' || selectedType.value !== 'lightDark') return ''
  const check = analysis.value.sideProbabilityCheck
  if (check.isClosed) return ''
  return ` 光暗末位抹0试算：副产物合计 ${fmtPercent(check.sideRate, 4)}，加限定为 ${fmtPercent(check.totalRate, 4)}，差 ${fmtPercent(check.gapRate, 4)}。`
})

const quantileGrossCost = (key) => analysis.value.quantiles[key] * analysis.value.config.costPerPull
const sideSummaryAtPull = pull => analysis.value.getSideSummaryAtPulls?.(pull) || {
  netCost: pull * analysis.value.config.costPerPull,
  sideValue: 0,
  sideQuantities: {},
  sideValues: {},
}
const quantileNetCost = (key) => sideSummaryAtPull(analysis.value.quantiles[key]).netCost
const invitationCost = computed(() => {
  const config = analysis.value.config
  return (config.invitationPulls || 0) * config.costPerPull
})
const rulePityText = computed(() => selectedBanner.value === 'pickup'
  ? '100抽必出；300抽邀请函'
  : '57-70软保底；70抽必出')

const getLimitedRateAtPull = (pull) => {
  const rows = analysis.value.pulls
  const effectivePull = selectedBanner.value === 'pickup'
    ? ((pull - 1) % analysis.value.config.maxPulls) + 1
    : pull
  if (effectivePull <= rows.length) return rows[effectivePull - 1].cumulativeRate
  return rows.at(-1)?.cumulativeRate || 0
}

const budgetRows = computed(() => {
  const config = analysis.value.config
  const pulls = selectedBanner.value === 'pickup'
    ? [30, 50, 80, 99, 100, 300]
    : [10, 30, 50, 56, 60, 70]

  return pulls.map(pull => ({
    pull,
    diamonds: pull * config.costPerPull,
    netCost: sideSummaryAtPull(pull).netCost,
    limitedRate: getLimitedRateAtPull(pull),
  }))
})

const cumulativeRows = computed(() => {
  const config = analysis.value.config
  const maxPulls = selectedBanner.value === 'pickup' ? config.invitationPulls : config.maxPulls

  return Array.from({ length: maxPulls }, (_, index) => {
    const pull = index + 1
    return {
      pull,
      diamonds: pull * config.costPerPull,
      netCost: sideSummaryAtPull(pull).netCost,
      limitedRate: getLimitedRateAtPull(pull),
      sideRate: selectedBanner.value === 'pickup'
        ? calcAtLeastOne(config.permanentRate, pull)
        : calcAtLeastOne(config.diamondPrizeRate, pull),
    }
  })
})

const sideDetailPulls = computed(() => selectedBanner.value === 'pickup'
  ? analysis.value.config.invitationPulls
  : analysis.value.config.maxPulls)
const detailSideSummary = computed(() => sideSummaryAtPull(sideDetailPulls.value))
const withSideSummaryMetrics = drop => ({
  ...drop,
  expectedQtyAtCeiling: detailSideSummary.value.sideQuantities[drop.key] || 0,
  expectedValuePerPull: (detailSideSummary.value.sideValues[drop.key] || 0) / sideDetailPulls.value,
  rateText: drop.milestoneCycle
    ? drop.label.includes('300整') ? '300 整抽奖励' : drop.milestoneLabel
    : fmtPercent(drop.rate, 4),
})
const sideContributionRows = computed(() => analysis.value.pricedSideDrops
  .map(withSideSummaryMetrics)
  .sort((a, b) => b.expectedValuePerPull - a.expectedValuePerPull)
  .slice(0, 10))
const sideDetailRows = computed(() => [
  ...analysis.value.pricedSideDrops,
  ...analysis.value.exclusiveSideDrops,
].map(withSideSummaryMetrics))

const makeTooltip = (label, rows, valueLabel = '概率') => (params) => {
  const list = Array.isArray(params) ? params : [params]
  const row = rows[list[0].dataIndex]
  const costText = hasSideReturn.value
    ? `${fmtDiamonds(row.netCost)} 净 / ${fmtDiamonds(row.diamonds)} 原`
    : fmtDiamonds(row.diamonds)
  let html = `<b style="color:var(--gold)">${label}：第 ${row.pull} 抽 / ${costText}</b><br>`
  list.forEach(item => {
    html += `<span style="color:${item.color}">● ${item.seriesName}</span> ${valueLabel}：<b>${item.value.toFixed(2)}%</b><br>`
  })
  return html
}

const cumulativeChartOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = cumulativeRows.value
  const sideName = selectedBanner.value === 'pickup' ? '光暗常驻至少一次' : '30000钻至少一次'

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      formatter: makeTooltip('预算', rows),
    },
    legend: {
      ...theme.legend,
      top: 8,
      right: 16,
    },
    xAxis: {
      type: 'category',
      data: rows.map(row => row.pull),
      axisLabel: theme.axisLabel,
      axisLine: theme.axisLine,
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { ...theme.axisLabel, formatter: '{value}%' },
      splitLine: theme.splitLine,
    },
    series: [
      {
        name: '指定限定至少一次',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 3, color: LINE_COLORS[0] },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${LINE_COLORS[0]}66` },
            { offset: 1, color: `${LINE_COLORS[0]}00` },
          ]),
        },
        data: rows.map(row => +(row.limitedRate * 100).toFixed(4)),
      },
      {
        name: sideName,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: LINE_COLORS[2], type: 'dashed' },
        data: rows.map(row => +(row.sideRate * 100).toFixed(4)),
      },
    ],
  }
})

const distributionChartOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = analysis.value.pulls

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      formatter: makeTooltip('首次命中', rows),
    },
    xAxis: {
      type: 'category',
      data: rows.map(row => row.pull),
      axisLabel: theme.axisLabel,
      axisLine: theme.axisLine,
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...theme.axisLabel, formatter: '{value}%' },
      splitLine: theme.splitLine,
    },
    series: [
      {
        name: '刚好本抽命中',
        type: 'bar',
        barMaxWidth: 12,
        itemStyle: { color: LINE_COLORS[0] },
        data: rows.map(row => +(row.firstHitRate * 100).toFixed(4)),
      },
    ],
  }
})

const rateChartOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = analysis.value.pulls

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      formatter: makeTooltip('逐抽条件概率', rows),
    },
    xAxis: {
      type: 'category',
      data: rows.map(row => row.pull),
      axisLabel: theme.axisLabel,
      axisLine: theme.axisLine,
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { ...theme.axisLabel, formatter: '{value}%' },
      splitLine: theme.splitLine,
    },
    series: [
      {
        name: '前面未中时本抽命中',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 3, color: LINE_COLORS[3] },
        itemStyle: { color: LINE_COLORS[3] },
        data: rows.map(row => +(row.conditionalRate * 100).toFixed(4)),
      },
    ],
  }
})

const sideContributionOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = [...sideContributionRows.value].reverse()

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const item = params[0]
        const row = rows[item.dataIndex]
        return `<b style="color:var(--gold)">${row.label}</b><br>来源：${row.rateText}<br>单个价值：${fmtScore(row.unitScore)} 钻<br>每抽期望：${fmtDiamondValue(row.expectedValuePerPull)}`
      },
    },
    grid: {
      ...theme.grid,
      left: 132,
      right: 28,
    },
    xAxis: {
      type: 'value',
      axisLabel: { ...theme.axisLabel, formatter: '{value}' },
      splitLine: theme.splitLine,
    },
    yAxis: {
      type: 'category',
      data: rows.map(row => row.label.replace(' x', '×')),
      axisLabel: {
        ...theme.axisLabel,
        width: 120,
        overflow: 'truncate',
      },
      axisLine: theme.axisLine,
    },
    series: [
      {
        name: '每抽期望价值',
        type: 'bar',
        barMaxWidth: 16,
        itemStyle: { color: LINE_COLORS[0] },
        data: rows.map(row => +row.expectedValuePerPull.toFixed(3)),
      },
    ],
  }
})
</script>

<style scoped>
.gacha-controls {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1.4fr);
  align-items: start;
  gap: 14px;
  margin-bottom: 14px;
}

.gacha-filter-card,
.gacha-rule-card {
  min-width: 0;
}

.gacha-filter-card {
  display: grid;
  gap: 12px;
  padding-block: 16px;
}

.gacha-filter-row {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.gacha-filter-label {
  color: var(--text-secondary);
  font-size: var(--fs-sm);
  font-weight: 600;
  white-space: nowrap;
}

.gacha-rule-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 12px;
}

.gacha-rule-header .card-title {
  margin-bottom: 0;
}

.gacha-rule-grid {
  display: grid;
  grid-template-columns: minmax(140px, 1.1fr) minmax(82px, 0.7fr) minmax(90px, 0.7fr) minmax(220px, 1.6fr);
  gap: 8px;
}

.gacha-rule-cell {
  min-width: 0;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  background: rgba(var(--color-invert-rgb), 0.035);
}

.gacha-rule-cell span {
  display: block;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  line-height: 1.2;
}

.gacha-rule-cell b {
  display: block;
  margin-top: 3px;
  color: var(--text-secondary);
  font-size: var(--fs-sm);
  font-weight: 700;
  line-height: 1.35;
}

.gacha-rule-cell:not(.gacha-rule-cell-wide) b {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gacha-rule-details {
  margin-left: auto;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.gacha-rule-details[open] {
  flex-basis: 100%;
  margin-left: 0;
}

.gacha-rule-details summary {
  cursor: pointer;
  width: fit-content;
  margin-left: auto;
  padding: 4px 9px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  color: var(--gold);
  font-weight: 600;
  outline: none;
}

.gacha-rule-detail-body {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-subtle);
  line-height: 1.5;
}

.gacha-rule-detail-body span {
  padding: 3px 8px;
  border-radius: var(--r-sm);
  background: rgba(var(--color-invert-rgb), 0.035);
}

.gacha-summary {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.gacha-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 14px;
  margin-bottom: 14px;
}

.gacha-secondary,
.gacha-side-analysis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.gacha-secondary {
  margin-bottom: 14px;
}

.gacha-chart-card,
.gacha-side-detail-card {
  min-width: 0;
}

.gacha-chart-frame {
  height: 420px;
  min-height: 420px;
}

.gacha-chart-frame-sm {
  height: 320px;
  min-height: 320px;
}

.gacha-budget-card {
  min-width: 0;
}

.gacha-budget-list {
  display: grid;
  gap: 8px;
}

.gacha-budget-head,
.gacha-budget-row {
  display: grid;
  grid-template-columns: 54px minmax(64px, 0.85fr) minmax(88px, 1fr);
  align-items: center;
  gap: 8px;
}

.gacha-budget-head.has-net,
.gacha-budget-row.has-net {
  grid-template-columns: 48px minmax(62px, 0.75fr) minmax(78px, 1fr) minmax(78px, 1fr);
}

.gacha-budget-head {
  padding: 0 10px;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  font-weight: 600;
  white-space: nowrap;
}

.gacha-budget-head span:nth-child(n + 2) {
  text-align: right;
}

.gacha-budget-row {
  padding: 9px 10px;
  border-radius: var(--r-sm);
  background: rgba(var(--color-invert-rgb), 0.035);
  font-size: var(--fs-sm);
}

.gacha-budget-row span {
  color: var(--text-secondary);
}

.gacha-budget-row b {
  color: var(--gold);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.gacha-budget-row small {
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.gacha-side-note {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-subtle);
  color: var(--text-muted);
  font-size: var(--fs-sm);
  line-height: 1.55;
}

.gacha-side-note b {
  display: block;
  margin-bottom: 4px;
  color: var(--text-secondary);
  font-size: var(--fs-xs);
}

.gacha-side-detail-list {
  display: grid;
  gap: 8px;
  max-height: 320px;
  overflow: auto;
  padding-right: 4px;
}

.gacha-side-detail-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 90px;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--r-sm);
  background: rgba(var(--color-invert-rgb), 0.035);
  font-size: var(--fs-sm);
}

.gacha-side-detail-row span {
  display: block;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gacha-side-detail-row b {
  color: var(--gold);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.gacha-side-detail-row small {
  color: var(--text-muted);
  font-size: var(--fs-xs);
  line-height: 1.35;
  text-align: right;
}

.gacha-side-detail-row > div small {
  display: block;
  text-align: left;
}

@media (max-width: 1100px) {
  .gacha-controls,
  .gacha-main,
  .gacha-secondary,
  .gacha-side-analysis {
    grid-template-columns: 1fr;
  }

  .gacha-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .gacha-controls,
  .gacha-summary,
  .gacha-main,
  .gacha-secondary,
  .gacha-side-analysis {
    gap: 12px;
  }

  .gacha-summary {
    grid-template-columns: 1fr;
  }

  .gacha-filter-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .gacha-chart-frame,
  .gacha-chart-frame-sm {
    min-height: 330px;
  }

  .gacha-rule-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .gacha-rule-cell-wide {
    grid-column: 1 / -1;
  }

  .gacha-budget-head.has-net,
  .gacha-budget-row.has-net {
    grid-template-columns: 52px 1fr 1fr;
  }

  .gacha-budget-head.has-net span:last-child,
  .gacha-budget-row small:last-child {
    grid-column: 2 / -1;
  }

  .gacha-budget-head:not(.has-net),
  .gacha-budget-row:not(.has-net) {
    grid-template-columns: 52px 1fr 1fr;
  }

  .gacha-side-detail-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .gacha-side-detail-row > small {
    grid-column: 1 / -1;
    text-align: left;
  }
}
</style>
