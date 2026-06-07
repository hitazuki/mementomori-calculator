<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">💰 {{ $t('navPackCalc') }}</h1>
    <p class="view-desc">
      {{ $t('packCalcDesc') }} — <span v-html="$t('packCalcSource')"></span>
    </p>
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <!-- Left Panel: Scores -->
    <div class="flex-col gap-12" style="position:sticky;top:24px;height:calc(100vh - 48px);">

      <!-- Scores Panel -->
      <div class="card flex-col" :style="{ flex: showScores ? 1 : 'none' }" style="min-height:0; display:flex; padding-bottom:12px;">
        <div class="card-title" @click="showScores = !showScores" style="cursor:pointer;user-select:none;margin-bottom:0;display:flex;align-items:center;">
          📊 {{ $t('packScoreTitle') }}
          <span style="margin-left:auto;font-size:var(--fs-xs);color:var(--gold);">{{ showScores ? '▼' : '▶' }}</span>
        </div>
        <div v-show="showScores" style="font-size: var(--fs-sm); color: var(--text-muted); margin-top: 8px; line-height: 1.4;">
          {{ $t('packScoreDesc') }}
        </div>
        <div v-show="showScores" class="flex-col gap-8" style="overflow-y:auto; margin-top:12px; padding-top:12px; border-top:1px dashed var(--border-subtle); padding-right:4px;">
          <div v-for="(s, key) in editableScores" :key="key" v-show="s.isBase" style="display:flex;align-items:center;gap:8px;font-size:var(--fs-sm);">
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
              style="width:64px;padding:2px 6px;font-size:var(--fs-sm);min-height:var(--control-h-sm);text-align:right;"
              min="0"
              step="1"
            />
            <span v-else class="num-value" style="width:64px;text-align:right;font-size:var(--fs-sm);color:var(--gold);">1</span>
            <span v-if="s.batch > 1" style="font-size:var(--fs-xs);color:var(--text-muted);min-width:50px;text-align:left;">/ {{ s.batch.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel: Results Table -->
    <div class="flex-col gap-12" style="min-width:0;">
      <!-- Filters -->
      <div class="card" style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; padding: 10px 14px;">
        <div style="font-weight:bold; font-size:var(--fs-sm); color:var(--text-primary); display:flex; align-items:center; white-space:nowrap;">
          🔍 {{ $t('packFilterTitle') }}
        </div>
        
        <div style="display:flex; gap:4px; align-items:center;">
          <button class="btn btn-sm" :class="filter.cat==='tower'?'btn-primary':'btn-ghost'" @click="filter.cat='tower'" style="padding:4px 10px; white-space:nowrap;">{{ $t('origin_tower_unknown') }}</button>
          <button class="btn btn-sm" :class="filter.cat==='rank'?'btn-primary':'btn-ghost'" @click="filter.cat='rank'" style="padding:4px 10px; white-space:nowrap;">{{ $t('origin_rank') }}</button>
          <button class="btn btn-sm" :class="filter.cat==='quest'?'btn-primary':'btn-ghost'" @click="filter.cat='quest'" style="padding:4px 10px; white-space:nowrap;">{{ $t('origin_quest') }}</button>
        </div>

        <div v-if="filter.cat==='tower'" style="display:flex; align-items:center; gap:6px;">
          <select class="form-select" v-model="filter.tower" style="min-width:110px; padding:4px 28px 4px 8px; font-size:var(--fs-sm); min-height:var(--control-h-sm);">
            <option v-for="t in towerOptions" :key="t" :value="t">{{ towerName(t) }}</option>
          </select>
        </div>

        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:var(--fs-sm); color:var(--text-muted); white-space:nowrap;">{{ $t('packFilterPrice') }}</span>
          <select class="form-select" v-model="filter.price" style="min-width:80px; padding:4px 28px 4px 8px; font-size:var(--fs-sm); min-height:var(--control-h-sm);">
            <option :value="0">-- {{ $t('ui_all') }} --</option>
            <option v-for="p in priceOptions" :key="p" :value="p">{{ formatPrice(p) }}</option>
          </select>
        </div>

        <div style="margin-left:auto; font-size:var(--fs-sm); color:var(--text-muted); white-space:nowrap;">
          {{ $t('packResultCount', { n: filteredPacks.length }) }}
        </div>
      </div>

      <div class="card" style="overflow-x:auto;padding:8px;">
        <table class="data-table">
          <thead>
            <tr>
              <th @click="toggleSort('trigger')" style="cursor:pointer;">{{ $t('packColTrigger') }} {{ sortIcon('trigger') }}</th>
              <th @click="toggleSort('price')" style="cursor:pointer;">{{ $t('packColPrice') }} {{ sortIcon('price') }}</th>
              <th @click="toggleSort('ce')" style="cursor:pointer;">CE {{ sortIcon('ce') }}</th>
              <th @click="toggleSort('value')" style="cursor:pointer;">{{ $t('packColValue') }} {{ sortIcon('value') }}</th>
              <th>{{ $t('packColItems') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(p, i) in sortedPacks" :key="i">
              <tr @click="toggleExpand(i)" style="cursor:pointer;" :class="{ 'row-expanded': expanded.has(i) }">
                <td style="white-space:nowrap;">
                  <span style="font-size:var(--fs-xs);margin-right:6px;">{{ expanded.has(i) ? '▼' : '▶' }}</span>
                  {{ p.trigger }}
                </td>
                <td style="white-space:nowrap;">{{ formatPrice(p.price) }}</td>
                <td :style="{color: p.ce >= 1 ? '#2ecc71' : '#e74c3c', fontWeight:'bold'}">{{ p.ce.toFixed(1) }}</td>
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
                <td :colspan="5" style="padding:6px 16px;">
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
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const showScores = ref(true)

import { calculatePackCE, normalizeScores } from '../engine/packCalc.js'
import { editableScores } from '../store/itemScores.js'

const { t, locale } = useI18n()
const baseUrl = import.meta.env.BASE_URL || '/'
const packsRaw = ref([])

onMounted(async () => {
  packsRaw.value = (await import('../constants/ultraSalePacks.json')).default
})

// Map locale to itemScores name field
const localeNameMap = { 'zh-CN': 'nameZh', 'zh-TW': 'nameTw', 'en': 'nameEn', 'ja': 'nameJa', 'ko': 'nameKo' }
function itemDisplayName(s) {
  const field = localeNameMap[locale.value] || 'nameZh'
  return s[field] || s.name || ''
}

// Tower names are now stored as i18n keys directly
function towerName(key) {
  return key ? t(key) : ''
}

function formatPrice(p) {
  return '¥' + p.toLocaleString()
}

// --- Scores (shared) ---
// editableScores is now imported from store/itemScores.js
const normalizedScores = computed(() => normalizeScores(editableScores))

// --- Filters ---
const filter = reactive({
  cat: 'tower',
  tower: 'origin_tower_infinite',
  price: 11800
})

const towerOptions = computed(() => {
  const s = new Set()
  packsRaw.value.forEach(p => { if (p.cat === 'tower' && p.tower) s.add(p.tower) })
  return [...s].sort()
})

const priceOptions = computed(() => {
  const s = new Set()
  packsRaw.value.forEach(p => s.add(p.price))
  return [...s].sort((a, b) => b - a)
})

// --- Sort ---
const sortState = reactive({ by: 'trigger', asc: true })
function toggleSort(field) {
  if (sortState.by === field) sortState.asc = !sortState.asc
  else { sortState.by = field; sortState.asc = true }
}
function sortIcon(field) {
  if (sortState.by !== field) return '↕'
  return sortState.asc ? '▲' : '▼'
}

// --- Calculation ---
const filteredPacks = computed(() => {
  let result = packsRaw.value
  if (filter.cat) result = result.filter(p => p.cat === filter.cat)
  if (filter.cat === 'tower' && filter.tower) result = result.filter(p => p.tower === filter.tower)
  if (filter.price > 0) result = result.filter(p => p.price === filter.price)

  return calculatePackCE(result, normalizedScores.value)
})

const sortedPacks = computed(() => {
  const result = [...filteredPacks.value]
  const { by, asc } = sortState
  result.sort((a, b) => {
    let va, vb
    if (by === 'trigger') { va = a.sortKey; vb = b.sortKey }
    else if (by === 'price') { va = a.price; vb = b.price }
    else if (by === 'ce') { va = a.ce; vb = b.ce }
    else if (by === 'value') { va = a.value; vb = b.value }
    else { va = a.cat + a.tower; vb = b.cat + b.tower }
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

function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(Math.round(n))
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

</style>
