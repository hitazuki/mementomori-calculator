<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">💰 {{ $t('navPackCalc') }}</h1>
    <p class="view-desc">
      {{ $t('packCalcDesc') }} — <span v-html="$t('packCalcSource')"></span>
    </p>
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <!-- Left Panel: Scores -->
    <div class="flex-col gap-12 pack-score-panel" style="position:sticky;top:24px;height:calc(100vh - 48px);">

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
          <div v-for="(s, key) in editableScores" :key="key" v-show="s.isBase" style="display:flex;align-items:center;gap:8px;font-size:var(--fs-sm);">
            <img
              :src="`${baseUrl}images/items/Item_${String(s.iconId).padStart(4,'0')}.png`"
              style="width:24px;height:24px;flex-shrink:0;"
              @error="e => e.target.style.display='none'"
            />
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="itemDisplayName(s)">{{ itemDisplayName(s) }}</span>
            <input
              v-if="!isLocked(key)"
              class="form-input"
              type="number"
              v-model.number="s.score"
              style="width:64px;padding:2px 6px;font-size:var(--fs-sm);min-height:var(--control-h-sm);text-align:right;"
              min="0"
              step="1"
            />
            <span v-else class="num-value" style="width:64px;text-align:right;font-size:var(--fs-sm);color:var(--gold);">1</span>
            <span v-if="s.batch > 1" style="font-size:var(--fs-xs);color:var(--text-muted);min-width:50px;text-align:left;">/ {{ s.batch.toLocaleString() }}</span>
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
          礼包查询
        </button>
        <button
          class="btn btn-sm"
          :class="activePackTab === 'planner' ? 'btn-primary' : 'btn-ghost'"
          type="button"
          @click="setActivePackTab('planner')"
        >
          购买规划
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
        <div class="card-title">购买方案规划</div>

        <div class="planner-controls">
          <label class="planner-field">
            <span>预算（日元）</span>
            <input class="form-input" type="number" min="0" step="160" v-model.number="planSettings.budget" />
          </label>

          <label class="planner-field">
            <span>当前礼包档位</span>
            <select class="form-select" v-model.number="planSettings.currentPrice">
              <option v-for="p in planPriceOptions" :key="p" :value="p">
                {{ tierLabel(p) }}
              </option>
            </select>
          </label>

          <label class="planner-field">
            <span>补累充阈值 x%</span>
            <input class="form-input" type="number" min="0" max="100" step="1" v-model.number="planSettings.topUpThreshold" />
          </label>
        </div>

        <div class="planner-derived-note">
          跨日前 gap <= 累计付费钻 × {{ planSettings.topUpThreshold || 10 }}% 时自动补包。补包不计入主预算约束。
        </div>

        <div class="planner-lane-head">
          <span>触发源</span>
          <span>当前层/等级</span>
          <span>计划推到</span>
          <span>2小时内最多触发</span>
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
              placeholder="13-28 / 336"
              v-model.trim="lane.endProgress"
            />
            <input v-else class="form-input" type="number" min="0" step="1" v-model.number="lane.endProgress" />
            <input
              v-if="isAttributeTowerLane(lane)"
              class="form-input"
              type="number"
              value="1"
              disabled
              title="属性塔触发间隔为 50 层，单批固定为 1"
            />
            <input v-else class="form-input" type="number" min="1" max="50" step="1" v-model.number="lane.batchSize" />
          </label>
        </div>

        <div class="planner-derived-note">
          当前层/等级表示已经达到的位置；计划推到表示本次规划最多推进到哪里；2小时内最多触发用于模拟卡包。预算单位为日元。全属性塔抵达由蓝塔、红塔、翠塔、黄塔四行自动推算。
        </div>

        <div class="planner-derived-note">
          乐观卡包假设：属性塔按全属性抵达与单属性触发的层级拓扑排序；属性塔触发间隔为 50 层，单批固定为 1。
        </div>

        <div class="planner-derived-note">
          每日累充按 0 点重置计算；属性塔开放与每日 10 层限制按 4 点换日，但当前乐观卡包策略不使用跨 4 点额外推塔能力。
        </div>

        <a
          class="planner-doc-link"
          href="https://github.com/hitazuki/mementomori-calculator/blob/main/doc/items/UltraSalePack/game-rules.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          查看游戏内规则文档
        </a>

        <div class="planner-actions">
          <button class="btn btn-primary btn-sm" type="button" :disabled="isPlanning" @click="calculatePlanner">
            {{ isPlanning ? '计算中...' : '计算购买方案' }}
          </button>
          <span class="planner-calc-status">
            {{ plannerStatusText }}
          </span>
        </div>

        <div v-if="planOptions.length" class="planner-mode-tabs" role="tablist" aria-label="购买方案">
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
            {{ option.label }}
          </button>
        </div>

        <div v-if="planOptions.length" class="planner-mode-desc">
          {{ selectedPlan.description }}
        </div>

        <div v-if="selectedPlan" class="planner-summary">
          <div><span>可触发</span><b>{{ selectedPlan.opportunityCount }}</b></div>
          <div><span>批次</span><b>{{ selectedPlan.batchCount }}</b></div>
          <div><span>购买</span><b>{{ selectedPlan.purchases }}</b></div>
          <div><span>补包批次</span><b>{{ selectedPlan.topUpBatchCount || selectedPlan.topUpBatches?.length || 0 }}</b></div>
          <div><span>限时花费</span><b>{{ formatPrice(selectedPlan.limitedSpentYen ?? selectedPlan.spent) }}</b></div>
          <div><span>补包开销</span><b>{{ formatPrice(selectedPlan.topUpTotalCost || 0) }}</b></div>
          <div><span>总花费</span><b>{{ formatPrice(selectedPlan.totalSpent ?? selectedPlan.spent) }}</b></div>
          <div><span>剩余</span><b>{{ formatPrice(selectedPlan.remaining) }}</b></div>
          <div><span>总价值</span><b>{{ selectedPlan.value.toLocaleString() }}</b></div>
          <div><span>累充赠钻</span><b>{{ (selectedPlan.rechargeFreeDiamonds || 0).toLocaleString() }}</b></div>
          <div><span>均 CE</span><b>{{ selectedPlan.averageCe.toFixed(1) }}</b></div>
          <div><span>末档</span><b>{{ tierLabel(selectedPlan.finalTierPrice) }}</b></div>
        </div>

        <div v-if="selectedPlan && selectedPlan.topUpBatches && selectedPlan.topUpBatches.length" class="planner-top-up-summary">
          <div class="planner-detail-title">补累充包</div>
          <div class="planner-top-up-list">
            <div v-for="batch in selectedPlan.topUpBatches" :key="`${selectedPlan.id}-top-up-batch-${batch.index}`" class="planner-top-up-item">
              <strong>第 {{ batch.index }} 批</strong>
              <span>{{ batch.packs.map(pack => pack.displayTrigger).join(' / ') }}</span>
              <span>{{ formatPrice(batch.cost) }}</span>
              <span>赠钻 +{{ batch.rechargeFreeDiamonds.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <div v-if="selectedPlan && selectedPlan.steps.length" class="planner-table-wrap">
          <table class="data-table planner-table">
            <thead>
              <tr>
                <th>批次</th>
                <th>推进范围</th>
                <th>档位</th>
                <th>触发/购买</th>
                <th>累充</th>
                <th>补包</th>
                <th>花费</th>
                <th>价值</th>
                <th>下批</th>
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
                      {{ step.skipCount > 1 ? `连续不买 ×${step.skipCount}` : '不买' }}
                    </span>
                  </td>
                  <td>
                    <span :class="step.rechargeReset ? 'planner-status-chip active' : 'planner-status-chip'">
                      {{ plannerRechargeText(step) }}
                    </span>
                  </td>
                  <td>
                    <span :class="step.topUpPacks && step.topUpPacks.length ? 'planner-status-chip active' : 'planner-status-chip'">
                      {{ step.topUpPacks && step.topUpPacks.length ? '已补' : '无' }}
                    </span>
                  </td>
                  <td>{{ formatPrice(step.cost) }}</td>
                  <td>
                    {{ step.value.toLocaleString() }}
                    <span v-if="step.rechargeValue" class="planner-value-extra">
                      (含累充 {{ step.rechargeValue.toLocaleString() }})
                    </span>
                  </td>
                  <td>{{ tierLabel(step.nextTierPrice) }}</td>
                </tr>
                <tr v-if="step.bought && isPlannerStepExpanded(step.rowKey)" class="planner-detail-row">
                  <td :colspan="9">
                    <div class="planner-pack-details">
                      <section v-if="step.opportunities && step.opportunities.length" class="planner-trigger-details">
                        <div class="planner-detail-title">本批触发范围</div>
                        <div class="planner-trigger-list">
                          <div
                            v-for="opportunity in step.opportunities"
                            :key="`${step.rowKey}-trigger-${opportunity.displayTrigger}`"
                            class="planner-trigger-item"
                            :class="{ purchased: opportunity.purchased, unavailable: !opportunity.hasPackAtTier }"
                          >
                            <strong>{{ opportunity.displayTrigger }}</strong>
                            <span v-if="opportunity.hasPackAtTier">
                              {{ opportunity.purchased ? '已购买' : '触发未买' }}
                              / CE {{ opportunity.ce.toFixed(1) }}
                            </span>
                            <span v-else>当前档位无包</span>
                          </div>
                        </div>
                        <div v-if="step.skippedOpportunities && step.skippedOpportunities.length" class="planner-recharge-note">
                          本批触发未买 {{ step.skippedOpportunities.length }} 个；因为批内至少买了 1 个，不会导致额外降档。
                        </div>
                      </section>
                      <article v-for="pack in step.purchases" :key="`${step.rowKey}-detail-${pack.displayTrigger}`" class="planner-pack-detail">
                        <div class="planner-pack-detail-head">
                          <strong>{{ pack.displayTrigger }}</strong>
                          <span>{{ formatPrice(pack.price) }}</span>
                          <span>CE {{ pack.ce.toFixed(1) }}</span>
                          <span>价值 {{ Math.round(pack.value).toLocaleString() }}</span>
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
                        <div class="planner-detail-title">本批补累充</div>
                        <div class="planner-recharge-note">
                          补包花费 {{ formatPrice(step.topUpCost) }}；累充 {{ step.topUpRechargeBeforePaid.toLocaleString() }} -> {{ step.topUpRechargeAfterPaid.toLocaleString() }} 付费钻，解锁 {{ step.topUpUnlockedRechargeTiers.join(' / ') }} 档，赠送免费钻 +{{ step.topUpRechargeFreeDiamonds.toLocaleString() }}。
                        </div>
                        <div class="planner-top-up-list">
                          <div v-for="pack in step.topUpPacks" :key="`${step.rowKey}-top-up-${pack.displayTrigger}`" class="planner-top-up-item">
                            <strong>{{ pack.displayTrigger }}</strong>
                            <span>{{ formatPrice(pack.price) }}</span>
                            <span>价值 {{ Math.round(pack.value).toLocaleString() }}</span>
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
                        <span>连续跳过 {{ step.skipCount }} 批</span>
                        <span>实际降档 {{ step.tierDropCount || 0 }} 次</span>
                        <span>{{ tierLabel(step.tierPrice) }} -> {{ tierLabel(step.nextTierPrice) }}</span>
                      </div>
                      <div v-if="step.skipSourceRanges && step.skipSourceRanges.length" class="planner-skip-sources">
                        <div v-for="source in step.skipSourceRanges" :key="`${step.rowKey}-${source.label}`" class="planner-skip-source">
                          <strong>{{ source.label }}</strong>
                          <span>{{ source.from === source.to ? source.from : `${source.from} -> ${source.to}` }}</span>
                          <em>{{ source.count }} 批</em>
                        </div>
                      </div>
                      <div class="planner-skip-batches">
                        <div v-for="skipped in step.skippedSteps" :key="`${step.rowKey}-skip-${skipped.index}`" class="planner-skip-batch">
                          <strong>第 {{ skipped.index }} 批</strong>
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
            还有 {{ compressedPlanSteps.length - displayedPlanSteps.length }} 行未显示
          </div>
        </div>

        <div v-else-if="planOptions.length" class="planner-empty">当前范围内没有可规划的限时组合包。</div>
        <div v-else class="planner-empty">调整预算与触发源后，点击“计算购买方案”。</div>
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
import { buildUltraSalePlanOptions, compressUltraSalePlanSteps, paidDiamondsForPrice } from '../engine/ultraSalePlanner.js'
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
  packsRaw.value = (await import('../constants/ultraSalePacks.json')).default
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
const normalizedScores = computed(() => normalizeScores(editableScores))

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
  budget: 118000,
  currentPrice: 160,
  topUpThreshold: 10,
})

