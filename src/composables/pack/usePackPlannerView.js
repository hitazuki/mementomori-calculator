import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { calculatePackCE } from '../../engine/packCalc.js'
import { buildUltraSalePlanOptions, compressUltraSalePlanSteps, preferenceCeForLevel } from '../../engine/ultraSalePlanner.js'
import { editableScores } from '../../store/itemScores.js'

const attributeTowerIds = new Set([
  'origin_tower_blue',
  'origin_tower_red',
  'origin_tower_green',
  'origin_tower_yellow',
])

export function usePackPlannerView({
  t,
  packsRaw,
  permanentPacksRaw,
  normalizedScores,
  formatCe,
  planLaneName,
}) {
  const planSettings = reactive({
    rechargePlanningMode: 'longTerm',
    preferenceLevel: 'balanced',
    customExpectedRatio: null,
    executionWeight: 50,
    currentPrice: 160,
    topUpMode: 'auto',
  })

  const plannerCalculatedPacks = computed(() => calculatePackCE(packsRaw.value, normalizedScores.value))

  const plannerPreferenceCePreview = computed(() => {
    const packs = plannerCalculatedPacks.value
    const balanced = preferenceCeForLevel(packs, 'balanced')
    return {
      baseline: balanced.preferenceBaselineCe,
      current: preferenceCeForLevel(packs, planSettings.preferenceLevel, planSettings).expectedRatio,
      conservative: preferenceCeForLevel(packs, 'conservative').expectedRatio,
      balanced: balanced.expectedRatio,
      aggressive: preferenceCeForLevel(packs, 'aggressive').expectedRatio,
      custom: preferenceCeForLevel(packs, 'custom', planSettings).expectedRatio,
    }
  })

  const activePlanId = ref('bestValue')
  const planOptions = shallowRef([])
  const isPlanning = ref(false)
  const plannerError = ref(null)
  const plannerDirty = ref(true)
  const plannerStatusCalcTime = ref(null)

  function setActivePlan(id) {
    activePlanId.value = id
  }

  const planLanes = reactive([
    { id: 'quest', cat: 'quest', labelKey: 'origin_quest', enabled: true, startProgress: '45-09', endProgress: '48-01', batchSize: 6 },
    { id: 'rank', cat: 'rank', labelKey: 'origin_rank', enabled: true, startProgress: 630, endProgress: 660, batchSize: 1 },
    { id: 'tower_infinite', cat: 'tower', tower: 'origin_tower_infinite', labelKey: 'origin_tower_infinite', enabled: true, startProgress: 2444, endProgress: 2555, batchSize: 6 },
    { id: 'tower_blue', cat: 'tower', tower: 'origin_tower_blue', labelKey: 'origin_tower_blue', enabled: true, startProgress: 1000, endProgress: 1100, batchSize: 1 },
    { id: 'tower_red', cat: 'tower', tower: 'origin_tower_red', labelKey: 'origin_tower_red', enabled: true, startProgress: 1099, endProgress: 1100, batchSize: 1 },
    { id: 'tower_green', cat: 'tower', tower: 'origin_tower_green', labelKey: 'origin_tower_green', enabled: true, startProgress: 1500, endProgress: 1800, batchSize: 1 },
    { id: 'tower_yellow', cat: 'tower', tower: 'origin_tower_yellow', labelKey: 'origin_tower_yellow', enabled: true, startProgress: 1500, endProgress: 1800, batchSize: 1 },
  ])

  function isAttributeTowerLane(lane) {
    return lane.cat === 'tower' && attributeTowerIds.has(lane.tower)
  }

  const planningSettings = computed(() => ({
    ...planSettings,
    lanes: planLanes.map(lane => ({
      id: lane.id,
      cat: lane.cat,
      tower: lane.tower,
      label: planLaneName(lane),
      enabled: lane.enabled,
      startProgress: lane.startProgress,
      endProgress: lane.endProgress,
      batchSize: isAttributeTowerLane(lane) ? 1 : lane.batchSize,
    })),
  }))

  const plannerStatusText = computed(() => {
    if (isPlanning.value) return t('planStatusGenerating')
    if (plannerDirty.value && planOptions.value.length) return t('planStatusDirty')
    return plannerStatusCalcTime.value === null ? t('planStatusNotCalc') : t('planStatusDone', { n: plannerStatusCalcTime.value })
  })

  function scoreOf(itemKey, fallback = 1) {
    const score = normalizedScores.value[itemKey]?.score
    return Number.isFinite(Number(score)) ? Number(score) : fallback
  }

  async function calculatePlanner() {
    if (isPlanning.value) return
    isPlanning.value = true
    await new Promise(resolve => setTimeout(resolve, 0))

    plannerError.value = null
    try {
      const startedAt = performance.now()
      const calculatedPacks = plannerCalculatedPacks.value
      const calculatedPermanentPacks = calculatePackCE(permanentPacksRaw.value, normalizedScores.value)
      const options = await buildUltraSalePlanOptions(calculatedPacks, {
        ...planningSettings.value,
        permanentPacks: calculatedPermanentPacks,
        diamondScore: scoreOf('[2,1]', 1),
        freeDiamondScore: scoreOf('[1,1]', scoreOf('[2,1]', 1)),
        maxStatesPerTier: 350,
      })
      planOptions.value = options
      if (!options.some(option => option.id === activePlanId.value)) {
        activePlanId.value = options[0]?.id || 'bestValue'
      }
      plannerStatusCalcTime.value = Math.max(1, Math.round(performance.now() - startedAt))
      plannerDirty.value = false
    } catch (e) {
      plannerError.value = String(e.stack || e)
      console.error('Planner Error:', e)
    } finally {
      isPlanning.value = false
    }
  }

  const selectedPlan = computed(() => {
    if (!planOptions.value.length) return null
    return planOptions.value.find(option => option.id === activePlanId.value) || planOptions.value[0]
  })

  const compressedPlanSteps = computed(() => {
    if (!selectedPlan.value) return []
    return compressUltraSalePlanSteps(selectedPlan.value.steps)
  })

  const displayedPlanSteps = computed(() => compressedPlanSteps.value)

  watch(planningSettings, () => {
    plannerDirty.value = true
  }, { deep: true })

  watch(editableScores, () => {
    plannerDirty.value = true
  }, { deep: true })

  const plannerExpanded = reactive(new Set())

  function isPlannerStepExpandable(step) {
    return !!step && (step.bought || step.skipCount > 0)
  }

  function togglePlannerStep(step) {
    if (!isPlannerStepExpandable(step)) return
    const rowKey = step.rowKey
    if (plannerExpanded.has(rowKey)) plannerExpanded.delete(rowKey)
    else plannerExpanded.add(rowKey)
  }

  function isPlannerStepExpanded(rowKey) {
    return plannerExpanded.has(rowKey)
  }

  watch(activePlanId, () => {
    plannerExpanded.clear()
  })

  function plannerTriggerCount(step) {
    if (step.skipCount > 1 && Array.isArray(step.skippedSteps)) {
      return step.skippedSteps.reduce((sum, skipped) => sum + (skipped.opportunities?.length || 0), 0)
    }
    return step.opportunities?.length || 0
  }

  function plannerPurchaseCount(step) {
    if (step.skipCount > 1 && Array.isArray(step.skippedSteps)) {
      return step.skippedSteps.reduce((sum, skipped) => sum + (skipped.purchases?.length || 0), 0)
    }
    return step.purchases?.length || 0
  }

  function plannerTriggeredPacks(step) {
    if (Array.isArray(step.opportunities) && step.opportunities.length) {
      return step.opportunities
        .filter(opportunity => opportunity.hasPackAtTier)
        .map(opportunity => ({
          displayTrigger: opportunity.displayTrigger,
          sourceLabel: opportunity.sourceLabel || opportunity.label || '',
          price: opportunity.price || 0,
          value: opportunity.value || opportunity.originalValue || 0,
          originalValue: opportunity.originalValue || opportunity.value || 0,
          ce: opportunity.ce || 0,
          items: opportunity.items || [],
          purchased: !!opportunity.purchased,
        }))
    }
    return (step.purchases || []).map(pack => ({ ...pack, purchased: true }))
  }

  function getRechargeProgress(step) {
    let paid = step.topUpPacks && step.topUpPacks.length ? step.topUpRechargeAfterPaid : step.rechargeAfterPaid
    if ((step.rechargeReset || step.rechargeResetCount) && !step.bought) {
      paid = 0
    }
    return t('planTierDiamond', { n: paid || 0 })
  }

  function getRechargeResetText(step) {
    if (step.rechargeResetCount) return t('planResetCount', { n: step.rechargeResetCount })
    if (step.rechargeReset) return t('planReset')
    return ''
  }

  function getPlannerRowLastStep(row) {
    if (Array.isArray(row.skippedSteps) && row.skippedSteps.length) return row.skippedSteps.at(-1)
    const steps = selectedPlan.value?.steps || []
    return steps.find(step => step.index === row.index) || row
  }

  function isTopUpSettlementPending(row) {
    if (row.topUpPacks && row.topUpPacks.length) return false
    const lastStep = getPlannerRowLastStep(row)
    if (!lastStep || !Number.isFinite(lastStep.index)) return true
    const nextStep = (selectedPlan.value?.steps || []).find(step => step.index > lastStep.index)
    return !nextStep || nextStep.rechargeDayIndex === lastStep.rechargeDayIndex
  }

  function getTopUpStatusText(row) {
    if (row.topUpPacks && row.topUpPacks.length) return t('planTopUpDone')
    if (isTopUpSettlementPending(row)) return t('planTopUpPending')
    return t('planTopUpNone')
  }

  function getTopUpStatusClass(row) {
    if (row.topUpPacks && row.topUpPacks.length) return 'planner-status-chip active'
    return isTopUpSettlementPending(row) ? 'planner-status-chip pending' : 'planner-status-chip'
  }

  function remainingOpportunityRange(group) {
    if (!group) return ''
    return group.from === group.to ? group.from : `${group.from} - ${group.to}`
  }

  function preferenceOptionLabel(level) {
    return `${t(`planPref${level[0].toUpperCase()}${level.slice(1)}`)} (CE ${formatCe(plannerPreferenceCePreview.value[level])})`
  }

  return {
    planSettings,
    plannerPreferenceCePreview,
    activePlanId,
    planOptions,
    isPlanning,
    plannerError,
    setActivePlan,
    planLanes,
    isAttributeTowerLane,
    plannerStatusText,
    calculatePlanner,
    selectedPlan,
    compressedPlanSteps,
    displayedPlanSteps,
    isPlannerStepExpandable,
    togglePlannerStep,
    isPlannerStepExpanded,
    plannerTriggerCount,
    plannerPurchaseCount,
    plannerTriggeredPacks,
    getRechargeProgress,
    getRechargeResetText,
    getTopUpStatusText,
    getTopUpStatusClass,
    remainingOpportunityRange,
    preferenceOptionLabel,
  }
}
