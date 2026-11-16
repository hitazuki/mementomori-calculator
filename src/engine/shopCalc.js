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

function normalizeCeCurrencyUnit(value) {
  const unit = Number(value)
  return Number.isFinite(unit) && unit > 0 ? unit : 1
}

export function calculateShopProduct(product, scores, ceCurrencyUnit = 1) {
  const valueSource = Array.isArray(product.contents) && product.contents.length
    ? product.contents
    : [product.reward]
  const contentDetails = valueSource
    .filter(Boolean)
    .map(item => calculateShopItemValue(item, scores))
  const rewardDetails = product.reward ? [calculateShopItemValue(product.reward, scores)] : []
  const rewardValue = contentDetails.reduce((sum, item) => sum + item.value, 0)
  const cost = Number(product.cost)
  const resolvedCeCurrencyUnit = normalizeCeCurrencyUnit(ceCurrencyUnit)
  const ce = Number.isFinite(cost) && cost > 0 ? rewardValue / cost * resolvedCeCurrencyUnit : null
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
    ceCurrencyUnit: resolvedCeCurrencyUnit,
    limitTotal: product.limitTotal ?? null,
    rewardDetails,
    contentDetails,
    valueShares,
    missingScoreItems,
  }
}

export function calculateShopCE(shops, scores) {
  return shops.map(shop => {
    const ceCurrencyUnit = normalizeCeCurrencyUnit(shop.ceCurrencyUnit)
    return {
      ...shop,
      ceCurrencyUnit,
      products: shop.products.map(product => calculateShopProduct(product, scores, ceCurrencyUnit)),
    }
  })
}

export function sortShopProducts(products, by = 'ce', asc = false) {
  const result = [...products]
  if (by === 'original') return result

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

/** Exact mixed-knapsack plan. Equal values retain the earlier source-order solution. */
export function calculateShopExchangePlan(shop, scores, budget) {
  if (typeof budget !== 'number' || !Number.isInteger(budget) || budget < 0 || budget > 100000) {
    throw new RangeError('Budget must be an integer from 0 to 100000')
  }
  const products = shop.products.map(product => calculateShopProduct(product, scores))
  const missingScoreItems = products.flatMap(product => product.missingScoreItems)
  const unknownLimitProducts = products.filter(product => product.limitTotal == null)
  const stages = []
  for (const [index, product] of products.entries()) {
    const { cost, rewardValue, limitTotal } = product
    if (product.soldOut || !Number.isInteger(cost) || cost <= 0 || !Number.isFinite(rewardValue) || rewardValue <= 0) continue
    if (limitTotal === Infinity) {
      stages.push({ index, cost, value: rewardValue, count: 1, unlimited: true })
    } else if (Number.isInteger(limitTotal) && limitTotal > 0) {
      let remaining = Math.min(limitTotal, Math.floor(budget / cost))
      for (let size = 1; remaining > 0; size *= 2) {
        const count = Math.min(size, remaining)
        stages.push({ index, cost: cost * count, value: rewardValue * count, count })
        remaining -= count
      }
    }
  }
  const values = new Float64Array(budget + 1).fill(-Infinity)
  values[0] = 0
  const traces = []
  for (const stage of stages) {
    const trace = new Uint32Array(budget + 1)
    // Stage-local decisions preserve the previous stage during backtracking.
    if (stage.unlimited) {
      for (let c = stage.cost; c <= budget; c++) {
        const candidate = values[c - stage.cost] + stage.value
        if (candidate > values[c]) {
          values[c] = candidate
          trace[c] = trace[c - stage.cost] + 1
        }
      }
    } else {
      for (let c = budget; c >= stage.cost; c--) {
        const candidate = values[c - stage.cost] + stage.value
        if (candidate > values[c]) {
          values[c] = candidate
          trace[c] = 1
        }
      }
    }
    traces.push(trace)
  }
  let totalCost = 0
  for (let c = 1; c <= budget; c++) {
    if (values[c] > values[totalCost]) totalCost = c
  }
  let cursor = totalCost
  const counts = new Uint32Array(products.length)
  for (let i = stages.length - 1; i >= 0; i--) {
    const units = traces[i][cursor]
    counts[stages[i].index] += units * stages[i].count
    cursor -= units * stages[i].cost
  }
  const entries = products.flatMap((product, index) => counts[index] ? [{
    product,
    count: counts[index],
    quantity: (product.reward?.quantity ?? 1) * counts[index],
    cost: product.cost * counts[index],
    value: product.rewardValue * counts[index],
  }] : [])
  const totalValue = entries.reduce((sum, entry) => sum + entry.value, 0)
  return { entries, totalCost, remainingBudget: budget - totalCost, totalValue,
    ce: totalCost > 0 ? totalValue / totalCost : null, missingScoreItems, unknownLimitProducts }
}
