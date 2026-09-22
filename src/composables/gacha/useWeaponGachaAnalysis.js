import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  buildForbiddenWeaponGachaAnalysis,
  buildCoreProductProbabilityDistributions,
  buildSeraphCrossWeekComparisonRows,
  findExpectedPullsForCoreProducts,
  WEAPON_GACHA_CONFIGS,
} from '../../engine/forbiddenWeaponGachaCalc.js'
import { normalizedScores } from '../../store/derivedItemScores.js'
import { LINE_COLORS } from '../../utils/chartTheme.js'

import {
  calculateGearCoreProductRange,
  GEAR_CORE_MAX_LEVEL,
  GEAR_CORE_MIN_LEVEL,
  normalizeGearLevelForGear,
} from '../../engine/gearCoreProductCalc.js'

export function useWeaponGachaAnalysis() {
  const { t, locale } = useI18n()

  const selectedBanner = ref('forbidden')
  const selectedPulls = ref(100)
  const gearCurrentLevel = ref(0)
  const gearTargetLevel = ref(240)
  const showFormula = ref(false)
  const ignoreFirstTopUp3 = ref(false)
  const implicitChartMode = ref('cost')
  const seraphStrategyChartMode = ref('cost')
  const pullStrategyMode = ref('weeklyRound')
  const implicitChartModes = [
    { key: 'cost', labelKey: 'weaponGachaCostView' },
    { key: 'efficiency', labelKey: 'weaponGachaEfficiencyView' },
  ]
  const pullStrategyModes = [
    { key: 'weeklyRound', labelKey: 'weaponGachaDistributionWeeklyRound' },
    { key: 'singleWeek', labelKey: 'weaponGachaDistributionSingleWeek' },
  ]
  const gearKeyByBanner = {
    forbidden: 'forbidden',
    light: 'light',
    witchSecret: 'unique',
    seraphOracle: 'seraph',
  }
  const selectedGearKey = computed(() => gearKeyByBanner[selectedBanner.value])
  const gearCoreResult = computed(() => calculateGearCoreProductRange(
    gearCurrentLevel.value,
    gearTargetLevel.value,
    selectedGearKey.value,
  ))
  const gearCoreExpectedPulls = computed(() => findExpectedPullsForCoreProducts(
    selectedBanner.value,
    gearCoreResult.value.products,
    {
      periodMode: pullStrategyMode.value,
      ignoreFirstTopUp3: ignoreFirstTopUp3.value,
    },
  ))
  const gearCoreProductLabel = computed(() => {
    const key = selectedGearKey.value
    return t(`gearCoreProduct${key[0].toUpperCase()}${key.slice(1)}`)
  })
  const normalizeGearLevels = () => {
    gearCurrentLevel.value = normalizeGearLevelForGear(gearCurrentLevel.value, selectedGearKey.value)
    gearTargetLevel.value = normalizeGearLevelForGear(gearTargetLevel.value, selectedGearKey.value)
  }
  watch(selectedGearKey, normalizeGearLevels)
  const bannerOptions = Object.values(WEAPON_GACHA_CONFIGS)
  const isWitchSecret = computed(() => selectedBanner.value === 'witchSecret')
  const isSeraphOracle = computed(() => selectedBanner.value === 'seraphOracle')
  const hasPeriodStrategy = computed(() => isWitchSecret.value || isSeraphOracle.value)
  const hasFreePulls = computed(() => Boolean(analysis.value.config.freePullsPerPeriod))
  const usesExpectedCoreSummary = computed(() => analysis.value.config.summaryMode === 'expectedCore' || isWitchSecret.value)
  const selectedPullMin = computed(() => isSeraphOracle.value && ignoreFirstTopUp3.value ? 11 : 1)
  const presetPulls = computed(() => {
    if (isWitchSecret.value) return [7, 15, 25, 35, 70]
    if (isSeraphOracle.value) return ignoreFirstTopUp3.value ? [11, 25, 50, 100, 150] : [7, 10, 25, 50, 100, 150]
    return [10, 20, 50, 100]
  })
  const maxPresetPulls = computed(() => Math.max(...presetPulls.value))
  const chartMaxPulls = computed(() => {
    const requestedPulls = Math.trunc(Number(selectedPulls.value))
    const selectedChartPulls = Number.isFinite(requestedPulls) ? requestedPulls : maxPresetPulls.value
    const config = WEAPON_GACHA_CONFIGS[selectedBanner.value]
    const decisionBaseline = isSeraphOracle.value && ignoreFirstTopUp3.value
      ? 10
      : (config?.freePullsPerPeriod || 0)
    return Math.max(
      decisionBaseline + 1,
      Math.min(selectedChartPulls, maxPresetPulls.value * 2),
    )
  })

  const normalizeSelectedPulls = () => {
    const pulls = Math.trunc(Number(selectedPulls.value))
    selectedPulls.value = Number.isFinite(pulls) ? Math.max(selectedPullMin.value, pulls) : selectedPullMin.value
  }

  const analysis = computed(() => buildForbiddenWeaponGachaAnalysis(normalizedScores.value, {
    bannerKey: selectedBanner.value,
    selectedPulls: selectedPulls.value,
    maxPulls: WEAPON_GACHA_CONFIGS[selectedBanner.value]?.maxPulls || 100,
    ignoreFirstTopUp3: ignoreFirstTopUp3.value,
    periodMode: pullStrategyMode.value,
  }))
  const implicitChartAnalysis = computed(() => buildForbiddenWeaponGachaAnalysis(normalizedScores.value, {
    bannerKey: selectedBanner.value,
    selectedPulls: selectedPulls.value,
    maxPulls: chartMaxPulls.value,
    ignoreFirstTopUp3: ignoreFirstTopUp3.value,
    periodMode: pullStrategyMode.value,
  }))
  const selected = computed(() => analysis.value.selected)
  const coreDistributions = computed(() => buildCoreProductProbabilityDistributions(analysis.value))
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
  const quantityChartTitle = computed(() => t('weaponGachaCoreDistributionTitle'))
  const quantityChartTag = computed(() => coreDistributionTag.value)
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
    ].filter(row => !ignoreFirstTopUp3.value || !['stage1TopUp3', 'topUp3Full'].includes(row.key))
  })

  const currentSeraphStrategyLabel = computed(() => t(
    pullStrategyMode.value === 'weeklyRound'
      ? 'weaponGachaDistributionWeeklyRound'
      : 'weaponGachaDistributionSingleWeek'
  ))
  const comparisonSeraphStrategyLabel = computed(() => t(
    pullStrategyMode.value === 'weeklyRound'
      ? 'weaponGachaDistributionSingleWeek'
      : 'weaponGachaDistributionWeeklyRound'
  ))
  const seraphCrossWeekRows = computed(() => buildSeraphCrossWeekComparisonRows(
    analysis.value,
    undefined,
    {
      periodMode: pullStrategyMode.value,
      ignoreFirstTopUp3: ignoreFirstTopUp3.value,
    },
  ))

  watch(selectedBanner, () => {
    selectedPulls.value = maxPresetPulls.value
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

  return {
    t,
    locale,
    selectedBanner,
    selectedPulls,
    gearCurrentLevel,
    gearTargetLevel,
    showFormula,
    ignoreFirstTopUp3,
    implicitChartMode,
    seraphStrategyChartMode,
    pullStrategyMode,
    implicitChartModes,
    pullStrategyModes,
    gearCoreResult,
    gearCoreExpectedPulls,
    gearCoreProductLabel,
    normalizeGearLevels,
    bannerOptions,
    isWitchSecret,
    isSeraphOracle,
    hasPeriodStrategy,
    hasFreePulls,
    usesExpectedCoreSummary,
    selectedPullMin,
    presetPulls,
    normalizeSelectedPulls,
    analysis,
    implicitChartAnalysis,
    selected,
    coreDistributions,
    noFreeCycle,
    tr,
    costItemLabel,
    implicitUnitLabel,
    implicitChartTitle,
    implicitChartTag,
    seraphStrategyChartTag,
    expectedCoreSummaryLabel,
    quantityChartTitle,
    quantityChartTag,
    coreDistributionTag,
    dropLabel,
    selectedCoreRows,
    selectedMilestoneRows,
    seraphStrategyRows,
    currentSeraphStrategyLabel,
    comparisonSeraphStrategyLabel,
    seraphCrossWeekRows,
    fmtDiamonds,
    fmtUnitDiamonds,
    fmtPulls,
    fmtScoreValue,
    fmtPercent,
    fmtQty,
    selectedSideRows
  }
}
