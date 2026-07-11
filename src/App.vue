<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <!-- Sidebar -->
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">⚔</div>
        <div class="logo-text">
          <span class="logo-title">{{ $t('appName') }}</span>
          <span class="logo-sub">{{ $t('appSub') }}</span>
        </div>
      </div>

      <button
        class="sidebar-collapse-btn"
        type="button"
        :title="$t(sidebarCollapsed ? 'sidebarExpand' : 'sidebarCollapse')"
        :aria-label="$t(sidebarCollapsed ? 'sidebarExpand' : 'sidebarCollapse')"
        @click="sidebarCollapsed = !sidebarCollapsed"
      >
        {{ sidebarCollapsed ? '›' : '‹' }}
      </button>

      <ul class="nav-list" id="nav-list">
        <li class="nav-group-title">📂 {{ $t('navGroupDamage') }}</li>
        
        <li 
          v-for="item in navDamageItems" 
          :key="item.id"
          class="nav-item" 
          :class="{ active: currentView === item.id }"
          @click="currentView = item.id"
          :title="$t(item.i18nTitle)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ $t(item.i18nLabel) }}</span>
        </li>

        <li class="nav-group-title">📦 {{ $t('navGroupItemSystem') }}</li>

        <li
          v-for="item in navItemSystemItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: currentView === item.id }"
          @click="currentView = item.id"
          :title="$t(item.i18nTitle)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ $t(item.i18nLabel) }}</span>
        </li>

        <li class="nav-group-title">🎲 {{ $t('navGroupGacha') }}</li>

        <li
          v-for="item in navGachaItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: currentView === item.id }"
          @click="currentView = item.id"
          :title="$t(item.i18nTitle)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ $t(item.i18nLabel) }}</span>
        </li>

        <li class="nav-group-title">📂 {{ $t('navGroupMysterium') }}</li>
        
        <li 
          v-for="item in navMysteriumItems" 
          :key="item.id"
          class="nav-item" 
          :class="{ active: currentView === item.id }"
          @click="currentView = item.id"
          :title="$t(item.i18nTitle)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ $t(item.i18nLabel) }}</span>
        </li>
      </ul>

      <div class="sidebar-footer">
        <div class="formula-badge" id="formula-toggle" :title="$t('tooltipToggleFormula')" style="display:none">
          <span class="formula-label">{{ $t('formula') }}</span>
          <span class="formula-value" id="formula-display">{{ $t('propPen') }}</span>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <div class="mobile-current-view">
        <span class="mobile-current-icon">{{ currentNavItem?.icon }}</span>
        <select class="mobile-view-select" v-model="currentView" :aria-label="currentNavItem ? $t(currentNavItem.i18nLabel) : ''">
          <option v-for="item in allNavItems" :key="item.id" :value="item.id">
            {{ item.icon }} {{ $t(item.i18nLabel) }}
          </option>
        </select>
      </div>

      <div class="global-actions" style="position: absolute; top: 22px; right: 24px; z-index: 100; display: flex; align-items: center; gap: 12px;">
        <button 
          @click="toggleTheme" 
          class="btn btn-ghost" 
          style="padding: 6px 12px; font-size: 16px; border-color: var(--border-subtle);"
          :title="currentTheme === 'dark' ? $t('tooltipSwitchLight') : $t('tooltipSwitchDark')"
        >
          {{ currentTheme === 'dark' ? '🌙' : '☀️' }}
        </button>
        <span style="font-size: 18px;">🌐</span>
        <select 
          class="form-select" 
          v-model="currentLanguage" 
          @change="changeLanguage"
          style="background: var(--bg-card); color: var(--gold); border: 1px solid var(--border-subtle); font-size: 15px; width: auto; padding-right: 32px; box-shadow: var(--shadow-card);"
        >
          <option value="zh-CN">简体中文</option>
          <option value="zh-TW">繁體中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
        </select>
      </div>

      <!-- Dynamic View Rendering -->
      <div class="view active">
        <KeepAlive>
          <component :is="activeComponent" />
        </KeepAlive>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watchEffect, defineAsyncComponent, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLang } from './i18n/index.js'

const LoadingOverlay = {
  setup() {
    return () => h('div', { class: 'view-loading' }, [
      h('span', { class: 'loading-icon' }, '⏳'),
      h('span', 'Loading...')
    ])
  }
}

const createAsyncView = (loader) => defineAsyncComponent({
  loader,
  loadingComponent: LoadingOverlay,
  delay: 0
})

