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
    <!-- Left Panel: Scores -->
    <div class="flex-col gap-12 pack-score-panel">

      <!-- Scores Panel -->
      <div class="card flex-col" :style="{ flex: showScores ? 1 : 'none' }" style="min-height:0; display:flex; padding-bottom:12px;">
        <div class="card-title" @click="showScores = !showScores" style="cursor:pointer;user-select:none;margin-bottom:0;display:flex;align-items:center;">
          📊 {{ $t('packScoreTitle') }}
          <span style="margin-left:auto;font-size:var(--fs-xs);color:var(--gold);">{{ showScores ? '▼' : '▶' }}</span>
        </div>
        <div v-show="showScores" style="font-size: var(--fs-sm); color: var(--text-muted); margin-top: 8px; line-height: 1.4;">
          {{ $t('packScoreDesc') }}
        </div>
        <div v-show="showScores" class="flex-col gap-8" style="overflow-y:auto; margin-top:12px; padding-top:12px; border-top:1px dashed var(--border-subtle); padding-right:4px;">
          <div v-for="row in editableScoreRows" :key="row.key" style="display:flex;align-items:center;gap:8px;font-size:var(--fs-sm);">
            <img
              :src="`${baseUrl}images/items/Item_${String(row.item.iconId).padStart(4,'0')}.png`"
              style="width:24px;height:24px;flex-shrink:0;"
              @error="e => e.target.style.display='none'"
            />
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="itemDisplayName(row.item)">{{ itemDisplayName(row.item) }}</span>
            <input
              v-if="!isLocked(row.key)"
              class="form-input"
              type="number"
              v-model.number="editableScores[row.key].score"
              style="width:64px;padding:2px 6px;font-size:var(--fs-sm);min-height:var(--control-h-sm);text-align:right;"
              min="0"
              step="1"
            />
            <span v-else class="num-value" style="width:64px;text-align:right;font-size:var(--fs-sm);color:var(--gold);">{{ formatScoreForPanel(row.item.score) }}</span>
            <span v-if="row.item.batch > 1" style="font-size:var(--fs-xs);color:var(--text-muted);min-width:50px;text-align:left;">/ {{ row.item.batch.toLocaleString() }}</span>
          </div>
          <div class="score-derived-divider">{{ t('scoreReadonlyTitle') }}</div>
          <div v-for="row in readonlyScoreRows" :key="row.key" class="score-derived-row">
            <img
              :src="`${baseUrl}images/items/Item_${String(row.iconId).padStart(4,'0')}.png`"
              style="width:24px;height:24px;flex-shrink:0;"
              @error="e => e.target.style.display='none'"
            />
            <span class="score-derived-name" :title="itemDisplayName(row)">{{ itemDisplayName(row) }}</span>
            <span class="num-value score-derived-value">{{ formatScoreForPanel(row.score) }}</span>
            <small>{{ scoreReasonText(row) }}</small>
          </div>
        </div>
      </div>
    </div>

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

      <!-- Filters -->
      <div v-if="activePackTab === 'query'" class="card pack-filters-card" style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; padding: 10px 14px;">
        <div style="font-weight:bold; font-size:var(--fs-sm); color:var(--text-primary); display:flex; align-items:center; white-space:nowrap;">
          🔍 {{ $t('packFilterTitle') }}
        </div>
        
        <div style="display:flex; gap:4px; align-items:center;">
          <button class="btn btn-sm" :class="filter.cat==='tower'?'btn-primary':'btn-ghost'" @click="filter.cat='tower'" style="padding:4px 10px; white-space:nowrap;">{{ $t('origin_tower_unknown') }}</button>
          <button class="btn btn-sm" :class="filter.cat==='rank'?'btn-primary':'btn-ghost'" @click="filter.cat='rank'" style="padding:4px 10px; white-space:nowrap;">{{ $t('origin_rank') }}</button>
          <button class="btn btn-sm" :class="filter.cat==='quest'?'btn-primary':'btn-ghost'" @click="filter.cat='quest'" style="padding:4px 10px; white-space:nowrap;">{{ $t('origin_quest') }}</button>
        </div>

        <div v-if="filter.cat==='tower'" style="display:flex; align-items:center; gap:6px;">
          <select class="form-select" v-model="filter.tower" style="min-width:110px; padding:4px 28px 4px 8px; font-size:var(--fs-sm); min-height:var(--control-h-sm);">
            <option v-for="t in towerOptions" :key="t" :value="t">{{ towerName(t) }}</option>
          </select>
        </div>

        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:var(--fs-sm); color:var(--text-muted); white-space:nowrap;">{{ $t('packFilterPrice') }}</span>
          <select class="form-select" v-model="filter.price" style="min-width:80px; padding:4px 28px 4px 8px; font-size:var(--fs-sm); min-height:var(--control-h-sm);">
            <option :value="0">-- {{ $t('ui_all') }} --</option>
            <option v-for="p in priceOptions" :key="p" :value="p">{{ formatPrice(p) }}</option>
          </select>
        </div>

        <div style="margin-left:auto; font-size:var(--fs-sm); color:var(--text-muted); white-space:nowrap;">
          {{ $t('packResultCount', { n: filteredPacks.length }) }}
        </div>

        <div class="mobile-pack-sort">
          <select class="form-select" v-model="sortState.by">
            <option value="trigger">{{ $t('packColTrigger') }}</option>
            <option value="price">{{ $t('packColPrice') }}</option>
            <option value="ce">CE</option>
            <option value="value">{{ $t('packColValue') }}</option>
          </select>
          <button class="btn btn-ghost btn-sm" @click="sortState.asc = !sortState.asc">
            {{ sortState.asc ? '▲' : '▼' }}
          </button>
        </div>
      </div>

      <!-- Planner -->
      <div v-if="activePackTab === 'planner'" class="card planner-card">
        <div class="card-title">{{ $t('planTitle') }}</div>

        <div class="planner-controls">
          <label class="planner-field">
            <span>{{ $t('planPreferenceLevel') || '购买意愿与偏好' }}</span>
            <select class="form-select" v-model="planSettings.preferenceLevel">
              <option value="conservative">{{ preferenceOptionLabel('conservative') }}</option>
              <option value="balanced">{{ preferenceOptionLabel('balanced') }}</option>
              <option value="aggressive">{{ preferenceOptionLabel('aggressive') }}</option>
              <option value="custom">{{ preferenceOptionLabel('custom') }}</option>
            </select>
          </label>

          <label v-if="planSettings.preferenceLevel === 'custom'" class="planner-field planner-field-compact">
            <span>{{ $t('planCustomCe') || '自定义 CE' }}</span>
            <input
              class="form-input"
              type="number"
              min="0.1"
              step="0.1"
              :placeholder="formatCe(plannerPreferenceCePreview.balanced)"
              v-model.number="planSettings.customExpectedRatio"
            />
          </label>

          <label class="planner-field">
            <span>{{ $t('planCurrentTier') }}</span>
            <select class="form-select" v-model.number="planSettings.currentPrice">
              <option v-for="p in planPriceOptions" :key="p" :value="p">
                {{ tierLabel(p) }}
              </option>
            </select>
          </label>

          <label class="planner-field">
            <span>{{ $t('planTopUpMode') || '补累充模式' }}</span>
            <select class="form-select" v-model="planSettings.topUpMode">
              <option value="auto">{{ $t('planTopUpAuto') || '自动价值判断' }}</option>
              <option value="off">{{ $t('planTopUpOff') || '关闭' }}</option>
            </select>
          </label>

          <label class="planner-field">
            <span>{{ $t('planRechargeMode') || '规划模式' }}</span>
            <select class="form-select" v-model="planSettings.rechargePlanningMode">
              <option value="longTerm">{{ $t('planRechargeModeLongTerm') || '长期规划' }}</option>
              <option value="rush">{{ $t('planRechargeModeRush') || '赶进度' }}</option>
            </select>
          </label>


        </div>

        <div class="planner-derived-note" v-html="$t('planTopUpNote')">
        </div>
        <div class="planner-derived-note planner-ce-note">
          <span class="planner-ce-chip">
            {{ $t('planCeBaselineLabel') }}
            <b>{{ formatCe(plannerPreferenceCePreview.baseline) }}</b>
          </span>
          <span class="planner-ce-chip active">
            {{ $t('planCeTargetLabel') }}
            <b>{{ formatCe(plannerPreferenceCePreview.current) }}</b>
          </span>
          <span>{{ $t('planCeBaselineMeaning') }}</span>
        </div>

        <div class="planner-lane-head">
          <span>{{ $t('planLaneSource') }}</span>
          <span>{{ $t('planLaneCurrent') }}</span>
          <span>{{ $t('planLaneTarget') }}</span>
          <span>{{ $t('planLaneLimit') }}</span>
        </div>

        <div class="planner-lanes">
          <label
            v-for="lane in planLanes"
            :key="lane.id"
            class="planner-lane"
            :class="{ disabled: !lane.enabled }"
          >
            <span class="planner-lane-name">
              <input type="checkbox" v-model="lane.enabled" />
              {{ planLaneName(lane) }}
            </span>
            <input
              v-if="lane.cat === 'quest'"
              class="form-input"
              type="text"
              inputmode="numeric"
              placeholder="13-28 / 336"
              v-model.trim="lane.startProgress"
            />
            <input v-else class="form-input" type="number" min="0" step="1" v-model.number="lane.startProgress" />
            <input
              v-if="lane.cat === 'quest'"
              class="form-input"
              type="text"
              inputmode="numeric"
              :placeholder="$t('planPlaceholderQuest')"
              v-model.trim="lane.endProgress"
            />
            <input v-else class="form-input" type="number" min="0" step="1" v-model.number="lane.endProgress" />
            <input
              v-if="isAttributeTowerLane(lane)"
              class="form-input"
              type="number"
              value="1"
              disabled
              :title="$t('planAttrTowerTitle')"
            />
            <input v-else class="form-input" type="number" min="1" max="50" step="1" v-model.number="lane.batchSize" />
          </label>
        </div>

        <div class="planner-derived-note">
          {{ $t('planNote1') }}
        </div>

        <div class="planner-derived-note">
          {{ $t('planNote2') }}
        </div>

        <div class="planner-derived-note">
          {{ $t('planNote3') }}
        </div>

        <div class="planner-doc-links">
          <a
            href="https://github.com/hitazuki/mementomori-calculator/blob/main/doc/items/UltraSalePack/game-rules.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $t('planDocRules') }}
          </a>
          <span class="planner-doc-sep">|</span>
          <a
            href="https://github.com/hitazuki/mementomori-calculator/blob/main/doc/items/UltraSalePack/implementation-design.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $t('planDocDesign') }}
          </a>
          <span class="planner-doc-sep">|</span>
          <a
            href="https://github.com/hitazuki/mementomori-calculator/blob/main/doc/items/UltraSalePack/path-planning-visual.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $t('planDocFlowchart') }}
          </a>
        </div>

        <div class="planner-actions">
          <button class="btn btn-primary btn-sm" type="button" :disabled="isPlanning" @click="calculatePlanner">
            {{ isPlanning ? $t('planStatusCalculating') : $t('planBtnCalc') }}
          </button>
          <span class="planner-calc-status">
            {{ plannerStatusText }}
          </span>
        </div>

        <div v-if="planOptions.length" class="planner-mode-tabs" role="tablist" :aria-label="$t('planTabPlanner')">
          <button
            v-for="option in planOptions"
            :key="option.id"
            class="btn btn-sm"
            :class="activePlanId === option.id ? 'btn-primary' : 'btn-ghost'"
            type="button"
            role="tab"
            :aria-selected="activePlanId === option.id"
            @click="setActivePlan(option.id)"
          >
            {{ option.labelKey ? $t(option.labelKey) : option.label }}
          </button>
        </div>

        <div v-if="planOptions.length" class="planner-mode-desc">
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
                  @click="togglePlannerStep(step)"
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
                        style="margin-top: 3px;"
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
        <div v-if="plannerError" class="planner-error" style="color: #ff5555; padding: 20px; white-space: pre-wrap; font-family: monospace; background: rgba(255,0,0,0.1); border-radius: 8px; margin-top: 20px; font-size: 12px">
          {{ plannerError }}
        </div>
        <div v-else class="planner-empty">{{ $t('planEmptyInit') }}</div>
      </div>

      <div v-if="activePackTab === 'query'" class="card desktop-pack-table" style="overflow-x:auto;padding:8px;">
        <table class="data-table">
          <thead>
            <tr>
              <th @click="toggleSort('trigger')" style="cursor:pointer;">{{ $t('packColTrigger') }} {{ sortIcon('trigger') }}</th>
              <th @click="toggleSort('price')" style="cursor:pointer;">{{ $t('packColPrice') }} {{ sortIcon('price') }}</th>
              <th @click="toggleSort('ce')" style="cursor:pointer;">CE {{ sortIcon('ce') }}</th>
              <th @click="toggleSort('value')" style="cursor:pointer;">{{ $t('packColValue') }} {{ sortIcon('value') }}</th>
              <th>{{ $t('packColItems') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(p, i) in sortedPacks" :key="i">
              <tr @click="toggleExpand(i)" style="cursor:pointer;" :class="{ 'row-expanded': expanded.has(i) }">
                <td style="white-space:nowrap;">
                  <span style="font-size:var(--fs-xs);margin-right:6px;">{{ expanded.has(i) ? '▼' : '▶' }}</span>
                  {{ p.trigger }}
                </td>
                <td style="white-space:nowrap;">{{ formatPrice(p.price) }}</td>
                <td :style="{color: p.ce >= 1 ? '#2ecc71' : '#e74c3c', fontWeight:'bold'}">{{ p.ce.toFixed(1) }}</td>
                <td style="white-space:nowrap;">{{ p.originalValue.toLocaleString() }} <span style="font-size:var(--fs-xs);color:var(--gold);">+ {{ p.rechargeValue.toLocaleString() }}</span></td>
                <td>
                  <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;">
                    <div
                      v-for="(item, j) in p.items"
                      :key="j"
                      :title="itemDisplayName(item)"
                      style="display:flex;align-items:center;gap:4px;font-size:var(--fs-sm);"
                    >
                      <img
                        :src="`${baseUrl}images/items/Item_${String(item.iconId).padStart(4,'0')}.png`"
                        style="width:24px;height:24px;"
                        @error="e => e.target.style.display='none'"
                      />
                      <span class="pack-item-qty"><span class="pack-item-qty-mark">×</span>{{ item.qty }}</span>
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-if="expanded.has(i)" style="background:rgba(255,255,255,0.02);">
                <td :colspan="5" style="padding:6px 16px;">
                  <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:var(--fs-sm);align-items:flex-start;">
                    <div
                      v-for="(item, j) in p.items"
                      :key="j"
                      style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.03);padding:4px 10px;border-radius:4px;"
                    >
                      <img
                        :src="`${baseUrl}images/items/Item_${String(item.iconId).padStart(4,'0')}.png`"
                        style="width:24px;height:24px;"
                        @error="e => e.target.style.display='none'"
                      />
                      <span style="min-width:60px;">{{ itemDisplayName(item) }}</span>
                      <span class="pack-item-qty pack-item-qty-muted"><span class="pack-item-qty-mark">×</span>{{ item.qty }}</span>
                      <span style="color:var(--gold);font-weight:bold;">{{ Math.round(item.value).toLocaleString() }}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div v-if="activePackTab === 'query'" class="mobile-pack-list">
        <article
          v-for="(p, i) in sortedPacks"
          :key="`mobile-${i}`"
          class="mobile-pack-card"
          @click="toggleExpand(i)"
        >
          <div class="mobile-pack-head">
            <div class="mobile-pack-title">
              <span>{{ p.trigger }}</span>
            </div>
            <div class="mobile-pack-ce" :style="{ color: p.ce >= 1 ? '#2ecc71' : '#e74c3c' }">
              CE {{ p.ce.toFixed(1) }}
            </div>
          </div>

          <div class="mobile-pack-meta">
            <span>{{ $t('packColPrice') }} <b>{{ formatPrice(p.price) }}</b></span>
            <span>{{ $t('packColValue') }} <b>{{ p.originalValue.toLocaleString() }}</b> <em>+ {{ p.rechargeValue.toLocaleString() }}</em></span>
          </div>

          <div class="mobile-pack-items">
            <div
              v-for="(item, j) in p.items"
              :key="j"
              class="mobile-pack-item"
              :title="itemDisplayName(item)"
            >
              <img
                :src="`${baseUrl}images/items/Item_${String(item.iconId).padStart(4,'0')}.png`"
                @error="e => e.target.style.display='none'"
              />
              <span class="pack-item-qty"><span class="pack-item-qty-mark">×</span>{{ item.qty }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

const showScores = ref(true)

import { calculatePackCE, normalizeScores } from '../engine/packCalc.js'
import { buildDerivedScoreState } from '../engine/derivedScores.js'
import { buildUltraSalePlanOptions, compressUltraSalePlanSteps, paidDiamondsForPrice, preferenceCeForLevel } from '../engine/ultraSalePlanner.js'
import { editableScores } from '../store/itemScores.js'

const { t, locale } = useI18n()
const baseUrl = import.meta.env.BASE_URL || '/'
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

// Map locale to itemScores name field
const localeNameMap = { 'zh-CN': 'nameZh', 'zh-TW': 'nameTw', 'en': 'nameEn', 'ja': 'nameJa', 'ko': 'nameKo' }
function itemDisplayName(s) {
  const field = localeNameMap[locale.value] || 'nameZh'
  return s[field] || s.name || ''
}

// Tower names are now stored as i18n keys directly
function towerName(key) {
  return key ? t(key) : ''
}

function formatPrice(p) {
  return '¥' + p.toLocaleString()
}

// --- Scores (shared) ---
// editableScores is now imported from store/itemScores.js
const baseScores = computed(() => normalizeScores(editableScores))
const derivedScoreState = computed(() => buildDerivedScoreState(baseScores.value))
const normalizedScores = computed(() => derivedScoreState.value.scores)
const readonlyScoreRows = computed(() => derivedScoreState.value.readonlyRows)
const editableScoreRows = computed(() => Object.entries(editableScores)
  .filter(([key, score]) => score.isBase && !isReadonlyScore(key))
  .map(([key, item]) => ({ key, item })))

// --- Filters ---
const filter = reactive({
  cat: 'tower',
  tower: 'origin_tower_infinite',
  price: 11800
})

const towerOptions = computed(() => {
  const s = new Set()
  packsRaw.value.forEach(p => { if (p.cat === 'tower' && p.tower) s.add(p.tower) })
  return [...s].sort()
})

const priceOptions = computed(() => {
  const s = new Set()
  packsRaw.value.forEach(p => s.add(p.price))
  return [...s].sort((a, b) => b - a)
})

const planPriceOptions = computed(() => [...priceOptions.value].sort((a, b) => a - b))

// --- Sort ---
const sortState = reactive({ by: 'trigger', asc: true })
function toggleSort(field) {
  if (sortState.by === field) sortState.asc = !sortState.asc
  else { sortState.by = field; sortState.asc = true }
}
function sortIcon(field) {
  if (sortState.by !== field) return '↕'
  return sortState.asc ? '▲' : '▼'
}

// --- Calculation ---
const filteredPacks = computed(() => {
  let result = packsRaw.value
  if (filter.cat) result = result.filter(p => p.cat === filter.cat)
  if (filter.cat === 'tower' && filter.tower) result = result.filter(p => p.tower === filter.tower)
  if (filter.price > 0) result = result.filter(p => p.price === filter.price)

  return calculatePackCE(result, normalizedScores.value)
})

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

const attributeTowerIds = new Set([
  'origin_tower_blue',
  'origin_tower_red',
  'origin_tower_green',
  'origin_tower_yellow',
])

function isAttributeTowerLane(lane) {
  return lane.cat === 'tower' && attributeTowerIds.has(lane.tower)
}

function planLaneName(lane) {
  return lane.labelKey ? t(lane.labelKey) : lane.id
}

function tierLabel(price) {
  if (!Number.isFinite(Number(price))) return '-'
  return t('planTierDiamond', { n: paidDiamondsForPrice(price) })
}

function translatePackName(name) {
  if (!name) return ''
  const m1 = name.match(/^钻石组合包 (\d+)( \(\w+\d+\))?( ×\d+)?$/)
  if (m1) return t('planPackDiamond', { n: m1[1] }) + (m1[2] || '') + (m1[3] || '')
  const m2 = name.match(/^钻石组合包 (\d+) \(首次双倍\)( ×\d+)?$/)
  if (m2) return t('planPackDiamondFirst', { n: m2[1] }) + (m2[2] || '')
  return name
}

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

function formatCe(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toFixed(1) : '-'
}

function preferenceOptionLabel(level) {
  return `${t(`planPref${level[0].toUpperCase()}${level.slice(1)}`)} (CE ${formatCe(plannerPreferenceCePreview.value[level])})`
}

function scoreOf(itemKey, fallback = 1) {
  const score = normalizedScores.value[itemKey]?.score
  return Number.isFinite(Number(score)) ? Number(score) : fallback
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

const sortedPacks = computed(() => {
  const result = [...filteredPacks.value]
  const { by, asc } = sortState
  result.sort((a, b) => {
    let va, vb
    if (by === 'trigger') { va = a.sortKey; vb = b.sortKey }
    else if (by === 'price') { va = a.price; vb = b.price }
    else if (by === 'ce') { va = a.ce; vb = b.ce }
    else if (by === 'value') { va = a.value; vb = b.value }
    else { va = a.cat + a.tower; vb = b.cat + b.tower }
    return asc ? va - vb : vb - va
  })
  return result
})

const expanded = reactive(new Set())
function toggleExpand(i) {
  if (expanded.has(i)) expanded.delete(i)
  else expanded.add(i)
}

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

const LOCKED_SCORES = { '[2,1]': true }
function isLocked(key) { return !!LOCKED_SCORES[key] }
function isReadonlyScore(key) {
  return key === '[1,1]' || key === '[13,1]'
}
function formatScoreForPanel(value) {
  const numeric = Number(value) || 0
  if (Math.abs(numeric) > 0 && Math.abs(numeric) < 10) return numeric.toFixed(2)
  return Math.round(numeric).toLocaleString()
}
function scoreReasonText(row) {
  return row.reasonKey ? t(row.reasonKey, row.reasonParams || {}) : row.reason
}

function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(Math.round(n))
}
</script>

<style scoped>
:deep(.data-table td) {
  text-align: center;
  vertical-align: middle;
}
:deep(.data-table th) {
  text-align: center;
}

.score-derived-divider {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-subtle);
  color: var(--gold);
  font-size: var(--fs-xs);
}

.score-derived-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 64px;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-sm);
}

