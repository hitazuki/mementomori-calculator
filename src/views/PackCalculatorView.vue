<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">💰 {{ $t('navPackCalc') }}</h1>
    <p class="view-desc">
      {{ $t('packCalcDesc') }} — 
      <i18n-t keypath="packCalcSource" tag="span">
        <template #link>
          <a href="https://tamamo.dev/UltraSalePack" target="_blank" style="color:var(--gold);text-decoration:underline;">tamamo.dev</a>
        </template>
      </i18n-t>
    </p>
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <PackScorePanel
      v-model:show-scores="showScores"
      :editable-score-rows="editableScoreRows"
      :readonly-score-rows="readonlyScoreRows"
      :base-url="baseUrl"
      :item-display-name="itemDisplayName"
      :format-score-for-panel="formatScoreForPanel"
      :score-reason-text="scoreReasonText"
      :score-detail-name="scoreDetailName"
      :score-detail-label="scoreDetailLabel"
      :format-score-share="formatScoreShare"
      :has-score-details="hasScoreDetails"
      :is-score-detail-expanded="isScoreDetailExpanded"
      :is-locked="isLocked"
      @toggle-score-detail="toggleScoreDetail"
    />

    <!-- Right Panel: Results Table -->
    <div class="flex-col gap-12" style="min-width:0;">
      <div class="card pack-view-tabs">
        <button
          class="btn btn-sm"
          :class="activePackTab === 'query' ? 'btn-primary' : 'btn-ghost'"
          type="button"
          @click="setActivePackTab('query')"
        >
          {{ $t('planTabQuery') }}
        </button>
        <button
          class="btn btn-sm"
          :class="activePackTab === 'planner' ? 'btn-primary' : 'btn-ghost'"
          type="button"
          @click="setActivePackTab('planner')"
        >
          {{ $t('planTabPlanner') }}
        </button>
      </div>

      <PackQueryResults
        v-if="activePackTab === 'query'"
        :filter="filter"
        :sort-state="sortState"
        :expanded="expanded"
        :tower-options="towerOptions"
        :price-options="priceOptions"
        :filtered-count="filteredPacks.length"
        :sorted-packs="sortedPacks"
        :base-url="baseUrl"
        :tower-name="towerName"
        :format-price="formatPrice"
        :item-display-name="itemDisplayName"
        :sort-icon="sortIcon"
        @toggle-sort="toggleSort"
        @toggle-expand="toggleExpand"
      />

      <!-- Planner -->
      <div v-if="activePackTab === 'planner'" class="card planner-card">
        <PackPlannerControls
          :plan-settings="planSettings"
          :plan-lanes="planLanes"
          :plan-price-options="planPriceOptions"
          :planner-preference-ce-preview="plannerPreferenceCePreview"
          :is-planning="isPlanning"
          :planner-status-text="plannerStatusText"
          :preference-option-label="preferenceOptionLabel"
          :format-ce="formatCe"
          :tier-label="tierLabel"
          :is-attribute-tower-lane="isAttributeTowerLane"
          :plan-lane-name="planLaneName"
          @calculate="calculatePlanner"
        />

        <PackPlannerSummary
          :plan-options="planOptions"
          :active-plan-id="activePlanId"
          :selected-plan="selectedPlan"
          :format-price="formatPrice"
          :tier-label="tierLabel"
          :translate-pack-name="translatePackName"
          @select-plan="setActivePlan"
        />

        <PackPlannerStepTable
          :selected-plan="selectedPlan"
          :plan-options="planOptions"
          :displayed-plan-steps="displayedPlanSteps"
          :compressed-plan-steps="compressedPlanSteps"
          :planner-error="plannerError"
          :base-url="baseUrl"
          :tier-label="tierLabel"
          :format-price="formatPrice"
          :translate-pack-name="translatePackName"
          :item-display-name="itemDisplayName"
          :planner-trigger-count="plannerTriggerCount"
          :planner-purchase-count="plannerPurchaseCount"
          :planner-triggered-packs="plannerTriggeredPacks"
          :get-recharge-progress="getRechargeProgress"
          :get-recharge-reset-text="getRechargeResetText"
          :get-top-up-status-text="getTopUpStatusText"
          :get-top-up-status-class="getTopUpStatusClass"
          :remaining-opportunity-range="remainingOpportunityRange"
          :is-planner-step-expandable="isPlannerStepExpandable"
          :is-planner-step-expanded="isPlannerStepExpanded"
          @toggle-step="togglePlannerStep"
        />
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PackScorePanel from '../components/pack/PackScorePanel.vue'
import PackQueryResults from '../components/pack/PackQueryResults.vue'
import PackPlannerControls from '../components/pack/PackPlannerControls.vue'
import PackPlannerSummary from '../components/pack/PackPlannerSummary.vue'
import PackPlannerStepTable from '../components/pack/PackPlannerStepTable.vue'
import { usePackDisplay } from '../composables/pack/usePackDisplay.js'
import { usePackScores } from '../composables/pack/usePackScores.js'
import { usePackQuery } from '../composables/pack/usePackQuery.js'
import { usePackPlannerView } from '../composables/pack/usePackPlannerView.js'

const { t, locale } = useI18n()
const baseUrl = import.meta.env.BASE_URL || '/'
const showScores = ref(true)
const packsRaw = ref([])
const permanentPacksRaw = ref([])
const activePackTab = ref('query')

function setActivePackTab(tab) {
  activePackTab.value = tab
}

onMounted(async () => {
  try {
    packsRaw.value = await fetch(`${import.meta.env.BASE_URL}data/ultraSalePacks.json`).then(r => r.json())
  } catch (e) {
    console.error('Failed to fetch ultraSalePacks.json', e)
  }
  permanentPacksRaw.value = (await import('../constants/permanentPacks.json')).default
})

const {
  itemDisplayName,
  itemLocaleField,
  towerName,
  formatPrice,
  tierLabel,
  translatePackName,
  formatCe,
} = usePackDisplay(t, locale)

function planLaneName(lane) {
  return lane.labelKey ? t(lane.labelKey) : lane.id
}

const {
  normalizedScores,
  readonlyScoreRows,
  editableScoreRows,
  isLocked,
  hasScoreDetails,
  toggleScoreDetail,
  isScoreDetailExpanded,
  formatScoreForPanel,
  scoreReasonText,
  scoreDetailName,
  scoreDetailLabel,
  formatScoreShare,
} = usePackScores({ t, itemDisplayName, itemLocaleField })

const {
  filter,
  towerOptions,
  priceOptions,
  planPriceOptions,
  sortState,
  toggleSort,
  sortIcon,
  filteredPacks,
  sortedPacks,
  expanded,
  toggleExpand,
} = usePackQuery({ packsRaw, normalizedScores })

const {
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
} = usePackPlannerView({
  t,
  packsRaw,
  permanentPacksRaw,
  normalizedScores,
  formatCe,
  planLaneName,
})
</script>

<style scoped>
:deep(.data-table td) {
  text-align: center;
  vertical-align: middle;
}
:deep(.data-table th) {
  text-align: center;
}

.pack-view-tabs {
  display: flex;
  gap: 8px;
  padding: 8px;
}

.pack-view-tabs .btn {
  min-width: 112px;
}

.planner-card {
  padding: 14px;
}

@media (max-width: 560px) {
  .pack-view-tabs {
    flex-direction: column;
  }

  .pack-view-tabs .btn {
    width: 100%;
  }
}
</style>
