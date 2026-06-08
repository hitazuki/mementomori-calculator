import { DAILY_RECHARGE_BONUS_TIERS, marginalFreeDiamonds, unlockedRechargeTiers } from './dailyRechargeBonus.js'
import { parseMainQuestProgress } from './mainQuestProgress.js'

const DEFAULT_PRICE_TIERS = [160, 650, 1000, 1500, 3000, 6000, 11800]
const DEFAULT_MAX_STATES_PER_TIER = 350
const TOP_UP_TRIGGER_RANGE = '每日累充补包'
const MAX_DAILY_RECHARGE_PAID = DAILY_RECHARGE_BONUS_TIERS.at(-1)?.paid || 0
const ATTRIBUTE_TOWERS = [
  'origin_tower_blue',
  'origin_tower_red',
  'origin_tower_green',
  'origin_tower_yellow',
]
const ALL_ATTRIBUTE_TOWER = 'origin_group_all_towers'

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function parseTriggerProgress(trigger) {
  if (typeof trigger === 'number') return trigger
  const text = String(trigger || '').trim()
  if (!text) return 0
  const quest = text.match(/^(\d+)-(\d+)$/)
  if (quest) return Number(quest[1]) + Number(quest[2]) / 100
  const numeric = Number(text)
  return Number.isFinite(numeric) ? numeric : 0
}

function parseLaneProgress(progress, lane) {
  if ((lane.cat || lane.source) === 'quest') return parseMainQuestProgress(progress)
  return parseTriggerProgress(progress)
}

function getPriceTiers(packs) {
  const prices = [...new Set(packs.map(pack => pack.price))]
    .filter(price => Number.isFinite(price))
    .sort((a, b) => a - b)
  return prices.length ? prices : DEFAULT_PRICE_TIERS
}

function laneLabel(lane) {
  if (lane.label) return lane.label
  if (lane.cat === 'quest') return '主线'
  if (lane.cat === 'rank') return '等级'
  return lane.tower || '塔'
}

function buildLaneOpportunities(packs, lane) {
  const start = parseLaneProgress(lane.startProgress, lane)
  const end = parseLaneProgress(lane.endProgress, lane)
  const source = lane.cat || lane.source || 'tower'
  const tower = lane.tower || null
  const label = laneLabel(lane)
  const laneId = lane.id || `${source}:${tower || 'all'}`

  const groups = new Map()
  for (const pack of packs) {
    if (pack.cat !== source) continue
    if (source === 'tower' && tower && pack.tower !== tower) continue

    const progress = parseLaneProgress(pack.trigger, lane)
    if (progress <= start || (end > 0 && progress > end)) continue

    const key = `${laneId}:${pack.trigger}`
    if (!groups.has(key)) {
      groups.set(key, {
        laneId,
        label,
        trigger: pack.trigger,
        displayTrigger: `${label}: ${pack.trigger}`,
        sortValue: progress,
        packsByPrice: new Map(),
      })
    }
    groups.get(key).packsByPrice.set(pack.price, {
      ...pack,
      plannerLaneId: laneId,
      plannerSourceLabel: label,
      plannerDisplayTrigger: `${label}: ${pack.trigger}`,
    })
  }

  return [...groups.values()].sort((a, b) => {
    if (a.sortValue !== b.sortValue) return a.sortValue - b.sortValue
    return String(a.trigger).localeCompare(String(b.trigger), undefined, { numeric: true })
  })
}

function buildOpportunities(packs, settings) {
  const [lane] = normalizePlanningLanes(settings)
  return buildLaneOpportunities(packs, lane)
}

function buildBatches(opportunities, batchSize) {
  const size = Math.max(1, Number(batchSize) || 1)
  const batches = []
  for (let i = 0; i < opportunities.length; i += size) {
    batches.push(opportunities.slice(i, i + size))
  }
  return batches
}