const activePlanId = ref('bestValue')
const planOptions = shallowRef([])
const isPlanning = ref(false)
const plannerDirty = ref(true)
const plannerStatus = ref('尚未计算')

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
  return `${paidDiamondsForPrice(price)}钻`
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

function plannerRechargeText(step) {
  let paid = step.topUpPacks && step.topUpPacks.length ? step.topUpRechargeAfterPaid : step.rechargeAfterPaid
  if (step.rechargeReset || step.rechargeResetCount) {
    if (!step.bought) {
      paid = 0
    }
  }
  const formattedPaid = `${paid || 0}钻`
  
  if (step.rechargeResetCount) return `${formattedPaid} / 重置×${step.rechargeResetCount}`
  if (step.rechargeReset) return `${formattedPaid} / 重置`
  return formattedPaid
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
  if (isPlanning.value) return '正在生成方案，请稍候'
  if (plannerDirty.value && planOptions.value.length) return '参数已变更，请重新计算'
  return plannerStatus.value
})

async function calculatePlanner() {
  if (isPlanning.value) return
  isPlanning.value = true
  await new Promise(resolve => setTimeout(resolve, 0))

  try {
    const startedAt = performance.now()
    const calculatedPacks = calculatePackCE(packsRaw.value, normalizedScores.value)
    const calculatedPermanentPacks = calculatePackCE(permanentPacksRaw.value, normalizedScores.value)
    const options = buildUltraSalePlanOptions(calculatedPacks, {
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
    plannerDirty.value = false
    plannerStatus.value = `已计算，耗时 ${Math.max(1, Math.round(performance.now() - startedAt))} ms`
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
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-width: 600px;
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

.planner-doc-link {
  display: inline-flex;
  width: fit-content;
  color: var(--gold);
  font-size: var(--fs-xs);
  margin-top: 8px;
  text-decoration: none;
}

.planner-doc-link:hover {
  text-decoration: underline;
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
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
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
