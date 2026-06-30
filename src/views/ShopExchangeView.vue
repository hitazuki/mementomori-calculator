<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">🛒 {{ $t('navShopExchange') }}</h1>
    <p class="view-desc">{{ $t('shopExchangeDesc') }}</p>
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <div class="flex-col gap-12 pack-score-panel">
      <div class="card flex-col" :style="{ flex: showScores ? 1 : 'none' }" style="min-height:0;display:flex;padding-bottom:12px;">
        <div class="card-title" @click="showScores = !showScores" style="cursor:pointer;user-select:none;margin-bottom:0;display:flex;align-items:center;">
          📊 {{ $t('packScoreTitle') }}
          <span style="margin-left:auto;font-size:var(--fs-xs);color:var(--gold);">{{ showScores ? '▼' : '▶' }}</span>
        </div>
        <div v-show="showScores" style="font-size:var(--fs-sm);color:var(--text-muted);margin-top:8px;line-height:1.4;">
          {{ $t('shopScoreDesc') }}
        </div>
        <div v-show="showScores" class="flex-col gap-8 shop-score-list">
          <div v-for="row in editableScoreRows" :key="row.key" class="shop-score-row">
            <img
              :src="itemIconUrl(row.item.iconId)"
              class="shop-score-icon"
              @error="hideBrokenImage"
            />
            <span class="shop-score-name" :title="itemDisplayName(row.item)">{{ itemDisplayName(row.item) }}</span>
            <input
              v-if="!isLocked(row.key)"
              class="form-input shop-score-input"
              type="number"
              v-model.number="editableScores[row.key].score"
              min="0"
              step="1"
            />
            <span v-else class="num-value shop-score-fixed">{{ formatNumber(row.item.score) }}</span>
            <span v-if="row.item.batch > 1" class="shop-score-batch">/ {{ row.item.batch.toLocaleString() }}</span>
          </div>

          <div class="score-derived-divider">{{ t('scoreReadonlyTitle') }}</div>
          <div v-for="row in readonlyScoreRows" :key="row.key" class="score-derived-row">
            <img
              :src="itemIconUrl(row.iconId)"
              class="shop-score-icon"
              @error="hideBrokenImage"
            />
            <span class="score-derived-name" :title="itemDisplayName(row)">{{ itemDisplayName(row) }}</span>
            <span class="num-value score-derived-value">{{ formatNumber(row.score) }}</span>
            <small>{{ scoreReasonText(row) }}</small>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-col gap-12" style="min-width:0;">
      <div class="card shop-toolbar">
        <div class="shop-toolbar-field">
          <label>{{ $t('shopSelectLabel') }}</label>
          <select class="form-select" v-model="selectedShopKey">
            <option v-for="shop in calculatedShops" :key="shop.shopKey" :value="shop.shopKey">
              {{ shop.shopName }}
            </option>
          </select>
        </div>

        <div class="shop-toolbar-field">
          <label>{{ $t('shopSortLabel') }}</label>
          <select class="form-select" v-model="sortState.by">
            <option value="ce">{{ $t('shopSortCe') }}</option>
            <option value="value">{{ $t('shopSortValue') }}</option>
            <option value="cost">{{ $t('shopSortCost') }}</option>
            <option value="name">{{ $t('packCompareColName') }}</option>
          </select>
        </div>

        <button class="btn btn-ghost btn-sm shop-sort-dir" @click="sortState.asc = !sortState.asc">
          {{ sortState.asc ? '▲' : '▼' }}
        </button>

        <div class="shop-count">
          {{ $t('shopResultCount', { n: sortedProducts.length }) }}
        </div>
      </div>

      <div class="shop-currency-strip">
        <img :src="itemIconUrl(selectedShop.currency.iconId)" @error="hideBrokenImage" />
        <span>{{ selectedShop.shopName }}</span>
        <b>{{ selectedShop.currency.name }}</b>
      </div>

      <div class="shop-product-grid">
        <article v-for="product in sortedProducts" :key="product.id" class="card shop-product-card">
          <div class="shop-product-top">
            <img
              :src="itemIconUrl(productIconId(product))"
              class="shop-product-icon"
              @error="hideBrokenImage"
            />
            <div class="shop-product-title">
              <h2>{{ productDisplayName(product) }}</h2>
              <span v-if="product.tier">{{ $t('shopTierLabel', { tier: product.tier }) }}</span>
            </div>
          </div>

          <div class="shop-product-metrics">
            <div>
              <span>{{ $t('shopRewardQty') }}</span>
              <b>×{{ formatNumber(product.reward?.quantity || 1) }}</b>
            </div>
            <div>
              <span>{{ $t('packColPrice') }}</span>
              <b>{{ formatNullableNumber(product.cost) }}</b>
            </div>
            <div>
              <span>{{ $t('packColValue') }}</span>
              <b>{{ formatNumber(product.rewardValue) }}</b>
            </div>
            <div>
              <span>CE</span>
              <b :style="{ color: getCeColor(product.ce) }">{{ formatCe(product.ce) }}</b>
            </div>
          </div>

          <div class="shop-product-footer">
            <span>{{ formatLimit(product.limitTotal) }}</span>
            <button
              v-if="product.contentDetails.length > 1 || product.missingScoreItems.length"
              class="btn btn-ghost btn-sm"
              @click="toggleExpand(product.id)"
            >
              {{ expanded.has(product.id) ? $t('shopHideDetails') : $t('shopShowDetails') }}
            </button>
          </div>

          <div v-if="expanded.has(product.id)" class="shop-detail">
            <div v-if="product.missingScoreItems.length" class="shop-missing">
              {{ $t('shopMissingScoreNotice') }}
            </div>
            <div v-for="item in product.contentDetails" :key="`${product.id}-${item.itemType}-${item.itemId}`" class="shop-detail-row">
              <img :src="itemIconUrl(item.iconId)" @error="hideBrokenImage" />
              <span class="shop-detail-name" :title="itemDisplayName(item)">{{ itemDisplayName(item) }}</span>
              <span>×{{ formatNumber(item.quantity) }}</span>
              <b>{{ formatNumber(item.value) }}</b>
              <small>{{ formatPercent(item.value, product.rewardValue) }}</small>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { shopItems } from '../constants/shopItems.js'