function getLaneReachBatchIndex(lane, triggerProgress) {
  const start = parseLaneProgress(lane.startProgress, lane)
  const end = parseLaneProgress(lane.endProgress, lane)
  if (triggerProgress <= start) return 0
  if (end > 0 && triggerProgress > end) return null

  const batchSize = Math.max(1, Number(lane.batchSize) || 1)
  const triggerCount = Math.ceil(triggerProgress - start)
  return Math.max(1, Math.ceil(triggerCount / batchSize))
}

function buildDerivedAllTowerEntries(packs, lanes) {
  const attributeLanes = ATTRIBUTE_TOWERS.map(tower => {
    return lanes.find(lane => lane.cat === 'tower' && lane.tower === tower)
  })
  if (attributeLanes.some(lane => !lane)) return []

  const start = Math.min(...attributeLanes.map(lane => parseLaneProgress(lane.startProgress, lane)))
  const end = Math.min(...attributeLanes.map(lane => parseLaneProgress(lane.endProgress, lane)))
  if (end <= start) return []

  const allTowerLane = {
    id: 'tower_all_derived',
    cat: 'tower',
    tower: 'origin_group_all_towers',
    label: '\u5168\u5c5e\u6027\u5854\u62b5\u8fbe',
    startProgress: start,
    endProgress: end,
    batchSize: 1,
  }

  return buildLaneOpportunities(packs, allTowerLane)
    .map(opportunity => {
      const reachBatchIndexes = attributeLanes.map(lane => getLaneReachBatchIndex(lane, opportunity.sortValue))
      if (reachBatchIndexes.some(index => index === null)) return null
      const reachBatchIndex = Math.max(...reachBatchIndexes)
      if (!Number.isFinite(reachBatchIndex)) return null
      return { opportunity, batchIndex: reachBatchIndex - 1 }
    })
    .filter(Boolean)
}

function isAttributeTowerLane(lane) {
  return lane.cat === 'tower' && ATTRIBUTE_TOWERS.includes(lane.tower)
}

function sortBatchOpportunities(batch) {
  return batch.sort((a, b) => {
    const labelOrder = a.label.localeCompare(b.label)
    if (labelOrder !== 0) return labelOrder
    if (a.sortValue !== b.sortValue) return a.sortValue - b.sortValue
    return String(a.trigger).localeCompare(String(b.trigger), undefined, { numeric: true })
  })
}

function buildAttributeTowerTopologyBatches(packs, lanes) {
  const attributeLanes = lanes.filter(isAttributeTowerLane)
  if (!attributeLanes.length) return { batches: [], opportunities: [] }

  const singleEvents = new Map()
  for (const lane of attributeLanes) {
    const opportunities = buildLaneOpportunities(packs, {
      ...lane,
      batchSize: 1,
    })
    for (const opportunity of opportunities) {
      const key = `single:${opportunity.sortValue}`
      if (!singleEvents.has(key)) {
        singleEvents.set(key, {
          kind: 'single',
          sortValue: opportunity.sortValue,
          opportunities: [],
        })
      }
      singleEvents.get(key).opportunities.push(opportunity)
    }
  }

  const allTowerEvents = new Map()
  if (ATTRIBUTE_TOWERS.every(tower => attributeLanes.some(lane => lane.tower === tower))) {
    const start = Math.min(...attributeLanes.map(lane => parseLaneProgress(lane.startProgress, lane)))
    const end = Math.min(...attributeLanes.map(lane => parseLaneProgress(lane.endProgress, lane)))

    if (end > start) {
      const allTowerLane = {
        id: 'tower_all_derived',
        cat: 'tower',
        tower: ALL_ATTRIBUTE_TOWER,
        label: '\u5168\u5c5e\u6027\u5854\u62b5\u8fbe',
        startProgress: start,
        endProgress: end,
        batchSize: 1,
      }

      for (const opportunity of buildLaneOpportunities(packs, allTowerLane)) {
        const key = `all:${opportunity.sortValue}`
        allTowerEvents.set(key, {
          kind: 'all',
          sortValue: opportunity.sortValue,
          opportunities: [opportunity],
        })
      }
    }
  }

  const events = [...singleEvents.values(), ...allTowerEvents.values()]
    .sort((a, b) => {
      if (a.sortValue !== b.sortValue) return a.sortValue - b.sortValue
      if (a.kind === b.kind) return 0
      return a.kind === 'all' ? -1 : 1
    })

  const batches = events.map(event => sortBatchOpportunities(event.opportunities))
  return {
    batches,
    opportunities: batches.flat(),
  }
}