.score-derived-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-derived-value {
  text-align: right;
  color: var(--gold);
  font-size: var(--fs-sm);
}

.score-derived-row small {
  grid-column: 2 / -1;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  line-height: 1.25;
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

.planner-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.planner-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.planner-field span {
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.planner-field-compact {
  max-width: 160px;
}

.planner-toggle-field {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--control-h);
  color: var(--text-secondary);
  font-size: var(--fs-sm);
}

.planner-toggle-field input {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.planner-lane-head,
.planner-lane {
  display: grid;
  grid-template-columns: minmax(150px, 1.4fr) repeat(3, minmax(72px, 0.7fr));
  gap: 8px;
  align-items: center;
}

.planner-lane-head {
  color: var(--text-muted);
  font-size: var(--fs-xs);
  margin-top: 12px;
  padding: 0 8px;
}

.planner-lanes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.planner-lane {
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  padding: 8px;
  background: rgba(255,255,255,0.03);
}

.planner-lane.disabled {
  opacity: 0.58;
}

.planner-lane-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  font-size: var(--fs-sm);
  font-weight: 700;
  min-width: 0;
}

.planner-lane-name input {
  flex: 0 0 auto;
}

.planner-derived-note {
  color: var(--text-muted);
  font-size: var(--fs-xs);
  line-height: 1.45;
  margin-top: 8px;
}

.planner-ce-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  border: 1px solid rgba(199, 157, 74, 0.42);
  border-radius: var(--r-sm);
  padding: 8px 10px;
  background: rgba(199, 157, 74, 0.08);
}

