export const DAMAGE_TABS = [
  { id: 'calculator', viewId: 'calculator', matchViews: ['calculator'], icon: '🎯', labelKey: 'navCalc', descriptionKey: 'calcDesc' },
  { id: 'sweep', viewId: 'sweep', matchViews: ['sweep'], icon: '📈', labelKey: 'navSweep', descriptionKey: 'sweepDesc' },
  { id: 'heatmap', viewId: 'heatmap', matchViews: ['heatmap'], icon: '🔥', labelKey: 'navHeatmap', descriptionKey: 'heatmapDesc' },
  { id: 'tornado', viewId: 'tornado', matchViews: ['tornado'], icon: '🌪', labelKey: 'navTornado', descriptionKey: 'tornadoDesc' },
  { id: 'compare', viewId: 'compare', matchViews: ['compare'], icon: '⚖', labelKey: 'navCompare', descriptionKey: 'compareDesc' },
  { id: 'table', viewId: 'table', matchViews: ['table'], icon: '📋', labelKey: 'navTable', descriptionKey: 'tableDesc' },
]

export const DAMAGE_VIEW_IDS = DAMAGE_TABS.map((item) => item.id)

export const NAV_GROUPS = [
  { id: 'characters', icon: '📖', labelKey: 'catalogGroup', items: [
    { id: 'characters', viewId: 'characters', matchViews: ['characters'], icon: '📖', labelKey: 'catalogTitle', descriptionKey: 'catalogDescription' },
  ] },
  {
    id: 'damage',
    icon: '🎯',
    labelKey: 'navDamageAnalysis',
    items: DAMAGE_TABS,
  },
  {
    id: 'combat',
    icon: '⚔️',
    labelKey: 'navGroupCombatAnalysis',
    items: [
      {
        id: 'raid',
        icon: '🪵',
        labelKey: 'navRaidTable',
        descriptionKey: 'homeRaidDesc',
        viewId: 'raidTable',
        matchViews: ['raidTable'],
        capabilities: ['homeRaidCapLineup', 'homeRaidCapRotation', 'homeRaidCapBuffs'],
      },
    ],
  },
  {
    id: 'resources',
    icon: '📦',
    labelKey: 'navGroupResourcePlanning',
    items: [
      {
        id: 'shopExchange',
        icon: '🛒',
        labelKey: 'navShopExchange',
        descriptionKey: 'homeShopDesc',
        viewId: 'shopExchange',
        matchViews: ['shopExchange'],
      },
      {
        id: 'packCompare',
        icon: '📊',
        labelKey: 'navPackCompare',
        descriptionKey: 'homePackCompareDesc',
        viewId: 'packCompare',
        matchViews: ['packCompare'],
      },
      {
        id: 'packCalc',
        icon: '💰',
        labelKey: 'navPackCalc',
        descriptionKey: 'homePackCalcDesc',
        viewId: 'packCalc',
        matchViews: ['packCalc'],
      },
    ],
  },
  {
    id: 'equipment',
    icon: '⚒',
    labelKey: 'navGroupEquipmentAnalysis',
    items: [
      { id: 'equipmentUpgrade', viewId: 'equipmentUpgrade', matchViews: ['equipmentUpgrade'], icon: '📈', labelKey: 'equipmentUpgradeTitle', descriptionKey: 'equipmentUpgradeDescription' },
      { id: 'equipmentReinforcement', viewId: 'equipmentReinforcement', matchViews: ['equipmentReinforcement'], icon: '⚒', labelKey: 'reinforcementTitle', descriptionKey: 'reinforcementDescription' },
    ],
  },
  {
    id: 'gacha',
    icon: '🎲',
    labelKey: 'navGroupGachaAnalysis',
    items: [
      {
        id: 'gacha',
        icon: '🎲',
        labelKey: 'navGacha',
        descriptionKey: 'homeGachaDesc',
        viewId: 'gacha',
        matchViews: ['gacha'],
      },
      {
        id: 'forbiddenWeaponGacha',
        icon: '📜',
        labelKey: 'navForbiddenWeaponGacha',
        descriptionKey: 'homeForbiddenWeaponDesc',
        viewId: 'forbiddenWeaponGacha',
        matchViews: ['forbiddenWeaponGacha'],
      },
    ],
  },
  {
    id: 'other',
    icon: '✨',
    labelKey: 'navGroupOtherTools',
    items: [
      {
        id: 'mysterium',
        icon: '🔮',
        labelKey: 'navMysterium',
        descriptionKey: 'homeMysteriumDesc',
        viewId: 'mysterium',
        matchViews: ['mysterium'],
      },
      {
        id: 'serialCode',
        icon: '🎁',
        labelKey: 'navSerialCode',
        descriptionKey: 'homeSerialCodeDesc',
        viewId: 'serialCode',
        matchViews: ['serialCode'],
      },
    ],
  },
]

