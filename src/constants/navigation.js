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
