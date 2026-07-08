<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">🛒 {{ $t('navShopExchange') }}</h1>
    <p class="view-desc">{{ $t('shopExchangeDesc') }}</p>
  </div>

  <div class="grid-sidebar animate-fadeup" style="align-items:start;gap:16px">
    <ItemScorePanel
      v-model:show-scores="showScores"
      desc-key="shopScoreDesc"
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

    <div class="flex-col gap-12" style="min-width:0;">
      <div class="card shop-switch-card">
        <div class="shop-switch-title">{{ $t('shopSelectLabel') }}</div>
        <div class="shop-switch-buttons">
          <button
            v-for="shop in calculatedShops"
            :key="shop.shopKey"
            class="btn btn-sm"
            :class="selectedShopKey === shop.shopKey ? 'btn-primary' : 'btn-ghost'"
            type="button"
            @click="selectedShopKey = shop.shopKey"
          >
            {{ itemDisplayName(shop) }}
          </button>
        </div>
      </div>

      <div class="shop-result-bar">
        <div class="shop-currency-strip">
          <img :src="itemIconUrl(selectedShop.currency.iconId)" @error="hideBrokenImage" />
          <span>{{ itemDisplayName(selectedShop) }}</span>
          <b>{{ itemDisplayName(selectedShop.currency) }}</b>
        </div>

        <div class="shop-compact-sort">
          <label>{{ $t('shopSortLabel') }}</label>
          <select class="form-select shop-sort-select" v-model="sortState.by">
            <option value="original">{{ $t('shopSortOriginal') }}</option>
            <option value="ce">{{ $t('shopSortCe') }}</option>
            <option value="value">{{ $t('shopSortValue') }}</option>
            <option value="cost">{{ $t('shopSortCost') }}</option>
          </select>

          <button v-if="sortState.by !== 'original'" class="btn btn-ghost btn-sm shop-sort-dir" @click="sortState.asc = !sortState.asc">
            {{ sortState.asc ? '▲' : '▼' }}
          </button>

          <div class="shop-count">
            {{ $t('shopResultCount', { n: sortedProducts.length }) }}
          </div>
        </div>
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
            <div v-for="item in product.contentDetails" :key="`${product.id}-${item.scoreKey || `${item.itemType}-${item.itemId}`}`" class="shop-detail-row">
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
import ItemScorePanel from '../components/ItemScorePanel.vue'
import { shopItems } from '../constants/shopItems.js'
import { calculateShopCE, sortShopProducts } from '../engine/shopCalc.js'
import { useItemScores } from '../composables/useItemScores.js'

const { t, locale } = useI18n()
const baseUrl = import.meta.env.BASE_URL || '/'
const showScores = ref(true)
const selectedShopKey = ref(shopItems[0]?.shopKey || '')
const sortState = reactive({ by: 'original', asc: true })
const expanded = reactive(new Set())

const localeNameMap = { 'zh-CN': 'nameZh', 'zh-TW': 'nameTw', en: 'nameEn', ja: 'nameJa', ko: 'nameKo' }
const unlimitedLimitText = {
  'zh-CN': '不限购',
  'zh-TW': '不限購',
  en: 'Unlimited',
  ja: '購入制限なし',
  ko: '구매 제한 없음',
}

function itemLocaleField() {
  return localeNameMap[locale.value] || 'nameZh'
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
const calculatedShops = computed(() => calculateShopCE(shopItems, normalizedScores.value))
const selectedShop = computed(() => calculatedShops.value.find(shop => shop.shopKey === selectedShopKey.value) || calculatedShops.value[0])
const sortedProducts = computed(() => {
  const products = selectedShop.value?.products || []
  return sortShopProducts(products, sortState.by, sortState.asc)
})

watch(selectedShopKey, () => expanded.clear())

function itemDisplayName(item) {
  const field = localeNameMap[locale.value] || 'nameZh'
  return item?.[field] || item?.name || item?.ItemName || ''
}

function productDisplayName(product) {
  if (product.displayName) return product.displayName
  if (product.rewardDetails?.[0] && !product.treasureChestId) {
    return itemDisplayName(product.rewardDetails[0]) || product.name
  }
  return itemDisplayName(product)
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
  if (limit === Infinity) {
    const translated = t('shopLimitUnlimited')
    return translated === 'shopLimitUnlimited' ? unlimitedLimitText[locale.value] || unlimitedLimitText['zh-CN'] : translated
  }
  return limit == null ? t('shopLimitUnknown') : t('shopLimitTimes', { n: limit })
}

function getCeColor(ce) {
  if (ce == null) return 'var(--text-muted)'
  if (ce >= 2) return '#f1c40f'
  if (ce >= 1) return '#2ecc71'
  if (ce >= 0.5) return '#3498db'
  return '#e74c3c'
}

</script>

<style scoped>
.shop-switch-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.shop-switch-title {
  flex: 0 0 auto;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  font-weight: 700;
}

.shop-switch-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.shop-switch-buttons .btn {
  min-height: var(--control-h-sm);
  white-space: normal;
  text-align: left;
  line-height: 1.25;
}

.shop-result-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 32px;
}

.shop-currency-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
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

.shop-currency-strip span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-compact-sort {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

.shop-compact-sort label {
  color: var(--text-muted);
  font-size: var(--fs-sm);
  font-weight: 700;
  white-space: nowrap;
}

.shop-sort-select {
  width: 132px;
  min-height: var(--control-h-sm);
  padding-top: 4px;
  padding-bottom: 4px;
}

.shop-sort-dir {
  width: 38px;
  min-width: 38px;
  min-height: var(--control-h-sm);
}

.shop-count {
  color: var(--text-muted);
  font-size: var(--fs-sm);
  white-space: nowrap;
  margin-left: 6px;
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
  .shop-switch-card {
    align-items: stretch;
    flex-direction: column;
  }

  .shop-switch-buttons {
    flex-direction: column;
  }

  .shop-result-bar {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .shop-compact-sort {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .shop-sort-select {
    flex: 1;
    min-width: 140px;
  }

  .shop-count {
    margin-left: auto;
  }

  .shop-product-grid {
    grid-template-columns: 1fr;
  }
}
</style>
