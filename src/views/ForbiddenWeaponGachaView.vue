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
          <div class="stat-value">{{ fmtUnitDiamonds(selected.implicitCoreUnit) }}</div>
          <div class="stat-label">{{ implicitUnitLabel }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ usesExpectedCoreSummary ? fmtQty(selected.totalCoreCount) : fmtPulls(analysis.bestNode.pulls) }}</div>
          <div class="stat-label">{{ usesExpectedCoreSummary ? expectedCoreSummaryLabel : t('weaponGachaBestNode') }}</div>
        </div>
      </section>

      <section class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ implicitChartTitle }}</div>
            <span class="tag tag-gold">{{ implicitChartTag }}</span>
            <span v-if="analysis.decisionBaselinePulls" class="tag tag-purple">{{ t('weaponGachaFreeBaselineExcluded') }}</span>
          </div>
          <div class="segmented-control weapon-chart-mode">
            <button
              v-for="mode in implicitChartModes"
              :key="mode.key"
              class="btn btn-sm"
              :class="implicitChartMode === mode.key ? 'btn-primary' : 'btn-ghost'"
              :aria-pressed="implicitChartMode === mode.key"
              @click="implicitChartMode = mode.key"
            >
              {{ t(mode.labelKey) }}
            </button>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="implicitCostOption" autoresize />
        </div>
      </section>

      <section v-if="isSeraphOracle" class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ t('weaponGachaCoreDistributionTitle') }}</div>
            <span class="tag tag-gold">{{ coreDistributionTag }}</span>
            <span v-if="analysis.decisionBaselinePulls" class="tag tag-purple">{{ t('weaponGachaFreeBaselineExcluded') }}</span>
            <span class="tag tag-purple">{{ t('weaponGachaStage1DistributionExcluded') }}</span>
          </div>
          <div class="segmented-control weapon-chart-mode">
            <button
              v-for="mode in coreDistributionPeriodModes"
              :key="mode.key"
              class="btn btn-sm"
              :class="coreDistributionPeriodMode === mode.key ? 'btn-primary' : 'btn-ghost'"
              :aria-pressed="coreDistributionPeriodMode === mode.key"
              @click="coreDistributionPeriodMode = mode.key"
            >
              {{ t(mode.labelKey) }}
            </button>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="coreDistributionOption" autoresize />
        </div>
      </section>

      <section v-if="isSeraphOracle" class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ t('weaponGachaRelicExpectationLossTitle') }}</div>
            <span class="tag tag-gold">{{ t('weaponGachaSamePaidPulls') }}</span>
            <span class="tag tag-purple">{{ t('weaponGachaStage1CommonBaseline') }}</span>
            <span class="tag tag-purple">{{ t('weaponGachaFullStagesOnly') }}</span>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="seraphCrossWeekOption" autoresize />
        </div>
      </section>

      <section v-if="isSeraphOracle" class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ t('weaponGachaSeraphStrategyTitle') }}</div>
            <span class="tag tag-purple">{{ seraphStrategyChartTag }}</span>
          </div>
          <div class="segmented-control weapon-chart-mode">
            <button
              v-for="mode in implicitChartModes"
              :key="mode.key"
              class="btn btn-sm"
              :class="seraphStrategyChartMode === mode.key ? 'btn-primary' : 'btn-ghost'"
              :aria-pressed="seraphStrategyChartMode === mode.key"
              @click="seraphStrategyChartMode = mode.key"
            >
              {{ t(mode.labelKey) }}
            </button>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="seraphStrategyOption" autoresize />
        </div>
      </section>

      <section class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ quantityChartTitle }}</div>
            <span class="tag tag-purple">{{ quantityChartTag }}</span>
          </div>
          <div v-if="isWitchSecret" class="segmented-control weapon-chart-mode">
            <button
              v-for="mode in coreDistributionPeriodModes"
              :key="mode.key"
              class="btn btn-sm"
              :class="coreDistributionPeriodMode === mode.key ? 'btn-primary' : 'btn-ghost'"
              :aria-pressed="coreDistributionPeriodMode === mode.key"
              @click="coreDistributionPeriodMode = mode.key"
            >
              {{ t(mode.labelKey) }}
            </button>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="quantityOption" autoresize />
        </div>
      </section>

      <section class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="card-title">{{ t('weaponGachaSideContribution') }}</div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="sideContributionOption" autoresize />
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
          <input
            class="form-input weapon-pull-input"
            type="number"
            :min="selectedPullMin"
            step="1"
            v-model.number="selectedPulls"
            @change="normalizeSelectedPulls"
          >
        </div>
        <div class="weapon-preset-row">
          <button v-for="pull in presetPulls" :key="pull" class="btn btn-sm" :class="selectedPulls === pull ? 'btn-primary' : 'btn-ghost'" @click="selectedPulls = pull">{{ fmtPulls(pull) }}</button>
        </div>
        <button
          v-if="isSeraphOracle"
          class="btn btn-sm weapon-baseline-toggle"
          :class="ignoreFirstTopUp3 ? 'btn-primary' : 'btn-ghost'"
          :aria-pressed="ignoreFirstTopUp3"
          :title="t('weaponGachaIgnoreFirstTopUp3Hint')"
          @click="ignoreFirstTopUp3 = !ignoreFirstTopUp3"
        >
          {{ t('weaponGachaIgnoreFirstTopUp3') }}
        </button>
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
            <b>{{ analysis.cumulativeSelected.freePulls }} / {{ analysis.cumulativeSelected.paidPulls }}</b>
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
            <b>{{ fmtUnitDiamonds(noFreeCycle.implicitCoreUnit) }}</b>
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

