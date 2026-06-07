<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">💰 {{ $t('navPackCompare') }}</h1>
    <p class="view-desc">
      {{ $t('packCompareDesc') }} — <span v-html="$t('packCalcSource')"></span>
    </p>
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <!-- Left Panel: Scores -->
    <div class="flex-col gap-12" style="position:sticky;top:24px;height:calc(100vh - 48px);">
      <!-- Scores Panel -->
      <div class="card flex-col" :style="{ flex: showScores ? 1 : 'none' }" style="min-height:0; display:flex; padding-bottom:12px;">
        <div class="card-title" @click="showScores = !showScores" style="cursor:pointer;user-select:none;margin-bottom:0;display:flex;align-items:center;">
          📊 {{ $t('packScoreTitle') }}
          <span style="margin-left:auto;font-size:12px;color:var(--gold);">{{ showScores ? '▼' : '▶' }}</span>
        </div>
        <div v-show="showScores" style="font-size: 13px; color: var(--text-muted); margin-top: 8px; line-height: 1.4;">
          {{ $t('packScoreDesc') }}
        </div>
        <div v-show="showScores" class="flex-col gap-8" style="overflow-y:auto; margin-top:12px; padding-top:12px; border-top:1px dashed var(--border-subtle); padding-right:4px;">
          <div v-for="(s, key) in editableScores" :key="key" v-show="s.isBase" style="display:flex;align-items:center;gap:8px;font-size:14px;">
            <img
              :src="`${baseUrl}images/items/Item_${String(s.iconId).padStart(4,'0')}.png`"
              style="width:24px;height:24px;flex-shrink:0;"
              @error="e => e.target.style.display='none'"
            />
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="itemDisplayName(s)">{{ itemDisplayName(s) }}</span>
            <input
              v-if="!isLocked(key)"
              class="form-input"
              type="number"
              v-model.number="s.score"
              style="width:60px;padding:2px 4px;font-size:14px;height:24px;text-align:right;"
              min="0"
              step="1"
            />
            <span v-else style="width:60px;text-align:right;font-size:14px;font-weight:bold;color:var(--gold);">1</span>
            <span v-if="s.batch > 1" style="font-size:12px;color:var(--text-muted);min-width:50px;text-align:left;">/ {{ s.batch.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel: Results Table -->
    <div class="flex-col gap-12" style="min-width:0;">
      <!-- Filters -->
      <div class="card" style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; padding: 10px 14px;">
        <div style="font-weight:bold; font-size:14px; color:var(--text-primary); display:flex; align-items:center; white-space:nowrap;">
          🔍 {{ $t('packFilterTitle') }}
        </div>
        
        <div style="margin-left:auto; font-size:13px; color:var(--text-muted); white-space:nowrap;">
          {{ $t('packResultCount', { n: filteredPacks.length }) }}
        </div>

        <div style="width: 100%; height: 1px; background: var(--border-subtle); margin: 2px 0;"></div>

        <div style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
          <!-- Sources -->
          <div>
            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 6px;">{{ $t('packCompareFilterSource') }}</div>
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
            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 6px;">{{ $t('packFilterPrice') }}</div>
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
            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 6px;">{{ $t('packFilterContentsOr') }}</div>
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

      <div class="card" style="overflow-x:auto;padding:8px;">
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
                  <span style="font-size:12px;margin-right:6px;">{{ expanded.has(i) ? '▼' : '▶' }}</span>
                  <span :class="sourceBadgeClass(p.source)" style="margin-right:6px; font-size:10px; padding:2px 4px; border-radius:4px;">
                    {{ sourceBadgeText(p.source) }}
                  </span>
                  <span style="font-weight:bold;">{{ getShortPackName(p) }}</span>
                </td>
                <td style="white-space:nowrap;">¥{{ p.price.toLocaleString() }}</td>
                <td :style="{color: getCeColor(p.ce), fontWeight:'bold', fontSize: p.ce >= 1.5 ? '15px' : '14px'}">{{ p.ce.toFixed(2) }}</td>
                <td style="white-space:nowrap;">{{ p.originalValue.toLocaleString() }} <span style="font-size:12px;color:var(--gold);">+ {{ p.rechargeValue.toLocaleString() }}</span></td>
                <td>
                  <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;">
                    <div
                      v-for="(item, j) in p.items"
                      :key="j"
                      :title="itemDisplayName(item)"
                      style="display:flex;align-items:center;gap:4px;font-size:13px;"
                    >
                      <img
                        :src="`${baseUrl}images/items/Item_${String(item.iconId).padStart(4,'0')}.png`"
                        style="width:24px;height:24px;"
                        @error="e => e.target.style.display='none'"
                      />
                      <span style="font-weight:bold;color:var(--text-base);">×{{ item.qty }}</span>
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-if="expanded.has(i)" style="background:rgba(255,255,255,0.02);">
                <td :colspan="5" style="padding:12px 16px;">
                  <div v-if="p.originKeys.length > 1" style="margin-bottom:12px; font-size:13px; color:var(--text-muted); text-align:left; background:rgba(0,0,0,0.2); padding:6px 12px; border-radius:4px; border-left:3px solid var(--gold);">
                    <strong style="color:var(--text-base); margin-right:8px;">{{ $t('packCompareFullSources') }}:</strong>
                    {{ getFullPackName(p) }}
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:13px;align-items:flex-start;">
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
                      <span style="color:var(--text-muted);">×{{ item.qty }}</span>
                      <span style="color:var(--gold);font-weight:bold;">{{ Math.round(item.value).toLocaleString() }}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import packsRaw from '../constants/allPacks.json'
import { calculatePackCE, normalizeScores, getItemInfo, getBaseItemKey } from '../engine/packCalc.js'
import { editableScores } from '../store/itemScores.js'

const showScores = ref(true)
const { t, locale } = useI18n()
const baseUrl = import.meta.env.BASE_URL || '/'

// Map locale to itemScores name field
const localeNameMap = { 'zh-CN': 'nameZh', 'zh-TW': 'nameTw', 'en': 'nameEn', 'ja': 'nameJa', 'ko': 'nameKo' }
function itemDisplayName(s) {
  const field = localeNameMap[locale.value] || 'nameZh'
  return s[field] || s.name || s.ItemName || ''
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

// --- Scores (shared) ---
// editableScores is now imported from store/itemScores.js
const normalizedScores = computed(() => normalizeScores(editableScores))

// --- Filters ---
const filter = reactive({
  sources: [],
  prices: [],
  contents: [],
})

const availableSources = computed(() => {
  const set = new Set()
  packsRaw.forEach(p => {
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
  const prices = new Set(packsRaw.map(p => p.price))
  return Array.from(prices).sort((a, b) => a - b)
})

const availableItems = computed(() => {
  const map = new Map()
  
  packsRaw.forEach(pack => {
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
  let result = packsRaw
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

const LOCKED_SCORES = { '[2,1]': true }
function isLocked(key) { return !!LOCKED_SCORES[key] }

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
