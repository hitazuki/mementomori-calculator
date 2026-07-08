<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">💰 {{ $t('navPackCompare') }}</h1>
    <p class="view-desc">
      {{ $t('packCompareDesc') }} — <span v-html="$t('packCalcSource')"></span>
    </p>
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <ItemScorePanel
      v-model:show-scores="showScores"
      desc-key="packScoreDesc"
      :editable-score-rows="editableScoreRows"
      :readonly-score-rows="readonlyScoreRows"
      :base-url="baseUrl"
      :item-display-name="itemDisplayName"
      :format-score-for-panel="formatScoreForPanel"
      :score-reason-text="scoreReasonText"
      :score-detail-name="scoreDetailName"
      :score-detail-label="scoreDetailLabel"
      :format-score-share="formatScoreShare"
      :has-score-details="hasScoreDetails"
      :is-score-detail-expanded="isScoreDetailExpanded"
      :is-locked="isLocked"
      @toggle-score-detail="toggleScoreDetail"
      @reset-scores="resetEditableScores"
    />

    <!-- Right Panel: Results Table -->
    <div class="flex-col gap-12" style="min-width:0;">
      <!-- Filters -->
      <div class="card pack-filters-card" style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; padding: 10px 14px;">
        <div style="font-weight:bold; font-size:var(--fs-sm); color:var(--text-primary); display:flex; align-items:center; white-space:nowrap;">
          🔍 {{ $t('packFilterTitle') }}
        </div>
        
        <div style="margin-left:auto; font-size:var(--fs-sm); color:var(--text-muted); white-space:nowrap;">
          {{ $t('packResultCount', { n: filteredPacks.length }) }}
        </div>

        <div class="mobile-pack-sort">
          <select class="form-select" v-model="sortState.by">
            <option value="name">{{ $t('packCompareColName') }}</option>
            <option value="price">{{ $t('packColPrice') }}</option>
            <option value="ce">CE</option>
            <option value="value">{{ $t('packColValue') }}</option>
          </select>
          <button class="btn btn-ghost btn-sm" @click="sortState.asc = !sortState.asc">
            {{ sortState.asc ? '▲' : '▼' }}
          </button>
        </div>

        <div style="width: 100%; height: 1px; background: var(--border-subtle); margin: 2px 0;"></div>

        <div style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
          <!-- Sources -->
          <div>
            <div style="font-size: var(--fs-sm); color: var(--text-muted); margin-bottom: 6px;">{{ $t('packCompareFilterSource') }}</div>
            <div class="chip-row">
              <button class="chip" :class="{active: filter.sources.length === 0}" @click="filter.sources = []">{{ $t('ui_all') }}</button>
              <button v-for="src in availableSources" :key="src.key"
                      class="chip" :class="{active: filter.sources.includes(src.key)}"
                      @click="toggleSource(src.key)">
                {{ src.label }}
              </button>
            </div>
          </div>

          <!-- Prices -->
          <div>
            <div style="font-size: var(--fs-sm); color: var(--text-muted); margin-bottom: 6px;">{{ $t('packFilterPrice') }}</div>
            <div class="chip-row">
              <button class="chip" :class="{active: filter.prices.length === 0}" @click="filter.prices = []">{{ $t('ui_all') }}</button>
              <button v-for="price in availablePrices" :key="price"
                      class="chip" :class="{active: filter.prices.includes(price)}"
                      @click="togglePrice(price)">
                ¥{{ price.toLocaleString() }}
              </button>
            </div>
          </div>

          <!-- Contents -->
          <div>
            <div style="font-size: var(--fs-sm); color: var(--text-muted); margin-bottom: 6px;">{{ $t('packFilterContentsOr') }}</div>
            <div class="chip-row" style="max-height: 120px; overflow-y: auto;">
              <button class="chip" :class="{active: filter.contents.length === 0}" @click="filter.contents = []">{{ $t('ui_all') }}</button>
              <button v-for="item in availableItems" :key="item.key"
                      class="chip" :class="{active: filter.contents.includes(item.key)}"
                      @click="toggleContent(item.key)"
                      style="display: flex; align-items: center; gap: 4px; padding-left: 6px;">
                <img :src="`${baseUrl}images/items/Item_${String(item.iconId).padStart(4,'0')}.png`" style="width: 16px; height: 16px;" @error="e => e.target.style.display='none'">
                <span>{{ cleanItemName(itemDisplayName(item)) }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card desktop-pack-table" style="overflow-x:auto;padding:8px;">
        <table class="data-table">
          <thead>
            <tr>
              <th @click="toggleSort('name')" style="cursor:pointer;text-align:left;">{{ $t('packCompareColName') }} {{ sortIcon('name') }}</th>
              <th @click="toggleSort('price')" style="cursor:pointer;">{{ $t('packColPrice') }} {{ sortIcon('price') }}</th>
              <th @click="toggleSort('ce')" style="cursor:pointer;">CE {{ sortIcon('ce') }}</th>
              <th @click="toggleSort('value')" style="cursor:pointer;">{{ $t('packColValue') }} {{ sortIcon('value') }}</th>
              <th>{{ $t('packColItems') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(p, i) in sortedPacks" :key="i">
              <tr @click="toggleExpand(i)" style="cursor:pointer;" :class="{ 'row-expanded': expanded.has(i) }">
                <td style="white-space:nowrap; text-align:left;">
                  <span style="font-size:var(--fs-xs);margin-right:6px;">{{ expanded.has(i) ? '▼' : '▶' }}</span>
                  <span :class="sourceBadgeClass(p.source)" style="margin-right:6px; font-size:var(--fs-xs); padding:2px 5px; border-radius:4px;">
                    {{ sourceBadgeText(p.source) }}
                  </span>
                  <span style="font-weight:bold;">{{ getShortPackName(p) }}</span>
                </td>
                <td style="white-space:nowrap;">¥{{ p.price.toLocaleString() }}</td>
                <td :style="{color: getCeColor(p.ce), fontWeight:'bold', fontSize: p.ce >= 1.5 ? 'var(--fs-md)' : 'var(--fs-sm)'}">{{ p.ce.toFixed(2) }}</td>
                <td style="white-space:nowrap;">{{ p.originalValue.toLocaleString() }} <span style="font-size:var(--fs-xs);color:var(--gold);">+ {{ p.rechargeValue.toLocaleString() }}</span></td>
                <td>
                  <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;">
                    <div
                      v-for="(item, j) in p.items"
                      :key="j"
                      :title="itemDisplayName(item)"
                      style="display:flex;align-items:center;gap:4px;font-size:var(--fs-sm);"
                    >
                      <img
                        :src="`${baseUrl}images/items/Item_${String(item.iconId).padStart(4,'0')}.png`"
                        style="width:24px;height:24px;"
                        @error="e => e.target.style.display='none'"
                      />
                      <span class="pack-item-qty"><span class="pack-item-qty-mark">×</span>{{ item.qty }}</span>
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-if="expanded.has(i)" style="background:rgba(255,255,255,0.02);">
                <td :colspan="5" style="padding:12px 16px;">
                  <div v-if="p.originKeys.length > 1" style="margin-bottom:12px; font-size:var(--fs-sm); color:var(--text-muted); text-align:left; background:rgba(0,0,0,0.2); padding:6px 12px; border-radius:4px; border-left:3px solid var(--gold);">
                    <strong style="color:var(--text-base); margin-right:8px;">{{ $t('packCompareFullSources') }}:</strong>
                    {{ getFullPackName(p) }}
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:var(--fs-sm);align-items:flex-start;">
                    <div
                      v-for="(item, j) in p.items"
                      :key="j"
                      style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.03);padding:4px 10px;border-radius:4px;"
                    >
                      <img
                        :src="`${baseUrl}images/items/Item_${String(item.iconId).padStart(4,'0')}.png`"
                        style="width:24px;height:24px;"
                        @error="e => e.target.style.display='none'"
                      />
                      <span style="min-width:60px;">{{ itemDisplayName(item) }}</span>
                      <span class="pack-item-qty pack-item-qty-muted"><span class="pack-item-qty-mark">×</span>{{ item.qty }}</span>
                      <span style="color:var(--gold);font-weight:bold;">{{ Math.round(item.value).toLocaleString() }}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="mobile-pack-list">
        <article
          v-for="(p, i) in sortedPacks"
          :key="`mobile-${i}`"
          class="mobile-pack-card"
          @click="toggleExpand(i)"
        >
          <div class="mobile-pack-head">
            <div class="mobile-pack-title">
              <span :class="sourceBadgeClass(p.source)" class="mobile-pack-badge">
                {{ sourceBadgeText(p.source) }}
              </span>
              <span>{{ getShortPackName(p) }}</span>
            </div>
            <div class="mobile-pack-ce" :style="{ color: getCeColor(p.ce) }">
              CE {{ p.ce.toFixed(2) }}
            </div>
          </div>

          <div class="mobile-pack-meta">
            <span>{{ $t('packColPrice') }} <b>¥{{ p.price.toLocaleString() }}</b></span>
            <span>{{ $t('packColValue') }} <b>{{ p.originalValue.toLocaleString() }}</b> <em>+ {{ p.rechargeValue.toLocaleString() }}</em></span>
          </div>

          <div v-if="expanded.has(i) && p.originKeys.length > 1" class="mobile-pack-source">
            {{ getFullPackName(p) }}
          </div>

          <div class="mobile-pack-items">
            <div
              v-for="(item, j) in p.items"
              :key="j"
              class="mobile-pack-item"
              :title="itemDisplayName(item)"
            >
              <img
                :src="`${baseUrl}images/items/Item_${String(item.iconId).padStart(4,'0')}.png`"
                @error="e => e.target.style.display='none'"
              />
              <span class="pack-item-qty"><span class="pack-item-qty-mark">×</span>{{ item.qty }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ItemScorePanel from '../components/ItemScorePanel.vue'

const packsRaw = ref([])
onMounted(async () => {
  try {
    packsRaw.value = await fetch(`${import.meta.env.BASE_URL}data/allPacks.json`).then(r => r.json())
  } catch (e) {
    console.error('Failed to fetch allPacks.json', e)
  }
})
import { calculatePackCE, getItemInfo, getBaseItemKey } from '../engine/packCalc.js'
import { useItemScores } from '../composables/useItemScores.js'

const showScores = ref(true)
const { t, locale } = useI18n()
const baseUrl = import.meta.env.BASE_URL || '/'

// Map locale to itemScores name field
const localeNameMap = { 'zh-CN': 'nameZh', 'zh-TW': 'nameTw', 'en': 'nameEn', 'ja': 'nameJa', 'ko': 'nameKo' }
function itemDisplayName(s) {
  const field = localeNameMap[locale.value] || 'nameZh'
  return s[field] || s.name || s.ItemName || ''
}

function itemLocaleField() {
  return localeNameMap[locale.value] || 'nameZh'
}

function cleanItemName(name) {
  return name
    .replace(/\s*Lv\s*\d+/ig, '')
    .replace(/\s*[(（]\d+\s*(?:小时|小時|hrs?|時間|시간)[)）]/ig, '')
    .replace(/(R|SR)[/・．][^)）]+/ig, '$1')
    .trim()
}

function sourceBadgeClass(source) {
  if (source === 'witch_gift') return 'badge-witch'
  if (source === 'ultra_sale') return 'badge-ultra'
  if (source === 'permanent_pack') return 'badge-permanent'
  return 'badge-other'
}

function sourceBadgeText(source) {
  if (source === 'witch_gift') return t('packBadgeWitch')
  if (source === 'ultra_sale') return t('packBadgeUltra')
  if (source === 'mixed') return t('packBadgeMixed')
  if (source === 'permanent_pack') return t('packBadgePermanent')
  return source
}

function getShortPackName(p) {
  if (!p.originKeys || p.originKeys.length === 0) return p.name || 'Unknown'
  const firstKey = p.originKeys[0]
  let firstName = ''
  if (firstKey.includes('|')) {
    const [key, param] = firstKey.split('|')
    firstName = t(key, { stage: param })
  } else {
    firstName = t(firstKey)
  }

  if (p.originKeys.length > 1) {
    return t('packCompareAndOthers', { name: firstName, count: p.originKeys.length - 1 })
  }
  return firstName
}

function getFullPackName(p) {
  if (!p.originKeys || p.originKeys.length === 0) return p.name || 'Unknown'
  return p.originKeys.map(k => {
    if (k.includes('|')) {
      const [key, param] = k.split('|')
      return t(key, { stage: param })
    }
    return t(k)
  }).join(' / ')
}

function getCeColor(ce) {
  if (ce >= 1.5) return '#f1c40f' // Gold
  if (ce >= 1.2) return '#2ecc71' // Green
  if (ce >= 1.0) return '#3498db' // Blue
  return '#e74c3c' // Red
}

const {
  normalizedScores,
  readonlyScoreRows,
  editableScoreRows,
  isLocked,
  hasScoreDetails,
  toggleScoreDetail,
  isScoreDetailExpanded,
  formatScoreForPanel,
  scoreReasonText,
  scoreDetailName,
  scoreDetailLabel,
  formatScoreShare,
  resetEditableScores,
} = useItemScores({ t, itemDisplayName, itemLocaleField })

// --- Filters ---
const filter = reactive({
  sources: [],
  prices: [],
  contents: [],
})

const availableSources = computed(() => {
  const set = new Set()
  packsRaw.value.forEach(p => {
    if (p.source === 'witch_gift') {
      set.add('witch_gift')
    } else if (p.source === 'permanent_pack') {
      set.add(p.source)
    } else if (p.source === 'ultra_sale' && p.originKeys) {
      p.originKeys.forEach(k => {
        set.add(k.includes('|') ? k.split('|')[0] : k)
      })
    } else {
      set.add(p.source)
    }
  })
  
  return Array.from(set).map(k => {
    if (k === 'witch_gift') return { key: k, label: t('sourceTypeWitch') }
    if (k === 'ultra_sale') return { key: k, label: t('sourceTypeUltra') }
    if (k === 'permanent_pack') return { key: k, label: t('sourceTypePermanent') }
    return { key: k, label: t(k) }
  })
})

const availablePrices = computed(() => {
  const prices = new Set(packsRaw.value.map(p => p.price))
  return Array.from(prices).sort((a, b) => a - b)
})

const availableItems = computed(() => {
  const map = new Map()
  
  packsRaw.value.forEach(pack => {
    pack.items.forEach(item => {
      const baseKey = getBaseItemKey(item.ItemType, item.ItemId)
      if (!map.has(baseKey)) {
        const [bType, bId] = JSON.parse(baseKey)
        const info = getItemInfo(normalizedScores.value, bType, bId)
        map.set(baseKey, { key: baseKey, ...info })
      }
    })
  })
  return Array.from(map.values()).sort((a, b) => b.score - a.score)
})

function toggleSource(src) {
  const idx = filter.sources.indexOf(src)
  if (idx === -1) filter.sources.push(src)
  else filter.sources.splice(idx, 1)
}

function togglePrice(price) {
  const idx = filter.prices.indexOf(price)
  if (idx === -1) filter.prices.push(price)
  else filter.prices.splice(idx, 1)
}

function toggleContent(key) {
  const idx = filter.contents.indexOf(key)
  if (idx === -1) filter.contents.push(key)
  else filter.contents.splice(idx, 1)
}

// --- Sort ---
const sortState = reactive({ by: 'ce', asc: false })
function toggleSort(field) {
  if (sortState.by === field) sortState.asc = !sortState.asc
  else { sortState.by = field; sortState.asc = false }
}
function sortIcon(field) {
  if (sortState.by !== field) return '↕'
  return sortState.asc ? '▲' : '▼'
}

// --- Calculation ---
const filteredPacks = computed(() => {
  let result = packsRaw.value
  if (filter.sources.length > 0) {
    result = result.filter(p => {
      if (p.source === 'witch_gift') return filter.sources.includes('witch_gift')
      if (p.source === 'permanent_pack') return filter.sources.includes('permanent_pack')
      
      if (p.source === 'ultra_sale') {
        if (!p.originKeys) return filter.sources.includes('ultra_sale')
        return p.originKeys.some(k => {
          const baseKey = k.includes('|') ? k.split('|')[0] : k
          return filter.sources.includes(baseKey)
        })
      }
      return filter.sources.includes(p.source)
    })
  }

  if (filter.prices.length > 0) {
    result = result.filter(p => filter.prices.includes(p.price))
  }

  if (filter.contents.length > 0) {
    result = result.filter(p => {
      const packBaseKeys = p.items.map(i => getBaseItemKey(i.ItemType, i.ItemId))
      return filter.contents.some(key => packBaseKeys.includes(key))
    })
  }

  return calculatePackCE(result, normalizedScores.value)
})

const sortedPacks = computed(() => {
  const result = [...filteredPacks.value]
  const { by, asc } = sortState
  result.sort((a, b) => {
    let va, vb
    if (by === 'name') { va = a.name; vb = b.name }
    else if (by === 'price') { va = a.price; vb = b.price }
    else if (by === 'ce') { va = a.ce; vb = b.ce }
    else if (by === 'value') { va = a.value; vb = b.value }
    else { va = a.name; vb = b.name }

    if (va === vb) return 0
    if (typeof va === 'string') {
      return asc ? va.localeCompare(vb) : vb.localeCompare(va)
    }
    return asc ? va - vb : vb - va
  })
  return result
})

const expanded = reactive(new Set())
function toggleExpand(i) {
  if (expanded.has(i)) expanded.delete(i)
  else expanded.add(i)
}

</script>

<style scoped>
:deep(.data-table td) {
  text-align: center;
  vertical-align: middle;
}
:deep(.data-table th) {
  text-align: center;
}
.badge-witch {
  background-color: #8e44ad;
  color: white;
}
.badge-ultra { background-color: #f57c00; color: white; border: 1px solid #e65100; }
.badge-permanent {
  background-color: #2e7d32;
  color: white;
  border: 1px solid #1b5e20;
}
.badge-other {
  background-color: #7f8c8d;
  color: white;
}

</style>
