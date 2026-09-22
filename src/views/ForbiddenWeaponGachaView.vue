<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('forbiddenWeaponGachaTitle') }}</h1>
    <p class="view-desc">{{ $t('forbiddenWeaponGachaDesc') }}</p>
  </div>

  <section class="weapon-banner-control animate-fadeup">
    <div class="card weapon-banner-card">
      <div class="card-title">{{ t('weaponGachaType') }}</div>
      <div class="segmented-control">
        <button
          v-for="banner in bannerOptions"
          :key="banner.key"
          class="btn btn-sm"
          :class="selectedBanner === banner.key ? 'btn-primary' : 'btn-ghost'"
          @click="selectedBanner = banner.key"
        >
          {{ tr(banner.shortLabelKey, banner.shortLabel) }}
        </button>
      </div>
    </div>

    <div class="card gear-core-card">
      <div class="card-title gear-core-title">{{ t('gearCoreCalculatorTitle') }}</div>
      <div class="gear-level-range">
        <label class="gear-level-field">
          <span>{{ t('gearCoreCurrentLevel') }}</span>
          <input
            v-model.number="gearCurrentLevel"
            class="form-input"
            type="number"
            :min="GEAR_CORE_MIN_LEVEL"
            :max="GEAR_CORE_MAX_LEVEL"
            step="10"
            @change="normalizeGearLevels"
          >
        </label>
        <span class="gear-level-arrow">→</span>
        <label class="gear-level-field">
          <span>{{ t('gearCoreTargetLevel') }}</span>
          <input
            v-model.number="gearTargetLevel"
            class="form-input"
            type="number"
            :min="GEAR_CORE_MIN_LEVEL"
            :max="GEAR_CORE_MAX_LEVEL"
            step="10"
            @change="normalizeGearLevels"
          >
        </label>
      </div>
      <div class="gear-core-result">
        <div class="gear-core-metric">
          <span>{{ gearCoreProductLabel }}</span>
          <b>{{ gearCoreResult.products.toLocaleString() }}</b>
          <small>{{ t('gearCorePartsRequired', { count: gearCoreResult.parts.toLocaleString() }) }}</small>
        </div>
        <div class="gear-core-metric">
          <span>{{ t('gearCoreExpectedPulls') }}</span>
          <b>{{ t('gearCoreExpectedPullsValue', { count: gearCoreExpectedPulls.toLocaleString() }) }}</b>
          <small>{{ t('gearCoreExpectedPullsTarget', { count: gearCoreResult.products.toLocaleString() }) }}</small>
        </div>
      </div>
    </div>
  </section>

  <section class="weapon-layout animate-fadeup">
    <div class="weapon-main">
      <section class="weapon-summary">
        <div class="stat-box">
          <div class="stat-value">{{ fmtDiamonds(analysis.ticketValue) }}</div>
          <div class="stat-label">{{ t('weaponGachaTicketValue', { item: costItemLabel }) }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ hasFreePulls ? fmtPulls(selected.paidPulls) : fmtPercent(selected.sideRecoveryRate) }}</div>
          <div class="stat-label">{{ hasFreePulls ? t('weaponGachaPaidPulls') : t('weaponGachaSideRecovery') }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ selected.totalCoreCount > 0 ? fmtUnitDiamonds(selected.implicitCoreUnit) : '—' }}</div>
          <div class="stat-label">{{ implicitUnitLabel }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ usesExpectedCoreSummary ? fmtQty(selected.totalCoreCount) : fmtPulls(analysis.bestNode.pulls) }}</div>
          <div class="stat-label">{{ usesExpectedCoreSummary ? expectedCoreSummaryLabel : t('weaponGachaBestNode') }}</div>
        </div>
      </section>

      <WeaponGachaCharts :model="model" />
    </div>

    <aside class="weapon-side">
      <div class="card">
        <div class="card-title">{{ t('weaponGachaStrategyTitle') }}</div>
        <div class="form-group">
          <label class="form-label">
            <span>{{ t('weaponGachaForSummary') }}</span>
            <span class="value-display">{{ fmtPulls(selectedPulls) }}</span>
          </label>
          <input
            class="form-input weapon-pull-input"
            type="number"
            :min="selectedPullMin"
            step="1"
            v-model.number="selectedPulls"
            @change="normalizeSelectedPulls"
          >
        </div>
        <div class="weapon-preset-row">
          <button v-for="pull in presetPulls" :key="pull" class="btn btn-sm" :class="selectedPulls === pull ? 'btn-primary' : 'btn-ghost'" @click="selectedPulls = pull">{{ fmtPulls(pull) }}</button>
        </div>
        <div v-if="hasPeriodStrategy" class="segmented-control weapon-strategy-mode">
          <button
            v-for="mode in pullStrategyModes"
            :key="mode.key"
            class="btn btn-sm"
            :class="pullStrategyMode === mode.key ? 'btn-primary' : 'btn-ghost'"
            :aria-pressed="pullStrategyMode === mode.key"
            @click="pullStrategyMode = mode.key"
          >
            {{ t(mode.labelKey) }}
          </button>
        </div>
        <button
          v-if="isSeraphOracle"
          class="btn btn-sm weapon-baseline-toggle"
          :class="ignoreFirstTopUp3 ? 'btn-primary' : 'btn-ghost'"
          :aria-pressed="ignoreFirstTopUp3"
          :title="t('weaponGachaIgnoreFirstTopUp3Hint')"
          @click="ignoreFirstTopUp3 = !ignoreFirstTopUp3"
        >
          {{ t('weaponGachaIgnoreFirstTopUp3') }}
        </button>
      </div>

      <div class="card">
        <div class="card-title">{{ t('weaponGachaCurrentResult') }}</div>
        <div class="weapon-result-list">
          <div>
          <span>{{ t('weaponGachaTotalCost') }}</span>
            <b>{{ fmtDiamonds(selected.totalCost) }}</b>
          </div>
          <div v-if="hasFreePulls">
            <span>{{ t('weaponGachaFreePaidPulls') }}</span>
            <b>{{ analysis.cumulativeSelected.freePulls }} / {{ analysis.cumulativeSelected.paidPulls }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaSideDeduction') }}</span>
            <b>{{ fmtDiamonds(selected.sideValue) }}</b>
          </div>
          <div v-for="row in selectedCoreRows" :key="row.key">
            <span>{{ row.label }}</span>
            <b>{{ fmtQty(row.qty) }}</b>
          </div>
          <div v-for="row in selectedMilestoneRows" :key="row.key">
            <span>{{ row.label }}</span>
            <b>{{ fmtQty(row.qty) }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaCoreTotal') }}</span>
            <b>{{ fmtQty(selected.totalCoreCount) }}</b>
          </div>
        </div>
      </div>

      <div v-if="isSeraphOracle && noFreeCycle" class="card">
        <div class="card-title">{{ t('weaponGachaNoFreeCycleTitle') }}</div>
        <div class="weapon-result-list">
          <div>
            <span>{{ t('weaponGachaPullCount') }}</span>
            <b>{{ fmtPulls(noFreeCycle.pulls) }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaFreePaidPulls') }}</span>
            <b>{{ noFreeCycle.freePulls }} / {{ noFreeCycle.paidPulls }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaTotalCost') }}</span>
            <b>{{ fmtDiamonds(noFreeCycle.totalCost) }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaSideDeduction') }}</span>
            <b>{{ fmtDiamonds(noFreeCycle.sideValue) }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaExpectedRelic') }}</span>
            <b>{{ fmtQty(noFreeCycle.totalCoreCount) }}</b>
          </div>
          <div>
            <span>{{ t('weaponGachaRelicValue') }}</span>
            <b>{{ fmtUnitDiamonds(noFreeCycle.implicitCoreUnit) }}</b>
          </div>
        </div>
      </div>

      <div class="card">
        <button class="btn btn-ghost weapon-formula-toggle" @click="showFormula = !showFormula">
          {{ showFormula ? t('weaponGachaHideFormula') : t('weaponGachaShowFormula') }}
        </button>
        <div v-show="showFormula" class="weapon-formula">
          <template v-if="isWitchSecret">
            <p>{{ t('weaponGachaWitchFormulaWeekly') }}</p>
            <p>{{ t('weaponGachaWitchFormulaGuarantee') }}</p>
            <p>{{ t('weaponGachaWitchFormulaValue') }}</p>
            <p>{{ t('weaponGachaWitchFormulaAfterCap') }}</p>
          </template>
          <template v-else-if="isSeraphOracle">
            <p>{{ t('weaponGachaSeraphFormulaCycle') }}</p>
            <p>{{ t('weaponGachaSeraphFormulaFree') }}</p>
            <p>{{ t('weaponGachaSeraphFormulaValue') }}</p>
            <p>{{ t('weaponGachaSeraphFormulaMilestone') }}</p>
          </template>
          <template v-else>
          <p>{{ t('weaponGachaWeaponFormulaScores') }}</p>
          <p>{{ t('weaponGachaWeaponFormulaRecovery', { item: costItemLabel }) }}</p>
          <p>{{ t('weaponGachaWeaponFormulaValue') }}</p>
          <p>{{ t('weaponGachaWeaponFormulaMilestone') }}</p>
          </template>
        </div>
      </div>

      <div class="card">
        <div class="card-title">{{ t('weaponGachaDropDetail') }}</div>
        <div class="weapon-detail-list">
          <div v-for="drop in selectedSideRows" :key="drop.key" class="weapon-detail-row">
            <span>{{ dropLabel(drop) }}</span>
            <b>{{ fmtPercent(drop.rate) }}</b>
            <small>{{ t('weaponGachaScoreLine', { value: fmtScoreValue(drop.scoreMeta.score), batch: drop.scoreMeta.batch.toLocaleString() }) }}</small>
            <small>{{ t('weaponGachaExpectedLine', { qty: fmtQty(drop.expectedQty), value: fmtScoreValue(drop.expectedValue) }) }}</small>
            <small>{{ t('weaponGachaPerPullLine', { value: fmtScoreValue(drop.expectedValuePerPull) }) }}</small>
          </div>
        </div>
      </div>
    </aside>
  </section>
</template>

<script setup>
import WeaponGachaCharts from '../components/gacha/WeaponGachaCharts.vue'
import { useWeaponGachaAnalysis } from '../composables/gacha/useWeaponGachaAnalysis.js'

const model = useWeaponGachaAnalysis()
const {
  t,
  selectedBanner,
  selectedPulls,
  gearCurrentLevel,
  gearTargetLevel,
  showFormula,
  ignoreFirstTopUp3,
  pullStrategyMode,
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
  selected,
  noFreeCycle,
  tr,
  costItemLabel,
  implicitUnitLabel,
  expectedCoreSummaryLabel,
  dropLabel,
  selectedCoreRows,
  selectedMilestoneRows,
  fmtDiamonds,
  fmtUnitDiamonds,
  fmtPulls,
  fmtScoreValue,
  fmtPercent,
  fmtQty,
  selectedSideRows
} = model
</script>

<style scoped>
.weapon-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 14px;
  align-items: start;
}

.weapon-banner-control {
  display: grid;
  grid-template-columns: minmax(360px, 420px) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  margin-bottom: 14px;
}

.weapon-banner-card {
  min-width: 0;
}

.gear-core-card {
  display: grid;
  grid-template-columns: auto auto minmax(280px, 1fr);
  gap: 18px;
  align-items: center;
  min-width: 0;
}

.gear-core-title {
  margin: 0;
  white-space: nowrap;
}

.gear-level-range {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-end;
  gap: 8px;
}

.gear-level-field {
  display: flex;
  width: 106px;
  flex-direction: column;
  gap: 5px;
  color: var(--text-secondary);
  font-size: var(--fs-xs);
}

.gear-level-arrow {
  padding-bottom: 8px;
  color: var(--gold);
  font-weight: 700;
}

.gear-level-field .form-input {
  height: 36px;
  padding: 6px 10px;
  text-align: center;
}

.gear-core-result {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
}

.gear-core-metric {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 8px;
  align-items: center;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  background: rgba(var(--color-invert-rgb), 0.035);
}

.gear-core-metric span {
  overflow: hidden;
  color: var(--text-secondary);
  font-size: var(--fs-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gear-core-metric b {
  grid-row: span 2;
  color: var(--gold);
  font-family: var(--font-mono);
  font-size: var(--fs-lg);
  font-variant-numeric: tabular-nums;
}

.gear-core-metric small {
  grid-column: 1;
  color: var(--text-muted);
  font-size: 10px;
}

.weapon-main,
.weapon-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.weapon-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.weapon-table-wrap {
  overflow-x: auto;
}

.weapon-table-grid {
  display: grid;
  gap: 14px;
}

.weapon-table-panel {
  min-width: 0;
}

.weapon-table-title {
  margin-bottom: 8px;
  color: var(--gold);
  font-weight: 700;
}

.weapon-value-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}

.weapon-value-table th,
.weapon-value-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
  text-align: right;
  white-space: nowrap;
}

.weapon-value-table th:first-child,
.weapon-value-table td:first-child {
  text-align: left;
}

.weapon-value-table th {
  color: var(--text-muted);
  font-weight: 600;
}

.weapon-value-table td {
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.weapon-value-table b {
  display: block;
  color: var(--gold);
}

.weapon-value-table small {
  display: block;
  margin-top: 3px;
  color: var(--text-muted);
  font-family: var(--font-main);
}

.weapon-pull-input {
  text-align: center;
}

.weapon-preset-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.weapon-strategy-mode {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.weapon-strategy-mode .btn {
  min-width: 0;
}

.weapon-baseline-toggle {
  width: 100%;
  margin-top: 10px;
}

.weapon-result-list,
.weapon-detail-list {
  display: grid;
  gap: 8px;
}

.weapon-result-list div,
.weapon-detail-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  background: rgba(var(--color-invert-rgb), 0.035);
}

.weapon-result-list span,
.weapon-detail-row span {
  color: var(--text-secondary);
  min-width: 0;
}

.weapon-result-list b,
.weapon-detail-row b {
  color: var(--gold);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.weapon-detail-row small {
  grid-column: 1 / -1;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}

.weapon-formula-toggle {
  width: 100%;
}

.weapon-formula {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-subtle);
  color: var(--text-muted);
  font-size: var(--fs-sm);
  line-height: 1.55;
}

.weapon-formula p + p {
  margin-top: 8px;
}

@media (max-width: 1100px) {
  .weapon-banner-control {
    grid-template-columns: 1fr;
  }

  .weapon-layout {
    grid-template-columns: 1fr;
  }

  .weapon-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .gear-core-card {
    grid-template-columns: auto auto minmax(280px, 1fr);
  }
}

@media (max-width: 560px) {
  .weapon-layout,
  .weapon-main,
  .weapon-side,
  .weapon-summary {
    gap: 12px;
  }

  .weapon-summary {
    grid-template-columns: 1fr;
  }

  .gear-core-card {
    grid-template-columns: 1fr;
  }

  .gear-level-field {
    width: 100%;
  }

  .gear-level-range {
    width: 100%;
  }

  .gear-core-result {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }


}
</style>