function normalizePlanningLanes(settings) {
  if (Array.isArray(settings.lanes) && settings.lanes.length) {
    return settings.lanes
      .filter(lane => lane.enabled !== false)
      .map(lane => ({
        ...lane,
        cat: lane.cat || lane.source || 'tower',
        batchSize: isAttributeTowerLane({
          ...lane,
          cat: lane.cat || lane.source || 'tower',
        })
          ? 1
          : Math.max(1, Math.floor(Number(lane.batchSize) || Number(settings.batchSize) || 1)),
      }))
  }

  return [{
    id: settings.source === 'tower' ? `tower:${settings.tower || 'origin_tower_infinite'}` : settings.source || 'tower',
    cat: settings.source || 'tower',
    tower: settings.tower || 'origin_tower_infinite',
    startProgress: settings.startProgress,
    endProgress: settings.endProgress,
    batchSize: Math.max(1, Math.floor(Number(settings.batchSize) || 1)),
  }]
}

function buildCombinedBatches(packs, settings) {
  const lanes = normalizePlanningLanes(settings)
  const attributeTowerTopology = buildAttributeTowerTopologyBatches(packs, lanes)
  const laneBatches = lanes.filter(lane => !isAttributeTowerLane(lane)).map(lane => ({
    lane,
    batches: buildBatches(buildLaneOpportunities(packs, lane), lane.batchSize),
  }))

  const maxBatchCount = Math.max(
    0,
    ...laneBatches.map(entry => entry.batches.length),
    attributeTowerTopology.batches.length,
  )
  const batches = []
  for (let i = 0; i < maxBatchCount; i++) {
    const batch = []
    for (const entry of laneBatches) {
      batch.push(...(entry.batches[i] || []))
    }
    batch.push(...(attributeTowerTopology.batches[i] || []))
    sortBatchOpportunities(batch)
    batches.push(batch)
  }

  return {
    lanes,
    opportunities: [
      ...laneBatches.flatMap(entry => entry.batches.flat()),
      ...attributeTowerTopology.opportunities,
    ],
    batches,
  }
}

function makeStateKey(tierIndex, spent) {
  return `${tierIndex}|${spent}`
}

function comparePlan(a, b) {
  if (a.value !== b.value) return b.value - a.value
  if (a.purchases !== b.purchases) return b.purchases - a.purchases
  return a.spent - b.spent
}

function getPackOriginalValue(pack) {
  if (Number.isFinite(pack.originalValue)) return pack.originalValue
  if (Number.isFinite(pack.value) && Number.isFinite(pack.rechargeValue)) return pack.value - pack.rechargeValue
  return Number(pack.value) || 0
}

function getPackPaidDiamonds(pack) {
  if (Number.isFinite(pack.paidDiamonds)) return pack.paidDiamonds
  return paidDiamondsForPrice(pack.price)
}

