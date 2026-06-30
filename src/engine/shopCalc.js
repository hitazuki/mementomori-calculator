import { getBaseItemKey, getItemInfo, getScore } from './packCalc.js'

function scoreKey(itemType, itemId) {
  return `[${itemType},${itemId}]`
}

function normalizeItem(item) {
  return {
    itemType: item.itemType ?? item.ItemType ?? item.itype,
    itemId: item.itemId ?? item.ItemId ?? item.iid,
    quantity: item.quantity ?? item.ItemCount ?? item.qty ?? 1,
    scoreKey: item.scoreKey ?? item.ScoreKey,
  }
}

function hasScoreEntry(scores, itemType, itemId, customScoreKey) {
  if (customScoreKey) return Boolean(scores?.[customScoreKey])
  return Boolean(scores?.[scoreKey(itemType, itemId)] || scores?.[getBaseItemKey(itemType, itemId)])
}

function getScoreEntryValue(entry) {
  if (!entry || entry.score <= 0) return 0
  return entry.score / (entry.batch || 1)
}

function getVirtualItemInfo(item, scoreEntry, customScoreKey) {
  const fallbackName = item.name || item.displayName || customScoreKey
  return {
    name: scoreEntry?.name || fallbackName,
    nameZh: scoreEntry?.nameZh || item.nameZh || fallbackName,
    nameTw: scoreEntry?.nameTw || item.nameTw || fallbackName,
    nameEn: scoreEntry?.nameEn || item.nameEn || fallbackName,
    nameJa: scoreEntry?.nameJa || item.nameJa || fallbackName,
    nameKo: scoreEntry?.nameKo || item.nameKo || fallbackName,
    iconId: item.iconId || scoreEntry?.iconId || 0,
    batch: scoreEntry?.batch || 1,
    score: scoreEntry?.score || 0,
  }
}

export function calculateShopItemValue(item, scores) {
  const normalized = normalizeItem(item)
  const { itemType, itemId, quantity, scoreKey: customScoreKey } = normalized
  const scoreEntry = customScoreKey ? scores?.[customScoreKey] : null
  const unitScore = customScoreKey ? getScoreEntryValue(scoreEntry) : getScore(scores, itemType, itemId)
  const info = customScoreKey ? getVirtualItemInfo(item, scoreEntry, customScoreKey) : getItemInfo(scores, itemType, itemId)
  const value = unitScore * quantity
  const missingScore = unitScore === 0 && !hasScoreEntry(scores, itemType, itemId, customScoreKey)

  return {
    ...info,
    scoreKey: customScoreKey,
    itemType,
    itemId,
    itype: itemType,
    iid: itemId,
    quantity,
    qty: quantity,
    unitScore,
    value,
    missingScore,
  }
}

export function calculateShopProduct(product, scores) {
  const valueSource = Array.isArray(product.contents) && product.contents.length
    ? product.contents
    : [product.reward]
  const contentDetails = valueSource
    .filter(Boolean)
    .map(item => calculateShopItemValue(item, scores))
  const rewardDetails = product.reward ? [calculateShopItemValue(product.reward, scores)] : []
  const rewardValue = contentDetails.reduce((sum, item) => sum + item.value, 0)
  const cost = Number(product.cost)
  const ce = Number.isFinite(cost) && cost > 0 ? rewardValue / cost : null
  const valueShares = contentDetails.map(item => ({
    itemType: item.itemType,
    itemId: item.itemId,
    quantity: item.quantity,
    value: item.value,
    share: rewardValue > 0 ? item.value / rewardValue : 0,
  }))
  const missingScoreItems = contentDetails.filter(item => item.missingScore)

  return {
    ...product,
    rewardValue,
    value: rewardValue,
    ce,
    limitTotal: product.limitTotal ?? null,
    rewardDetails,
    contentDetails,
    valueShares,
    missingScoreItems,
  }
}

export function calculateShopCE(shops, scores) {
  return shops.map(shop => ({
    ...shop,
    products: shop.products.map(product => calculateShopProduct(product, scores)),
  }))
}

export function sortShopProducts(products, by = 'ce', asc = false) {
  const result = [...products]
  result.sort((a, b) => {
    const va = by === 'cost' ? a.cost : by === 'value' ? a.rewardValue : by === 'name' ? a.name : a.ce
    const vb = by === 'cost' ? b.cost : by === 'value' ? b.rewardValue : by === 'name' ? b.name : b.ce

    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (va === vb) return 0
    if (typeof va === 'string') return asc ? va.localeCompare(vb) : vb.localeCompare(va)
    return asc ? va - vb : vb - va
  })
  return result
}