.planner-ce-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.planner-ce-chip b {
  color: var(--gold);
  font-size: var(--fs-sm);
}

.planner-ce-chip.active b {
  color: var(--text-primary);
}

.planner-doc-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: var(--fs-xs);
}

.planner-doc-links a {
  color: var(--gold);
  text-decoration: none;
}

.planner-doc-links a:hover {
  text-decoration: underline;
}

.planner-doc-sep {
  color: var(--border-subtle);
  user-select: none;
}

.planner-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.planner-actions .btn {
  min-width: 132px;
}

.planner-calc-status {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

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

.planner-top-up-summary {
  border: 1px solid rgba(212,175,55,0.32);
  border-radius: var(--r-sm);
  padding: 10px;
  margin-top: 10px;
  background: rgba(212,175,55,0.055);
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

.planner-purchases {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  margin-left: 4px;
}

.planner-purchases span {
  color: var(--text-muted);
  font-size: var(--fs-xs);
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

.planner-more,
.planner-empty {
  color: var(--text-muted);
  font-size: var(--fs-sm);
  margin-top: 8px;
  text-align: center;
}

@media (max-width: 900px) {
  .planner-controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .planner-lane-head {
    display: none;
  }

  .planner-lane {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .planner-lane-name {
    grid-column: 1 / -1;
  }

  .planner-mode-tabs .btn {
    flex: 1 1 calc(50% - 6px);
  }

  .planner-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .planner-controls,
  .planner-summary {
    grid-template-columns: 1fr;
  }

  .planner-field-compact {
    max-width: none;
  }

  .pack-view-tabs {
    flex-direction: column;
  }

  .pack-view-tabs .btn {
    width: 100%;
  }

  .planner-lane {
    grid-template-columns: 1fr;
  }

  .planner-mode-tabs .btn {
    flex-basis: 100%;
  }
}
</style>