import {
  buildForbiddenWeaponGachaAnalysis,
  buildCoreProductProbabilityDistributions,
  buildSeraphCrossWeekComparisonRows,
  WEAPON_GACHA_CONFIGS,
} from '../engine/forbiddenWeaponGachaCalc.js'
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
const ignoreFirstTopUp3 = ref(false)
const implicitChartMode = ref('cost')
const seraphStrategyChartMode = ref('cost')
const coreDistributionPeriodMode = ref('singleWeek')
const implicitChartModes = [
  { key: 'cost', labelKey: 'weaponGachaCostView' },
  { key: 'efficiency', labelKey: 'weaponGachaEfficiencyView' },
]
const coreDistributionPeriodModes = [
  { key: 'singleWeek', labelKey: 'weaponGachaDistributionSingleWeek' },
  { key: 'weeklyRound', labelKey: 'weaponGachaDistributionWeeklyRound' },
]
const bannerOptions = Object.values(WEAPON_GACHA_CONFIGS)
const isWitchSecret = computed(() => selectedBanner.value === 'witchSecret')
const isSeraphOracle = computed(() => selectedBanner.value === 'seraphOracle')
const hasFreePulls = computed(() => Boolean(analysis.value.config.freePullsPerPeriod))
const usesExpectedCoreSummary = computed(() => analysis.value.config.summaryMode === 'expectedCore' || isWitchSecret.value)
const selectedPullMin = computed(() => isSeraphOracle.value && ignoreFirstTopUp3.value ? 11 : 1)
const presetPulls = computed(() => {
  if (isWitchSecret.value) return [7, 15, 25, 35]
  if (isSeraphOracle.value) return ignoreFirstTopUp3.value ? [11, 25, 50, 100, 150] : [7, 10, 25, 50, 100, 150]
  return [10, 20, 50, 100]
})

const normalizeSelectedPulls = () => {
  const pulls = Math.trunc(Number(selectedPulls.value))
  selectedPulls.value = Number.isFinite(pulls) ? Math.max(selectedPullMin.value, pulls) : selectedPullMin.value
}

const normalizedScores = computed(() => applyDerivedScores(normalizeScores(editableScores)))
const analysis = computed(() => buildForbiddenWeaponGachaAnalysis(normalizedScores.value, {
  bannerKey: selectedBanner.value,
  selectedPulls: selectedPulls.value,
  maxPulls: WEAPON_GACHA_CONFIGS[selectedBanner.value]?.maxPulls || 100,
  ignoreFirstTopUp3: ignoreFirstTopUp3.value,
}))
const selected = computed(() => analysis.value.selected)
const coreDistributions = computed(() => buildCoreProductProbabilityDistributions(analysis.value, {
  periodMode: coreDistributionPeriodMode.value,
}))
const noFreeCycle = computed(() => analysis.value.noFreeCycleNode)
const localeNameMap = { 'zh-CN': 'nameZh', 'zh-TW': 'nameTw', en: 'nameEn', ja: 'nameJa', ko: 'nameKo' }
const tr = (key, fallback, params = {}) => key ? t(key, params) : fallback
const costItemLabel = computed(() => tr(analysis.value.config.costItem.nameKey, analysis.value.config.costItem.label))
const implicitUnitLabel = computed(() => tr(
  analysis.value.config.implicitUnitLabelKey,
  analysis.value.config.implicitUnitLabel || t('weaponGachaCoreImplicitUnit')
))
const implicitChartTitle = computed(() => implicitChartMode.value === 'efficiency'
  ? t('weaponGachaEfficiencyChart')
  : t('weaponGachaCoreCostChart'))
