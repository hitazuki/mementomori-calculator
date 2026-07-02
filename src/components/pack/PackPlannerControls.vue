<template>
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

  <div class="planner-derived-note" v-html="$t('planTopUpNote')"></div>
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
    <button class="btn btn-primary btn-sm" type="button" :disabled="isPlanning" @click="$emit('calculate')">
      {{ isPlanning ? $t('planStatusCalculating') : $t('planBtnCalc') }}
    </button>
    <span class="planner-calc-status">
      {{ plannerStatusText }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  planSettings: { type: Object, required: true },
  planLanes: { type: Array, required: true },
  planPriceOptions: { type: Array, required: true },
  plannerPreferenceCePreview: { type: Object, required: true },
  isPlanning: { type: Boolean, required: true },
  plannerStatusText: { type: String, required: true },
  preferenceOptionLabel: { type: Function, required: true },
  formatCe: { type: Function, required: true },
  tierLabel: { type: Function, required: true },
  isAttributeTowerLane: { type: Function, required: true },
  planLaneName: { type: Function, required: true },
})

defineEmits(['calculate'])
</script>

<style scoped>
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
}

@media (max-width: 560px) {
  .planner-controls {
    grid-template-columns: 1fr;
  }

  .planner-field-compact {
    max-width: none;
  }

  .planner-lane {
    grid-template-columns: 1fr;
  }
}
</style>
