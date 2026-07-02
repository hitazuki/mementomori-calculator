<template>
  <div class="flex-col gap-12 pack-score-panel">
    <div class="card flex-col score-panel-card" :style="{ flex: showScores ? 1 : 'none' }">
      <div class="card-title score-panel-title" @click="$emit('update:showScores', !showScores)">
        📊 {{ $t('packScoreTitle') }}
        <span class="score-panel-toggle">{{ showScores ? '▼' : '▶' }}</span>
      </div>
      <div v-show="showScores" class="score-panel-desc">
        {{ $t('packScoreDesc') }}
      </div>
      <div v-show="showScores" class="flex-col gap-8 score-panel-list">
        <div v-for="row in editableScoreRows" :key="row.key" class="score-edit-row">
          <img
            :src="`${baseUrl}images/items/Item_${String(row.item.iconId).padStart(4,'0')}.png`"
            class="score-item-icon"
            @error="e => e.target.style.display='none'"
          />
          <span class="score-item-name" :title="itemDisplayName(row.item)">{{ itemDisplayName(row.item) }}</span>
          <input
            v-if="!isLocked(row.key)"
            class="form-input score-edit-input"
            type="number"
            v-model.number="row.item.score"
            min="0"
            step="1"
          />
          <span v-else class="num-value score-locked-value">{{ formatScoreForPanel(row.item.score) }}</span>
          <span v-if="row.item.batch > 1" class="score-batch-size">/ {{ row.item.batch.toLocaleString() }}</span>
        </div>
        <div class="score-derived-divider">{{ $t('scoreReadonlyTitle') }}</div>
        <div v-for="row in readonlyScoreRows" :key="row.key" class="score-derived-block">
          <div
            class="score-derived-row"
            :class="{ 'score-derived-row-clickable': hasScoreDetails(row) }"
            :role="hasScoreDetails(row) ? 'button' : undefined"
            :tabindex="hasScoreDetails(row) ? 0 : undefined"
            @click="$emit('toggleScoreDetail', row)"
            @keydown.enter.prevent="$emit('toggleScoreDetail', row)"
            @keydown.space.prevent="$emit('toggleScoreDetail', row)"
          >
            <img
              :src="`${baseUrl}images/items/Item_${String(row.iconId).padStart(4,'0')}.png`"
              class="score-item-icon"
              @error="e => e.target.style.display='none'"
            />
            <span class="score-derived-name" :title="itemDisplayName(row)">{{ itemDisplayName(row) }}</span>
            <span class="num-value score-derived-value">{{ formatScoreForPanel(row.score) }}</span>
            <small>{{ scoreReasonText(row) }}</small>
            <span v-if="hasScoreDetails(row)" class="score-detail-toggle">{{ isScoreDetailExpanded(row) ? '▲' : '▼' }}</span>
          </div>
          <div v-if="isScoreDetailExpanded(row)" class="score-detail-list">
            <div v-for="(detail, idx) in row.detailRows" :key="idx" class="score-detail-row">
              <span class="score-detail-name" :title="scoreDetailName(detail)">{{ scoreDetailLabel(detail) }}</span>
              <span class="score-detail-value">{{ formatScoreForPanel(detail.value) }}</span>
              <span class="score-detail-share">{{ formatScoreShare(detail.share) }}</span>
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

defineEmits(['update:showScores', 'toggleScoreDetail'])
</script>

<style scoped>
.score-panel-card {
  min-height: 0;
  display: flex;
  padding-bottom: 12px;
}

.score-panel-title {
  cursor: pointer;
  user-select: none;
  margin-bottom: 0;
  display: flex;
  align-items: center;
}

.score-panel-toggle {
  margin-left: auto;
  font-size: var(--fs-xs);
  color: var(--gold);
}

.score-panel-desc {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin-top: 8px;
  line-height: 1.4;
}

.score-panel-list {
  overflow-y: auto;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-subtle);
  padding-right: 4px;
}

.score-edit-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-sm);
}

.score-item-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.score-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-edit-input {
  width: 64px;
  padding: 2px 6px;
  font-size: var(--fs-sm);
  min-height: var(--control-h-sm);
  text-align: right;
}

.score-locked-value {
  width: 64px;
  text-align: right;
  font-size: var(--fs-sm);
  color: var(--gold);
}

.score-batch-size {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  min-width: 50px;
  text-align: left;
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
  grid-template-columns: 24px minmax(0, 1fr) 64px 16px;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-sm);
}

.score-derived-row-clickable {
  cursor: pointer;
  border-radius: 6px;
}

.score-derived-row-clickable:hover {
  background: rgba(255, 255, 255, 0.04);
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
  grid-column: 2 / 4;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  line-height: 1.25;
}

.score-detail-toggle {
  grid-column: 4;
  grid-row: 1 / span 2;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  text-align: right;
}

.score-detail-list {
  margin: 4px 0 4px 32px;
  padding: 6px 0 6px 8px;
  border-left: 1px solid var(--border-subtle);
  display: grid;
  gap: 4px;
}

.score-detail-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 58px 44px;
  gap: 6px;
  align-items: center;
  font-size: var(--fs-xs);
}

.score-detail-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-muted);
}

.score-detail-value {
  text-align: right;
  color: var(--text-primary);
}

.score-detail-share {
  text-align: right;
  color: var(--gold);
}
</style>
