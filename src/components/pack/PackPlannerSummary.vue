<template>
  <div v-if="planOptions.length" class="planner-mode-tabs" role="tablist" :aria-label="$t('planTabPlanner')">
    <button
      v-for="option in planOptions"
      :key="option.id"
      class="btn btn-sm"
      :class="activePlanId === option.id ? 'btn-primary' : 'btn-ghost'"
      type="button"
      role="tab"
      :aria-selected="activePlanId === option.id"
      @click="$emit('selectPlan', option.id)"
    >
      {{ option.labelKey ? $t(option.labelKey) : option.label }}
    </button>
  </div>

  <div v-if="planOptions.length && selectedPlan" class="planner-mode-desc">
    {{ selectedPlan.descKey ? $t(selectedPlan.descKey) : selectedPlan.description }}
  </div>

  <div v-if="selectedPlan" class="planner-summary">
    <div><span>{{ $t('planSumRecommendation') || '推荐结论' }}</span><b>{{ selectedPlan.labelKey ? $t(selectedPlan.labelKey) : selectedPlan.label }}</b></div>
    <div><span>{{ $t('planSumExpectedRatio') || '预期性价比' }}</span><b>{{ selectedPlan.expectedRatio.toFixed(1) }}</b></div>
    <div><span>{{ $t('planSumActualCE') || '路径实际性价比' }}</span><b>{{ selectedPlan.averageCe.toFixed(1) }}</b></div>
    <div><span>{{ $t('planSumSurplus') || '金钱净收益' }}</span><b :style="{ color: selectedPlan.moneySurplus < 0 ? '#e74c3c' : 'var(--gold)' }">{{ selectedPlan.moneySurplus.toLocaleString() }}</b></div>
    <div><span>{{ $t('planSumDecision') || '决策价值' }}</span><b class="planner-simple-metric">{{ selectedPlan.decisionValue.toLocaleString() }}</b></div>
    <div><span>{{ $t('planSumTotalValue') || '总价值' }}</span><b>{{ selectedPlan.value.toLocaleString() }}</b></div>
    <div><span>{{ $t('planSumTotalSpent') || '总花费' }}</span><b>{{ formatPrice(selectedPlan.totalSpent ?? selectedPlan.spent) }}</b></div>
    <div><span>{{ $t('planSumLimitedSpent') || '限时包花费' }}</span><b>{{ formatPrice(selectedPlan.limitedSpentYen ?? selectedPlan.spent) }}</b></div>
    <div><span>{{ $t('planSumTopUpCost') || '补累充花费' }}</span><b>{{ formatPrice(selectedPlan.topUpTotalCost || 0) }}</b></div>
    <div><span>{{ $t('planSumPurchase') || '购买限时包数' }}</span><b>{{ selectedPlan.purchases }}</b></div>
    <div><span>{{ $t('planSumTriggerCount') || '已触发机会数' }}</span><b>{{ selectedPlan.triggerCount }}</b></div>
    <div><span>{{ $t('planSumRetained') || '未使用机会数' }}</span><b>{{ selectedPlan.remainingOpportunities ?? selectedPlan.retainedOpportunities }}</b></div>
    <div><span>{{ $t('planSumResets') || '跨日重置次数' }}</span><b>{{ selectedPlan.rechargeResets }}</b></div>
    <div><span>{{ $t('planSumTopUpBatch') || '补累充批次数' }}</span><b>{{ selectedPlan.topUpBatches?.length || 0 }}</b></div>
    <div><span>{{ $t('planSumFinalTier') || '下一批结束后档位' }}</span><b>{{ tierLabel(selectedPlan.finalTierPrice) }}</b></div>
  </div>

  <div v-if="selectedPlan && selectedPlan.topUpBatches && selectedPlan.topUpBatches.length" class="planner-top-up-summary">
    <div class="planner-detail-title">{{ $t('planTopUpTitle') }}</div>
    <div class="planner-top-up-list">
      <div v-for="batch in selectedPlan.topUpBatches" :key="`${selectedPlan.id}-top-up-batch-${batch.index}`" class="planner-top-up-item">
        <strong>{{ $t('planBatchNum', { n: batch.index }) }}</strong>
        <span>{{ batch.packs.map(pack => translatePackName(pack.displayTrigger)).join(' / ') }}</span>
        <span>{{ formatPrice(batch.cost) }}</span>
        <span>{{ $t('planFreeDiamondAdd', { n: batch.rechargeFreeDiamonds.toLocaleString() }) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  planOptions: { type: Array, required: true },
  activePlanId: { type: String, required: true },
  selectedPlan: { type: Object, default: null },
  formatPrice: { type: Function, required: true },
  tierLabel: { type: Function, required: true },
  translatePackName: { type: Function, required: true },
})

defineEmits(['selectPlan'])
</script>

<style scoped>
.planner-mode-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.planner-mode-tabs .btn {
  min-width: 88px;
}

.planner-mode-desc {
  color: var(--text-muted);
  font-size: var(--fs-sm);
  line-height: 1.45;
  margin-top: 8px;
}

.planner-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.planner-summary div {
  min-width: 0;
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  padding: 8px;
  background: rgba(255,255,255,0.03);
}

.planner-summary span,
.planner-summary b {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.planner-summary span {
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.planner-summary b {
  color: var(--gold);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
  margin-top: 2px;
}

.planner-simple-metric {
  color: var(--gold);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
}

.planner-top-up-summary {
  border: 1px solid rgba(212,175,55,0.32);
  border-radius: var(--r-sm);
  padding: 10px;
  margin-top: 10px;
  background: rgba(212,175,55,0.055);
}

.planner-detail-title {
  color: var(--text-primary);
  font-size: var(--fs-sm);
  font-weight: 700;
  margin-bottom: 8px;
}

.planner-top-up-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.planner-top-up-item {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  padding: 6px 8px;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  background: rgba(0,0,0,0.1);
}

.planner-top-up-item strong {
  color: var(--gold);
}

@media (max-width: 900px) {
  .planner-mode-tabs .btn {
    flex: 1 1 calc(50% - 6px);
  }

  .planner-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .planner-summary {
    grid-template-columns: 1fr;
  }

  .planner-mode-tabs .btn {
    flex-basis: 100%;
  }
}
</style>
