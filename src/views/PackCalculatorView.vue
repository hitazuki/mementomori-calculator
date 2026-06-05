<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">💰 {{ $t('navPackCalc') }}</h1>
    <p class="view-desc">{{ $t('packCalcDesc') }} — {{ $t('packCalcSource') }}</p>
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <!-- Left Panel: Filters + Scores -->
    <div class="flex-col gap-12" style="position:sticky;top:24px;max-height:calc(100vh - 130px);overflow-y:auto;">
      <!-- Filters -->
      <div class="card">
        <div class="card-title">🔍 {{ $t('packFilterTitle') }}</div>
        <div class="form-group">
          <label class="form-label">{{ $t('packFilterCategory') }}</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-sm" :class="filter.cat==='tower'?'btn-primary':'btn-ghost'" @click="filter.cat='tower'">{{ $t('[TowerTypeInfinite]') }}</button>
            <button class="btn btn-sm" :class="filter.cat==='rank'?'btn-primary':'btn-ghost'" @click="filter.cat='rank'">{{ $t('[CommonPlayerRankLabel]') }}</button>
            <button class="btn btn-sm" :class="filter.cat==='quest'?'btn-primary':'btn-ghost'" @click="filter.cat='quest'">{{ $t('[CommonQuestLabel]') }}</button>
          </div>
        </div>
        <div class="form-group" v-if="filter.cat==='tower'">
          <label class="form-label">{{ $t('packFilterTower') }}</label>
          <select class="form-select" v-model="filter.tower">
            <option v-for="t in towerOptions" :key="t" :value="t">{{ towerName(t) }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('packFilterPrice') }}</label>
          <select class="form-select" v-model="filter.price">
            <option v-for="p in priceOptions" :key="p" :value="p">¥{{ p.toLocaleString() }}</option>
          </select>
        </div>
      </div>

      <!-- Scores Panel -->
      <div class="card">
        <details open style="outline:none;">
          <summary class="card-title" style="cursor:pointer;user-select:none;margin-bottom:0;">
            📊 {{ $t('packScoreTitle') }}
            <span style="margin-left:auto;font-size:12px;color:var(--gold);">▼</span>
          </summary>
          <div class="flex-col gap-8" style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--border-subtle);">
            <div v-for="(s, key) in editableScores" :key="key" v-show="s.isBase" style="display:flex;align-items:center;gap:8px;font-size:13px;">
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
                style="width:60px;padding:2px 4px;font-size:12px;height:22px;text-align:right;"
                min="0"
                step="1"
              />
              <span v-else style="width:60px;text-align:right;font-size:12px;font-weight:bold;color:var(--gold);">1</span>
              <span v-if="s.batch > 1" style="font-size:11px;color:var(--text-muted);min-width:50px;text-align:left;">/ {{ s.batch.toLocaleString() }}</span>
            </div>
          </div>
        </details>
      </div>
    </div>

    <!-- Right Panel: Results Table -->
    <div class="flex-col gap-12" style="min-width:0;">
      <div class="card" style="padding:8px 16px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:14px;">{{ $t('packResultCount', { n: filteredPacks.length }) }}</span>
      </div>

      <div class="card" style="overflow-x:auto;padding:8px;">
        <table class="data-table" style="font-size:12px;">
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
                  <span style="font-size:10px;margin-right:4px;">{{ expanded.has(i) ? '▼' : '▶' }}</span>
                  {{ p.trigger }}
                </td>
                <td style="white-space:nowrap;">¥{{ p.price.toLocaleString() }}</td>
                <td :style="{color: p.ce >= 1 ? '#2ecc71' : '#e74c3c', fontWeight:'bold'}">{{ p.ce.toFixed(1) }}</td>
                <td>{{ p.value.toLocaleString() }}</td>
                <td>
                  <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;">
                    <div
                      v-for="(item, j) in p.items"
                      :key="j"
                      :title="itemDisplayName(item)"
                      style="display:flex;align-items:center;gap:2px;font-size:12px;"
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
                <td :colspan="5" style="padding:4px 16px;">
                  <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:11px;align-items:flex-start;">
                    <div
                      v-for="(item, j) in p.items"
                      :key="j"
                      style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.03);padding:3px 8px;border-radius:4px;"
                    >
                      <img
                        :src="`${baseUrl}images/items/Item_${String(item.iconId).padStart(4,'0')}.png`"
                        style="width:22px;height:22px;"
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

import packsRaw from '../constants/ultraSalePacks.json'
import scoresRaw from '../constants/itemScores.json'
import { calculatePackCE, normalizeScores } from '../engine/packCalc.js'

const { t, locale } = useI18n()
const baseUrl = import.meta.env.BASE_URL || '/'

// Map locale to itemScores name field
const localeNameMap = { 'zh-CN': 'nameZh', 'zh-TW': 'nameTw', 'en': 'nameEn', 'ja': 'nameJa', 'ko': 'nameKo' }
function itemDisplayName(s) {
  const field = localeNameMap[locale.value] || 'nameZh'
  return s[field] || s.name || ''
}

// Map Japanese tower names to i18n keys
const towerKeyMap = {
  '無窮の塔': '[TowerTypeInfinite]',
  '藍の塔': '[TowerTypeBlue]',
  '紅の塔': '[TowerTypeRed]',
  '翠の塔': '[TowerTypeGreen]',
  '黄の塔': '[TowerTypeYellow]',
  '全塔': '[TowerTypeAllElement]',
}
function towerName(jpName) {
  const key = towerKeyMap[jpName]
  return key ? t(key) : jpName
}

// --- Scores (reactive, persisted) ---
const STORAGE_KEY = 'mmt-pack-scores-v2'
const stored = localStorage.getItem(STORAGE_KEY)
const initialScores = stored ? JSON.parse(stored) : scoresRaw
const editableScores = reactive(initialScores)

watch(editableScores, (v) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
}, { deep: true })

// --- Filters ---
const filter = reactive({
  cat: 'tower',
  tower: '無窮の塔',
  price: 11800
})

const towerOptions = computed(() => {
  const s = new Set()
  packsRaw.forEach(p => { if (p.cat === 'tower' && p.tower) s.add(p.tower) })
  return [...s].sort()
})

const priceOptions = computed(() => {
  const s = new Set()
  packsRaw.forEach(p => s.add(p.price))
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
  let result = packsRaw
  if (filter.cat) result = result.filter(p => p.cat === filter.cat)
  if (filter.cat === 'tower' && filter.tower) result = result.filter(p => p.tower === filter.tower)
  if (filter.price > 0) result = result.filter(p => p.price === filter.price)

  const scores = normalizeScores(editableScores)
  return calculatePackCE(result, scores)
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
