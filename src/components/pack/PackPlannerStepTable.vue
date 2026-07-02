<template>
  <div v-if="selectedPlan && selectedPlan.steps.length" class="planner-table-wrap">
    <table class="data-table planner-table">
      <thead>
        <tr>
          <th>{{ $t('planColBatch') }}</th>
          <th>{{ $t('planColRange') }}</th>
          <th>{{ $t('planColTier') }}</th>
          <th>{{ $t('planColTriggerBuy') }}</th>
          <th>{{ $t('planColRecharge') }}</th>
          <th>{{ $t('planColTopUp') }}</th>
          <th>{{ $t('planColCost') }}</th>
          <th>{{ $t('planColValue') }}</th>
          <th>{{ $t('planColNextTier') }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="step in displayedPlanSteps" :key="step.rowKey">
          <tr
            :class="{ 'row-expanded': isPlannerStepExpanded(step.rowKey), 'planner-clickable-row': isPlannerStepExpandable(step) }"
            @click="$emit('toggleStep', step)"
          >
            <td>{{ step.indexLabel }}</td>
            <td class="planner-range-cell" :title="step.triggerRange">{{ step.triggerRange }}</td>
            <td>{{ tierLabel(step.tierPrice) }}</td>
            <td>
              <span class="planner-simple-metric">
                {{ plannerTriggerCount(step) }} / {{ plannerPurchaseCount(step) }}
              </span>
              <span v-if="!step.bought" class="planner-cell-sub">
                {{ step.skipCount > 1 ? $t('planSkipCount', { n: step.skipCount }) : $t('planSkip') }}
              </span>
            </td>
            <td>
              <div class="planner-recharge-cell">
                <span class="planner-recharge-val">{{ getRechargeProgress(step) }}</span>
                <span
                  v-if="step.rechargeReset || step.rechargeResetCount"
                  :class="step.rechargeReset ? 'planner-status-chip active' : 'planner-status-chip'"
                  class="planner-reset-chip"
                >
                  {{ getRechargeResetText(step) }}
                </span>
              </div>
            </td>
            <td>
              <span :class="getTopUpStatusClass(step)">
                {{ getTopUpStatusText(step) }}
              </span>
            </td>
            <td>{{ formatPrice(step.cost) }}</td>
            <td>
              {{ step.value.toLocaleString() }}
              <span v-if="step.rechargeValue" class="planner-value-extra">
                {{ $t('planValueWithRecharge', { n: step.rechargeValue.toLocaleString() }) }}
              </span>
            </td>
            <td>{{ tierLabel(step.nextTierPrice) }}</td>
          </tr>
          <tr v-if="step.bought && isPlannerStepExpanded(step.rowKey)" class="planner-detail-row">
            <td :colspan="9">
              <div class="planner-pack-details">
                <section v-if="step.opportunities && step.opportunities.length" class="planner-trigger-details">
                  <div class="planner-detail-title">{{ $t('planDetailTriggerRange') }}</div>
                  <div class="planner-trigger-list">
                    <div
                      v-for="opportunity in step.opportunities"
                      :key="`${step.rowKey}-trigger-${opportunity.displayTrigger}`"
                      class="planner-trigger-item"
                      :class="{ purchased: opportunity.purchased, skipped: opportunity.hasPackAtTier && !opportunity.purchased, unavailable: !opportunity.hasPackAtTier }"
                      :title="opportunity.hasPackAtTier ? `${opportunity.displayTrigger} / CE ${opportunity.ce.toFixed(1)}` : opportunity.displayTrigger"
                    >
                      <strong>{{ opportunity.displayTrigger }}</strong>
                      <span v-if="opportunity.hasPackAtTier">CE {{ opportunity.ce.toFixed(1) }}</span>
                      <span v-else>{{ $t('planDetailNoPack') }}</span>
                    </div>
                  </div>
                  <div v-if="step.skippedOpportunities && step.skippedOpportunities.length" class="planner-recharge-note">
                    {{ $t('planDetailSkipNote', { n: step.skippedOpportunities.length }) }}
                  </div>
                </section>
                <article
                  v-for="(pack, packIndex) in plannerTriggeredPacks(step)"
                  :key="`${step.rowKey}-detail-${pack.displayTrigger}-${packIndex}`"
                  class="planner-pack-detail"
                  :class="{ purchased: pack.purchased, skipped: !pack.purchased }"
                >
                  <div class="planner-pack-detail-head">
                    <strong>{{ pack.displayTrigger }}</strong>
                    <span class="planner-pack-state">{{ pack.purchased ? $t('planDetailBought') : $t('planDetailNotBought') }}</span>
                    <span>{{ formatPrice(pack.price) }}</span>
                    <span>CE {{ pack.ce.toFixed(1) }}</span>
                    <span>{{ $t('planColValue') }} {{ Math.round(pack.value).toLocaleString() }}</span>
                  </div>
                  <div class="planner-pack-items">
                    <div
                      v-for="(item, itemIndex) in pack.items"
                      :key="`${pack.displayTrigger}-${itemIndex}`"
                      class="planner-pack-item"
                      :title="itemDisplayName(item)"
                    >
                      <img
                        :src="`${baseUrl}images/items/Item_${String(item.iconId).padStart(4,'0')}.png`"
                        @error="e => e.target.style.display='none'"
                      />
                      <span>{{ itemDisplayName(item) }}</span>
                      <b><span class="pack-item-qty-mark">×</span>{{ item.qty }}</b>
                    </div>
                  </div>
                </article>
                <section v-if="step.topUpPacks && step.topUpPacks.length" class="planner-trigger-details">
                  <div class="planner-detail-title">{{ $t('planDetailTopUpTitle') }}</div>
                  <div class="planner-recharge-note">
                    {{ $t('planDetailTopUpNote', { cost: formatPrice(step.topUpCost), before: step.topUpRechargeBeforePaid.toLocaleString(), after: step.topUpRechargeAfterPaid.toLocaleString(), tiers: step.topUpUnlockedRechargeTiers.join(' / '), free: step.topUpRechargeFreeDiamonds.toLocaleString() }) }}
                  </div>
                  <div class="planner-top-up-list">
                    <div v-for="pack in step.topUpPacks" :key="`${step.rowKey}-top-up-${pack.displayTrigger}`" class="planner-top-up-item">
                      <strong>{{ translatePackName(pack.displayTrigger) }}</strong>
                      <span>{{ formatPrice(pack.price) }}</span>
                      <span>{{ $t('planColValue') }} {{ Math.round(pack.value || 0).toLocaleString() }}</span>
                    </div>
                  </div>
                </section>
              </div>
            </td>
          </tr>
          <tr v-else-if="!step.bought && isPlannerStepExpanded(step.rowKey)" class="planner-detail-row">
            <td :colspan="9">
              <div class="planner-skip-details">
                <div class="planner-skip-summary">
                  <span>{{ $t('planSkipSeriesCount', { n: step.skipCount }) }}</span>
                  <span>{{ $t('planTierDropCount', { n: step.tierDropCount || 0 }) }}</span>
                  <span>{{ tierLabel(step.tierPrice) }} -> {{ tierLabel(step.nextTierPrice) }}</span>
                </div>
                <div v-if="step.skipSourceRanges && step.skipSourceRanges.length" class="planner-skip-sources">
                  <div v-for="source in step.skipSourceRanges" :key="`${step.rowKey}-${source.label}`" class="planner-skip-source">
                    <strong>{{ source.label }}</strong>
                    <span>{{ source.from === source.to ? source.from : `${source.from} -> ${source.to}` }}</span>
                    <em>{{ $t('planSkipBatchCount', { n: source.count }) }}</em>
                  </div>
                </div>
                <div class="planner-skip-batches">
                  <div v-for="skipped in step.skippedSteps" :key="`${step.rowKey}-skip-${skipped.index}`" class="planner-skip-batch">
                    <strong>{{ $t('planBatchNum', { n: skipped.index }) }}</strong>
                    <span>{{ skipped.triggerRange }}</span>
                    <em>{{ tierLabel(skipped.tierPrice) }} -> {{ tierLabel(skipped.nextTierPrice) }}</em>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    <div v-if="compressedPlanSteps.length > displayedPlanSteps.length" class="planner-more">
      {{ $t('planMoreRows', { n: compressedPlanSteps.length - displayedPlanSteps.length }) }}
    </div>
    <div
      v-if="selectedPlan.remainingOpportunities > 0 && selectedPlan.remainingOpportunityGroups?.length"
      class="planner-remaining"
    >
      <div class="planner-remaining-head">
        <strong>{{ $t('planRemainingTitle', { n: selectedPlan.remainingOpportunities }) }}</strong>
        <span>{{ $t('planRemainingDesc') }}</span>
      </div>
      <div class="planner-remaining-list">
        <div
          v-for="group in selectedPlan.remainingOpportunityGroups"
          :key="`${selectedPlan.id}-remaining-${group.sourceId}-${group.from}-${group.to}`"
          class="planner-remaining-item"
        >
          <strong>{{ group.label }}</strong>
          <span>{{ remainingOpportunityRange(group) }}</span>
          <em>{{ $t('planRemainingCount', { n: group.count }) }}</em>
        </div>
      </div>
      <div class="planner-remaining-note">
        {{ $t('planRemainingRangeHint') }}
      </div>
    </div>
  </div>

  <div v-else-if="planOptions.length" class="planner-empty">{{ $t('planEmptyRange') }}</div>
  <div v-if="plannerError" class="planner-error">
    {{ plannerError }}
  </div>
  <div v-else class="planner-empty">{{ $t('planEmptyInit') }}</div>
</template>

<script setup>
defineProps({
  selectedPlan: { type: Object, default: null },
  planOptions: { type: Array, required: true },
  displayedPlanSteps: { type: Array, required: true },
  compressedPlanSteps: { type: Array, required: true },
  plannerError: { type: [String, null], default: null },
  baseUrl: { type: String, required: true },
  tierLabel: { type: Function, required: true },
  formatPrice: { type: Function, required: true },
  translatePackName: { type: Function, required: true },
  itemDisplayName: { type: Function, required: true },
  plannerTriggerCount: { type: Function, required: true },
  plannerPurchaseCount: { type: Function, required: true },
  plannerTriggeredPacks: { type: Function, required: true },
  getRechargeProgress: { type: Function, required: true },
  getRechargeResetText: { type: Function, required: true },
  getTopUpStatusText: { type: Function, required: true },
  getTopUpStatusClass: { type: Function, required: true },
  remainingOpportunityRange: { type: Function, required: true },
  isPlannerStepExpandable: { type: Function, required: true },
  isPlannerStepExpanded: { type: Function, required: true },
})

defineEmits(['toggleStep'])
</script>

<style scoped>
.planner-table-wrap {
  margin-top: 12px;
  overflow-x: auto;
}

.planner-table {
  min-width: 920px;
}

.planner-table th,
.planner-table tbody tr:not(.planner-detail-row) td {
  white-space: nowrap;
}

.planner-range-cell {
  max-width: 280px;
  min-width: 150px;
  white-space: normal !important;
  word-break: break-word;
  text-align: left;
  font-size: var(--fs-xs);
  line-height: 1.4;
}

.planner-clickable-row {
  cursor: pointer;
}

.planner-clickable-row:hover td {
  background: rgba(255,255,255,0.035);
}

.planner-simple-metric {
  color: var(--gold);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
}

.planner-cell-sub {
  display: block;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  margin-top: 2px;
}

.planner-status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  padding: 2px 6px;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  white-space: nowrap;
  background: rgba(255,255,255,0.025);
}