const implicitChartTag = computed(() => implicitChartMode.value === 'efficiency'
  ? t('weaponGachaEfficiencyScale')
  : t('weaponGachaMilestoneIncluded'))
const seraphStrategyChartTag = computed(() => seraphStrategyChartMode.value === 'efficiency'
  ? t('weaponGachaEfficiencyScale')
  : t('weaponGachaStrategyUnitCost'))
const expectedCoreSummaryLabel = computed(() => tr(
  analysis.value.config.summaryCoreLabelKey,
  isWitchSecret.value ? t('weaponGachaExpectedMagicCrystal') : t('weaponGachaExpectedCore')
))
const quantityChartTitle = computed(() => isSeraphOracle.value
  ? t('weaponGachaSeraphValueStructureTitle')
  : t('weaponGachaCoreDistributionTitle'))
const quantityChartTag = computed(() => isSeraphOracle.value
  ? t('weaponGachaValueConverted')
  : coreDistributionTag.value)
const coreDistributionTag = computed(() => t('weaponGachaDistributionPaidPulls', {
  count: coreDistributions.value[0]?.decisionPulls || 0,
}))

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

const rowAtFrom = (rows, pulls) => {
  if (pulls <= 0) return zeroAnalysisRow
  return rows.find(row => row.pulls === pulls)
    || rows.filter(row => row.pulls <= pulls).at(-1)
    || zeroAnalysisRow
}

const rowAtPulls = pulls => rowAtFrom(analysis.value.rows, pulls)

const allSeraphMilestonePulls = computed(() => {
  const rewards = analysis.value.config.milestone?.rewards || []
  return [...new Set(rewards.map(reward => reward.pull))]
    .filter(Boolean)
    .sort((a, b) => a - b)
})

const seraphMilestonePulls = computed(() => allSeraphMilestonePulls.value
  .filter(pull => pull > analysis.value.baselinePulls))

const seraphRoundChance = (pullInRound, baselinePulls = 0) => 1 - (analysis.value.config.milestone?.rewards || [])
  .filter(reward => reward.core && reward.pull > baselinePulls && reward.pull <= pullInRound)
  .reduce((missChance, reward) => missChance * (1 - (reward.rate || 0)), 1)

const buildSeraphMilestoneRows = (rows, noteKey, milestonePulls, baselinePulls = 0) => milestonePulls.map(pullInRound => ({
  ...rowAtFrom(rows, pullInRound),
  pullInRound,
  roundChance: seraphRoundChance(pullInRound, baselinePulls),
  note: t(noteKey),
}))

const seraphMilestoneGroups = computed(() => [
  {
    key: 'withFree',
    titleKey: ignoreFirstTopUp3.value ? 'weaponGachaIgnoredFirstCycleTitle' : 'weaponGachaFirstCycleTitle',
    shortTitleKey: ignoreFirstTopUp3.value ? 'weaponGachaIgnoredFirstCycleShort' : 'weaponGachaFirstCycleShort',
    rows: buildSeraphMilestoneRows(
      analysis.value.rows,
      ignoreFirstTopUp3.value ? 'weaponGachaIgnoredFirstCycleNote' : 'weaponGachaFirstCycleNote',
      seraphMilestonePulls.value,
      analysis.value.baselinePulls
    ),
  },
  {
    key: 'noFree',
    titleKey: 'weaponGachaNoFreeCycleTitle',
    shortTitleKey: 'weaponGachaNoFreeCycleShort',
    rows: buildSeraphMilestoneRows(
      analysis.value.noFreeCycleRows,
      'weaponGachaNoFreeCycleNote',
      allSeraphMilestonePulls.value
    ),
  },
])