export const NAV_MODULES = NAV_GROUPS.flatMap((group) => group.items)

const RECOMMENDED_MODULE_IDS = ['raid', 'packCompare', 'shopExchange', 'mysterium', 'sweep']

export const RECOMMENDED_MODULES = RECOMMENDED_MODULE_IDS
  .map((id) => NAV_MODULES.find((item) => item.id === id))
  .filter(Boolean)

export const SIDEBAR_GROUPS = NAV_GROUPS

export function findModuleByView(viewId) {
  return NAV_MODULES.find((item) => item.matchViews.includes(viewId))
}

export function findGroupByView(viewId) {
  return NAV_GROUPS.find((group) => group.items.some((item) => item.matchViews.includes(viewId)))
}

export function findSidebarGroupByView(viewId) {
  return SIDEBAR_GROUPS.find((group) => group.items.some((item) => item.matchViews.includes(viewId)))
}

// Registered pages and their cache policy live alongside navigation metadata.
export const VIEW_DEFINITIONS = {
  characters: { name: 'CharacterCatalogView', cache: true, load: () => import('../views/CharacterCatalogView.vue') },
  home: { name: 'HomeView', cache: false, emitsNavigate: true, load: () => import('../views/HomeView.vue') },
  calculator: { name: 'CalculatorView', cache: true, load: () => import('../views/CalculatorView.vue') },
  sweep: { name: 'SweepChartView', cache: true, load: () => import('../views/SweepChartView.vue') },
  heatmap: { name: 'HeatmapChartView', cache: true, load: () => import('../views/HeatmapChartView.vue') },
  compare: { name: 'ComparePanelView', cache: true, load: () => import('../views/ComparePanelView.vue') },
  tornado: { name: 'TornadoChartView', cache: true, load: () => import('../views/TornadoChartView.vue') },
  table: { name: 'TableExportView', cache: true, load: () => import('../views/TableExportView.vue') },
  raidTable: { name: 'RaidTableView', cache: true, load: () => import('../views/RaidTableView.vue') },
  mysterium: { name: 'MysteriumPanelView', cache: true, load: () => import('../views/MysteriumPanelView.vue') },
  shopExchange: { name: 'ShopExchangeView', cache: true, load: () => import('../views/ShopExchangeView.vue') },
  packCalc: { name: 'PackCalculatorView', cache: true, load: () => import('../views/PackCalculatorView.vue') },
  packCompare: { name: 'PackComparisonView', cache: true, load: () => import('../views/PackComparisonView.vue') },
  gacha: { name: 'GachaAnalysisView', cache: true, load: () => import('../views/GachaAnalysisView.vue') },
  forbiddenWeaponGacha: { name: 'ForbiddenWeaponGachaView', cache: true, load: () => import('../views/ForbiddenWeaponGachaView.vue') },
  equipmentReinforcement: { name: 'EquipmentReinforcementView', cache: true, load: () => import('../views/EquipmentReinforcementView.vue') },
  equipmentUpgrade: { name: 'EquipmentUpgradeView', cache: true, load: () => import('../views/EquipmentUpgradeView.vue') },
  serialCode: { name: 'SerialCodeToolView', cache: false, load: () => import('../views/SerialCodeToolView.vue') },
}
