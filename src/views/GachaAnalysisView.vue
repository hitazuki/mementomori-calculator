<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('gachaTitle') }}</h1>
    <p class="view-desc">{{ $t('gachaDesc') }}</p>
  </div>

  <section class="gacha-controls animate-fadeup">
    <div class="card gacha-control-card">
      <div class="card-title">召唤类型</div>
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

    <div class="card gacha-control-card">
      <div class="card-title">指定角色属性</div>
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

    <div class="card gacha-rule-card">
      <div class="card-title">当前规则</div>
      <div class="gacha-rule-list">
        <span>{{ analysis.config.bannerLabel }} / {{ analysis.config.typeLabel }}</span>
        <span>单抽 {{ analysis.config.costPerPull.toLocaleString() }} 钻，基础概率 {{ fmtPercent(analysis.config.baseRate, 4) }}</span>
        <span>{{ analysis.config.note }}</span>
      </div>
    </div>
  </section>

  <section class="gacha-summary animate-fadeup">
    <div class="stat-box">
      <div class="stat-value">{{ fmtPulls(analysis.expectedPulls) }}</div>
      <div class="stat-label">平均出货</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">{{ fmtDiamonds(analysis.expectedNetCost) }}</div>
      <div class="stat-label">{{ selectedBanner === 'destiny' ? '期望净成本' : '期望成本' }}</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">{{ fmtDiamonds(quantileCost('p50')) }}</div>
      <div class="stat-label">50%预算</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">{{ fmtDiamonds(quantileCost('p90')) }}</div>
      <div class="stat-label">90%预算</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">{{ fmtDiamonds(analysis.config.maxPulls * analysis.config.costPerPull) }}</div>
      <div class="stat-label">保底成本</div>
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
      <div class="card-title">常用预算参考</div>
      <div class="gacha-budget-list">
        <div v-for="row in budgetRows" :key="row.pull" class="gacha-budget-row">
          <span>{{ row.pull }} 抽</span>
          <b>{{ fmtPercent(row.limitedRate) }}</b>
          <small>{{ fmtDiamonds(row.diamonds) }}</small>
        </div>
      </div>
      <div class="gacha-side-note">
        <template v-if="selectedBanner === 'destiny'">
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
import { baseChartOption, getMoriTheme, LINE_COLORS } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'

use([CanvasRenderer, BarChart, LineChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent])

useI18n()

const selectedBanner = ref('destiny')
const selectedType = ref('lightDark')

const bannerOptions = Object.values(GACHA_BANNERS).map(({ key, label }) => ({ key, label }))
const typeOptions = Object.values(GACHA_TYPES)

const analysis = computed(() => buildGachaAnalysis(selectedBanner.value, selectedType.value))

const fmtPercent = (value, digits = 2) => `${(value * 100).toFixed(digits)}%`
const fmtPulls = (value) => `${value.toFixed(1)} 抽`
const fmtDiamonds = (value) => `${Math.round(value).toLocaleString()} 钻`

const quantileCost = (key) => analysis.value.quantiles[key] * analysis.value.config.costPerPull
const invitationCost = computed(() => {
  const config = analysis.value.config
  return (config.invitationPulls || 0) * config.costPerPull
})

const getLimitedRateAtPull = (pull) => {
  const rows = analysis.value.pulls
  if (pull <= rows.length) return rows[pull - 1].cumulativeRate
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
      limitedRate: getLimitedRateAtPull(pull),
      sideRate: selectedBanner.value === 'pickup'
        ? calcAtLeastOne(config.permanentRate, pull)
        : calcAtLeastOne(config.diamondPrizeRate, pull),
    }
  })
})

const makeTooltip = (label, rows, valueLabel = '概率') => (params) => {
  const list = Array.isArray(params) ? params : [params]
  const row = rows[list[0].dataIndex]
  let html = `<b style="color:var(--gold)">${label}：第 ${row.pull} 抽 / ${fmtDiamonds(row.diamonds)}</b><br>`
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
</script>

<style scoped>
.gacha-controls {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(180px, 0.8fr) minmax(300px, 1.4fr);
  gap: 14px;
  margin-bottom: 14px;
}

.gacha-control-card,
.gacha-rule-card {
  min-width: 0;
}

.gacha-rule-list {
  display: grid;
  gap: 6px;
  color: var(--text-secondary);
  font-size: var(--fs-sm);
  line-height: 1.45;
}

.gacha-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.gacha-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 14px;
  margin-bottom: 14px;
}

.gacha-secondary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.gacha-chart-card {
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

.gacha-budget-row {
  display: grid;
  grid-template-columns: 70px 1fr auto;
  align-items: center;
  gap: 8px;
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
}

.gacha-side-note {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-subtle);
  color: var(--text-muted);
  font-size: var(--fs-sm);
  line-height: 1.55;
}

@media (max-width: 1100px) {
  .gacha-controls,
  .gacha-main,
  .gacha-secondary {
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
  .gacha-secondary {
    gap: 12px;
  }

  .gacha-summary {
    grid-template-columns: 1fr;
  }

  .gacha-chart-frame,
  .gacha-chart-frame-sm {
    min-height: 330px;
  }

  .gacha-budget-row {
    grid-template-columns: 60px 1fr;
  }

  .gacha-budget-row small {
    grid-column: 1 / -1;
  }
}
</style>
