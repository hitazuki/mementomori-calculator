<template>
  <div class="flex-col gap-12 item-score-panel">
    <div class="card flex-col item-score-card" :style="{ flex: showScores ? 1 : 'none' }">
      <div class="card-title item-score-title" @click="$emit('update:showScores', !showScores)">
        <span class="item-score-heading">📊 {{ $t('packScoreTitle') }}</span>
        <button
          class="btn btn-ghost btn-sm item-score-reset"
          type="button"
          @click.stop="$emit('resetScores')"
        >
          {{ $t('exportResetDefault') }}
        </button>
        <span class="item-score-toggle">{{ showScores ? '▼' : '▶' }}</span>
      </div>
      <div v-show="showScores" class="item-score-desc">
        {{ $t(descKey) }}
      </div>
      <div v-show="showScores" class="flex-col gap-8 item-score-list">
        <div v-for="row in editableScoreRows" :key="row.key" class="item-score-row">
          <img
            :src="`${baseUrl}images/items/Item_${String(row.item.iconId).padStart(4,'0')}.png`"
            class="item-score-icon"
            @error="e => e.target.style.display='none'"
          />
          <span class="item-score-name" :title="itemDisplayName(row.item)">{{ itemDisplayName(row.item) }}</span>
          <input
            v-if="!isLocked(row.key)"
            class="form-input item-score-input"
            type="number"
            v-model.number="row.item.score"
            min="0"
            step="1"
          />
          <span v-else class="num-value item-score-locked">{{ formatScoreForPanel(row.item.score) }}</span>
          <span v-if="row.item.batch > 1" class="item-score-batch">/ {{ row.item.batch.toLocaleString() }}</span>
        </div>
        <div class="item-score-derived-divider">{{ $t('scoreReadonlyTitle') }}</div>
        <div v-for="row in readonlyScoreRows" :key="row.key" class="item-score-derived-block">
          <div
            class="item-score-derived-row"
            :class="{ 'item-score-derived-row-clickable': hasScoreDetails(row) }"
            :role="hasScoreDetails(row) ? 'button' : undefined"
            :tabindex="hasScoreDetails(row) ? 0 : undefined"
            @click="$emit('toggleScoreDetail', row)"
            @keydown.enter.prevent="$emit('toggleScoreDetail', row)"
            @keydown.space.prevent="$emit('toggleScoreDetail', row)"
          >
            <img
              :src="`${baseUrl}images/items/Item_${String(row.iconId).padStart(4,'0')}.png`"
              class="item-score-icon"
              @error="e => e.target.style.display='none'"
            />
            <span class="item-score-derived-name" :title="itemDisplayName(row)">{{ itemDisplayName(row) }}</span>
            <span class="num-value item-score-derived-value">{{ formatScoreForPanel(row.score) }}</span>
            <small>{{ scoreReasonText(row) }}</small>
            <span v-if="hasScoreDetails(row)" class="item-score-detail-toggle">{{ isScoreDetailExpanded(row) ? '▲' : '▼' }}</span>
          </div>
          <div v-if="isScoreDetailExpanded(row)" class="item-score-detail-list">
            <div v-for="(detail, idx) in row.detailRows" :key="idx" class="item-score-detail-row">
              <span class="item-score-detail-name" :title="scoreDetailName(detail)">{{ scoreDetailLabel(detail) }}</span>
              <span class="item-score-detail-value">{{ formatScoreForPanel(detail.value) }}</span>
              <span class="item-score-detail-share">{{ formatScoreShare(detail.share) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  showScores: { type: Boolean, required: true },
  descKey: { type: String, default: 'packScoreDesc' },
  editableScoreRows: { type: Array, required: true },
  readonlyScoreRows: { type: Array, required: true },
  baseUrl: { type: String, required: true },
  itemDisplayName: { type: Function, required: true },
  formatScoreForPanel: { type: Function, required: true },
  scoreReasonText: { type: Function, required: true },
  scoreDetailName: { type: Function, required: true },
  scoreDetailLabel: { type: Function, required: true },
  formatScoreShare: { type: Function, required: true },
  hasScoreDetails: { type: Function, required: true },
  isScoreDetailExpanded: { type: Function, required: true },
  isLocked: { type: Function, required: true },
})

defineEmits(['update:showScores', 'toggleScoreDetail', 'resetScores'])
</script>

<style scoped>
.item-score-card {
  min-height: 0;
  display: flex;
  padding-bottom: 12px;
}

.item-score-title {
  cursor: pointer;
  user-select: none;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-score-heading {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-score-reset {
  margin-left: auto;
  min-height: 28px;
  padding: 0 8px;
  flex-shrink: 0;
}

.item-score-toggle {
  font-size: var(--fs-xs);
  color: var(--gold);
  flex-shrink: 0;
}

.item-score-desc {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin-top: 8px;
  line-height: 1.4;
}

.item-score-list {
  overflow-y: auto;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-subtle);
  padding-right: 4px;
}

.item-score-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-sm);
}

.item-score-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.item-score-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-score-input {
  width: 64px;
  padding: 2px 6px;
  font-size: var(--fs-sm);
  min-height: var(--control-h-sm);
  text-align: right;
}

.item-score-locked {
  width: 64px;
  text-align: right;
  font-size: var(--fs-sm);
  color: var(--gold);
}

.item-score-batch {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  min-width: 50px;
  text-align: left;
}

.item-score-derived-divider {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-subtle);
  color: var(--gold);
  font-size: var(--fs-xs);
}

.item-score-derived-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 64px 16px;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-sm);
}

.item-score-derived-row-clickable {
  cursor: pointer;
  border-radius: 6px;
}

.item-score-derived-row-clickable:hover {
  background: rgba(255, 255, 255, 0.04);
}

.item-score-derived-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-score-derived-value {
  text-align: right;
  color: var(--gold);
  font-size: var(--fs-sm);
}

.item-score-derived-row small {
  grid-column: 2 / 4;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  line-height: 1.25;
}

.item-score-detail-toggle {
  grid-column: 4;
  grid-row: 1 / span 2;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  text-align: right;
}

.item-score-detail-list {
  margin: 4px 0 4px 32px;
  padding: 6px 0 6px 8px;
  border-left: 1px solid var(--border-subtle);
  display: grid;
  gap: 4px;
}

.item-score-detail-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 58px 44px;
  gap: 6px;
  align-items: center;
  font-size: var(--fs-xs);
}

.item-score-detail-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-muted);
}

.item-score-detail-value {
  text-align: right;
  color: var(--text-primary);
}

.item-score-detail-share {
  text-align: right;
  color: var(--gold);
}
</style>