import { buildDerivedScoreState } from '../engine/derivedScores.js'
import { calculateShopCE, sortShopProducts } from '../engine/shopCalc.js'
import { normalizeScores } from '../engine/packCalc.js'
import { editableScores } from '../store/itemScores.js'

const { t, locale } = useI18n()
const baseUrl = import.meta.env.BASE_URL || '/'
const showScores = ref(true)
const selectedShopKey = ref(shopItems[0]?.shopKey || '')
const sortState = reactive({ by: 'ce', asc: false })
const expanded = reactive(new Set())

const localeNameMap = { 'zh-CN': 'nameZh', 'zh-TW': 'nameTw', en: 'nameEn', ja: 'nameJa', ko: 'nameKo' }

const baseScores = computed(() => normalizeScores(editableScores))
const derivedScoreState = computed(() => buildDerivedScoreState(baseScores.value))
const normalizedScores = computed(() => derivedScoreState.value.scores)
const readonlyScoreRows = computed(() => derivedScoreState.value.readonlyRows)
const editableScoreRows = computed(() => Object.entries(editableScores)
  .filter(([key, score]) => score.isBase && !isReadonlyScore(key))
  .map(([key, item]) => ({ key, item })))
const calculatedShops = computed(() => calculateShopCE(shopItems, normalizedScores.value))
const selectedShop = computed(() => calculatedShops.value.find(shop => shop.shopKey === selectedShopKey.value) || calculatedShops.value[0])
const sortedProducts = computed(() => sortShopProducts(selectedShop.value?.products || [], sortState.by, sortState.asc))

watch(selectedShopKey, () => expanded.clear())

function itemDisplayName(item) {
  const field = localeNameMap[locale.value] || 'nameZh'
  return item?.[field] || item?.name || item?.ItemName || ''
}

function productDisplayName(product) {
  if (product.rewardDetails?.[0] && !product.treasureChestId) {
    return itemDisplayName(product.rewardDetails[0]) || product.name
  }
  return product.name
}

function productIconId(product) {
  return product.iconId || product.rewardDetails?.[0]?.iconId || product.reward?.itemId || 0
}

function itemIconUrl(iconId) {
  return `${baseUrl}images/items/Item_${String(iconId || 0).padStart(4, '0')}.png`
}

