import { DAILY_RECHARGE_BONUS_TIERS, marginalFreeDiamonds, unlockedRechargeTiers } from './dailyRechargeBonus.js'
import { getPackOriginalValue, getPackPaidDiamonds } from './ultraSalePlannerPackUtils.js'

export const DEFAULT_DAILY_RECHARGE_RESET_PAID = 12000

const TOP_UP_SOURCE_LABEL = '每日累充补包'

export function rechargeValueForPaid(beforePaid, addedPaid, context) {
  const freeDiamonds = marginalFreeDiamonds(beforePaid, addedPaid)
  return {
    beforePaid,
    afterPaid: beforePaid + addedPaid,
    addedPaid,
    freeDiamonds,
    value: Math.round(freeDiamonds * context.freeDiamondScore),
    unlockedTiers: unlockedRechargeTiers(beforePaid, addedPaid).map(tier => tier.paid),
  }
}

function nameForTopUpPack(pack) {
  return String(pack.name || pack.displayTrigger || '钻石组合包')
}

function isPermanentDiamondTopUpPack(pack) {
  const name = String(pack.name || '')
  return name.startsWith('钻石组合包') && !name.includes('首次')
}

export function normalizePermanentTopUpPacks(packs) {
  return packs
    .filter(isPermanentDiamondTopUpPack)
    .map((pack, index) => {
      const price = Math.max(0, Math.floor(Number(pack.price) || 0))
      const paidDiamonds = getPackPaidDiamonds({ ...pack, price })
      const originalValue = getPackOriginalValue(pack)
      return {
        ...pack,
        topUpId: `${nameForTopUpPack(pack)}:${price}:${index}`,
        displayTrigger: nameForTopUpPack(pack),
        price,
        paidDiamonds,
        originalValue,
        value: originalValue,
        ce: paidDiamonds > 0 ? originalValue / paidDiamonds : 0,
        items: pack.items || [],
      }
    })
    .filter(pack => pack.price > 0 && pack.paidDiamonds > 0)
    .sort((a, b) => a.price - b.price)
}

function mergeTopUpItems(packs) {
  const map = new Map()
  for (const pack of packs) {
    for (const item of pack.items || []) {
      const key = `${item.itype ?? item.ItemType}:${item.iid ?? item.ItemId}`
      if (!map.has(key)) map.set(key, { ...item, qty: 0, value: 0 })
      const current = map.get(key)
      current.qty += Number(item.qty ?? item.ItemCount) || 0
      current.value += Number(item.value) || 0
    }
  }
  return [...map.values()]
}

export function groupTopUpPacks(packs) {
  const groups = new Map()
  for (const pack of packs) {
    const key = pack.topUpId || `${pack.name}:${pack.price}`
    if (!groups.has(key)) groups.set(key, { pack, copies: [] })
    groups.get(key).copies.push(pack)
  }

  return [...groups.values()].map(group => {
    const count = group.copies.length
    const price = group.copies.reduce((sum, pack) => sum + pack.price, 0)
    const paidDiamonds = group.copies.reduce((sum, pack) => sum + getPackPaidDiamonds(pack), 0)
    const originalValue = group.copies.reduce((sum, pack) => sum + getPackOriginalValue(pack), 0)
    const label = count > 1 ? `${nameForTopUpPack(group.pack)} ×${count}` : nameForTopUpPack(group.pack)

    return {
      trigger: TOP_UP_SOURCE_LABEL,
      sourceLabel: '常驻补包',
      displayTrigger: label,
      price,
      value: Math.round(originalValue),
      originalValue: Math.round(originalValue),
      rechargeValue: 0,
      ce: paidDiamonds > 0 ? originalValue / paidDiamonds : 0,
      paidDiamonds,
      items: mergeTopUpItems(group.copies),
    }
  })
}

export function getDailyRechargeResetPaid(context) {
  if (context.settings.rechargePlanningMode === 'rush') return 0
  const configured = Number(context.settings.dailyRechargeResetPaid)
  return Number.isFinite(configured)
    ? Math.max(0, Math.floor(configured))
    : DEFAULT_DAILY_RECHARGE_RESET_PAID
}

export function getDailyRechargeTargetPaid(context) {
  if (context.settings.rechargePlanningMode === 'rush') {
    return DAILY_RECHARGE_BONUS_TIERS[DAILY_RECHARGE_BONUS_TIERS.length - 1].paid
  }
  const resetPaid = getDailyRechargeResetPaid(context)
  return resetPaid > 0 ? resetPaid : DAILY_RECHARGE_BONUS_TIERS[DAILY_RECHARGE_BONUS_TIERS.length - 1].paid
}