.planner-status-chip.active {
  border-color: rgba(212,175,55,0.45);
  color: var(--gold);
  background: rgba(212,175,55,0.08);
}

.planner-status-chip.pending {
  border-color: rgba(212,175,55,0.28);
  color: var(--text-secondary);
  background: rgba(212,175,55,0.04);
}

.planner-reset-chip {
  margin-top: 3px;
}

.planner-recharge-cell {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  vertical-align: middle;
}

.planner-recharge-val {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--text-secondary);
}

.planner-value-extra {
  display: block;
  margin-top: 2px;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  white-space: nowrap;
}

.planner-detail-row td {
  background: rgba(255,255,255,0.025);
  padding: 10px !important;
}

.planner-pack-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.planner-detail-title {
  color: var(--text-primary);
  font-size: var(--fs-sm);
  font-weight: 700;
  margin-bottom: 8px;
}

.planner-trigger-details {
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  padding: 10px;
  background: rgba(255,255,255,0.025);
}

.planner-trigger-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 6px;
}

.planner-trigger-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  padding: 7px 9px;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  background: rgba(0,0,0,0.08);
}

.planner-trigger-item.purchased {
  border-color: rgba(212,175,55,0.45);
  background: rgba(212,175,55,0.08);
}

.planner-trigger-item.skipped {
  border-color: rgba(255,255,255,0.11);
  background: rgba(255,255,255,0.025);
}

