<template>
      <section class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ implicitChartTitle }}</div>
            <span class="tag tag-gold">{{ implicitChartTag }}</span>
            <span v-if="analysis.decisionBaselinePulls" class="tag tag-purple">{{ t('weaponGachaFreeBaselineExcluded') }}</span>
          </div>
          <div class="segmented-control weapon-chart-mode">
            <button
              v-for="mode in implicitChartModes"
              :key="mode.key"
              class="btn btn-sm"
              :class="implicitChartMode === mode.key ? 'btn-primary' : 'btn-ghost'"
              :aria-pressed="implicitChartMode === mode.key"
              @click="implicitChartMode = mode.key"
            >
              {{ t(mode.labelKey) }}
            </button>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="implicitCostOption" autoresize />
        </div>
      </section>

      <section v-if="isSeraphOracle" class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ t('weaponGachaCoreDistributionTitle') }}</div>
            <span class="tag tag-gold">{{ coreDistributionTag }}</span>
            <span v-if="analysis.decisionBaselinePulls" class="tag tag-purple">{{ t('weaponGachaFreeBaselineExcluded') }}</span>
            <span v-if="ignoreFirstTopUp3" class="tag tag-purple">{{ t('weaponGachaStage1DistributionExcluded') }}</span>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="coreDistributionOption" autoresize />
        </div>
      </section>

      <section v-if="isSeraphOracle" class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ t('weaponGachaRelicExpectationLossTitle') }}</div>
            <span class="tag tag-gold">{{ currentSeraphStrategyLabel }}</span>
            <span class="tag tag-purple">{{ t('weaponGachaSamePaidPulls') }}</span>
            <span v-if="ignoreFirstTopUp3" class="tag tag-purple">{{ t('weaponGachaStage1DistributionExcluded') }}</span>
            <span v-else class="tag tag-purple">{{ t('weaponGachaStage1CommonBaseline') }}</span>
            <span class="tag tag-purple">{{ t('weaponGachaFullStagesOnly') }}</span>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="seraphCrossWeekOption" autoresize />
        </div>
      </section>

      <section v-if="isSeraphOracle" class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ t('weaponGachaSeraphStrategyTitle') }}</div>
            <span class="tag tag-purple">{{ seraphStrategyChartTag }}</span>
          </div>
          <div class="segmented-control weapon-chart-mode">
            <button
              v-for="mode in implicitChartModes"
              :key="mode.key"
              class="btn btn-sm"
              :class="seraphStrategyChartMode === mode.key ? 'btn-primary' : 'btn-ghost'"
              :aria-pressed="seraphStrategyChartMode === mode.key"
              @click="seraphStrategyChartMode = mode.key"
            >
              {{ t(mode.labelKey) }}
            </button>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="seraphStrategyOption" autoresize />
        </div>
      </section>

      <section v-if="!isSeraphOracle" class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="chart-toolbar-main">
            <div class="card-title">{{ quantityChartTitle }}</div>
            <span class="tag tag-purple">{{ quantityChartTag }}</span>
          </div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="quantityOption" autoresize />
        </div>
      </section>

      <section class="card weapon-chart-card">
        <div class="chart-toolbar">
          <div class="card-title">{{ t('weaponGachaSideContribution') }}</div>
        </div>
        <div class="chart-frame weapon-chart-frame">
          <v-chart class="chart" :option="sideContributionOption" autoresize />
        </div>
      </section>
</template>

<script setup>
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import VChart from '../ActiveChart.vue'
import { useWeaponGachaCharts } from '../../composables/gacha/useWeaponGachaCharts.js'

use([CanvasRenderer, BarChart, LineChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent])
const { model } = defineProps({ model: { type: Object, required: true } })
const { t, ignoreFirstTopUp3, implicitChartMode, seraphStrategyChartMode, implicitChartModes, isSeraphOracle, analysis, implicitChartTitle, implicitChartTag, seraphStrategyChartTag, quantityChartTitle, quantityChartTag, coreDistributionTag, currentSeraphStrategyLabel } = model
const { implicitCostOption, seraphCrossWeekOption, seraphStrategyOption, coreDistributionOption, quantityOption, sideContributionOption } = useWeaponGachaCharts(model)
</script>

<style scoped>
.weapon-chart-card {
  min-width: 0;
}

.weapon-chart-mode {
  flex: 0 0 auto;
}

.weapon-chart-mode .btn {
  min-width: 88px;
}

.weapon-chart-frame {
  height: 380px;
  min-height: 380px;
}

@media (max-width: 560px) {
  .weapon-chart-frame {
    height: 340px;
    min-height: 340px;
  }
}
</style>
