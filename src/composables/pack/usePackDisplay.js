import { paidDiamondsForPrice } from '../../engine/ultraSalePlanner.js'

const localeNameMap = { 'zh-CN': 'nameZh', 'zh-TW': 'nameTw', en: 'nameEn', ja: 'nameJa', ko: 'nameKo' }

export function usePackDisplay(t, locale) {
  function itemDisplayName(item) {
    const field = localeNameMap[locale.value] || 'nameZh'
    return item?.[field] || item?.name || ''
  }

  function itemLocaleField() {
    return localeNameMap[locale.value] || 'nameZh'
  }

  function towerName(key) {
    return key ? t(key) : ''
  }

  function formatPrice(price) {
    return '¥' + price.toLocaleString()
  }

  function tierLabel(price) {
    if (!Number.isFinite(Number(price))) return '-'
    return t('planTierDiamond', { n: paidDiamondsForPrice(price) })
  }

  function translatePackName(name) {
    if (!name) return ''
    const normalDiamondPack = name.match(/^钻石组合包 (\d+)( \(\w+\d+\))?( ×\d+)?$/)
    if (normalDiamondPack) {
      return t('planPackDiamond', { n: normalDiamondPack[1] }) + (normalDiamondPack[2] || '') + (normalDiamondPack[3] || '')
    }
    const firstBonusDiamondPack = name.match(/^钻石组合包 (\d+) \(首次双倍\)( ×\d+)?$/)
    if (firstBonusDiamondPack) {
      return t('planPackDiamondFirst', { n: firstBonusDiamondPack[1] }) + (firstBonusDiamondPack[2] || '')
    }
    return name
  }

  function formatCe(value) {
    const number = Number(value)
    return Number.isFinite(number) ? number.toFixed(1) : '-'
  }

  return {
    itemDisplayName,
    itemLocaleField,
    towerName,
    formatPrice,
    tierLabel,
    translatePackName,
    formatCe,
  }
}
