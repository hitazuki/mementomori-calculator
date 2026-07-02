<template>
  <div class="card pack-filters-card">
    <div class="pack-filter-title">
      🔍 {{ $t('packFilterTitle') }}
    </div>

    <div class="pack-filter-group">
      <button class="btn btn-sm" :class="filter.cat === 'tower' ? 'btn-primary' : 'btn-ghost'" @click="filter.cat = 'tower'">{{ $t('origin_tower_unknown') }}</button>
      <button class="btn btn-sm" :class="filter.cat === 'rank' ? 'btn-primary' : 'btn-ghost'" @click="filter.cat = 'rank'">{{ $t('origin_rank') }}</button>
      <button class="btn btn-sm" :class="filter.cat === 'quest' ? 'btn-primary' : 'btn-ghost'" @click="filter.cat = 'quest'">{{ $t('origin_quest') }}</button>
    </div>

    <div v-if="filter.cat === 'tower'" class="pack-filter-group">
      <select class="form-select pack-filter-select" v-model="filter.tower">
        <option v-for="t in towerOptions" :key="t" :value="t">{{ towerName(t) }}</option>
      </select>
    </div>

    <div class="pack-filter-group">
      <span class="pack-filter-label">{{ $t('packFilterPrice') }}</span>
      <select class="form-select pack-filter-price" v-model="filter.price">
        <option :value="0">-- {{ $t('ui_all') }} --</option>
        <option v-for="p in priceOptions" :key="p" :value="p">{{ formatPrice(p) }}</option>
      </select>
    </div>

    <div class="pack-result-count">
      {{ $t('packResultCount', { n: filteredCount }) }}
    </div>

    <div class="mobile-pack-sort">
      <select class="form-select" v-model="sortState.by">
        <option value="trigger">{{ $t('packColTrigger') }}</option>
        <option value="price">{{ $t('packColPrice') }}</option>
        <option value="ce">CE</option>
        <option value="value">{{ $t('packColValue') }}</option>
      </select>
      <button class="btn btn-ghost btn-sm" @click="sortState.asc = !sortState.asc">
        {{ sortState.asc ? '▲' : '▼' }}
      </button>
    </div>
  </div>

  <div class="card desktop-pack-table">
    <table class="data-table">
      <thead>
        <tr>
          <th @click="$emit('toggleSort', 'trigger')">{{ $t('packColTrigger') }} {{ sortIcon('trigger') }}</th>
          <th @click="$emit('toggleSort', 'price')">{{ $t('packColPrice') }} {{ sortIcon('price') }}</th>
          <th @click="$emit('toggleSort', 'ce')">CE {{ sortIcon('ce') }}</th>
          <th @click="$emit('toggleSort', 'value')">{{ $t('packColValue') }} {{ sortIcon('value') }}</th>
          <th>{{ $t('packColItems') }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(p, i) in sortedPacks" :key="i">
          <tr @click="$emit('toggleExpand', i)" class="pack-table-row" :class="{ 'row-expanded': expanded.has(i) }">
            <td class="pack-nowrap">
              <span class="pack-expand-icon">{{ expanded.has(i) ? '▼' : '▶' }}</span>
              {{ p.trigger }}
            </td>
            <td class="pack-nowrap">{{ formatPrice(p.price) }}</td>
            <td :style="{ color: p.ce >= 1 ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }">{{ p.ce.toFixed(1) }}</td>
            <td class="pack-nowrap">{{ p.originalValue.toLocaleString() }} <span class="pack-recharge-value">+ {{ p.rechargeValue.toLocaleString() }}</span></td>
            <td>
              <div class="pack-item-icons">
                <div
                  v-for="(item, j) in p.items"
                  :key="j"
                  :title="itemDisplayName(item)"
                  class="pack-item-icon-row"
                >
                  <img
                    :src="`${baseUrl}images/items/Item_${String(item.iconId).padStart(4,'0')}.png`"
                    class="pack-item-icon"
                    @error="e => e.target.style.display='none'"
                  />
                  <span class="pack-item-qty"><span class="pack-item-qty-mark">×</span>{{ item.qty }}</span>
                </div>
              </div>
            </td>
          </tr>
          <tr v-if="expanded.has(i)" class="pack-detail-row">
            <td :colspan="5">
              <div class="pack-detail-items">
                <div
                  v-for="(item, j) in p.items"
                  :key="j"
                  class="pack-detail-item"
                >
                  <img
                    :src="`${baseUrl}images/items/Item_${String(item.iconId).padStart(4,'0')}.png`"
                    class="pack-item-icon"
                    @error="e => e.target.style.display='none'"
                  />
                  <span class="pack-detail-name">{{ itemDisplayName(item) }}</span>
                  <span class="pack-item-qty pack-item-qty-muted"><span class="pack-item-qty-mark">×</span>{{ item.qty }}</span>
                  <span class="pack-detail-value">{{ Math.round(item.value).toLocaleString() }}</span>
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
      @click="$emit('toggleExpand', i)"
    >
      <div class="mobile-pack-head">
        <div class="mobile-pack-title">
          <span>{{ p.trigger }}</span>
        </div>
        <div class="mobile-pack-ce" :style="{ color: p.ce >= 1 ? '#2ecc71' : '#e74c3c' }">
          CE {{ p.ce.toFixed(1) }}
        </div>
      </div>

      <div class="mobile-pack-meta">
        <span>{{ $t('packColPrice') }} <b>{{ formatPrice(p.price) }}</b></span>
        <span>{{ $t('packColValue') }} <b>{{ p.originalValue.toLocaleString() }}</b> <em>+ {{ p.rechargeValue.toLocaleString() }}</em></span>
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
</template>

<script setup>
defineProps({
  filter: { type: Object, required: true },
  sortState: { type: Object, required: true },
  expanded: { type: Object, required: true },
  towerOptions: { type: Array, required: true },
  priceOptions: { type: Array, required: true },
  filteredCount: { type: Number, required: true },
  sortedPacks: { type: Array, required: true },
  baseUrl: { type: String, required: true },
  towerName: { type: Function, required: true },
  formatPrice: { type: Function, required: true },
  itemDisplayName: { type: Function, required: true },
  sortIcon: { type: Function, required: true },
})

defineEmits(['toggleSort', 'toggleExpand'])
</script>

<style scoped>
.pack-filters-card {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
}

.pack-filter-title {
  font-weight: bold;
  font-size: var(--fs-sm);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.pack-filter-group {
  display: flex;
  gap: 6px;
  align-items: center;
}

.pack-filter-group .btn {
  padding: 4px 10px;
  white-space: nowrap;
}

.pack-filter-label {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  white-space: nowrap;
}

.pack-filter-select {
  min-width: 110px;
}

.pack-filter-price {
  min-width: 80px;
}

.pack-filter-select,
.pack-filter-price {
  padding: 4px 28px 4px 8px;
  font-size: var(--fs-sm);
  min-height: var(--control-h-sm);
}

.pack-result-count {
  margin-left: auto;
  font-size: var(--fs-sm);
  color: var(--text-muted);
  white-space: nowrap;
}

.desktop-pack-table {
  overflow-x: auto;
  padding: 8px;
}

.desktop-pack-table th,
.pack-table-row {
  cursor: pointer;
}

.pack-nowrap {
  white-space: nowrap;
}

.pack-expand-icon {
  font-size: var(--fs-xs);
  margin-right: 6px;
}

.pack-recharge-value {
  font-size: var(--fs-xs);
  color: var(--gold);
}

.pack-item-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.pack-item-icon-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--fs-sm);
}

.pack-item-icon {
  width: 24px;
  height: 24px;
}

.pack-detail-row {
  background: rgba(255, 255, 255, 0.02);
}

.pack-detail-row td {
  padding: 6px 16px;
}

.pack-detail-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: var(--fs-sm);
  align-items: flex-start;
}

.pack-detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px 10px;
  border-radius: 4px;
}

.pack-detail-name {
  min-width: 60px;
}

.pack-detail-value {
  color: var(--gold);
  font-weight: bold;
}
</style>
