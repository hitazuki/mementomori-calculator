<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('forbiddenWeaponGachaTitle') }}</h1>
    <p class="view-desc">{{ $t('forbiddenWeaponGachaDesc') }}</p>
  </div>

  <section class="weapon-banner-control animate-fadeup">
    <div class="card weapon-banner-card">
      <div class="card-title">{{ t('weaponGachaType') }}</div>
      <div class="segmented-control">
        <button
          v-for="banner in bannerOptions"
          :key="banner.key"
          class="btn btn-sm"
          :class="selectedBanner === banner.key ? 'btn-primary' : 'btn-ghost'"
          @click="selectedBanner = banner.key"
        >
          {{ tr(banner.shortLabelKey, banner.shortLabel) }}
        </button>
      </div>
    </div>
  </section>

  <section class="weapon-layout animate-fadeup">
    <div class="weapon-main">
      <section class="weapon-summary">
        <div class="stat-box">
          <div class="stat-value">{{ fmtDiamonds(analysis.ticketValue) }}</div>
          <div class="stat-label">{{ t('weaponGachaTicketValue', { item: costItemLabel }) }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ hasFreePulls ? fmtPulls(selected.paidPulls) : fmtPercent(selected.sideRecoveryRate) }}</div>
          <div class="stat-label">{{ hasFreePulls ? t('weaponGachaPaidPulls') : t('weaponGachaSideRecovery') }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ fmtDiamonds(selected.implicitCoreUnit) }}</div>
          <div class="stat-label">{{ implicitUnitLabel }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ usesExpectedCoreSummary ? fmtQty(selected.totalCoreCount) : fmtPulls(analysis.bestNode.pulls) }}</div>
          <div class="stat-label">{{ usesExpectedCoreSummary ? expectedCoreSummaryLabel : t('weaponGachaBestNode') }}</div>
        </div>
      </section>

      <section v-if="!isSeraphOracle" class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ t('weaponGachaCoreCostChart') }}</div>
            <span class="tag tag-gold">{{ t('weaponGachaMilestoneIncluded') }}</span>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="implicitCostOption" autoresize />
        </div>
      </section>

      <section v-else class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ t('weaponGachaSeraphMilestoneTitle') }}</div>
            <span class="tag tag-gold">{{ t('weaponGachaDiscreteMilestone') }}</span>
          </div>
        </div>
        <div class="weapon-table-grid">
          <div v-for="group in seraphMilestoneGroups" :key="group.key" class="weapon-table-panel">
            <div class="weapon-table-title">{{ t(group.titleKey) }}</div>
            <div class="weapon-table-wrap">
              <table class="weapon-value-table">
                <thead>
                  <tr>
                    <th>{{ t('weaponGachaMilestone') }}</th>
                    <th>{{ t('weaponGachaRoundChance') }}</th>
                    <th>{{ t('weaponGachaFreePaidPulls') }}</th>
                    <th>{{ t('weaponGachaSideDeduction') }}</th>
                    <th>{{ t('weaponGachaExpectedRelic') }}</th>
                    <th>{{ t('weaponGachaRelicValue') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in group.rows" :key="`${group.key}:${row.pullInRound}`">
                    <td>
                      <b>{{ fmtPulls(row.pullInRound) }}</b>
                      <small>{{ row.note }}</small>
                    </td>
                    <td>{{ fmtPercent(row.roundChance) }}</td>
                    <td>{{ row.freePulls }} / {{ row.paidPulls }}</td>
                    <td>{{ fmtDiamonds(row.sideValue) }}</td>
                    <td>{{ fmtQty(row.totalCoreCount) }}</td>
                    <td>{{ fmtDiamonds(row.implicitCoreUnit) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section v-if="isSeraphOracle" class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ t('weaponGachaSeraphSegmentTitle') }}</div>
            <span class="tag tag-purple">{{ t('weaponGachaMarginalValue') }}</span>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="seraphSegmentOption" autoresize />
        </div>
      </section>

      <section class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ quantityChartTitle }}</div>
            <span class="tag tag-purple">{{ quantityChartTag }}</span>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="quantityOption" autoresize />
        </div>
      </section>

      <section class="weapon-charts-row">
        <div class="card weapon-chart-card">
          <div class="chart-toolbar">
            <div class="card-title">{{ t('weaponGachaCostBreakdown') }}</div>
          </div>
          <div class="chart-frame weapon-chart-frame-sm">
            <v-chart class="chart" :option="costBreakdownOption" autoresize />
          </div>
        </div>

        <div class="card weapon-chart-card">
          <div class="chart-toolbar">
            <div class="card-title">{{ t('weaponGachaSideContribution') }}</div>
          </div>
          <div class="chart-frame weapon-chart-frame-sm">
            <v-chart class="chart" :option="sideContributionOption" autoresize />
          </div>
        </div>
      </section>
    </div>

    <aside class="weapon-side">
      <div class="card">
        <div class="card-title">{{ t('weaponGachaPullCount') }}</div>
        <div class="form-group">
          <label class="form-label">
            <span>{{ t('weaponGachaForSummary') }}</span>
            <span class="value-display">{{ fmtPulls(selectedPulls) }}</span>
          </label>
          <input class="form-range" type="range" min="1" :max="pullMax" step="1" v-model.number="selectedPulls">
          <input class="form-input weapon-pull-input" type="number" min="1" :max="pullMax" v-model.number="selectedPulls">
        </div>
        <div class="weapon-preset-row">
          <button v-for="pull in presetPulls" :key="pull" class="btn btn-sm" :class="selectedPulls === pull ? 'btn-primary' : 'btn-ghost'" @click="selectedPulls = pull">{{ fmtPulls(pull) }}</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">{{ t('weaponGachaCurrentResult') }}</div>
        <div class="weapon-result-list">
          <div>
          <span>{{ t('weaponGachaTotalCost') }}</span>
            <b>{{ fmtDiamonds(selected.totalCost) }}</b>
          </div>
          <div v-if="hasFreePulls">
            <span>{{ t('weaponGachaFreePaidPulls') }}</span>
            <b>{{ selected.freePulls }} / {{ selected.paidPulls }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaSideDeduction') }}</span>
            <b>{{ fmtDiamonds(selected.sideValue) }}</b>
          </div>
          <div v-for="row in selectedCoreRows" :key="row.key">
            <span>{{ row.label }}</span>
            <b>{{ fmtQty(row.qty) }}</b>
          </div>
          <div v-for="row in selectedMilestoneRows" :key="row.key">
            <span>{{ row.label }}</span>
            <b>{{ fmtQty(row.qty) }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaCoreTotal') }}</span>
            <b>{{ fmtQty(selected.totalCoreCount) }}</b>
          </div>
        </div>
      </div>

      <div v-if="isSeraphOracle && noFreeCycle" class="card">
        <div class="card-title">{{ t('weaponGachaNoFreeCycleTitle') }}</div>
        <div class="weapon-result-list">
          <div>
            <span>{{ t('weaponGachaPullCount') }}</span>
            <b>{{ fmtPulls(noFreeCycle.pulls) }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaFreePaidPulls') }}</span>
            <b>{{ noFreeCycle.freePulls }} / {{ noFreeCycle.paidPulls }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaTotalCost') }}</span>
            <b>{{ fmtDiamonds(noFreeCycle.totalCost) }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaSideDeduction') }}</span>
            <b>{{ fmtDiamonds(noFreeCycle.sideValue) }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaExpectedRelic') }}</span>
            <b>{{ fmtQty(noFreeCycle.totalCoreCount) }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaRelicValue') }}</span>
            <b>{{ fmtDiamonds(noFreeCycle.implicitCoreUnit) }}</b>
          </div>
        </div>
      </div>

      <div class="card">
        <button class="btn btn-ghost weapon-formula-toggle" @click="showFormula = !showFormula">
          {{ showFormula ? t('weaponGachaHideFormula') : t('weaponGachaShowFormula') }}
        </button>
        <div v-show="showFormula" class="weapon-formula">
          <template v-if="isWitchSecret">
            <p>{{ t('weaponGachaWitchFormulaWeekly') }}</p>
            <p>{{ t('weaponGachaWitchFormulaGuarantee') }}</p>
            <p>{{ t('weaponGachaWitchFormulaValue') }}</p>
            <p>{{ t('weaponGachaWitchFormulaAfterCap') }}</p>
          </template>
          <template v-else-if="isSeraphOracle">
            <p>{{ t('weaponGachaSeraphFormulaCycle') }}</p>
            <p>{{ t('weaponGachaSeraphFormulaFree') }}</p>
            <p>{{ t('weaponGachaSeraphFormulaValue') }}</p>
            <p>{{ t('weaponGachaSeraphFormulaMilestone') }}</p>
          </template>
          <template v-else>
          <p>{{ t('weaponGachaWeaponFormulaScores') }}</p>
          <p>{{ t('weaponGachaWeaponFormulaRecovery', { item: costItemLabel }) }}</p>
          <p>{{ t('weaponGachaWeaponFormulaValue') }}</p>
          <p>{{ t('weaponGachaWeaponFormulaMilestone') }}</p>
          </template>
        </div>
      </div>

      <div class="card">
        <div class="card-title">{{ t('weaponGachaDropDetail') }}</div>
        <div class="weapon-detail-list">
          <div v-for="drop in selectedSideRows" :key="drop.key" class="weapon-detail-row">
            <span>{{ dropLabel(drop) }}</span>
            <b>{{ fmtPercent(drop.rate) }}</b>
            <small>{{ t('weaponGachaScoreLine', { value: fmtScoreValue(drop.scoreMeta.score), batch: drop.scoreMeta.batch.toLocaleString() }) }}</small>
            <small>{{ t('weaponGachaExpectedLine', { qty: fmtQty(drop.expectedQty), value: fmtScoreValue(drop.expectedValue) }) }}</small>
            <small>{{ t('weaponGachaPerPullLine', { value: fmtScoreValue(drop.expectedValuePerPull) }) }}</small>
          </div>
        </div>
      </div>
    </aside>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'

import { buildForbiddenWeaponGachaAnalysis, WEAPON_GACHA_CONFIGS } from '../engine/forbiddenWeaponGachaCalc.js'
import { normalizeScores } from '../engine/packCalc.js'
import { applyDerivedScores } from '../engine/derivedScores.js'
import { editableScores } from '../store/itemScores.js'
import { baseChartOption, getMoriTheme, LINE_COLORS } from '../utils/chartTheme.js'
import { currentTheme } from '../utils/themeStore.js'

use([CanvasRenderer, BarChart, LineChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent])

const { t, locale } = useI18n()

const selectedBanner = ref('forbidden')
const selectedPulls = ref(20)
const showFormula = ref(false)
const bannerOptions = Object.values(WEAPON_GACHA_CONFIGS)
const isWitchSecret = computed(() => selectedBanner.value === 'witchSecret')
const isSeraphOracle = computed(() => selectedBanner.value === 'seraphOracle')
const hasFreePulls = computed(() => Boolean(analysis.value.config.freePullsPerPeriod))
const usesExpectedCoreSummary = computed(() => analysis.value.config.summaryMode === 'expectedCore' || isWitchSecret.value)
const pullMax = computed(() => WEAPON_GACHA_CONFIGS[selectedBanner.value]?.maxPulls || 100)
const presetPulls = computed(() => {
  if (isWitchSecret.value) return [7, 15, 25, 35]
  if (isSeraphOracle.value) return [7, 10, 25, 50, 100, 150]
  return [10, 20, 50, 100]
})

const normalizedScores = computed(() => applyDerivedScores(normalizeScores(editableScores)))
const analysis = computed(() => buildForbiddenWeaponGachaAnalysis(normalizedScores.value, {
  bannerKey: selectedBanner.value,
  selectedPulls: selectedPulls.value,
  maxPulls: WEAPON_GACHA_CONFIGS[selectedBanner.value]?.maxPulls || 100,
}))
const selected = computed(() => analysis.value.selected)
const noFreeCycle = computed(() => analysis.value.noFreeCycleNode)
const localeNameMap = { 'zh-CN': 'nameZh', 'zh-TW': 'nameTw', en: 'nameEn', ja: 'nameJa', ko: 'nameKo' }
const tr = (key, fallback, params = {}) => key ? t(key, params) : fallback
const costItemLabel = computed(() => tr(analysis.value.config.costItem.nameKey, analysis.value.config.costItem.label))
const implicitUnitLabel = computed(() => tr(
  analysis.value.config.implicitUnitLabelKey,
  analysis.value.config.implicitUnitLabel || t('weaponGachaCoreImplicitUnit')
))
const expectedCoreSummaryLabel = computed(() => tr(
  analysis.value.config.summaryCoreLabelKey,
  isWitchSecret.value ? t('weaponGachaExpectedMagicCrystal') : t('weaponGachaExpectedCore')
))
const quantityChartTitle = computed(() => isSeraphOracle.value
  ? t('weaponGachaSeraphValueStructureTitle')
  : t('weaponGachaQuantityChart'))
const quantityChartTag = computed(() => isSeraphOracle.value
  ? t('weaponGachaValueConverted')
  : t('weaponGachaExpectedQty'))

function itemName(itype, iid, fallback = '') {
  const item = normalizedScores.value[`[${itype},${iid}]`]
  if (!item) return fallback
  const field = localeNameMap[locale.value] || 'nameZh'
  return item[field] || item.nameZh || item.name || fallback
}

function dropBaseName(drop) {
  if (drop.labelKey || drop.nameKey) return tr(drop.labelKey || drop.nameKey, drop.label)
  if (drop.itype && drop.iid) return itemName(drop.itype, drop.iid, drop.label?.replace(/\sx\d+$/, '') || '')
  return drop.label
}

function dropLabel(drop) {
  const base = dropBaseName(drop)
  return drop.qty ? t('itemQtyLabel', { item: base, qty: drop.qty }) : base
}

const selectedCoreRows = computed(() => {
  const rows = analysis.value.config.coreDrops.map(drop => ({
    key: drop.key,
    label: t('weaponGachaExpectedItem', { item: dropBaseName(drop) }),
    qty: selected.value.coreCounts[drop.key] || 0,
  }))
  if (selected.value.coreCounts.weeklyBonus) {
    rows.push({
      key: 'weeklyBonus',
      label: t('weaponGachaWeeklyBonus'),
      qty: selected.value.coreCounts.weeklyBonus,
    })
  }
  return rows
})

const selectedMilestoneRows = computed(() => selected.value.milestoneRewards
  .filter(reward => !reward.core && reward.itype && reward.iid)
  .reduce((rows, reward) => {
    const key = `${reward.itype}:${reward.iid}`
    const existing = rows.find(row => row.key === key)
    const qty = reward.expectedQty ?? ((reward.qty || 0) * (reward.rate ?? 1))
    if (existing) {
      existing.qty += qty
      return rows
    }
    rows.push({
      key,
      label: t('weaponGachaMilestoneRewardMerged', { item: dropBaseName(reward) }),
      qty,
    })
    return rows
  }, []))

const zeroAnalysisRow = {
  pulls: 0,
  paidPulls: 0,
  freePulls: 0,
  totalCost: 0,
  sideValue: 0,
  coreBudget: 0,
  totalCoreCount: 0,
  implicitCoreUnit: 0,
}

const rowAtFrom = (rows, pulls) => pulls <= 0
  ? zeroAnalysisRow
  : rows[pulls - 1] || rows.at(-1) || zeroAnalysisRow

const rowAtPulls = pulls => rowAtFrom(analysis.value.rows, pulls)

const seraphMilestonePulls = computed(() => {
  const rewards = analysis.value.config.milestone?.rewards || []
  return [...new Set(rewards.map(reward => reward.pull))]
    .filter(Boolean)
    .sort((a, b) => a - b)
})

const seraphRoundChance = pullInRound => {
  if (pullInRound >= 50) return 1
  if (pullInRound >= 25) return 1 - (1 - 0.2) * (1 - 0.4)
  if (pullInRound >= 10) return 0.2
  return 0
}

const buildSeraphMilestoneRows = (rows, noteKey) => seraphMilestonePulls.value.map(pullInRound => ({
  ...rowAtFrom(rows, pullInRound),
  pullInRound,
  roundChance: seraphRoundChance(pullInRound),
  note: t(noteKey),
}))

const seraphMilestoneGroups = computed(() => [
  {
    key: 'withFree',
    titleKey: 'weaponGachaFirstCycleTitle',
    rows: buildSeraphMilestoneRows(analysis.value.rows, 'weaponGachaFirstCycleNote'),
  },
  {
    key: 'noFree',
    titleKey: 'weaponGachaNoFreeCycleTitle',
    rows: buildSeraphMilestoneRows(analysis.value.noFreeCycleRows, 'weaponGachaNoFreeCycleNote'),
  },
])

const buildSeraphSegmentRows = rows => {
  const cycle = analysis.value.config.milestone?.cycle || 50
  const milestones = seraphMilestonePulls.value
  const edges = [0]
  milestones.forEach(pull => {
    const edge = Math.min(pull, cycle)
    if (edge <= cycle) edges.push(edge)
  })

  return [...new Set(edges)]
    .sort((a, b) => a - b)
    .slice(1)
    .map((end, index, sortedEdges) => {
      const start = index === 0 ? 0 : sortedEdges[index - 1]
      const before = rowAtFrom(rows, start)
      const after = rowAtFrom(rows, end)
      const expectedRelic = after.totalCoreCount - before.totalCoreCount
      const totalCost = after.totalCost - before.totalCost
      const sideValue = after.sideValue - before.sideValue
      const coreBudget = Math.max(0, totalCost - sideValue)
      const implicitCoreUnit = expectedRelic > 0 ? coreBudget / expectedRelic : 0
      return {
        key: `${start}-${end}`,
        label: `${start + 1}-${end}`,
        start,
        end,
        paidPulls: after.paidPulls - before.paidPulls,
        freePulls: after.freePulls - before.freePulls,
        totalCost,
        sideValue,
        coreBudget,
        expectedRelic,
        implicitCoreUnit,
      }
    })
}

const seraphSegmentGroups = computed(() => [
  {
    key: 'withFree',
    titleKey: 'weaponGachaFirstCycleShort',
    rows: buildSeraphSegmentRows(analysis.value.rows),
  },
  {
    key: 'noFree',
    titleKey: 'weaponGachaNoFreeCycleShort',
    rows: buildSeraphSegmentRows(analysis.value.noFreeCycleRows),
  },
])

const seraphSegmentRows = computed(() => seraphSegmentGroups.value[0]?.rows || [])

const seraphValueStructureRows = computed(() => seraphMilestoneGroups.value.flatMap(group =>
  group.rows.map(row => ({
    ...row,
    groupKey: group.key,
    groupTitle: t(group.titleKey),
    groupShortTitle: t(group.key === 'withFree' ? 'weaponGachaFirstCycleShort' : 'weaponGachaNoFreeCycleShort'),
    label: `${t(group.key === 'withFree' ? 'weaponGachaFirstCycleShort' : 'weaponGachaNoFreeCycleShort')}\n${fmtPulls(row.pullInRound)}`,
  }))
))

watch(selectedBanner, banner => {
  selectedPulls.value = banner === 'witchSecret' ? 35 : banner === 'seraphOracle' ? 50 : 20
})

const fmtDiamonds = value => t('diamondValue', { value: Math.round(value).toLocaleString() })
const fmtPulls = value => t('pullCount', { count: value })
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
  let html = `<b style="color:var(--gold)">${title}: ${fmtPulls(row.pulls)}</b><br>`
  list.forEach(item => {
    html += `<span style="color:${item.color}">● ${item.seriesName}</span>: <b>${item.value}</b><br>`
  })
  fields?.forEach(field => {
    html += `${field.label}: <b>${field.format(row)}</b><br>`
  })
  return html
}

const implicitCostOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = analysis.value.rows
  const milestonePulls = analysis.value.config.weeklyMilestones?.length
    ? analysis.value.config.weeklyMilestones.map(reward => reward.pull)
    : analysis.value.config.milestone?.rewards?.length
      ? [...new Set(rows.flatMap(row => row.milestoneRewards.map(reward => reward.pull)))]
      : rows.filter(row => row.pulls % analysis.value.config.milestone.interval === 0).map(row => row.pulls)
  const milestonePoints = rows
    .filter(row => milestonePulls.includes(row.pulls))
    .map(row => ({
      name: fmtPulls(row.pulls),
      coord: [row.pulls, Math.round(row.implicitCoreUnit)],
      value: String(row.pulls),
    }))

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      formatter: chartTooltip(rows, t('weaponGachaPullCount'), [
        { label: t('weaponGachaSideRecovery'), format: row => fmtPercent(row.sideRecoveryRate) },
        { label: t('weaponGachaExpectedCore'), format: row => fmtQty(row.totalCoreCount) },
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
      axisLabel: { ...theme.axisLabel, formatter: value => fmtDiamonds(value) },
      splitLine: theme.splitLine,
    },
    series: [
      {
        name: implicitUnitLabel.value,
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

const seraphSegmentOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = seraphSegmentRows.value
  const groups = seraphSegmentGroups.value

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      formatter: params => {
        const list = Array.isArray(params) ? params : [params]
        const segment = rows[list[0].dataIndex]
        let html = `<b style="color:var(--gold)">${t('weaponGachaSegment')}: ${segment.label}</b><br>`
        list.forEach(item => {
          const group = groups[item.seriesIndex]
          const row = group.rows[item.dataIndex]
          html += `<span style="color:${item.color}">● ${item.seriesName}</span>: <b>${fmtDiamonds(row.implicitCoreUnit)}</b><br>${t('weaponGachaFreePaidPulls')}: <b>${row.freePulls} / ${row.paidPulls}</b> · ${t('weaponGachaExpectedRelic')}: <b>${fmtQty(row.expectedRelic)}</b><br>`
        })
        return html
      },
    },
    legend: { ...theme.legend, top: 8, right: 16 },
    grid: { top: 36, right: 18, bottom: 62, left: 72 },
    xAxis: {
      type: 'category',
      data: rows.map(row => row.label),
      axisLabel: { ...theme.axisLabel, rotate: 24 },
      axisLine: theme.axisLine,
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...theme.axisLabel, formatter: value => fmtDiamonds(value) },
      splitLine: theme.splitLine,
    },
    series: groups.map((group, index) => ({
        name: t(group.titleKey),
        type: 'bar',
        barMaxWidth: 42,
        itemStyle: { color: LINE_COLORS[index] },
        data: group.rows.map(row => Math.round(row.implicitCoreUnit)),
      })),
  }
})

const seraphValueStructureOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = seraphValueStructureRows.value

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      formatter: params => {
        const list = Array.isArray(params) ? params : [params]
        const row = rows[list[0].dataIndex]
        let html = `<b style="color:var(--gold)">${row.groupTitle} · ${fmtPulls(row.pullInRound)}</b><br>${t('weaponGachaFreePaidPulls')}: <b>${row.freePulls} / ${row.paidPulls}</b><br>${t('weaponGachaExpectedRelic')}: <b>${fmtQty(row.totalCoreCount)}</b><br>${t('weaponGachaRelicValue')}: <b>${fmtDiamonds(row.implicitCoreUnit)}</b><br>`
        list.forEach(item => {
          html += `<span style="color:${item.color}">● ${item.seriesName}</span>: <b>${fmtDiamonds(item.value)}</b><br>`
        })
        return html
      },
    },
    legend: { ...theme.legend, top: 8, right: 16 },
    grid: { top: 44, right: 18, bottom: 78, left: 72 },
    xAxis: {
      type: 'category',
      data: rows.map(row => row.label),
      axisLabel: { ...theme.axisLabel, lineHeight: 16 },
      axisLine: theme.axisLine,
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...theme.axisLabel, formatter: value => fmtDiamonds(value) },
      splitLine: theme.splitLine,
    },
    series: [
      {
        name: t('weaponGachaSideDeduction'),
        type: 'bar',
        stack: 'value',
        barMaxWidth: 42,
        itemStyle: { color: LINE_COLORS[2] },
        data: rows.map(row => Math.round(row.sideValue)),
      },
      {
        name: t('weaponGachaRelicNetCost'),
        type: 'bar',
        stack: 'value',
        barMaxWidth: 42,
        itemStyle: { color: LINE_COLORS[0] },
        data: rows.map(row => Math.round(row.coreBudget)),
      },
    ],
  }
})