const buildSeraphStrategy = (key, labelKey, before, after, colorIndex) => {
  const expectedRelic = after.totalCoreCount - before.totalCoreCount
  const totalCost = after.totalCost - before.totalCost
  const sideValue = after.sideValue - before.sideValue
  const coreBudget = Math.max(0, totalCost - sideValue)
  return {
    key,
    label: t(labelKey),
    pulls: after.pulls - before.pulls,
    paidPulls: after.paidPulls - before.paidPulls,
    totalCost,
    sideValue,
    coreBudget,
    expectedRelic,
    implicitCoreUnit: expectedRelic > 0 ? coreBudget / expectedRelic : 0,
    color: LINE_COLORS[colorIndex % LINE_COLORS.length],
  }
}

const seraphStrategyRows = computed(() => {
  const cumulative = analysis.value.cumulativeRows
  const noFree = analysis.value.noFreeCycleRows
  const cumulative7 = rowAtFrom(cumulative, 7)
  const cumulative10 = rowAtFrom(cumulative, 10)
  const noFree10 = rowAtFrom(noFree, 10)
  const noFree25 = rowAtFrom(noFree, 25)
  const noFree50 = rowAtFrom(noFree, 50)

  return [
    buildSeraphStrategy('stage1TopUp3', 'weaponGachaStrategyStage1TopUp3', cumulative7, cumulative10, 0),
    buildSeraphStrategy('stage1TopUp10', 'weaponGachaStrategyStage1TopUp10', zeroAnalysisRow, noFree10, 1),
    buildSeraphStrategy('stage2', 'weaponGachaStrategyStage2', noFree10, noFree25, 2),
    buildSeraphStrategy('stage3', 'weaponGachaStrategyStage3', noFree25, noFree50, 3),
    buildSeraphStrategy('stage2And3', 'weaponGachaStrategyStage2And3', noFree10, noFree50, 4),
    buildSeraphStrategy('topUp3Full', 'weaponGachaStrategyTopUp3Full', cumulative7, rowAtFrom(cumulative, 50), 5),
    buildSeraphStrategy('topUp10Full', 'weaponGachaStrategyTopUp10Full', zeroAnalysisRow, noFree50, 6),
  ]
})

const seraphCrossWeekRows = computed(() => buildSeraphCrossWeekComparisonRows(analysis.value))

const seraphValueStructureRows = computed(() => seraphMilestoneGroups.value.flatMap(group =>
  group.rows.map(row => ({
    ...row,
    groupKey: group.key,
    groupTitle: t(group.titleKey),
    label: `${t(group.shortTitleKey)}\n${fmtPulls(row.pullInRound)}`,
  }))
))

watch(selectedBanner, banner => {
  selectedPulls.value = banner === 'witchSecret' ? 35 : banner === 'seraphOracle' ? 50 : 20
})

watch(ignoreFirstTopUp3, enabled => {
  if (enabled && selectedPulls.value < 11) selectedPulls.value = 11
})

const fmtDiamonds = value => t('diamondValue', { value: Math.round(value).toLocaleString() })
const fmtUnitDiamonds = value => t('diamondValue', {
  value: Number(value).toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
})
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
  const rows = analysis.value.decisionRows
  const showEfficiency = implicitChartMode.value === 'efficiency'
  const comparableCosts = rows
    .filter(row => row.totalCoreCount > 0)
    .map(row => row.implicitCoreUnit)
  const bestCost = comparableCosts.length ? Math.min(...comparableCosts) : 0
  const worstCost = comparableCosts.length ? Math.max(...comparableCosts) : 0
  const metricValue = row => {
    if (row.totalCoreCount <= 0) return showEfficiency ? 0 : null
    if (!showEfficiency) return +row.implicitCoreUnit.toFixed(2)
    if (worstCost <= bestCost) return 100
    return +Math.max(0, Math.min(100,
      (worstCost - row.implicitCoreUnit) / (worstCost - bestCost) * 100
    )).toFixed(1)
  }
  const milestonePulls = analysis.value.config.weeklyMilestones?.length
    ? analysis.value.config.weeklyMilestones.map(reward => reward.pull)
    : analysis.value.config.milestone?.rewards?.length
      ? [...new Set(rows.flatMap(row => row.milestoneRewards.map(reward => reward.pull)))]
      : rows.filter(row => row.pulls % analysis.value.config.milestone.interval === 0).map(row => row.pulls)
  const milestonePoints = rows
    .filter(row => milestonePulls.includes(row.pulls))
    .map(row => ({
      name: fmtPulls(row.pulls),
      coord: [row.pulls, metricValue(row)],
      value: String(row.pulls),
    }))
    .filter(point => point.coord[1] != null)

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      formatter: chartTooltip(rows, t('weaponGachaPullCount'), [
        ...(showEfficiency ? [{ label: implicitUnitLabel.value, format: row => fmtUnitDiamonds(row.implicitCoreUnit) }] : []),
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
      min: showEfficiency ? 0 : undefined,
      max: showEfficiency ? 100 : undefined,
      axisLabel: {
        ...theme.axisLabel,
        formatter: value => showEfficiency ? value : fmtDiamonds(value),
      },
      splitLine: theme.splitLine,
    },
    series: [
      {
        name: showEfficiency ? t('weaponGachaEfficiencyIndex') : implicitUnitLabel.value,
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
        data: rows.map(metricValue),
      },
    ],
  }
})

const seraphCrossWeekOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = seraphCrossWeekRows.value

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      formatter: params => {
        const list = Array.isArray(params) ? params : [params]
        const row = rows[list[0].dataIndex]
        return `<b style="color:var(--gold)">${fmtPulls(row.requestedPulls)}</b><br>${t('weaponGachaContinuousSingleWeek')}: <b>${row.singleWeekStages} × 50</b> · ${t('weaponGachaExpectedRelic')}: <b>${fmtQty(row.continuous.expectedRelic)}</b><br>${t('weaponGachaSplitWeeksStage23')}: <b>${row.splitWeekStages} × 40</b> · ${t('weaponGachaExpectedRelic')}: <b>${fmtQty(row.splitWeeks.expectedRelic)}</b><br>${t('weaponGachaExpectedRelicLoss')}: <b>${fmtQty(row.expectedRelicLoss)}</b> (${fmtPercent(row.expectedRelicLossRate)})`
      },
    },
    legend: { ...theme.legend, top: 8, right: 16 },
    grid: { top: 54, right: 24, bottom: 52, left: 58 },
    xAxis: {
      type: 'category',
      data: rows.map(row => fmtPulls(row.requestedPulls)),
      axisLabel: { ...theme.axisLabel, interval: 0 },
      axisLine: theme.axisLine,
    },
    yAxis: {
      type: 'value',
      min: 0,
      axisLabel: theme.axisLabel,
      splitLine: theme.splitLine,
    },
    series: [
      {
        name: t('weaponGachaSingleWeekExpectedRelic'),
        type: 'bar',
        stack: 'relicExpectation',
        barMaxWidth: 62,
        itemStyle: { color: LINE_COLORS[1] },
        data: rows.map(row => +row.continuous.expectedRelic.toFixed(2)),
      },
      {
        name: t('weaponGachaExpectedRelicLoss'),
        type: 'bar',
        stack: 'relicExpectation',
        barMaxWidth: 62,
        itemStyle: { color: LINE_COLORS[4] },
        label: {
          show: true,
          position: 'top',
          color: theme.axisLabel.color,
          formatter: item => fmtQty(rows[item.dataIndex].splitWeeks.expectedRelic),
        },
        data: rows.map(row => +row.expectedRelicLoss.toFixed(2)),
      },
    ],
  }
})

const seraphStrategyOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const rows = seraphStrategyRows.value
  const showEfficiency = seraphStrategyChartMode.value === 'efficiency'
  const bestCost = Math.min(...rows.map(row => row.implicitCoreUnit).filter(value => value > 0))
  const metricValue = row => showEfficiency
    ? +(bestCost / row.implicitCoreUnit * 100).toFixed(1)
    : +row.implicitCoreUnit.toFixed(2)

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'item',
      formatter: item => {
        const row = rows[item.dataIndex]
        const efficiency = +(bestCost / row.implicitCoreUnit * 100).toFixed(1)
        return `<b style="color:var(--gold)">${row.label.replaceAll('\n', ' ')}</b><br>${t('weaponGachaPaidPulls')}: <b>${fmtPulls(row.paidPulls)}</b><br>${t('weaponGachaTotalCost')}: <b>${fmtDiamonds(row.totalCost)}</b><br>${t('weaponGachaSideDeduction')}: <b>${fmtDiamonds(row.sideValue)}</b><br>${t('weaponGachaExpectedRelic')}: <b>${fmtQty(row.expectedRelic)}</b><br>${t('weaponGachaRelicValue')}: <b>${fmtUnitDiamonds(row.implicitCoreUnit)}</b><br>${t('weaponGachaEfficiencyIndex')}: <b>${efficiency}</b>`
      },
    },
    grid: { top: 42, right: 18, bottom: 92, left: 72 },
    xAxis: {
      type: 'category',
      data: rows.map(row => row.label),
      axisLabel: { ...theme.axisLabel, interval: 0, lineHeight: 17 },
      axisLine: theme.axisLine,
    },
    yAxis: {
      type: 'value',
      min: showEfficiency ? 0 : undefined,
      max: showEfficiency ? 100 : undefined,
      axisLabel: {
        ...theme.axisLabel,
        formatter: value => showEfficiency ? value : fmtDiamonds(value),
      },
      splitLine: theme.splitLine,
    },
    series: [
      {
        name: showEfficiency ? t('weaponGachaEfficiencyIndex') : t('weaponGachaStrategyUnitCost'),
        type: 'bar',
        barMaxWidth: 52,
        label: {
          show: true,
          position: 'top',
          color: theme.axisLabel.color,
          formatter: item => showEfficiency
            ? Number(item.value).toLocaleString(locale.value, { maximumFractionDigits: 1 })
            : Math.round(item.value).toLocaleString(),
        },
        data: rows.map(row => ({
          value: metricValue(row),
          itemStyle: { color: row.color },
        })),
      },
    ],
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
        let html = `<b style="color:var(--gold)">${row.groupTitle} · ${fmtPulls(row.pullInRound)}</b><br>${t('weaponGachaFreePaidPulls')}: <b>${row.freePulls} / ${row.paidPulls}</b><br>${t('weaponGachaExpectedRelic')}: <b>${fmtQty(row.totalCoreCount)}</b><br>${t('weaponGachaRelicValue')}: <b>${fmtUnitDiamonds(row.implicitCoreUnit)}</b><br>`
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

const coreDistributionOption = computed(() => {
  const isDark = currentTheme.value === 'dark'
  const theme = getMoriTheme(isDark)
  const distributions = coreDistributions.value
  const quantities = [...new Set(distributions.flatMap(distribution =>
    distribution.points.map(point => point.quantity)
  ))].sort((left, right) => left - right)

  return {
    ...baseChartOption('', '', isDark),
    tooltip: {
      ...theme.tooltip,
      trigger: 'axis',
      formatter: params => {
        const list = Array.isArray(params) ? params : [params]
        const quantity = quantities[list[0].dataIndex]
        let html = `<b style="color:var(--gold)">${t('weaponGachaCoreQuantity', { count: quantity })}</b><br>`
        list.forEach(item => {
          const distribution = distributions[item.seriesIndex]
          html += `<span style="color:${item.color}">● ${item.seriesName}</span>: <b>${Number(item.value).toFixed(2)}%</b><br>${t('weaponGachaDistributionExpected')}: <b>${fmtQty(distribution.expected)}</b><br>`
        })
        return html
      },
    },
    legend: { ...theme.legend, top: 8, right: 16 },
    grid: { top: 48, right: 18, bottom: 52, left: 58 },
    xAxis: {
      type: 'category',
      data: quantities,
      axisLabel: theme.axisLabel,
      axisLine: theme.axisLine,
    },
    yAxis: {
      type: 'value',
      min: 0,
      axisLabel: { ...theme.axisLabel, formatter: value => `${value}%` },
      splitLine: theme.splitLine,
    },
    series: distributions.map((distribution, index) => {
      const probabilities = new Map(distribution.points.map(point => [point.quantity, point.probability]))
      return {
        name: tr(distribution.labelKey, distribution.label),
        type: 'bar',
        barMaxWidth: 42,
        itemStyle: { color: LINE_COLORS[index % LINE_COLORS.length] },
        data: quantities.map(quantity => +((probabilities.get(quantity) || 0) * 100).toFixed(4)),
      }
    }),
  }
})

const quantityOption = computed(() => isSeraphOracle.value
  ? seraphValueStructureOption.value
  : coreDistributionOption.value)

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

.weapon-chart-card {
  min-width: 0;
}

.weapon-chart-mode {
  flex: 0 0 auto;
}

.weapon-chart-mode .btn {
  min-width: 88px;
}

.weapon-chart-frame {
  height: 380px;
  min-height: 380px;
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
  text-align: center;
}

.weapon-preset-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.weapon-baseline-toggle {
  width: 100%;
  margin-top: 10px;
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
  .weapon-layout {
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
  .weapon-summary {
    gap: 12px;
  }

  .weapon-summary {
    grid-template-columns: 1fr;
  }

  .weapon-chart-frame {
    height: 340px;
    min-height: 340px;
  }
}
</style>