.planner-trigger-item.unavailable {
  opacity: 0.72;
}

.planner-trigger-item strong {
  color: var(--text-secondary);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.planner-trigger-item span {
  color: var(--gold);
  flex: 0 0 auto;
  white-space: nowrap;
}

.planner-pack-detail {
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  padding: 10px;
  background: rgba(255,255,255,0.03);
}

.planner-pack-detail.purchased {
  border-color: rgba(212,175,55,0.45);
  background: rgba(212,175,55,0.055);
}

.planner-pack-detail.skipped {
  border-color: rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.08);
}

.planner-pack-detail-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  margin-bottom: 8px;
}

.planner-pack-detail-head strong {
  color: var(--text-primary);
  font-size: var(--fs-sm);
}

.planner-pack-state {
  border: 1px solid rgba(212,175,55,0.36);
  border-radius: 999px;
  padding: 2px 7px;
  color: var(--gold);
  font-size: var(--fs-xs);
  line-height: 1.2;
}

.planner-pack-detail.skipped .planner-pack-state {
  border-color: rgba(255,255,255,0.14);
  color: var(--text-muted);
}

.planner-recharge-note {
  color: var(--text-muted);
  font-size: var(--fs-xs);
  line-height: 1.45;
  margin: -2px 0 8px;
}