const quantityOption = computed(() => {
  if (isSeraphOracle.value) return seraphValueStructureOption.value

  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = analysis.value.rows
  const coreSeries = analysis.value.config.coreDrops.map((drop, index) => ({
    name: dropBaseName(drop),
    type: 'line',
    smooth: true,
    lineStyle: { width: 3, color: LINE_COLORS[index % LINE_COLORS.length] },
    itemStyle: { color: LINE_COLORS[index % LINE_COLORS.length] },
    data: rows.map(row => +(row.coreCounts[drop.key] || 0).toFixed(2)),
  }))
  if (isWitchSecret.value) {
    coreSeries.push({
      name: t('weaponGachaWeeklyBonus'),
      type: 'line',
      smooth: true,
      lineStyle: { width: 3, color: LINE_COLORS[2], type: 'dashed' },
      itemStyle: { color: LINE_COLORS[2] },
      data: rows.map(row => +(row.coreCounts.weeklyBonus || 0).toFixed(2)),
    })
  }
  const sideSeries = analysis.value.sideDrops.slice(0, isWitchSecret.value ? 4 : 3).map((drop, index) => ({
    name: dropBaseName(drop),
    type: 'line',
    smooth: true,
    lineStyle: { width: 2, color: LINE_COLORS[(index + 3) % LINE_COLORS.length], type: 'dashed' },
    itemStyle: { color: LINE_COLORS[(index + 3) % LINE_COLORS.length] },
    data: rows.map(row => +(row.sideQuantities[drop.key] || 0).toFixed(2)),
  }))

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      formatter: chartTooltip(rows, t('weaponGachaPullCount'), [
        { label: t('weaponGachaSideDeduction'), format: row => fmtDiamonds(row.sideValue) },
        { label: t('weaponGachaCoreTotal'), format: row => fmtQty(row.totalCoreCount) },
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
    series: [...coreSeries, ...sideSeries],
  }
})

const costBreakdownOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = analysis.value.compareRows

  return {
    ...baseChartOption('', '', isDark),
    tooltip: { ...theme.tooltip, trigger: 'axis', formatter: chartTooltip(rows, t('weaponGachaCostBreakdown')) },
    legend: { ...theme.legend, top: 8, right: 16 },
    xAxis: {
      type: 'category',
      data: rows.map(row => fmtPulls(row.pulls)),
      axisLabel: theme.axisLabel,
      axisLine: theme.axisLine,
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...theme.axisLabel, formatter: value => fmtDiamonds(value) },
      splitLine: theme.splitLine,
    },
    series: [
      {
        name: t('weaponGachaSideDeduction'),
        type: 'bar',
        stack: 'cost',
        itemStyle: { color: LINE_COLORS[2] },
        data: rows.map(row => Math.round(row.sideValue)),
      },
      {
        name: t('weaponGachaImplicitCost'),
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
        return `<b style="color:var(--gold)">${dropLabel(row)}</b><br>${t('weaponGachaRate')}: ${fmtPercent(row.rate)}<br>${t('weaponGachaScoreLine', { value: fmtScoreValue(row.scoreMeta.score), batch: row.scoreMeta.batch.toLocaleString() })}<br>${t('weaponGachaExpectedContribution')}: <b>${fmtScoreValue(row.expectedValuePerPull)}</b>`
      },
    },
    grid: { top: 36, right: 16, bottom: 70, left: 58 },
    xAxis: {
      type: 'category',
      data: rows.map(row => dropLabel(row)),
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
        name: t('weaponGachaExpectedContribution'),
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

.weapon-table-wrap {
  overflow-x: auto;
}

.weapon-table-grid {
  display: grid;
  gap: 14px;
}

.weapon-table-panel {
  min-width: 0;
}

.weapon-table-title {
  margin-bottom: 8px;
  color: var(--gold);
  font-weight: 700;
}

.weapon-value-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}

.weapon-value-table th,
.weapon-value-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
  text-align: right;
  white-space: nowrap;
}

.weapon-value-table th:first-child,
.weapon-value-table td:first-child {
  text-align: left;
}

.weapon-value-table th {
  color: var(--text-muted);
  font-weight: 600;
}

.weapon-value-table td {
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.weapon-value-table b {
  display: block;
  color: var(--gold);
}

.weapon-value-table small {
  display: block;
  margin-top: 3px;
  color: var(--text-muted);
  font-family: var(--font-main);
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
