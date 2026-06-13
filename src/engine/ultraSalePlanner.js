import { DAILY_RECHARGE_BONUS_TIERS, marginalFreeDiamonds, unlockedRechargeTiers, cumulativeFreeDiamonds } from './dailyRechargeBonus.js'
import { parseMainQuestProgress } from './mainQuestProgress.js'

const DEFAULT_PRICE_TIERS = [160, 650, 1000, 1500, 3000, 6000, 11800]
const DEFAULT_MAX_STATES = 350
const DEFAULT_DAILY_RECHARGE_RESET_PAID = 12000
const RUSH_RECHARGE_RESET_COST_MULTIPLIER = 4
const SMALL_PACK_PAID_DIAMONDS = 80
const MID_TIER_PAID_DIAMONDS = 3000
const KEEP_TIER_MIN_PAID_DIAMONDS = 1500
const BASELINE_PAID_DIAMONDS = 5900
const STANDARD_HARD_CURRENCY_ITEM_KEYS = new Set([
  '16:1',
  '16:4',
  '17:107',
  '17:118',
])
const SECONDARY_HARD_CURRENCY_ITEM_KEYS = new Set([
  '16:7',
  '16:12',
  '24:1',
])
const PREFERENCE_CE_MULTIPLIERS = {
  conservative: 1.25,
  balanced: 1,
  aggressive: 0.75,
}
const TOP_UP_SOURCE_LABEL = '每日累充补包'
const ALL_ATTRIBUTE_TOWER = 'origin_group_all_towers'
const ATTRIBUTE_TOWERS = [
  'origin_tower_blue',
  'origin_tower_red',
  'origin_tower_green',
  'origin_tower_yellow',
]

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

function isAttributeTowerLane(lane) {
  return lane.cat === 'tower' && ATTRIBUTE_TOWERS.includes(lane.tower)
}

function paidDiamondsForPriceValue(price) {
  return Math.round(price / 2)
}

