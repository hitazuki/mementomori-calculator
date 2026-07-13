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
        <li
          class="nav-item nav-home-item"
          :class="{ active: currentView === 'home' }"
          :title="$t('navHome')"
          tabindex="0"
          @click="navigateTo('home')"
          @keydown.enter="navigateTo('home')"
        >
          <span class="nav-icon">⌂</span>
          <span class="nav-label">{{ $t('navHome') }}</span>
        </li>

        <li v-for="group in SIDEBAR_GROUPS" :key="group.id" class="nav-group" :class="{ open: openGroup === group.id }">
          <button
            type="button"
            class="nav-group-toggle"
            :aria-expanded="openGroup === group.id"
            :title="$t(group.labelKey)"
            @click="toggleGroup(group.id)"
          >
            <span class="nav-group-icon">{{ group.icon }}</span>
            <span class="nav-group-label">{{ $t(group.labelKey) }}</span>
            <span class="nav-group-chevron" aria-hidden="true">›</span>
          </button>

          <ul v-show="openGroup === group.id" class="nav-group-items">
            <li
              v-for="item in group.items"
              :key="item.id"
              class="nav-item"
              :class="{ active: item.matchViews.includes(currentView) }"
              :title="$t(item.labelKey)"
              tabindex="0"
              @click="navigateTo(item.viewId)"
              @keydown.enter="navigateTo(item.viewId)"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ $t(item.labelKey) }}</span>
            </li>
          </ul>
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
        <select class="mobile-view-select" v-model="currentView" :aria-label="currentNavItem ? $t(currentNavItem.labelKey) : ''">
          <option value="home">⌂ {{ $t('navHome') }}</option>
          <optgroup v-for="group in mobileNavGroups" :key="group.id" :label="`${group.icon} ${$t(group.labelKey)}`">
            <option v-for="option in group.options" :key="option.id" :value="option.id">
              {{ option.icon }} {{ option.parentLabelKey ? `${$t(option.parentLabelKey)} · ${$t(option.labelKey)}` : $t(option.labelKey) }}
            </option>
          </optgroup>
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
          <component :is="activeComponent" @navigate="navigateTo" />
        </KeepAlive>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, watchEffect, defineAsyncComponent, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLang } from './i18n/index.js'
import { DAMAGE_TABS, SIDEBAR_GROUPS, findModuleByView, findSidebarGroupByView } from './constants/navigation.js'

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

const HomeView = createAsyncView(() => import('./views/HomeView.vue'))
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

const viewMap = {
  home: HomeView,
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

const savedView = localStorage.getItem('mmt-calc-current-view')
const currentView = ref(Object.hasOwn(viewMap, savedView) ? savedView : 'home')
const sidebarCollapsed = ref(localStorage.getItem('mmt-calc-sidebar-collapsed') === 'true')
const savedGroup = localStorage.getItem('mmt-calc-open-nav-group')
const initialGroup = findSidebarGroupByView(currentView.value)?.id
const savedGroupIsValid = SIDEBAR_GROUPS.some((group) => group.id === savedGroup)
const openGroup = ref(initialGroup || (savedGroupIsValid ? savedGroup : 'damage'))

const activeComponent = computed(() => viewMap[currentView.value])
const currentNavItem = computed(() => {
  if (currentView.value === 'home') return { icon: '⌂', labelKey: 'navHome' }
  return DAMAGE_TABS.find((item) => item.id === currentView.value) || findModuleByView(currentView.value)
})

const mobileNavGroups = SIDEBAR_GROUPS.map((group) => ({
  ...group,
  options: group.items.flatMap((item) => item.childViews
    ? item.childViews.map((child) => ({ ...child, parentLabelKey: item.labelKey }))
    : [{ id: item.viewId, icon: item.icon, labelKey: item.labelKey }]),
}))

function navigateTo(viewId) {
  if (!Object.hasOwn(viewMap, viewId)) return
  currentView.value = viewId
}

function toggleGroup(groupId) {
  openGroup.value = openGroup.value === groupId ? '' : groupId
}

watch(currentView, (viewId) => {
  localStorage.setItem('mmt-calc-current-view', viewId)
  const group = findSidebarGroupByView(viewId)
  if (group) openGroup.value = group.id
})

watch(openGroup, (groupId) => {
  if (groupId) localStorage.setItem('mmt-calc-open-nav-group', groupId)
  else localStorage.removeItem('mmt-calc-open-nav-group')
})

watch(sidebarCollapsed, (collapsed) => {
  localStorage.setItem('mmt-calc-sidebar-collapsed', String(collapsed))
})
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
