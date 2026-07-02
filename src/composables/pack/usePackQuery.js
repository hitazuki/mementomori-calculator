import { computed, reactive } from 'vue'
import { calculatePackCE } from '../../engine/packCalc.js'

export function usePackQuery({ packsRaw, normalizedScores }) {
  const filter = reactive({
    cat: 'tower',
    tower: 'origin_tower_infinite',
    price: 11800,
  })

  const towerOptions = computed(() => {
    const towers = new Set()
    packsRaw.value.forEach(pack => {
      if (pack.cat === 'tower' && pack.tower) towers.add(pack.tower)
    })
    return [...towers].sort()
  })

  const priceOptions = computed(() => {
    const prices = new Set()
    packsRaw.value.forEach(pack => prices.add(pack.price))
    return [...prices].sort((a, b) => b - a)
  })

  const planPriceOptions = computed(() => [...priceOptions.value].sort((a, b) => a - b))

  const sortState = reactive({ by: 'trigger', asc: true })

  function toggleSort(field) {
    if (sortState.by === field) sortState.asc = !sortState.asc
    else {
      sortState.by = field
      sortState.asc = true
    }
  }

  function sortIcon(field) {
    if (sortState.by !== field) return '↕'
    return sortState.asc ? '▲' : '▼'
  }

  const filteredPacks = computed(() => {
    let result = packsRaw.value
    if (filter.cat) result = result.filter(pack => pack.cat === filter.cat)
    if (filter.cat === 'tower' && filter.tower) result = result.filter(pack => pack.tower === filter.tower)
    if (filter.price > 0) result = result.filter(pack => pack.price === filter.price)

    return calculatePackCE(result, normalizedScores.value)
  })

  const sortedPacks = computed(() => {
    const result = [...filteredPacks.value]
    const { by, asc } = sortState
    result.sort((a, b) => {
      let va
      let vb
      if (by === 'trigger') {
        va = a.sortKey
        vb = b.sortKey
      } else if (by === 'price') {
        va = a.price
        vb = b.price
      } else if (by === 'ce') {
        va = a.ce
        vb = b.ce
      } else if (by === 'value') {
        va = a.value
        vb = b.value
      } else {
        va = a.cat + a.tower
        vb = b.cat + b.tower
      }
      return asc ? va - vb : vb - va
    })
    return result
  })

  const expanded = reactive(new Set())

  function toggleExpand(index) {
    if (expanded.has(index)) expanded.delete(index)
    else expanded.add(index)
  }

  return {
    filter,
    towerOptions,
    priceOptions,
    planPriceOptions,
    sortState,
    toggleSort,
    sortIcon,
    filteredPacks,
    sortedPacks,
    expanded,
    toggleExpand,
  }
}