export function paidDiamondsForPrice(price) {
  return paidDiamondsForPriceValue(price)
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

function itemKey(item) {
  const itemType = item?.itype ?? item?.ItemType ?? item?.itemType
  const itemId = item?.iid ?? item?.ItemId ?? item?.itemId
  if (!Number.isFinite(Number(itemType)) || !Number.isFinite(Number(itemId))) return ''
  return `${Number(itemType)}:${Number(itemId)}`
}

function packContainsItemKey(pack, itemKeys) {
  return (pack.items || []).some(item => itemKeys.has(itemKey(item)))
}

function median(values) {
  const sorted = values
    .map(Number)
    .filter(value => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b)
  if (!sorted.length) return 0
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

function packBaselineCe(pack) {
  const ce = Number(pack.ce)
  if (Number.isFinite(ce) && ce > 0) return ce
  const paidDiamonds = getPackPaidDiamonds(pack)
  return paidDiamonds > 0 ? getPackOriginalValue(pack) / paidDiamonds : 0
}

function deriveHardCurrencyBaselineCe(packs) {
  const baselineTierPacks = packs.filter(pack => getPackPaidDiamonds(pack) === BASELINE_PAID_DIAMONDS)
  const standard = baselineTierPacks
    .filter(pack => packContainsItemKey(pack, STANDARD_HARD_CURRENCY_ITEM_KEYS))
    .map(packBaselineCe)
  const standardBaseline = median(standard)
  if (standardBaseline > 0) return standardBaseline

  const secondary = baselineTierPacks
    .filter(pack => packContainsItemKey(pack, SECONDARY_HARD_CURRENCY_ITEM_KEYS))
    .map(packBaselineCe)
  return median(secondary)
}

function resolvePreferenceBaselineCe(packs, settings) {
  const explicitBaseline = Number(settings.preferenceBaselineCe)
  if (Number.isFinite(explicitBaseline) && explicitBaseline > 0) return explicitBaseline
  const derivedBaseline = deriveHardCurrencyBaselineCe(packs)
  return derivedBaseline > 0 ? derivedBaseline : 3.0
}

export function preferenceCeForLevel(packs, preferenceLevel = 'balanced', settings = {}) {
  const preferenceBaselineCe = resolvePreferenceBaselineCe(packs, settings)
  const customExpectedRatio = Number(settings.customExpectedRatio)
  if (preferenceLevel === 'custom' && Number.isFinite(customExpectedRatio) && customExpectedRatio > 0) {
    return {
      preferenceBaselineCe,
      expectedRatio: customExpectedRatio,
    }
  }
  const preferenceMultiplier = PREFERENCE_CE_MULTIPLIERS[preferenceLevel] || PREFERENCE_CE_MULTIPLIERS.balanced
  return {
    preferenceBaselineCe,
    expectedRatio: preferenceBaselineCe * preferenceMultiplier,
  }
}

function normalizePlanningLanes(settings) {
  if (Array.isArray(settings.lanes) && settings.lanes.length) {
    return settings.lanes
      .filter(lane => lane.enabled !== false)
      .map(lane => {
        const normalized = {
          ...lane,
          cat: lane.cat || lane.source || 'tower',
        }
        return {
          ...normalized,
          batchSize: isAttributeTowerLane(normalized)
            ? 1
            : Math.max(1, Math.floor(Number(lane.batchSize) || Number(settings.batchSize) || 1)),
        }
      })
  }

  return [{
    id: settings.source === 'tower' ? `tower:${settings.tower || 'origin_tower_infinite'}` : settings.source || 'tower',
    cat: settings.source || 'tower',
    tower: settings.tower || 'origin_tower_infinite',
    label: settings.label,
    startProgress: settings.startProgress,
    endProgress: settings.endProgress,
    batchSize: Math.max(1, Math.floor(Number(settings.batchSize) || 1)),
  }]
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
        id: key,
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
  for (let i = 0; i < opportunities.length; i += size) batches.push(opportunities.slice(i, i + size))
  return batches
}

function sortOpportunities(opportunities) {
  return [...opportunities].sort((a, b) => {
    const labelOrder = String(a.label || '').localeCompare(String(b.label || ''))
    if (labelOrder !== 0) return labelOrder
    if (a.sortValue !== b.sortValue) return a.sortValue - b.sortValue
    return String(a.trigger).localeCompare(String(b.trigger), undefined, { numeric: true })
  })
}

function buildAttributeTowerEvents(packs, lanes) {
  const attributeLanes = lanes.filter(isAttributeTowerLane)
  if (!attributeLanes.length) return []

  const singleEvents = []
  for (const lane of attributeLanes) {
    for (const opportunity of buildLaneOpportunities(packs, { ...lane, batchSize: 1 })) {
      singleEvents.push({
        kind: 'single',
        sortValue: opportunity.sortValue,
        topologyKey: `single:${opportunity.sortValue}`,
        opportunities: [opportunity],
      })
    }
  }

  const allTowerEvents = []
  if (ATTRIBUTE_TOWERS.every(tower => attributeLanes.some(lane => lane.tower === tower))) {
    const start = Math.min(...attributeLanes.map(lane => parseLaneProgress(lane.startProgress, lane)))
    const end = Math.min(...attributeLanes.map(lane => parseLaneProgress(lane.endProgress, lane)))
    if (end > start) {
      const allTowerLane = {
        id: 'tower_all_derived',
        cat: 'tower',
        tower: ALL_ATTRIBUTE_TOWER,
        label: '全属性塔抵达',
        startProgress: start,
        endProgress: end,
        batchSize: 1,
      }
      for (const opportunity of buildLaneOpportunities(packs, allTowerLane)) {
        allTowerEvents.push({
          kind: 'all',
          sortValue: opportunity.sortValue,
          topologyKey: `all:${opportunity.sortValue}`,
          opportunities: [opportunity],
        })
      }
    }
  }

  return [...singleEvents, ...allTowerEvents]
    .sort((a, b) => {
      if (a.sortValue !== b.sortValue) return a.sortValue - b.sortValue
      if (a.kind === b.kind) return 0
      return a.kind === 'all' ? -1 : 1
    })
    .map((event, index) => ({
      id: `attribute:${index}:${event.kind}:${event.sortValue}`,
      opportunities: sortOpportunities(event.opportunities),
      sortValue: event.sortValue,
      kind: event.kind,
      topologyKey: event.topologyKey,
    }))
}

function buildAttributeTowerTopologyBatches(packs, lanes) {
  const events = buildAttributeTowerEvents(packs, lanes)
  const batches = events.map(event => event.opportunities)
  return {
    batches,
    opportunities: batches.flat(),
  }
}

function attributeTowerSourceId(lane) {
  return lane.id || `tower:${lane.tower}`
}

function buildPlanningSources(packs, settings) {
  const lanes = normalizePlanningLanes(settings)
  const sources = []

  for (const lane of lanes.filter(lane => !isAttributeTowerLane(lane))) {
    const opportunities = buildLaneOpportunities(packs, lane)
    if (!opportunities.length) continue
    sources.push({
      id: lane.id || `${lane.cat}:${lane.tower || 'all'}`,
      label: laneLabel(lane),
      batchSize: Math.max(1, Number(lane.batchSize) || 1),
      groups: opportunities.map((opportunity, index) => ({
        id: `${opportunity.id}:${index}`,
        opportunities: [opportunity],
        sortValue: opportunity.sortValue,
      })),
    })
  }

  const attributeSourceIndices = new Map()
  for (const lane of lanes.filter(isAttributeTowerLane)) {
    const opportunities = buildLaneOpportunities(packs, { ...lane, batchSize: 1 })
    const sourceIndex = sources.length
    attributeSourceIndices.set(lane.tower, sourceIndex)
    sources.push({
      id: attributeTowerSourceId(lane),
      label: laneLabel(lane),
      batchSize: 1,
      attributeTower: lane.tower,
      attributeStartProgress: parseLaneProgress(lane.startProgress, lane),
      attributeEndProgress: parseLaneProgress(lane.endProgress, lane),
      groups: opportunities.map((opportunity, index) => ({
        id: `${opportunity.id}:${index}`,
        opportunities: [opportunity],
        sortValue: opportunity.sortValue,
        attributeLayer: opportunity.sortValue,
        attributeKind: 'single',
      })),
    })
  }

  const attributeLanes = lanes.filter(isAttributeTowerLane)
  if (ATTRIBUTE_TOWERS.every(tower => attributeSourceIndices.has(tower))) {
    const start = Math.min(...attributeLanes.map(lane => parseLaneProgress(lane.startProgress, lane)))
    const end = Math.min(...attributeLanes.map(lane => parseLaneProgress(lane.endProgress, lane)))
    if (end > start) {
      const allTowerLane = {
        id: 'tower_all_derived',
        cat: 'tower',
        tower: ALL_ATTRIBUTE_TOWER,
        label: '全属性塔抵达',
        startProgress: start,
        endProgress: end,
        batchSize: 1,
      }
      const opportunities = buildLaneOpportunities(packs, allTowerLane)
      if (opportunities.length) {
        sources.push({
          id: 'attribute_all_towers',
          label: '全属性塔抵达',
          batchSize: 1,
          attributeKind: 'all',
          allAttributeTowerSourceIndices: ATTRIBUTE_TOWERS.map(tower => attributeSourceIndices.get(tower)),
          groups: opportunities.map((opportunity, index) => ({
            id: `${opportunity.id}:${index}`,
            opportunities: [opportunity],
            sortValue: opportunity.sortValue,
            attributeLayer: opportunity.sortValue,
            attributeKind: 'all',
          })),
        })
      }
    }
  }

  return { lanes, sources }
}

function sourceCursorsKey(cursors) {
  return cursors.join(',')
}

function stateTransitionKey(state) {
  return `${sourceCursorsKey(state.sourceCursors)}|${attributeTowerSetKey(state.currentDayAttributeTowers)}`
}

function allSourcesExhausted(sources, cursors) {
  return sources.every((source, index) => cursors[index] >= source.groups.length)
}

function batchIdForGroups(groups) {
  return groups.map(group => group.id).join('+')
}

function attributeTowerSetKey(towers = []) {
  return [...new Set(towers)].sort().join(',')
}

function mergeAttributeTowerSets(...sets) {
  return [...new Set(sets.flat().filter(Boolean))].sort()
}

function attributeTowerSetIntersects(a = [], b = []) {
  const lookup = new Set(a)
  return b.some(tower => lookup.has(tower))
}

function attributeTowerSetSubset(a = [], b = []) {
  const lookup = new Set(b)
  return a.every(tower => lookup.has(tower))
}

function attributeTowersForGroups(groupsBySource, sources) {
  const towers = []
  for (const [sourceIndexText, groups] of Object.entries(groupsBySource)) {
    if (!groups.length) continue
    const tower = sources[Number(sourceIndexText)]?.attributeTower
    if (tower) towers.push(tower)
  }
  return attributeTowerSetKey(towers).split(',').filter(Boolean)
}

function attributeTowerGateInterval(sourceIndex, state, sources) {
  const towerSource = sources[sourceIndex]
  if (!towerSource) return null
  const cursor = state.sourceCursors[sourceIndex] || 0
  const previous = cursor > 0
    ? towerSource.groups[cursor - 1]?.sortValue
    : towerSource.attributeStartProgress
  const next = cursor < towerSource.groups.length
    ? towerSource.groups[cursor]?.sortValue
    : towerSource.attributeEndProgress
  if (!Number.isFinite(previous) || !Number.isFinite(next)) return null
  return { sourceIndex, previous, next }
}

function allAttributeTowerGroupAvailable(source, group, state, sources) {
  if (!source.allAttributeTowerSourceIndices?.length) return true
  const layer = group.sortValue
  return source.allAttributeTowerSourceIndices.every(sourceIndex => {
    const interval = attributeTowerGateInterval(sourceIndex, state, sources)
    return interval
      && layer > interval.previous
      && layer <= interval.next
  })
}

function blockedTowerSourcesForAllAttributeGroup(source, group, state, sources) {
  if (!source.allAttributeTowerSourceIndices?.length) return []
  const layer = group.sortValue
  const intervals = source.allAttributeTowerSourceIndices
    .map(sourceIndex => attributeTowerGateInterval(sourceIndex, state, sources))
    .filter(Boolean)
    
  if (intervals.length !== source.allAttributeTowerSourceIndices.length) return []
  
  const slowestPrevious = Math.min(...intervals.map(interval => interval.previous))
  
  // Only block if the allTower pack is actually being unlocked by this slowest tower NOW
  // meaning the slowest tower's current interval "contains" the layer.
  const slowestInterval = intervals.find(i => i.previous === slowestPrevious)
  if (!(layer > slowestInterval.previous && layer <= slowestInterval.next)) {
    return []
  }
  
  return intervals
    .filter(interval => interval.previous === slowestPrevious)
    .map(interval => interval.sourceIndex)
}

function allAttributeBatchValid(groupsBySource, sources, state) {
  if (!state) return true
  for (const [sourceIndexText, groups] of Object.entries(groupsBySource)) {
    const source = sources[Number(sourceIndexText)]
    if (!source?.allAttributeTowerSourceIndices?.length) continue
    for (const group of groups) {
      for (const blockedSourceIndex of blockedTowerSourcesForAllAttributeGroup(source, group, state, sources)) {
        if (groupsBySource[blockedSourceIndex]?.length) return false
      }
    }
  }
  return true
}

function makeBatchCandidate(groupsBySource, sources, state = null) {
  if (!allAttributeBatchValid(groupsBySource, sources, state)) return null
  const opportunities = []
  const cursorDelta = Array.from({ length: sources.length }, () => 0)
  let sourceCount = 0
  const attributeTowers = attributeTowersForGroups(groupsBySource, sources)
  let requiresRechargeReset = state
    ? attributeTowerSetIntersects(state.currentDayAttributeTowers, attributeTowers)
    : false
  for (const [sourceIndexText, groups] of Object.entries(groupsBySource)) {
    const sourceIndex = Number(sourceIndexText)
    if (!groups.length) continue
    sourceCount += 1
    cursorDelta[sourceIndex] = groups.length
    const source = sources[sourceIndex]
    if (state && source?.forceRechargeResetBetweenGroups && state.sourceCursors[sourceIndex] > 0) {
      const previousGroup = source.groups[state.sourceCursors[sourceIndex] - 1]
      const nextGroup = groups[0]
      if (previousGroup?.topologyKey && nextGroup?.topologyKey && previousGroup.topologyKey !== nextGroup.topologyKey) {
        requiresRechargeReset = true
      }
    }
    for (const group of groups) opportunities.push(...group.opportunities)
  }
  const sorted = sortOpportunities(opportunities)
  const pressure = sorted.length + Math.max(0, sourceCount - 1)
  return {
    id: batchIdForGroups(Object.values(groupsBySource).flat()),
    opportunities: sorted,
    cursorDelta,
    pressure,
    sourceCount,
    attributeTowers,
    requiresRechargeReset,
  }
}

function sourcePrefixOptions(source, cursor, state, sources) {
  const remaining = source.groups.length - cursor
  if (remaining <= 0) return []
  if (source.allAttributeTowerSourceIndices && !allAttributeTowerGroupAvailable(source, source.groups[cursor], state, sources)) {
    return []
  }
  let maxTake = Math.min(source.batchSize, remaining)
  if (source.limitPrefixToSameTopology) {
    const topologyKey = source.groups[cursor]?.topologyKey
    let sameTopologyCount = 0
    while (
      sameTopologyCount < maxTake
      && source.groups[cursor + sameTopologyCount]?.topologyKey === topologyKey
    ) {
      sameTopologyCount += 1
    }
    maxTake = Math.max(1, sameTopologyCount)
  }
  const options = []
  for (let count = 1; count <= maxTake; count++) {
    options.push(source.groups.slice(cursor, cursor + count))
  }
  return options
}

function generateBatchCandidates(state, context) {
  const cacheKey = stateTransitionKey(state)
  const cached = context.batchCandidateCache?.get(cacheKey)
  if (cached) return cached

  const { sources } = context
  const candidates = new Map()
  const activeOptions = []

  for (let sourceIndex = 0; sourceIndex < sources.length; sourceIndex++) {
    const source = sources[sourceIndex]
    const options = sourcePrefixOptions(source, state.sourceCursors[sourceIndex], state, sources)
    if (!options.length) continue
    activeOptions.push({ sourceIndex, options })

    for (const groups of options) {
      const candidate = makeBatchCandidate({ [sourceIndex]: groups }, sources, state)
      if (candidate) candidates.set(candidate.id, candidate)
    }
  }

  const maxCrossSources = Math.min(activeOptions.length, Number(context.settings.maxCrossSources) || 5)
  const cappedSources = activeOptions.slice(0, maxCrossSources)
  const comboLimit = Math.max(20, Number(context.settings.maxBatchCandidates) || 120)

  function addCross(index, selected) {
    if (candidates.size >= comboLimit) return
    if (index >= cappedSources.length) {
      if (Object.keys(selected).length < 2) return
      const candidate = makeBatchCandidate(selected, sources, state)
      if (candidate) candidates.set(candidate.id, candidate)
      return
    }

    addCross(index + 1, selected)

    const { sourceIndex, options } = cappedSources[index]
    const first = options[0]
    addCross(index + 1, { ...selected, [sourceIndex]: first })

    const maxPrefix = options[options.length - 1]
    if (maxPrefix !== first) addCross(index + 1, { ...selected, [sourceIndex]: maxPrefix })
  }

  addCross(0, {})

  const result = [...candidates.values()]
    .filter(candidate => candidate.opportunities.length)
    .sort((a, b) => {
      if (a.pressure !== b.pressure) return a.pressure - b.pressure
      return b.opportunities.length - a.opportunities.length
    })
    .slice(0, comboLimit)

  context.batchCandidateCache?.set(cacheKey, result)
  return result
}

function rechargeValueForPaid(beforePaid, addedPaid, context) {
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

function rechargeValueForPurchase(beforeSpent, addedCost, context) {
  return rechargeValueForPaid(paidDiamondsForPrice(beforeSpent), paidDiamondsForPrice(addedCost), context)
}

function actionOptionsCacheKey(batch, tierPrice) {
  return `${tierPrice}|${batch.map(opportunity => opportunity.id).join('+')}`
}

function actionOptionsForBatch(batch, tierPrice, context = null) {
  const cacheKey = actionOptionsCacheKey(batch, tierPrice)
  const cached = context?.actionOptionsCache?.get(cacheKey)
  if (cached) return cached

  const offers = batch
    .map(opportunity => opportunity.packsByPrice.get(tierPrice))
    .filter(Boolean)
    .sort((a, b) => getPackOriginalValue(b) - getPackOriginalValue(a))

  const actions = [{
    bought: false,
    limitedCostYen: 0,
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
      limitedCostYen: totalCost,
      cost: totalCost,
      originalValue: totalOriginalValue,
      paidDiamonds: totalPaidDiamonds,
      purchases: [...selected],
    })
  }

  context?.actionOptionsCache?.set(cacheKey, actions)
  return actions
}

function nameForTopUpPack(pack) {
  return String(pack.name || pack.displayTrigger || '钻石组合包')
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

function groupTopUpPacks(packs) {
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

function getDailyRechargeResetPaid(context) {
  if (context.settings.rechargePlanningMode === 'rush') return 0
  const configured = Number(context.settings.dailyRechargeResetPaid)
  return Number.isFinite(configured)
    ? Math.max(0, Math.floor(configured))
    : DEFAULT_DAILY_RECHARGE_RESET_PAID
}

function getDailyRechargeTargetPaid(context) {
  if (context.settings.rechargePlanningMode === 'rush') {
    return DAILY_RECHARGE_BONUS_TIERS[DAILY_RECHARGE_BONUS_TIERS.length - 1].paid
  }
  const resetPaid = getDailyRechargeResetPaid(context)
  return resetPaid > 0 ? resetPaid : DAILY_RECHARGE_BONUS_TIERS[DAILY_RECHARGE_BONUS_TIERS.length - 1].paid
}

function nextPlannerRechargeTier(currentPaid, context) {
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

function findHeuristicTopUpCombination(gap, packs, prepared = null) {
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

function buildPermanentTopUpOptionCache(context) {
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

function findPermanentTopUpOption(state, context) {
  if (!context.permanentPacks.length || state.purchases <= 0) return null

  const currentPaid = state.dailyPaidDiamonds
  const cached = context.topUpOptionByCurrentPaid?.[currentPaid]
  if (cached) return cached

  const targetTier = nextPlannerRechargeTier(currentPaid, context)
  if (!targetTier) return null

  const combo = findHeuristicTopUpCombination(targetTier.paid - currentPaid, context.permanentPacks)
  if (!combo) return null
  
  // 组装最终方案返回
  const totalPaid = combo.paidDiamonds
  const totalCost = combo.cost
  const totalOriginalValue = combo.originalValue
  const recharge = rechargeValueForPaid(currentPaid, totalPaid, context)
  
  return {
    cost: totalCost,
    originalValue: totalOriginalValue,
    purchases: combo.purchases,
    paidDiamonds: totalPaid,
    recharge,
    value: Math.round(totalOriginalValue + recharge.value),
    unlockedCount: recharge.unlockedTiers.length,
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

function summarizeOpportunity(opportunity, tierPrice, purchasedPacks) {
  const pack = opportunity.packsByPrice.get(tierPrice)
  const purchased = !!pack && purchasedPacks.includes(pack)
  return {
    label: opportunity.label || '',
    trigger: opportunity.trigger,
    displayTrigger: opportunity.displayTrigger || String(opportunity.trigger),
    sortValue: opportunity.sortValue,
    tierPrice,
    hasPackAtTier: !!pack,
    purchased,
    price: pack?.price || 0,
    value: pack ? getPackOriginalValue(pack) : 0,
    ce: pack?.ce || 0,
  }
}

function summarizeAction(action, stepIndex, batch, tierPrice, nextTierPrice, recharge, meta = {}) {
  const originalValue = action.originalValue || 0
  const rechargeValue = recharge?.value || 0
  const opportunities = batch.map(opportunity => summarizeOpportunity(opportunity, tierPrice, action.purchases))
  return {
    index: stepIndex + 1,
    rechargeDayIndex: meta.rechargeDayIndex || 0,
    triggerRange: summarizeBatch(batch),
    opportunities,
    skippedOpportunities: opportunities.filter(opportunity => !opportunity.purchased),
    tierPrice,
    nextTierPrice,
    bought: action.bought,
    cost: action.limitedCostYen || 0,
    limitedCostYen: action.limitedCostYen || 0,
    topUpCost: 0,
    value: Math.round(originalValue + rechargeValue),
    originalValue: Math.round(originalValue),
    rechargeValue,
    rechargeFreeDiamonds: recharge?.freeDiamonds || 0,
    rechargeBeforePaid: recharge?.beforePaid || 0,
    rechargeAfterPaid: recharge?.afterPaid || 0,
    unlockedRechargeTiers: recharge?.unlockedTiers || [],
    pressure: meta.pressure || 0,
    moneySurplus: meta.moneySurplus || 0,
    waitType: action.bought ? 'buy' : 'timeout',
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

function stepsSignature(steps) {
  return steps
    .map(step => {
      const purchases = step.purchases.map(pack => pack.displayTrigger || pack.trigger).join(',')
      const topUps = (step.topUpPacks || []).map(pack => pack.displayTrigger).join(',')
      return `${step.tierPrice}:${step.triggerRange}:${purchases}:topUp:${topUps}`
    })
    .join('|')
}

function stateSignature(state) {
  return state.signature || stepsSignature(state.steps)
}

function appendStepSignature(state, step) {
  const current = stateSignature(state)
  const purchases = step.purchases.map(pack => pack.displayTrigger || pack.trigger).join(',')
  const next = `${step.tierPrice}:${step.triggerRange}:${purchases}:day:${step.rechargeDayIndex}`
  return current ? `${current}|${next}` : next
}

function getGapBand(gap) {
  if (gap <= 0) return 0
  if (gap <= 80) return 1
  if (gap <= 325) return 2
  if (gap <= 500) return 3
  if (gap <= 750) return 4
  if (gap <= 1500) return 5
  if (gap <= 3000) return 6
  if (gap <= 5900) return 7
  return 8
}

function getRewardTierIndex(paid) {
  let index = -1
  for (let i = 0; i < DAILY_RECHARGE_BONUS_TIERS.length; i++) {
    if (paid >= DAILY_RECHARGE_BONUS_TIERS[i].paid) index = i
    else break
  }
  return index
}

function getRechargeBucket(paid, context) {
  const nextTier = nextPlannerRechargeTier(paid, context)
  const rewardTierIndex = getRewardTierIndex(paid)
  const gap = nextTier ? nextTier.paid - paid : 0
  const nextGapBand = getGapBand(gap)
  if (context.envelope) {
    const potentialBand = Math.floor(getHeuristicRechargePotential(paid, context) / 500)
    return `${rewardTierIndex}|${nextGapBand}|${potentialBand}`
  }
  return `${rewardTierIndex}|${nextGapBand}`
}

function getHeuristicRechargePotential(paid, context) {
  if (!context.envelope || paid >= context.envelope.length) return 0
  const sx = cumulativeFreeDiamonds(paid) * context.freeDiamondScore
  return Math.max(0, context.envelope[paid] - sx)
}

function makeStateKey(state, context) {
  return [
    state.tierIndex,
    sourceCursorsKey(state.sourceCursors),
    attributeTowerSetKey(state.currentDayAttributeTowers),
    getRechargeBucket(state.dailyPaidDiamonds, context),
  ].join('|')
}

function comparePlan(a, b) {
  const aPriority = Number.isFinite(a.searchPriority) ? a.searchPriority : a.realScore
  const bPriority = Number.isFinite(b.searchPriority) ? b.searchPriority : b.realScore
  if (aPriority !== bPriority) return bPriority - aPriority
  if (a.realScore !== b.realScore) return b.realScore - a.realScore
  if (a.pressure !== b.pressure) return a.pressure - b.pressure
  return a.limitedSpentYen - b.limitedSpentYen
}

function compareRealizedPlan(a, b) {
  if (a.realScore !== b.realScore) return b.realScore - a.realScore
  if (a.moneySurplus !== b.moneySurplus) return b.moneySurplus - a.moneySurplus
  if (a.pressure !== b.pressure) return a.pressure - b.pressure
  return a.totalSpentYen - b.totalSpentYen
}

function statePurchasedPacks(state) {
  return state.steps.flatMap(step => step.purchases || [])
}

function stateAverageCe(state) {
  return state.totalSpentYen > 0 ? state.value / (state.totalSpentYen / 2) : 0
}

function purchasePaidDiamonds(purchase) {
  return getPackPaidDiamonds(purchase)
}

function purchasedPacksMeetCeThreshold(state, context) {
  const threshold = context.strategyCeThreshold
  return statePurchasedPacks(state).every(pack => (Number(pack.ce) || 0) >= threshold)
}

function hasFullTierDropWait(state) {
  return (state.steps || []).some(step => !step.bought && step.nextTierPrice < step.tierPrice)
}

function hasPartialPackSkip(state) {
  return (state.steps || []).some(step => step.bought && (step.skippedOpportunities?.length || 0) > 0)
}

function countPurchasesByPaidDiamonds(state, paidDiamonds) {
  return statePurchasedPacks(state)
    .filter(pack => purchasePaidDiamonds(pack) === paidDiamonds)
    .length
}

function allPurchasesAtOrBelowPaidDiamonds(state, paidDiamonds) {
  const purchases = statePurchasedPacks(state)
  return purchases.length > 0 && purchases.every(pack => purchasePaidDiamonds(pack) <= paidDiamonds)
}

function hasPurchaseAtOrAbovePaidDiamonds(state, paidDiamonds) {
  return statePurchasedPacks(state).some(pack => purchasePaidDiamonds(pack) >= paidDiamonds)
}

function allPurchasesAtOrAbovePaidDiamonds(state, paidDiamonds) {
  const purchases = statePurchasedPacks(state)
  return purchases.length > 0 && purchases.every(pack => purchasePaidDiamonds(pack) >= paidDiamonds)
}

function compareHighCePlan(a, b) {
  const aCe = stateAverageCe(a)
  const bCe = stateAverageCe(b)
  if (aCe !== bCe) return bCe - aCe
  return compareRealizedPlan(a, b)
}

function compareKeepTierPlan(a, b) {
  const aPartialSkip = hasPartialPackSkip(a) ? 1 : 0
  const bPartialSkip = hasPartialPackSkip(b) ? 1 : 0
  if (aPartialSkip !== bPartialSkip) return bPartialSkip - aPartialSkip
  if (a.triggerCount !== b.triggerCount) return b.triggerCount - a.triggerCount
  return compareRealizedPlan(a, b)
}

function compareSmallBatchPlan(a, b) {
  const aCe = stateAverageCe(a)
  const bCe = stateAverageCe(b)
  if (aCe !== bCe) return bCe - aCe
  if (a.purchases !== b.purchases) return b.purchases - a.purchases
  return compareRealizedPlan(a, b)
}

function pickStrategyState(candidates, predicate, compare = compareRealizedPlan) {
  return [...candidates].filter(predicate).sort(compare)[0] || null
}

function isKeepTierMaxPackState(state, context) {
  return state.purchases > 0
    && !hasFullTierDropWait(state)
    && hasPurchaseAtOrAbovePaidDiamonds(state, KEEP_TIER_MIN_PAID_DIAMONDS)
    && purchasedPacksMeetCeThreshold(state, context)
}

function isMidTier3000State(state, context) {
  return state.purchases > 0
    && countPurchasesByPaidDiamonds(state, MID_TIER_PAID_DIAMONDS) >= 2
    && allPurchasesAtOrAbovePaidDiamonds(state, MID_TIER_PAID_DIAMONDS / 2)
    && purchasedPacksMeetCeThreshold(state, context)
    && stateAverageCe(state) >= context.strategyCeThreshold + 1
}

function isSmallBatchState(state, context) {
  return state.purchases > 0
    && allPurchasesAtOrBelowPaidDiamonds(state, SMALL_PACK_PAID_DIAMONDS)
    && state.steps.some(step => (step.purchases?.length || 0) >= 2)
    && purchasedPacksMeetCeThreshold(state, context)
}

function isStrategicallyEquivalentPlan(a, b, context) {
  if (!a || !b || a.purchases <= 0 || b.purchases <= 0) return false

  const aMidTier = isMidTier3000State(a, context)
  const bMidTier = isMidTier3000State(b, context)
  const aSmallBatch = isSmallBatchState(a, context)
  const bSmallBatch = isSmallBatchState(b, context)
  if (aMidTier !== bMidTier || aSmallBatch !== bSmallBatch) return false

  const aKeepTier = isKeepTierMaxPackState(a, context)
  const bKeepTier = isKeepTierMaxPackState(b, context)
  if (!aKeepTier || !bKeepTier) return false

  const realScoreTolerance = Math.max(500, Math.abs(b.realScore) * 0.03)
  const spentTolerance = Math.max(650, b.totalSpentYen * 0.03)
  return Math.abs(a.realScore - b.realScore) <= realScoreTolerance
    && Math.abs(a.totalSpentYen - b.totalSpentYen) <= spentTolerance
    && Math.abs(stateAverageCe(a) - stateAverageCe(b)) <= 0.25
    && Math.abs(a.purchases - b.purchases) <= 1
    && Math.abs(a.triggerCount - b.triggerCount) <= 1
}

function estimateGroupRemainingValue(source, group, expectedRatio, executionWeight) {
  const weight = (source.cat === 'rank' || source.cat === 'tower') && source.tower !== 'origin_tower_infinite' ? 1.2 : 1.0
  const baseExecCost = (source.batchSize || 1) * 0.1 * executionWeight
  let groupValue = 0
  for (const opportunity of group.opportunities) {
    let bestSurplus = 0
    for (const pack of opportunity.packsByPrice.values()) {
      const surplus = getPackOriginalValue(pack) - (pack.price / 2) * expectedRatio - baseExecCost
      if (surplus > bestSurplus) bestSurplus = surplus
    }
    groupValue += bestSurplus * weight
  }
  return groupValue
}

function buildRemainingValueSuffixes(sources, expectedRatio, executionWeight) {
  return sources.map(source => {
    const suffix = new Float64Array(source.groups.length + 1)
    for (let i = source.groups.length - 1; i >= 0; i--) {
      suffix[i] = suffix[i + 1] + estimateGroupRemainingValue(source, source.groups[i], expectedRatio, executionWeight)
    }
    return suffix
  })
}

function estimateRemainingStateValue(state, context) {
  if (context.remainingValueSuffixes) {
    let remainingValue = 0
    for (let sourceIndex = 0; sourceIndex < context.remainingValueSuffixes.length; sourceIndex++) {
      const suffix = context.remainingValueSuffixes[sourceIndex]
      const cursor = clamp(state.sourceCursors[sourceIndex] || 0, 0, suffix.length - 1)
      remainingValue += suffix[cursor]
    }
    return remainingValue
  }

  let remainingValue = 0
  for (let sourceIndex = 0; sourceIndex < context.sources.length; sourceIndex++) {
    const source = context.sources[sourceIndex]
    const cursor = state.sourceCursors[sourceIndex] || 0
    // Give slightly higher weight to rarer opportunities
    const weight = (source.cat === 'rank' || source.cat === 'tower') && source.tower !== 'origin_tower_infinite' ? 1.2 : 1.0
    for (let i = cursor; i < source.groups.length; i++) {
      for (const opportunity of source.groups[i].opportunities) {
        let bestSurplus = 0
        const baseExecCost = (source.batchSize || 1) * 0.1 * context.executionWeight
        for (const pack of opportunity.packsByPrice.values()) {
          const surplus = getPackOriginalValue(pack) - (pack.price / 2) * context.expectedRatio - baseExecCost
          if (surplus > bestSurplus) bestSurplus = surplus
        }
        remainingValue += bestSurplus * weight
      }
    }
  }
  return remainingValue
}

function refreshSearchPriority(state, context) {
  const remainingStateValue = estimateRemainingStateValue(state, context)
  return {
    ...state,
    remainingStateValue,
    searchPriority: state.realScore + remainingStateValue * context.preferenceDiscount,
  }
}

function createEmptyState(context) {
  const state = {
    tierIndex: context.startTierIndex,
    sourceCursors: context.sources.map(() => 0),
    limitedSpentYen: 0,
    totalSpentYen: 0,
    topUpCostYen: 0,
    value: 0, 
    moneySurplus: 0,
    realScore: 0,
    remainingStateValue: 0,
    searchPriority: 0,
    purchases: 0,
    triggerCount: 0,
    pressure: 0,
    executionCost: 0,
    executionCostComponents: {},
    rechargeDayIndex: 0,
    dailyPaidDiamonds: 0,
    currentDayAttributeTowers: [],
    sameDayBatchCount: 0,
    timeoutWaits: 0,
    rechargeFreeDiamonds: 0,
    steps: [],
    signature: '',
  }
  return refreshSearchPriority(state, context)
}

function applyCursorDelta(cursors, delta) {
  return cursors.map((cursor, index) => cursor + (delta[index] || 0))
}

function continueSameRechargeDay(state) {
  return {
    ...state,
    sameDayBatchCount: state.sameDayBatchCount + 1,
  }
}

function rechargeResetCost(context) {
  const explicitCost = Number(context.settings.rechargeResetCost)
  if (Number.isFinite(explicitCost) && explicitCost >= 0) return explicitCost
  return context.settings.rechargePlanningMode === 'rush'
    ? context.executionWeight * RUSH_RECHARGE_RESET_COST_MULTIPLIER
    : 0
}

function resetToNextRechargeDay(state, context) {
  const resetCost = rechargeResetCost(context)
  const executionCostComponents = resetCost > 0
    ? {
        ...state.executionCostComponents,
        rechargeResetCost: (state.executionCostComponents.rechargeResetCost || 0) + resetCost,
      }
    : state.executionCostComponents
  const nextState = {
    ...state,
    rechargeDayIndex: state.rechargeDayIndex + 1,
    dailyPaidDiamonds: 0,
    currentDayAttributeTowers: [],
    sameDayBatchCount: 0,
    executionCost: state.executionCost + resetCost,
    executionCostComponents,
    realScore: state.moneySurplus - (state.executionCost + resetCost),
    signature: `${state.signature}|day:${state.rechargeDayIndex + 1}`,
  }
  return refreshSearchPriority(nextState, context)
}

function dayCloseTransitions(state, context) {
  const options = []
  
  // Option A: 不补，直接跨日
  options.push(resetToNextRechargeDay(state, context))
  
  // Option B: 补包后跨日
  if (context.permanentPacks?.length && state.steps.length > 0) {
    const targetStepIndex = state.steps.length - 1
    const targetStep = state.steps[targetStepIndex]
    
    if (targetStep.rechargeDayIndex === state.rechargeDayIndex && (!targetStep.topUpCost || targetStep.topUpCost <= 0)) {
      const nextTier = nextPlannerRechargeTier(state.dailyPaidDiamonds, context)
      if (nextTier && context.settings.topUpMode !== 'off') {
        const topUp = findPermanentTopUpOption(state, context)
      if (topUp) {
        // 评估是否划算: topUpSurplus >= 0
        const topUpCost = topUp.cost
        const expectedCostCE = (topUpCost / 2) * context.expectedRatio
        const topUpSurplus = topUp.value - expectedCostCE
        
        // 确保不会触发上限
        if (topUpSurplus >= 0) {
          const topUpPacks = groupTopUpPacks(topUp.purchases)
          const steps = [...state.steps]
          const last = steps[targetStepIndex]
          steps[targetStepIndex] = {
            ...last,
            cost: last.cost + topUpCost,
            topUpCost: topUpCost,
            value: last.value + topUp.value,
            originalValue: Math.round((last.originalValue || 0) + topUp.originalValue),
            rechargeValue: (last.rechargeValue || 0) + topUp.recharge.value,
            rechargeFreeDiamonds: (last.rechargeFreeDiamonds || 0) + topUp.recharge.freeDiamonds,
            topUpValue: topUp.value,
            topUpOriginalValue: Math.round(topUp.originalValue),
            topUpRechargeValue: topUp.recharge.value,
            topUpRechargeFreeDiamonds: topUp.recharge.freeDiamonds,
            topUpRechargeBeforePaid: topUp.recharge.beforePaid,
            topUpRechargeAfterPaid: topUp.recharge.afterPaid,
            topUpUnlockedRechargeTiers: topUp.recharge.unlockedTiers,
            topUpPacks,
          }
          
          const executionCostComponent = 1 * context.executionWeight // manualTopUpCost
          const newExecutionCostComponents = {
            ...state.executionCostComponents,
            topUpCost: (state.executionCostComponents.topUpCost || 0) + executionCostComponent,
          }

          const toppedUpState = {
            ...state,
            topUpCostYen: state.topUpCostYen + topUpCost,
            totalSpentYen: state.totalSpentYen + topUpCost,
            value: state.value + topUp.value,
            moneySurplus: state.moneySurplus + topUpSurplus,
            realScore: state.moneySurplus + topUpSurplus - (state.executionCost + executionCostComponent),
            executionCost: state.executionCost + executionCostComponent,
            executionCostComponents: newExecutionCostComponents,
            rechargeFreeDiamonds: (state.rechargeFreeDiamonds || 0) + topUp.recharge.freeDiamonds,
            dailyPaidDiamonds: state.dailyPaidDiamonds + topUp.paidDiamonds,
            steps,
            signature: `${state.signature}:topUp:${topUpPacks.map(pack => pack.displayTrigger).join(',')}`,
          }
          
          options.push(resetToNextRechargeDay(toppedUpState, context))
        }
      }
      }
    }
  }
  return options
}

function expandRequiredRechargeResetBeforeBatch(state, batchCandidate, context) {
  const resetPaid = getDailyRechargeResetPaid(context)
  if (batchCandidate.requiresRechargeReset || (resetPaid > 0 && state.dailyPaidDiamonds >= resetPaid)) {
    const transitions = dayCloseTransitions(state, context)
    let best = transitions[0]
    for (let i = 1; i < transitions.length; i++) {
      if (transitions[i].realScore > best.realScore) {
        best = transitions[i]
      }
    }
    return [best]
  }
  return [state]
}

function actionWithinDailyRechargeTarget(action, context) {
  const resetPaid = getDailyRechargeResetPaid(context)
  return !action.bought || resetPaid <= 0 || action.paidDiamonds <= resetPaid
}

function shouldResetBeforePurchaseAction(state, action, context) {
  const resetPaid = getDailyRechargeResetPaid(context)
  return action.bought
    && resetPaid > 0
    && state.dailyPaidDiamonds > 0
    && state.dailyPaidDiamonds < resetPaid
    && state.dailyPaidDiamonds + action.paidDiamonds > resetPaid
}

function strictlyDominates(a, b) {
  return a.totalSpentYen <= b.totalSpentYen
    && a.realScore >= b.realScore
    && attributeTowerSetSubset(a.currentDayAttributeTowers, b.currentDayAttributeTowers)
    && a.pressure <= b.pressure
    && a.triggerCount <= b.triggerCount
}

function approximatelyDominates(a, b, tolerance = 0.98) {
  // 容忍极小程度的非帕累托优劣，只为控制规模，牺牲一定全局最优概率
  return a.totalSpentYen <= b.totalSpentYen * (2 - tolerance)
    && a.realScore >= b.realScore * tolerance
    && a.pressure <= b.pressure + 2
}

function pruneStates(states, context) {
  const byBucketKey = new Map()
  for (const state of states) {
    const key = makeStateKey(state, context)
    if (!byBucketKey.has(key)) byBucketKey.set(key, [])
    byBucketKey.get(key).push(state)
  }

  const allSurvivors = []
  const userMax = Math.max(50, Number(context.settings.maxStatesPerTier) || Number(context.settings.maxStates) || DEFAULT_MAX_STATES)
  const bucketMax = Math.max(2, Number(context.settings.perBucketStates) || 5)
  const tolerance = Number(context.settings.pruneTolerance) || 0.99
  const minBucketSurvivors = Number(context.settings.minBucketSurvivors) || 2

  for (const group of byBucketKey.values()) {
    const survivors = []
    // 同一 bucketKey 内部拥有极其相似的后续转移环境 (包括 rechargeBucket)
    for (const state of group.sort(comparePlan)) {
      if (survivors.some(existing => strictlyDominates(existing, state))) continue
      // Approximate preference pruning (Layer 2)
      if (survivors.some(existing => approximatelyDominates(existing, state, tolerance))) continue
      
      survivors.push(state)
      if (survivors.length >= bucketMax) break
    }
    allSurvivors.push(...survivors)
  }

  // Layer 3: Global Beam with Bucket Quota
  const globalSorted = allSurvivors.sort(comparePlan)
  const finalSurvivors = []
  const bucketSurvivorCount = new Map()
  const takenSignatures = new Set()

  // Phase 1: 保底每个 rechargeBucket
  for (const state of globalSorted) {
    const rechargeBucket = getRechargeBucket(state.dailyPaidDiamonds, context)
    const count = bucketSurvivorCount.get(rechargeBucket) || 0
    if (count < minBucketSurvivors) {
      const sig = stateSignature(state)
      if (!takenSignatures.has(sig)) {
        finalSurvivors.push(state)
        takenSignatures.add(sig)
        bucketSurvivorCount.set(rechargeBucket, count + 1)
      }
    }
  }

  // Phase 2: 全局填充剩余名额
  for (const state of globalSorted) {
    if (finalSurvivors.length >= userMax) break
    const sig = stateSignature(state)
    if (!takenSignatures.has(sig)) {
      finalSurvivors.push(state)
      takenSignatures.add(sig)
    }
  }

  return finalSurvivors.sort(comparePlan)
}

function expandState(state, context) {
  const next = []
  const batchCandidates = generateBatchCandidates(state, context)

  for (const batchCandidate of batchCandidates) {
    const baseStates = expandRequiredRechargeResetBeforeBatch(state, batchCandidate, context)
    for (const baseState of baseStates) {
      const tierPrice = context.priceTiers[baseState.tierIndex]
      const actions = actionOptionsForBatch(batchCandidate.opportunities, tierPrice, context)
        .filter(action => actionWithinDailyRechargeTarget(action, context))

      for (const action of actions) {
        const actionBaseStates = shouldResetBeforePurchaseAction(baseState, action, context)
          ? dayCloseTransitions(baseState, context)
          : [baseState]

        for (const actionBaseState of actionBaseStates) {
          const actionTierPrice = context.priceTiers[actionBaseState.tierIndex]
          if (actionTierPrice !== tierPrice) continue

          const sourceCursors = applyCursorDelta(actionBaseState.sourceCursors, batchCandidate.cursorDelta)
          const nextTierIndex = action.bought
            ? clamp(actionBaseState.tierIndex + 1, 0, context.priceTiers.length - 1)
            : clamp(actionBaseState.tierIndex - 1, 0, context.priceTiers.length - 1)

          const recharge = rechargeValueForPaid(actionBaseState.dailyPaidDiamonds, action.paidDiamonds, context)

          const addedRealValue = action.originalValue + recharge.value
          const expectedCostCE = (action.limitedCostYen / 2) * context.expectedRatio
          const addedMoneySurplus = addedRealValue - expectedCostCE

          const step = summarizeAction(
            action,
            actionBaseState.steps.length,
            batchCandidate.opportunities,
            tierPrice,
            context.priceTiers[nextTierIndex],
            recharge,
            { rechargeDayIndex: actionBaseState.rechargeDayIndex, pressure: batchCandidate.pressure, moneySurplus: addedMoneySurplus },
          )

          // executionCost computation
          const isTimeout = !action.bought
          let newExecutionCost = actionBaseState.executionCost
          const execComponents = { ...actionBaseState.executionCostComponents }
        
          const bpCost = batchCandidate.pressure * 0.1 * context.executionWeight
          newExecutionCost += bpCost
          execComponents.batchPressureCost = (execComponents.batchPressureCost || 0) + bpCost
        
          if (batchCandidate.sourceCount > 1) {
            const csCost = (batchCandidate.sourceCount - 1) * 2.0 * context.executionWeight
            newExecutionCost += csCost
            execComponents.crossSourceCost = (execComponents.crossSourceCost || 0) + csCost
          }
        
          const nextDailyPaid = actionBaseState.dailyPaidDiamonds + action.paidDiamonds
          const candidateMoneySurplus = actionBaseState.moneySurplus + addedMoneySurplus
          const candidateRealScore = candidateMoneySurplus - newExecutionCost
        
          const candidate = {
            ...actionBaseState,
            tierIndex: nextTierIndex,
            sourceCursors,
            currentDayAttributeTowers: mergeAttributeTowerSets(actionBaseState.currentDayAttributeTowers, batchCandidate.attributeTowers),
            limitedSpentYen: actionBaseState.limitedSpentYen + action.limitedCostYen,
            totalSpentYen: actionBaseState.totalSpentYen + action.limitedCostYen,
            value: actionBaseState.value + addedRealValue,
            moneySurplus: candidateMoneySurplus,
            realScore: candidateRealScore,
            executionCost: newExecutionCost,
            executionCostComponents: execComponents,
            purchases: actionBaseState.purchases + action.purchases.length,
            triggerCount: actionBaseState.triggerCount + batchCandidate.opportunities.length,
            pressure: actionBaseState.pressure + batchCandidate.pressure,
            dailyPaidDiamonds: nextDailyPaid,
            timeoutWaits: actionBaseState.timeoutWaits + (isTimeout ? 1 : 0),
            rechargeFreeDiamonds: (actionBaseState.rechargeFreeDiamonds || 0) + recharge.freeDiamonds,
            steps: [...actionBaseState.steps, step],
            signature: appendStepSignature(actionBaseState, step),
          }
          const prioritizedCandidate = refreshSearchPriority(candidate, context)

          next.push(continueSameRechargeDay(prioritizedCandidate))
          if (prioritizedCandidate.purchases > 0) {
            next.push(...dayCloseTransitions(prioritizedCandidate, context))
          }
        }
      }
    }
  }

  return next
}

function compareFinalPlan(a, b) {
  return comparePlan(a, b)
}

async function collectTopValuePlans(context, topK = 1) {
  const emptyState = createEmptyState(context)
  let states = [emptyState]
  const candidatePool = []
  
  const totalGroups = context.sources.reduce((sum, source) => sum + source.groups.length, 0)
  const maxIterations = Math.max(1, totalGroups * (context.priceTiers.length + 2))

  for (let i = 0; i < maxIterations; i++) {
    await new Promise(r => setTimeout(r, 0)) // yield to UI
    candidatePool.push(...states)

    if (states.every(state => allSourcesExhausted(context.sources, state.sourceCursors))) break
    const expanded = []
    for (const state of states) {
      if (allSourcesExhausted(context.sources, state.sourceCursors)) {
        continue
      }
      expanded.push(...expandState(state, context))
    }
    if (!expanded.length) break
    states = pruneStates(expanded, context)
  }

  const ranked = []
  for (const state of candidatePool.sort(compareFinalPlan)) {
    if (!ranked.some(existing => stateSignature(existing) === stateSignature(state))) {
      ranked.push(state)
    }
    if (ranked.length >= topK) break
  }
  
  return ranked.length ? ranked : [emptyState]
}

function buildEnvelope(expectedRatio, freeDiamondScore, maxPaid) {
  const envelope = new Float64Array(maxPaid + 1)
  const slope = Math.max(0, expectedRatio - 1.2)

  envelope[maxPaid] = cumulativeFreeDiamonds(maxPaid) * freeDiamondScore
  for (let x = maxPaid - 1; x >= 0; x--) {
    const sx = cumulativeFreeDiamonds(x) * freeDiamondScore
    envelope[x] = Math.max(sx, envelope[x + 1] - slope)
  }
  return envelope
}

function buildPlanningContext(packs, settings) {
  const priceTiers = getPriceTiers(packs)
  const currentPrice = Number(settings.currentPrice) || priceTiers[0]
  const tierIndex = priceTiers.indexOf(currentPrice)
  const startTierIndex = clamp(tierIndex === -1 ? 0 : tierIndex, 0, priceTiers.length - 1)
  const { lanes, sources } = buildPlanningSources(packs, settings)
  const opportunities = sources.flatMap(source => source.groups.flatMap(group => group.opportunities))
  const freeDiamondScore = Number(settings.freeDiamondScore) || Number(settings.diamondScore) || 1
  const permanentPacks = normalizePermanentTopUpPacks(settings.permanentPacks || [])
  const minPermanentPackPrice = permanentPacks.length
    ? Math.min(...permanentPacks.map(p => p.price))
    : 0

  const preferenceLevel = settings.preferenceLevel || 'balanced'
  const { preferenceBaselineCe, expectedRatio } = preferenceCeForLevel(packs, preferenceLevel, settings)
  let preferenceDiscount = 0.9
  if (preferenceLevel === 'conservative') {
    preferenceDiscount = 1.0
  } else if (preferenceLevel === 'aggressive') {
    preferenceDiscount = 0.8
  }

  const executionWeight = settings.executionWeight !== undefined ? Number(settings.executionWeight) : 50
  const explicitStrategyCeThreshold = Number(settings.strategyCeThreshold)
  const strategyCeThreshold = Number.isFinite(explicitStrategyCeThreshold) && explicitStrategyCeThreshold > 0
    ? explicitStrategyCeThreshold
    : expectedRatio

  const context = {
    envelope: settings.rechargePlanningMode === 'rush'
      ? buildEnvelope(expectedRatio, freeDiamondScore, getDailyRechargeTargetPaid({ settings }))
      : null,
    expectedRatio,
    preferenceBaselineCe,
    preferenceDiscount,
    executionWeight,
    strategyCeThreshold,
    preferenceLevel,
    priceTiers,
    startTierIndex,
    freeDiamondScore,
    permanentPacks,
    minPermanentPackPrice,
    lanes,
    sources,
    opportunities,
    settings,
    remainingValueSuffixes: buildRemainingValueSuffixes(sources, expectedRatio, executionWeight),
    batchCandidateCache: new Map(),
    actionOptionsCache: new Map(),
  }
  context.topUpOptionByCurrentPaid = buildPermanentTopUpOptionCache(context)
  return context
}

function createResult(state, context, meta = {}) {
  const annotatedSteps = state.steps.map((step, index, steps) => {
    const previous = steps[index - 1]
    const rechargeReset = !!previous && step.rechargeDayIndex > previous.rechargeDayIndex
    return {
      ...step,
      rechargeReset,
      rechargeDayLabel: `第 ${step.rechargeDayIndex + 1} 日`,
    }
  })
  const topUpPacks = annotatedSteps.flatMap(step => step.topUpPacks || [])
  const topUpBatches = annotatedSteps
    .filter(step => step.topUpPacks?.length)
    .map(step => ({
      index: step.index,
      triggerRange: step.triggerRange,
      cost: step.topUpCost || 0,
      value: step.topUpValue || 0,
      rechargeFreeDiamonds: step.topUpRechargeFreeDiamonds || 0,
      unlockedRechargeTiers: step.topUpUnlockedRechargeTiers || [],
      packs: step.topUpPacks,
    }))
  const topUpTotalCost = topUpBatches.reduce((sum, b) => sum + b.cost, 0)
  const totalSpent = state.limitedSpentYen + topUpTotalCost
  const remainingOpportunityGroups = summarizeRemainingOpportunities(state, context)
  const remainingOpportunityCount = remainingOpportunityGroups.reduce((sum, group) => sum + group.count, 0)
  return {
    ...meta,
    expectedRatio: context.expectedRatio,
    preferenceBaselineCe: context.preferenceBaselineCe,
    preferenceDiscount: context.preferenceDiscount,
    executionWeight: context.executionWeight,
    strategyCeThreshold: context.strategyCeThreshold,
    preferenceLevel: context.preferenceLevel,
    remainingBudget: context.mainBudget !== undefined ? context.mainBudget - totalSpent : Infinity,
    limitedSpentYen: state.limitedSpentYen,
    topUpTotalCost,
    spent: state.limitedSpentYen,
    totalSpent,
    value: Math.round(state.value),
    moneySurplus: Math.round(state.moneySurplus),
    decisionValue: Math.round(state.searchPriority || state.realScore),
    executionCost: state.executionCost || 0,
    purchases: state.purchases,
    triggerCount: state.triggerCount,
    retainedOpportunities: remainingOpportunityCount,
    remainingOpportunities: remainingOpportunityCount,
    remainingOpportunityGroups,
    pressure: state.pressure,
    rechargeDayCount: state.rechargeDayIndex + 1,
    rechargeResets: state.rechargeDayIndex,
    topUpPacks,
    topUpBatches,
    topUpPackSummary: topUpBatches
      .map(batch => `第 ${batch.index} 批：${batch.packs.map(pack => pack.displayTrigger).join(' / ')}`)
      .join('；'),
    rechargeFreeDiamonds: state.rechargeFreeDiamonds || 0,
    finalTierPrice: context.priceTiers[state.tierIndex],
    averageCe: totalSpent > 0 ? state.value / (totalSpent / 2) : 0,
    priceTiers: context.priceTiers,
    opportunityCount: context.opportunities.length,
    topUpBatchCount: topUpBatches.length,
    batchCount: annotatedSteps.length,
    steps: annotatedSteps,
  }
}

export async function planUltraSalePurchases(packs, settings = {}) {
  const context = buildPlanningContext(packs, settings)
  const [state] = await collectTopValuePlans(context, 1)
  return createResult(state, context)
}

export async function buildUltraSalePlanOptions(packs, settings = {}) {
  const context = buildPlanningContext(packs, settings)
  const candidates = await collectTopValuePlans(context, 200)
  const emptyState = createEmptyState(context)

  const retentionDecision = emptyState.searchPriority
  const viableCandidates = candidates
    .filter(state => state.purchases > 0 && state.searchPriority > retentionDecision)
  const strategyCandidates = candidates
    .filter(state => state.purchases > 0 && state.realScore > 0)
  const bestState = viableCandidates.length
    ? [...viableCandidates].sort(compareRealizedPlan)[0]
    : emptyState

  const hasProfitablePlan = bestState.purchases > 0 || strategyCandidates.length > 0

  function createNoPlanResult(description, meta = {}) {
    return createResult(emptyState, context, {
      id: 'retention',
      label: '保留机会',
      description,
      ...meta,
    })
  }

  if (!hasProfitablePlan) {
    return [
      createNoPlanResult('当前决策价值（执行收益+未来保留价值）未超过直接保留机会的基线。建议暂不购买，保留机会。')
    ]
  }

  const options = []
  const optionStates = []

  function addOption(state, meta) {
    if (!state) return
    optionStates.push(state)
    options.push(createResult(state, context, meta))
  }

  const keepTierState = pickStrategyState(
    strategyCandidates,
    state => isKeepTierMaxPackState(state, context),
    compareKeepTierPlan,
  )
  addOption(keepTierState, {
    id: 'keepTierMaxPack',
    labelKey: 'planOptKeepTierMax',
    descKey: hasPartialPackSkip(keepTierState || {})
      ? 'planOptKeepTierMaxDescPartial'
      : 'planOptKeepTierMaxDesc',
  })

  const midTierState = pickStrategyState(
    strategyCandidates,
    state => isMidTier3000State(state, context),
    compareHighCePlan,
  )
  addOption(midTierState, {
    id: 'midTier3000',
    labelKey: 'planOptMidTier3000',
    descKey: 'planOptMidTier3000Desc',
  })

  const smallBatchState = pickStrategyState(
    strategyCandidates,
    state => isSmallBatchState(state, context),
    compareSmallBatchPlan,
  )
  addOption(smallBatchState, {
    id: 'smallBatch',
    labelKey: 'planOptSmallBatch',
    descKey: 'planOptSmallBatchDesc',
  })

  const bestStateAlreadyRepresented = optionStates.some(state => (
    stateSignature(state) === stateSignature(bestState)
    || isStrategicallyEquivalentPlan(bestState, state, context)
  ))
  if (bestState.purchases > 0 && !bestStateAlreadyRepresented) {
    addOption(bestState, {
      id: 'bestValue',
      labelKey: 'planOptBest',
      descKey: 'planOptBestDesc',
    })
  }

  return options.length ? options : [
    createNoPlanResult('当前没有符合策略输出规则的正收益路径。建议暂不购买，保留机会。')
  ]

}

function formatSkipPlanRow(row) {
  const triggerRange = row.skipCount === 1
    ? row.triggerRange
    : `${row.triggerRanges[0]} ... ${row.triggerRanges[row.triggerRanges.length - 1]}`
  const skippedSteps = row.skippedSteps || []
  const tierDropCount = skippedSteps.filter(step => {
    return Number.isFinite(step.tierPrice)
      && Number.isFinite(step.nextTierPrice)
      && step.nextTierPrice < step.tierPrice
  }).length
  const rechargeResetCount = skippedSteps.filter(step => step.rechargeReset).length

  return {
    ...row,
    rowKey: `skip-${row.startIndex}-${row.endIndex}`,
    indexLabel: row.startIndex === row.endIndex ? String(row.startIndex) : `${row.startIndex}-${row.endIndex}`,
    triggerRange,
    skippedSteps,
    skipSourceRanges: summarizeSkippedSources(skippedSteps),
    tierDropCount,
    rechargeResetCount,
    rechargeReset: rechargeResetCount > 0,
    rechargeDayLabel: skippedSteps.length
      ? `${skippedSteps[0].rechargeDayLabel}${skippedSteps.at(-1).rechargeDayLabel !== skippedSteps[0].rechargeDayLabel ? ` - ${skippedSteps.at(-1).rechargeDayLabel}` : ''}`
      : row.rechargeDayLabel,
    cost: 0,
    value: 0,
    purchases: [],
  }
}

function parseTriggerSummary(triggerRange) {
  return String(triggerRange || '')
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const separator = part.indexOf(':')
      if (separator === -1) return { label: '触发', range: part }
      return {
        label: part.slice(0, separator).trim(),
        range: part.slice(separator + 1).trim(),
      }
    })
}

function summarizeSkippedSources(skippedSteps) {
  const byLabel = new Map()
  for (const step of skippedSteps) {
    for (const segment of parseTriggerSummary(step.triggerRange)) {
      if (!byLabel.has(segment.label)) {
        byLabel.set(segment.label, {
          label: segment.label,
          from: segment.range,
          to: segment.range,
          count: 0,
        })
      }
      const current = byLabel.get(segment.label)
      current.to = segment.range
      current.count += 1
    }
  }
  return [...byLabel.values()]
}

function groupTriggerLabel(group) {
  const opportunity = group?.opportunities?.[0]
  return String(group?.trigger ?? opportunity?.trigger ?? opportunity?.displayTrigger ?? '')
}

function summarizeRemainingOpportunities(state, context) {
  const summaries = []
  for (let sourceIndex = 0; sourceIndex < context.sources.length; sourceIndex++) {
    const source = context.sources[sourceIndex]
    const cursor = state.sourceCursors[sourceIndex] || 0
    const groups = source.groups.slice(cursor)
    if (!groups.length) continue

    const count = groups.reduce((sum, group) => sum + group.opportunities.length, 0)
    if (count <= 0) continue

    const first = groups[0]
    const last = groups[groups.length - 1]
    summaries.push({
      sourceId: source.id || source.laneId || String(sourceIndex),
      label: first.label || source.label || source.id || '触发',
      from: groupTriggerLabel(first),
      to: groupTriggerLabel(last),
      count,
    })
  }
  return summaries
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
          skippedSteps: [step],
        }
      } else {
        pendingSkip.endIndex = step.index
        pendingSkip.skipCount += 1
        pendingSkip.triggerRanges.push(step.triggerRange)
        pendingSkip.nextTierPrice = step.nextTierPrice
        pendingSkip.skippedSteps.push(step)
      }
      continue
    }

    if (pendingSkip) {
      rows.push(formatSkipPlanRow(pendingSkip))
      pendingSkip = null
    }
    rows.push({
      ...step,
      rowKey: `buy-${step.index}`,
      indexLabel: String(step.index),
      skipCount: 0,
    })
  }

  if (pendingSkip) rows.push(formatSkipPlanRow(pendingSkip))
  return rows
}

export const __testables = {
  parseTriggerProgress,
  buildOpportunities,
  buildBatches,
  buildAttributeTowerTopologyBatches,
  buildPlanningSources,
  generateBatchCandidates,
  buildPlanningContext,
  createEmptyState,
  expandState,
  estimateRemainingStateValue,
  comparePlan,
  compareRealizedPlan,
  findHeuristicTopUpCombination,
  findPermanentTopUpOption,
  pruneStates,
  getRechargeBucket,
  rechargeResetCost,
}

export function testPool(context) { const emptyState = createEmptyState(context); let states = [emptyState]; const candidatePool = []; const totalGroups = context.sources.reduce((sum, s) => sum + s.groups.length, 0); const maxIterations = Math.max(1, totalGroups * 4); for (let i = 0; i < maxIterations; i++) { candidatePool.push(...states); if (states.every(state => allSourcesExhausted(context.sources, state.sourceCursors))) break; const expanded = []; for (const state of states) { if (allSourcesExhausted(context.sources, state.sourceCursors)) { continue; } expanded.push(...expandState(state, context)); } if (!expanded.length) break; states = pruneStates(expanded, context); } return candidatePool.sort(compareFinalPlan); }