export function nextPlannerRechargeTier(currentPaid, context) {
  const targetPaid = getDailyRechargeTargetPaid(context)
  if (targetPaid <= 0 || currentPaid >= targetPaid) return null
  return DAILY_RECHARGE_BONUS_TIERS
    .find(tier => currentPaid < tier.paid && tier.paid <= targetPaid) || null
}

function isBetterTopUpPackForTier(candidate, best) {
  if (!best) return true
  if (candidate.price !== best.price) return candidate.price < best.price
  return getPackOriginalValue(candidate) > getPackOriginalValue(best)
}

function addTopUpPackToCombo(combo, pack) {
  combo.purchases.push(pack)
  combo.cost += pack.price
  combo.paidDiamonds += getPackPaidDiamonds(pack)
  combo.originalValue += getPackOriginalValue(pack)
}

function prepareTopUpPackOptions(packs) {
  const packByPaid = new Map()
  for (const pack of packs) {
    const paidDiamonds = getPackPaidDiamonds(pack)
    if (paidDiamonds <= 0 || pack.price <= 0) continue
    const best = packByPaid.get(paidDiamonds)
    if (isBetterTopUpPackForTier(pack, best)) packByPaid.set(paidDiamonds, pack)
  }

  const uniquePacks = [...packByPaid.values()]
    .sort((a, b) => getPackPaidDiamonds(b) - getPackPaidDiamonds(a))
  const filler = [...uniquePacks]
    .sort((a, b) => {
      if (getPackPaidDiamonds(a) !== getPackPaidDiamonds(b)) return getPackPaidDiamonds(a) - getPackPaidDiamonds(b)
      return a.price - b.price
    })[0]

  return { uniquePacks, filler }
}

export function findHeuristicTopUpCombination(gap, packs, prepared = null) {
  if (gap <= 0) return null

  const { uniquePacks, filler } = prepared || prepareTopUpPackOptions(packs)
  if (!uniquePacks.length || !filler) return null

  const combo = { cost: 0, paidDiamonds: 0, originalValue: 0, purchases: [] }
  let remainingGap = gap

  for (const pack of uniquePacks) {
    const paidDiamonds = getPackPaidDiamonds(pack)
    if (paidDiamonds <= remainingGap) {
      addTopUpPackToCombo(combo, pack)
      remainingGap -= paidDiamonds
    }
  }

  while (remainingGap > 0) {
    addTopUpPackToCombo(combo, filler)
    remainingGap -= getPackPaidDiamonds(filler)
  }

  return combo.purchases.length ? combo : null
}

export function buildPermanentTopUpOptionCache(context) {
  const targetPaid = getDailyRechargeTargetPaid(context)
  if (!context.permanentPacks.length || targetPaid <= 0) return []

  const prepared = prepareTopUpPackOptions(context.permanentPacks)
  if (!prepared.uniquePacks.length || !prepared.filler) return []

  const options = Array.from({ length: targetPaid + 1 }, () => null)
  for (let currentPaid = 0; currentPaid < targetPaid; currentPaid++) {
    const targetTier = nextPlannerRechargeTier(currentPaid, context)
    if (!targetTier) continue

    const combo = findHeuristicTopUpCombination(targetTier.paid - currentPaid, context.permanentPacks, prepared)
    if (!combo) continue

    const recharge = rechargeValueForPaid(currentPaid, combo.paidDiamonds, context)
    options[currentPaid] = {
      cost: combo.cost,
      originalValue: combo.originalValue,
      purchases: combo.purchases,
      paidDiamonds: combo.paidDiamonds,
      recharge,
      value: Math.round(combo.originalValue + recharge.value),
      unlockedCount: recharge.unlockedTiers.length,
    }
  }
  return options
}

export function findPermanentTopUpOption(state, context) {
  if (!context.permanentPacks.length || state.purchases <= 0) return null

  const currentPaid = state.dailyPaidDiamonds
  const cached = context.topUpOptionByCurrentPaid?.[currentPaid]
  if (cached) return cached

  const targetTier = nextPlannerRechargeTier(currentPaid, context)
  if (!targetTier) return null

  const combo = findHeuristicTopUpCombination(targetTier.paid - currentPaid, context.permanentPacks)
  if (!combo) return null

  const recharge = rechargeValueForPaid(currentPaid, combo.paidDiamonds, context)
  return {
    cost: combo.cost,
    originalValue: combo.originalValue,
    purchases: combo.purchases,
    paidDiamonds: combo.paidDiamonds,
    recharge,
    value: Math.round(combo.originalValue + recharge.value),
    unlockedCount: recharge.unlockedTiers.length,
  }
}