function rechargeValueForPurchase(beforeSpent, addedCost, context) {
  const beforePaid = paidDiamondsForPrice(beforeSpent)
  const addedPaid = paidDiamondsForPrice(addedCost)
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

function isPermanentDiamondTopUpPack(pack) {
  const name = String(pack.name || '')
  return name.startsWith('钻石组合包') && !name.includes('首次')
}

function normalizePermanentTopUpPacks(packs) {
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

function nameForTopUpPack(pack) {
  return String(pack.name || pack.displayTrigger || '钻石组合包')
}

function mergeTopUpItems(packs) {
  const map = new Map()
  for (const pack of packs) {
    for (const item of pack.items || []) {
      const key = `${item.itype ?? item.ItemType}:${item.iid ?? item.ItemId}`
      if (!map.has(key)) {
        map.set(key, {
          ...item,
          qty: 0,
          value: 0,
        })
      }
      const current = map.get(key)
      current.qty += Number(item.qty ?? item.ItemCount) || 0
      current.value += Number(item.value) || 0
    }
  }
  return [...map.values()]
}

function groupTopUpPacks(packs) {
  const groups = new Map()
  for (const pack of packs) {
    const key = pack.topUpId || `${pack.name}:${pack.price}`
    if (!groups.has(key)) {
      groups.set(key, {
        pack,
        count: 0,
        copies: [],
      })
    }
    const group = groups.get(key)
    group.count += 1
    group.copies.push(pack)
  }

  return [...groups.values()].map(group => {
    const price = group.copies.reduce((sum, pack) => sum + pack.price, 0)
    const paidDiamonds = group.copies.reduce((sum, pack) => sum + getPackPaidDiamonds(pack), 0)
    const originalValue = group.copies.reduce((sum, pack) => sum + getPackOriginalValue(pack), 0)
    const label = group.count > 1
      ? `${nameForTopUpPack(group.pack)} ×${group.count}`
      : nameForTopUpPack(group.pack)

    return {
      trigger: TOP_UP_TRIGGER_RANGE,
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

function betterTopUpCandidate(candidate, current) {
  if (!current) return true
  if (candidate.value !== current.value) return candidate.value > current.value
  if (candidate.unlockedCount !== current.unlockedCount) return candidate.unlockedCount > current.unlockedCount
  if (candidate.cost !== current.cost) return candidate.cost < current.cost
  return candidate.purchases.length < current.purchases.length
}

function findBestPermanentTopUp(state, context) {
  if (!context.enablePermanentTopUp || !context.permanentPacks.length) return null
  if (state.purchases <= 0) return null

  const remainingBudget = context.budget - state.spent
  if (remainingBudget <= 0) return null
  const maxPackPrice = Math.max(...context.permanentPacks.map(pack => pack.price))
  const currentPaid = paidDiamondsForPrice(state.spent)
  const budgetToLastTier = Math.max(0, (MAX_DAILY_RECHARGE_PAID - currentPaid) * 2)
  const searchableBudget = Math.min(remainingBudget, budgetToLastTier + maxPackPrice)

  const dp = Array.from({ length: searchableBudget + 1 })
  dp[0] = { cost: 0, originalValue: 0, purchases: [] }

  for (let cost = 0; cost <= searchableBudget; cost++) {
    const base = dp[cost]
    if (!base) continue

    for (const pack of context.permanentPacks) {
      const nextCost = cost + pack.price
      if (nextCost > searchableBudget) continue
      const candidate = {
        cost: nextCost,
        originalValue: base.originalValue + getPackOriginalValue(pack),
        purchases: [...base.purchases, pack],
      }
      const current = dp[nextCost]
      if (!current || candidate.originalValue > current.originalValue) dp[nextCost] = candidate
    }
  }

  let best = null

  for (const candidate of dp) {
    if (!candidate || candidate.cost <= 0) continue

    const recharge = rechargeValueForPurchase(state.spent, candidate.cost, context)
    if (!recharge.unlockedTiers.length) continue

    const value = Math.round(candidate.originalValue + recharge.value)
    const topUpCandidate = {
      ...candidate,
      value,
      paidDiamonds: paidDiamondsForPrice(candidate.cost),
      recharge,
      unlockedCount: recharge.unlockedTiers.length,
      afterPaid: currentPaid + paidDiamondsForPrice(candidate.cost),
    }
    if (betterTopUpCandidate(topUpCandidate, best)) best = topUpCandidate
  }

  return best
}

function applyPermanentTopUp(state, context) {
  const topUp = findBestPermanentTopUp(state, context)
  if (!topUp) return state

  const step = {
    index: state.steps.length + 1,
    triggerRange: TOP_UP_TRIGGER_RANGE,
    tierPrice: null,
    nextTierPrice: context.priceTiers[state.tierIndex],
    bought: true,
    isTopUp: true,
    cost: topUp.cost,
    value: topUp.value,
    originalValue: Math.round(topUp.originalValue),
    rechargeValue: topUp.recharge.value,
    rechargeFreeDiamonds: topUp.recharge.freeDiamonds,
    rechargeBeforePaid: topUp.recharge.beforePaid,
    rechargeAfterPaid: topUp.recharge.afterPaid,
    unlockedRechargeTiers: topUp.recharge.unlockedTiers,
    purchases: groupTopUpPacks(topUp.purchases),
  }

  return {
    ...state,
    spent: state.spent + topUp.cost,
    value: state.value + topUp.value,
    topUpPurchaseCount: (state.topUpPurchaseCount || 0) + topUp.purchases.length,
    rechargeFreeDiamonds: (state.rechargeFreeDiamonds || 0) + topUp.recharge.freeDiamonds,
    steps: [...state.steps, step],
  }
}

function summarizeBatch(batch) {
  if (!batch.length) return ''
  if (batch.length === 1) return batch[0].displayTrigger || String(batch[0].trigger)

  const byLabel = new Map()
  for (const opportunity of batch) {
    const label = opportunity.label || ''
    if (!byLabel.has(label)) byLabel.set(label, [])
    byLabel.get(label).push(opportunity)
  }

  return [...byLabel.entries()].map(([label, opportunities]) => {
    const first = opportunities[0]
    const last = opportunities[opportunities.length - 1]
    const range = first.trigger === last.trigger ? first.trigger : `${first.trigger} - ${last.trigger}`
    return label ? `${label}: ${range}` : String(range)
  }).join('; ')
}

function actionOptionsForBatch(batch, tierPrice) {
  const offers = batch
    .map(opportunity => opportunity.packsByPrice.get(tierPrice))
    .filter(Boolean)
    .sort((a, b) => b.value - a.value)

  const actions = [{
    bought: false,
    cost: 0,
    originalValue: 0,
    paidDiamonds: 0,
    purchases: [],
  }]

  let totalCost = 0
  let totalOriginalValue = 0
  let totalPaidDiamonds = 0
  const selected = []
  for (const pack of offers) {
    totalCost += pack.price
    totalOriginalValue += getPackOriginalValue(pack)
    totalPaidDiamonds += getPackPaidDiamonds(pack)
    selected.push(pack)
    actions.push({
      bought: true,
      cost: totalCost,
      originalValue: totalOriginalValue,
      paidDiamonds: totalPaidDiamonds,
      purchases: [...selected],
    })
  }

  return actions
}

function summarizeAction(action, batchIndex, batch, tierPrice, nextTierPrice, recharge = null) {
  const rechargeValue = recharge?.value || 0
  const originalValue = action.originalValue || 0
  return {
    index: batchIndex + 1,
    triggerRange: summarizeBatch(batch),
    tierPrice,
    nextTierPrice,
    bought: action.bought,
    cost: action.cost,
    value: Math.round(originalValue + rechargeValue),
    originalValue: Math.round(originalValue),
    rechargeValue,
    rechargeFreeDiamonds: recharge?.freeDiamonds || 0,
    rechargeBeforePaid: recharge?.beforePaid || 0,
    rechargeAfterPaid: recharge?.afterPaid || 0,
    unlockedRechargeTiers: recharge?.unlockedTiers || [],
    purchases: action.purchases.map(pack => ({
      trigger: pack.trigger,
      sourceLabel: pack.plannerSourceLabel || '',
      displayTrigger: pack.plannerDisplayTrigger || String(pack.trigger),
      price: pack.price,
      value: getPackOriginalValue(pack),
      originalValue: getPackOriginalValue(pack),
      rechargeValue: 0,
      ce: pack.ce,
      items: pack.items || [],
    })),
  }
}

function createResult(state, context, meta = {}) {
  return {
    ...meta,
    budget: context.budget,
    spent: state.spent,
    remaining: context.budget - state.spent,
    value: Math.round(state.value),
    purchases: state.purchases,
    topUpPurchaseCount: state.topUpPurchaseCount || 0,
    rechargeFreeDiamonds: state.rechargeFreeDiamonds || 0,
    finalTierPrice: context.priceTiers[state.tierIndex],
    averageCe: state.spent > 0 ? state.value / (state.spent / 2) : 0,
    priceTiers: context.priceTiers,
    opportunityCount: context.opportunities.length,
    batchCount: context.batches.length,
    steps: state.steps,
  }
}

function createEmptyState(startTierIndex) {
  return {
    tierIndex: startTierIndex,
    spent: 0,
    value: 0,
    purchases: 0,
    topUpPurchaseCount: 0,
    rechargeFreeDiamonds: 0,
    steps: [],
  }
}

function buildPlanningContext(packs, settings) {
  const priceTiers = getPriceTiers(packs)
  const budget = Math.max(0, Math.floor(Number(settings.budget) || 0))
  const batchSize = Math.max(1, Math.floor(Number(settings.batchSize) || 1))
  const currentPrice = Number(settings.currentPrice) || priceTiers[0]
  const tierIndex = priceTiers.indexOf(currentPrice)
  const startTierIndex = clamp(tierIndex === -1 ? 0 : tierIndex, 0, priceTiers.length - 1)
  const combined = buildCombinedBatches(packs, settings)

  return {
    priceTiers,
    budget,
    batchSize,
    startTierIndex,
    freeDiamondScore: Number(settings.freeDiamondScore) || Number(settings.diamondScore) || 1,
    permanentPacks: normalizePermanentTopUpPacks(settings.permanentPacks || []),
    enablePermanentTopUp: settings.enablePermanentTopUp === true,
    lanes: combined.lanes,
    opportunities: combined.opportunities,
    batches: combined.batches,
    settings,
  }
}

function stateSignature(state) {
  return state.steps
    .map(step => `${step.tierPrice}:${step.purchases.map(pack => pack.displayTrigger || pack.trigger).join(',')}`)
    .join('|')
}

function insertRankedState(states, candidate, limit) {
  const signature = stateSignature(candidate)
  if (states.some(state => stateSignature(state) === signature)) return states

  const ranked = [...states, candidate].sort(comparePlan)
  return ranked.slice(0, limit)
}

function pruneStateMap(stateMap, maxStatesPerTier) {
  const byTier = new Map()
  for (const stateList of stateMap.values()) {
    for (const state of stateList) {
      if (!byTier.has(state.tierIndex)) byTier.set(state.tierIndex, [])
      byTier.get(state.tierIndex).push(state)
    }
  }

  const pruned = new Map()
  for (const states of byTier.values()) {
    const pareto = []
    let bestValue = -Infinity
    for (const state of states.sort((a, b) => {
      if (a.spent !== b.spent) return a.spent - b.spent
      return b.value - a.value
    })) {
      if (state.value <= bestValue) continue
      pareto.push(state)
      bestValue = state.value
    }

    const limited = pareto.sort(comparePlan).slice(0, maxStatesPerTier)
    for (const state of limited) {
      const key = makeStateKey(state.tierIndex, state.spent)
      const current = pruned.get(key) || []
      pruned.set(key, insertRankedState(current, state, 2))
    }
  }

  return pruned
}

function collectTopValuePlans(context, topK = 2) {
  const perStateLimit = Math.max(2, topK)
  const maxStatesPerTier = Math.max(50, Number(context.settings?.maxStatesPerTier) || DEFAULT_MAX_STATES_PER_TIER)
  let states = new Map()
  states.set(makeStateKey(context.startTierIndex, 0), [createEmptyState(context.startTierIndex)])

  for (const [batchIndex, batch] of context.batches.entries()) {
    const nextStates = new Map()

    for (const stateList of states.values()) {
      for (const state of stateList) {
        const tierPrice = context.priceTiers[state.tierIndex]
        const actions = actionOptionsForBatch(batch, tierPrice)

        for (const action of actions) {
          const spent = state.spent + action.cost
          if (spent > context.budget) continue

          const nextTierIndex = action.bought
            ? clamp(state.tierIndex + 1, 0, context.priceTiers.length - 1)
            : clamp(state.tierIndex - 1, 0, context.priceTiers.length - 1)

          const recharge = rechargeValueForPurchase(state.spent, action.cost, context)
          const actionValue = (action.originalValue || 0) + recharge.value
          const step = summarizeAction(action, batchIndex, batch, tierPrice, context.priceTiers[nextTierIndex], recharge)
          const candidate = {
            tierIndex: nextTierIndex,
            spent,
            value: state.value + actionValue,
            purchases: state.purchases + action.purchases.length,
            topUpPurchaseCount: state.topUpPurchaseCount || 0,
            rechargeFreeDiamonds: (state.rechargeFreeDiamonds || 0) + recharge.freeDiamonds,
            steps: [...state.steps, step],
          }
          const key = makeStateKey(nextTierIndex, spent)
          const current = nextStates.get(key) || []
          nextStates.set(key, insertRankedState(current, candidate, perStateLimit))
        }
      }
    }

    states = pruneStateMap(nextStates, maxStatesPerTier)
    if (states.size === 0) break
  }

  const allStates = []
  for (const stateList of states.values()) allStates.push(...stateList)

  const ranked = []
  for (const state of allStates.sort(comparePlan)) {
    const signature = stateSignature(state)
    if (!ranked.some(existing => stateSignature(existing) === signature)) ranked.push(state)
    if (ranked.length >= topK) break
  }

  if (!ranked.length) ranked.push(createEmptyState(context.startTierIndex))
  return ranked
}

function makePolicyAction(policy, offers, state, context) {
  if (!offers.length) {
    return { bought: false, cost: 0, value: 0, purchases: [] }
  }

  if (policy === 'smallPack') {
    if (state.tierIndex !== 0) return { bought: false, cost: 0, value: 0, purchases: [] }
    const best = offers[0]
    if (state.spent + best.price > context.budget) return { bought: false, cost: 0, value: 0, purchases: [] }
    return { bought: true, cost: best.price, originalValue: getPackOriginalValue(best), paidDiamonds: getPackPaidDiamonds(best), purchases: [best] }
  }

  if (policy === 'maxPack') {
    if (state.tierIndex < context.priceTiers.length - 1) {
      const best = offers[0]
      if (state.spent + best.price > context.budget) return { bought: false, cost: 0, value: 0, purchases: [] }
      return { bought: true, cost: best.price, originalValue: getPackOriginalValue(best), paidDiamonds: getPackPaidDiamonds(best), purchases: [best] }
    }

    let cost = 0
    let originalValue = 0
    let paidDiamonds = 0
    const purchases = []
    for (const pack of offers) {
      if (state.spent + cost + pack.price > context.budget) break
      cost += pack.price
      originalValue += getPackOriginalValue(pack)
      paidDiamonds += getPackPaidDiamonds(pack)
      purchases.push(pack)
    }
    return purchases.length
      ? { bought: true, cost, originalValue, paidDiamonds, purchases }
      : { bought: false, cost: 0, value: 0, purchases: [] }
  }

  return { bought: false, cost: 0, value: 0, purchases: [] }
}

function simulatePolicyPlan(context, policy) {
  let state = createEmptyState(context.startTierIndex)

  for (const [batchIndex, batch] of context.batches.entries()) {
    const tierPrice = context.priceTiers[state.tierIndex]
    const offers = batch
      .map(opportunity => opportunity.packsByPrice.get(tierPrice))
      .filter(Boolean)
      .sort((a, b) => b.value - a.value)

    const action = makePolicyAction(policy, offers, state, context)
    const nextTierIndex = action.bought
      ? clamp(state.tierIndex + 1, 0, context.priceTiers.length - 1)
      : clamp(state.tierIndex - 1, 0, context.priceTiers.length - 1)

    const recharge = rechargeValueForPurchase(state.spent, action.cost, context)
    const actionValue = (action.originalValue || 0) + recharge.value
    const step = summarizeAction(action, batchIndex, batch, tierPrice, context.priceTiers[nextTierIndex], recharge)
    state = {
      tierIndex: nextTierIndex,
      spent: state.spent + action.cost,
      value: state.value + actionValue,
      purchases: state.purchases + action.purchases.length,
      topUpPurchaseCount: state.topUpPurchaseCount || 0,
      rechargeFreeDiamonds: (state.rechargeFreeDiamonds || 0) + recharge.freeDiamonds,
      steps: [...state.steps, step],
    }
  }

  return state
}

export function paidDiamondsForPrice(price) {
  return Math.round(price / 2)
}

function formatSkipPlanRow(row) {
  const triggerRange = row.skipCount === 1
    ? row.triggerRange
    : `${row.triggerRanges[0]} ... ${row.triggerRanges[row.triggerRanges.length - 1]}`

  return {
    ...row,
    rowKey: `skip-${row.startIndex}-${row.endIndex}`,
    indexLabel: row.startIndex === row.endIndex ? String(row.startIndex) : `${row.startIndex}-${row.endIndex}`,
    triggerRange,
    cost: 0,
    value: 0,
    purchases: [],
  }
}

export function compressUltraSalePlanSteps(steps = []) {
  const rows = []
  let pendingSkip = null

  for (const step of steps) {
    if (!step.bought) {
      if (!pendingSkip) {
        pendingSkip = {
          ...step,
          rowKey: `skip-${step.index}`,
          startIndex: step.index,
          endIndex: step.index,
          skipCount: 1,
          triggerRanges: [step.triggerRange],
        }
      } else {
        pendingSkip.endIndex = step.index
        pendingSkip.skipCount += 1
        pendingSkip.triggerRanges.push(step.triggerRange)
        pendingSkip.nextTierPrice = step.nextTierPrice
      }
      continue
    }

    if (pendingSkip) {
      rows.push(formatSkipPlanRow(pendingSkip))
      pendingSkip = null
    }
    rows.push({
      ...step,
      rowKey: step.isTopUp ? `top-up-${step.index}` : `buy-${step.index}`,
      indexLabel: step.isTopUp ? '补包' : String(step.index),
      skipCount: 0,
    })
  }

  if (pendingSkip) rows.push(formatSkipPlanRow(pendingSkip))
  return rows
}

export function planUltraSalePurchases(packs, settings = {}) {
  const context = buildPlanningContext(packs, settings)
  const states = collectTopValuePlans(context, context.enablePermanentTopUp ? 12 : 1)
    .map(state => applyPermanentTopUp(state, context))
    .sort(comparePlan)
  return createResult(states[0], context)
}

export function buildUltraSalePlanOptions(packs, settings = {}) {
  const context = buildPlanningContext(packs, settings)
  const rankedStates = collectTopValuePlans(context, context.enablePermanentTopUp ? 12 : 2)
    .map(state => applyPermanentTopUp(state, context))
    .sort(comparePlan)
  const [bestState, secondState] = rankedStates
  const smallPackState = applyPermanentTopUp(simulatePolicyPlan(context, 'smallPack'), context)
  const maxPackState = applyPermanentTopUp(simulatePolicyPlan(context, 'maxPack'), context)

  return [
    createResult(bestState, context, {
      id: 'bestValue',
      label: '价值最优',
      description: '预算内最大化总评分价值。',
    }),
    createResult(secondState || bestState, context, {
      id: 'secondValue',
      label: '次优方案',
      description: secondState ? '价值排名第二的可行路径。' : '当前条件下没有独立次优路径。',
      unavailable: !secondState,
    }),
    createResult(smallPackState, context, {
      id: 'smallPack',
      label: '只买小包',
      description: '只在最低档购买，升档后等待掉回最低档。',
    }),
    createResult(maxPackState, context, {
      id: 'maxPack',
      label: '冲最大包',
      description: '先每批买 1 个升档，到最高档后尽量购买高档包。',
    }),
  ]
}

export const __testables = {
  parseTriggerProgress,
  buildOpportunities,
  buildBatches,
  buildDerivedAllTowerEntries,
  buildAttributeTowerTopologyBatches,
}