function hideBrokenImage(event) {
  event.target.style.display = 'none'
}

function toggleExpand(id) {
  if (expanded.has(id)) expanded.delete(id)
  else expanded.add(id)
}

function formatNumber(value) {
  const numeric = Number(value) || 0
  if (Math.abs(numeric) > 0 && Math.abs(numeric) < 10) return numeric.toFixed(2)
  return Math.round(numeric).toLocaleString()
}

function formatNullableNumber(value) {
  return value == null ? '-' : formatNumber(value)
}

function formatCe(value) {
  return value == null ? '-' : value.toFixed(2)
}

function formatPercent(value, total) {
  if (!total) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

function formatLimit(limit) {
  return limit == null ? t('shopLimitUnknown') : t('shopLimitTimes', { n: limit })
}

function getCeColor(ce) {
  if (ce == null) return 'var(--text-muted)'
  if (ce >= 2) return '#f1c40f'
  if (ce >= 1) return '#2ecc71'
  if (ce >= 0.5) return '#3498db'
  return '#e74c3c'
}

function scoreReasonText(row) {
  return row.reasonKey ? t(row.reasonKey, row.reasonParams || {}) : row.reason
}

const LOCKED_SCORES = { '[2,1]': true }

function isLocked(key) {
  return Boolean(LOCKED_SCORES[key])
}

function isReadonlyScore(key) {
  return key === '[1,1]' || key === '[13,1]'
}
</script>

<style scoped>
.shop-score-list {
  overflow-y: auto;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-subtle);
  padding-right: 4px;
}

.shop-score-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-sm);
}

.shop-score-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.shop-score-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-score-input {
  width: 64px;
  padding: 2px 6px;
  font-size: var(--fs-sm);
  min-height: var(--control-h-sm);
  text-align: right;
}

.shop-score-fixed {
  width: 64px;
  text-align: right;
  font-size: var(--fs-sm);
  color: var(--gold);
}

.shop-score-batch {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  min-width: 50px;
}

.score-derived-divider {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-subtle);
  color: var(--gold);
  font-size: var(--fs-xs);
}

.score-derived-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 64px;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-sm);
}

.score-derived-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-derived-value {
  text-align: right;
  color: var(--gold);
  font-size: var(--fs-sm);
}

.score-derived-row small {
  grid-column: 2 / -1;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  line-height: 1.25;
}

.shop-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  padding: 12px 14px;
}

.shop-toolbar-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}

.shop-toolbar-field label {
  font-size: var(--fs-xs);
  color: var(--text-muted);
}

.shop-sort-dir {
  min-width: 42px;
}

.shop-count {
  margin-left: auto;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  padding-bottom: 8px;
}

.shop-currency-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.shop-currency-strip img {
  width: 24px;
  height: 24px;
}

.shop-currency-strip b {
  color: var(--gold);
}

.shop-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.shop-product-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
}

.shop-product-top {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.shop-product-icon {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}

.shop-product-title {
  min-width: 0;
}

.shop-product-title h2 {
  margin: 0;
  font-size: var(--fs-md);
  line-height: 1.25;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.shop-product-title span {
  font-size: var(--fs-xs);
  color: var(--text-muted);
}

.shop-product-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.shop-product-metrics div {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 8px;
  min-width: 0;
}

.shop-product-metrics span {
  display: block;
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.shop-product-metrics b {
  display: block;
  margin-top: 3px;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.shop-product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 32px;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.shop-detail {
  border-top: 1px dashed var(--border-subtle);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shop-missing {
  color: var(--danger);
  font-size: var(--fs-xs);
}

.shop-detail-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto auto 46px;
  align-items: center;
  gap: 7px;
  font-size: var(--fs-xs);
}

.shop-detail-row img {
  width: 24px;
  height: 24px;
}

.shop-detail-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-detail-row b {
  color: var(--gold);
}

.shop-detail-row small {
  color: var(--text-muted);
  text-align: right;
}

@media (max-width: 768px) {
  .shop-toolbar-field {
    min-width: 100%;
  }

  .shop-count {
    margin-left: 0;
    width: 100%;
    padding-bottom: 0;
  }

  .shop-product-grid {
    grid-template-columns: 1fr;
  }
}
</style>
