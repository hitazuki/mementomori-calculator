<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">💰 {{ $t('navPackCompare') }}</h1>
    <p class="view-desc">{{ $t('packCompareDesc') }} — {{ $t('packCalcSource') }}</p>
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
        
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:13px; color:var(--text-muted); white-space:nowrap;">{{ $t('packCompareFilterSource') }}</span>
          <select class="form-select" v-model="filter.source" style="min-width:110px; padding:4px 28px 4px 8px; font-size:13px; height:28px;">
            <option value="all">{{ $t('packCompareAllSources') }}</option>
            <option value="ultra_sale">{{ $t('sourceTypeUltra') }}</option>
            <option value="witch_gift">{{ $t('sourceTypeWitch') }}</option>
          </select>
        </div>

        <div style="margin-left:auto; font-size:13px; color:var(--text-muted); white-space:nowrap;">
          {{ $t('packResultCount', { n: filteredPacks.length }) }}
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
                <td>{{ p.value.toLocaleString() }}</td>
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
import scoresRaw from '../constants/itemScores.json'
import { calculatePackCE, normalizeScores } from '../engine/packCalc.js'

const showScores = ref(true)
const { t, locale } = useI18n()
const baseUrl = import.meta.env.BASE_URL || '/'

// Map locale to itemScores name field
const localeNameMap = { 'zh-CN': 'nameZh', 'zh-TW': 'nameTw', 'en': 'nameEn', 'ja': 'nameJa', 'ko': 'nameKo' }
function itemDisplayName(s) {
  const field = localeNameMap[locale.value] || 'nameZh'
  return s[field] || s.name || s.ItemName || ''
}

function sourceBadgeClass(source) {
  if (source === 'witch_gift') return 'badge-witch'
  if (source === 'ultra_sale') return 'badge-ultra'
  return 'badge-other'
}

function sourceBadgeText(source) {
  if (source === 'witch_gift') return t('packBadgeWitch')
  if (source === 'ultra_sale') return t('packBadgeUltra')
  if (source === 'mixed') return t('packBadgeMixed')
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

// --- Scores (reactive, persisted) ---
// Note: using the same key as old page to sync scores
const STORAGE_KEY = 'mmt-pack-scores-v2'
const stored = localStorage.getItem(STORAGE_KEY)
let initialScores = JSON.parse(JSON.stringify(scoresRaw)) // deep copy
if (stored) {
  try {
    const parsed = JSON.parse(stored)
    for (const key in parsed) {
      if (initialScores[key]) {
        initialScores[key].score = parsed[key].score
      }
    }
  } catch(e) {
    console.error('Failed to parse stored scores', e)
  }
}
const editableScores = reactive(initialScores)

watch(editableScores, (v) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
}, { deep: true })

// --- Filters ---
const filter = reactive({
  source: 'all',
})

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
  if (filter.source !== 'all') {
    result = result.filter(p => p.source === filter.source)
  }

  const scores = normalizeScores(editableScores)
  return calculatePackCE(result, scores)
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
.badge-ultra {
  background-color: #2980b9;
  color: white;
}
.badge-other {
  background-color: #7f8c8d;
  color: white;
}
</style>