.planner-skip-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.planner-skip-summary,
.planner-skip-source,
.planner-skip-batch {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  line-height: 1.45;
}

.planner-skip-summary span {
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  padding: 4px 8px;
  background: rgba(255,255,255,0.03);
}

.planner-skip-sources,
.planner-skip-batches {
  display: grid;
  gap: 6px;
}

.planner-skip-source,
.planner-skip-batch {
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  padding: 7px 9px;
  background: rgba(255,255,255,0.025);
}

.planner-skip-source strong,
.planner-skip-batch strong {
  color: var(--text-primary);
  min-width: 88px;
}

.planner-skip-source span,
.planner-skip-batch span {
  color: var(--text-secondary);
  flex: 1 1 220px;
}

.planner-skip-source em,
.planner-skip-batch em {
  color: var(--gold);
  font-style: normal;
  white-space: nowrap;
}

.planner-remaining {
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  margin-top: 12px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.025);
  display: grid;
  gap: 10px;
}

.planner-remaining-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 14px;
}

.planner-remaining-head strong {
  color: var(--gold);
  font-size: var(--fs-md);
}

.planner-remaining-head span,
.planner-remaining-note {
  color: var(--text-muted);
  font-size: var(--fs-xs);
  line-height: 1.45;
}

.planner-remaining-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px;
}

.planner-remaining-item {
  display: grid;
  grid-template-columns: minmax(72px, max-content) minmax(0, 1fr) max-content;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  padding: 7px 9px;
  background: rgba(255,255,255,0.025);
  color: var(--text-secondary);
  font-size: var(--fs-xs);
}

.planner-remaining-item strong {
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.planner-remaining-item span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.planner-remaining-item em {
  color: var(--gold);
  font-style: normal;
  white-space: nowrap;
}

.planner-pack-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.planner-pack-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 260px;
  border-radius: var(--r-sm);
  padding: 4px 8px;
  background: rgba(255,255,255,0.035);
  color: var(--text-primary);
  font-size: var(--fs-xs);
}

.planner-pack-item img {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
}

.planner-pack-item span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.planner-pack-item b {
  flex: 0 0 auto;
  font-family: var(--font-mono);
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

.planner-more,
.planner-empty {
  color: var(--text-muted);
  font-size: var(--fs-sm);
  margin-top: 8px;
  text-align: center;
}

.planner-error {
  color: #ff5555;
  padding: 20px;
  white-space: pre-wrap;
  font-family: monospace;
  background: rgba(255,0,0,0.1);
  border-radius: 8px;
  margin-top: 20px;
  font-size: 12px;
}
</style>