const CalculatorView = createAsyncView(() => import('./views/CalculatorView.vue'))
const SweepChartView = createAsyncView(() => import('./views/SweepChartView.vue'))
const HeatmapChartView = createAsyncView(() => import('./views/HeatmapChartView.vue'))
const ComparePanelView = createAsyncView(() => import('./views/ComparePanelView.vue'))
const TornadoChartView = createAsyncView(() => import('./views/TornadoChartView.vue'))
const TableExportView = createAsyncView(() => import('./views/TableExportView.vue'))
const RaidTableView = createAsyncView(() => import('./views/RaidTableView.vue'))
const MysteriumPanelView = createAsyncView(() => import('./views/MysteriumPanelView.vue'))
const PackCalculatorView = createAsyncView(() => import('./views/PackCalculatorView.vue'))
const PackComparisonView = createAsyncView(() => import('./views/PackComparisonView.vue'))
const ShopExchangeView = createAsyncView(() => import('./views/ShopExchangeView.vue'))
const GachaAnalysisView = createAsyncView(() => import('./views/GachaAnalysisView.vue'))
const ForbiddenWeaponGachaView = createAsyncView(() => import('./views/ForbiddenWeaponGachaView.vue'))

const { locale, t } = useI18n()
const currentLanguage = ref(locale.value)

const changeLanguage = () => {
  setLang(currentLanguage.value)
}

watchEffect(() => {
  document.title = t('appTitle')
  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) {
    metaDesc.setAttribute('content', t('appDesc'))
  }
})

import { currentTheme, toggleTheme } from './utils/themeStore.js'

onMounted(() => {
  const basePath = import.meta.env.BASE_URL || '/'
  document.documentElement.style.setProperty('--body-bg-img', `linear-gradient(to bottom, rgba(var(--color-base-rgb), 0.82), rgba(var(--color-base-rgb), 0.94)), url('${basePath}assets/bg/bg.png')`)
})

const currentView = ref('calculator')
const sidebarCollapsed = ref(false)

const viewMap = {
  calculator: CalculatorView,
  sweep: SweepChartView,
  heatmap: HeatmapChartView,
  compare: ComparePanelView,
  tornado: TornadoChartView,
  table: TableExportView,
  raidTable: RaidTableView,
  mysterium: MysteriumPanelView,
  shopExchange: ShopExchangeView,
  packCalc: PackCalculatorView,
  packCompare: PackComparisonView,
  gacha: GachaAnalysisView,
  forbiddenWeaponGacha: ForbiddenWeaponGachaView
}

const activeComponent = computed(() => viewMap[currentView.value])

const allNavItems = computed(() => [
  ...navDamageItems,
  ...navItemSystemItems,
  ...navGachaItems,
  ...navMysteriumItems
])

const currentNavItem = computed(() => allNavItems.value.find(item => item.id === currentView.value))

const navDamageItems = [
  { id: 'calculator', icon: '🎯', i18nLabel: 'navCalc', i18nTitle: 'navCalc' },
  { id: 'sweep', icon: '📈', i18nLabel: 'navSweep', i18nTitle: 'navSweep' },
  { id: 'heatmap', icon: '🔥', i18nLabel: 'navHeatmap', i18nTitle: 'navHeatmap' },
  { id: 'tornado', icon: '🌪', i18nLabel: 'navTornado', i18nTitle: 'navTornado' },
  { id: 'compare', icon: '⚖', i18nLabel: 'navCompare', i18nTitle: 'navCompare' },
  { id: 'table', icon: '📋', i18nLabel: 'navTable', i18nTitle: 'navTable' },
  { id: 'raidTable', icon: '🪵', i18nLabel: 'navRaidTable', i18nTitle: 'navRaidTable' }
]

const navItemSystemItems = [
  { id: 'shopExchange', icon: '🛒', i18nLabel: 'navShopExchange', i18nTitle: 'navShopExchange' },
  { id: 'packCompare', icon: '📊', i18nLabel: 'navPackCompare', i18nTitle: 'navPackCompare' },
  { id: 'packCalc', icon: '💰', i18nLabel: 'navPackCalc', i18nTitle: 'navPackCalc' }
]

const navGachaItems = [
  { id: 'gacha', icon: '🎲', i18nLabel: 'navGacha', i18nTitle: 'navGacha' },
  { id: 'forbiddenWeaponGacha', icon: '📜', i18nLabel: 'navForbiddenWeaponGacha', i18nTitle: 'navForbiddenWeaponGacha' }
]

const navMysteriumItems = [
  { id: 'mysterium', icon: '🔮', i18nLabel: 'navMysterium', i18nTitle: 'navMysterium' }
]
</script>

<style scoped>
.view-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 50vh;
  color: var(--text-muted);
  font-size: 16px;
  gap: 16px;
}
.loading-icon {
  font-size: 40px;
  animation: spin 1.5s linear infinite;
}
@keyframes spin { 
  100% { transform: rotate(360deg); } 
}
</style>
