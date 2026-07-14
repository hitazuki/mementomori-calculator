<template>
  <div class="home-view">
    <div class="view-header animate-fadeup home-header">
      <div>
        <h1 class="view-title">⌂ {{ $t('homeTitle') }}</h1>
        <p class="view-desc">{{ $t('homeDesc') }}</p>
      </div>
    </div>

    <section class="home-recommended animate-fadeup" aria-labelledby="home-recommended-title">
      <div class="home-recommended-heading">
        <span aria-hidden="true">★</span>
        <h2 id="home-recommended-title">{{ $t('homeRecommended') }}</h2>
      </div>
      <div class="home-recommended-list">
        <button
          v-for="item in RECOMMENDED_MODULES"
          :key="item.id"
          type="button"
          class="home-recommended-item"
          @click="navigate(item.viewId)"
        >
          <span class="home-recommended-icon" aria-hidden="true">{{ item.icon }}</span>
          <span>{{ $t(item.labelKey) }}</span>
          <span class="home-recommended-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </section>

    <section
      v-for="(group, groupIndex) in NAV_GROUPS"
      :key="group.id"
      class="home-section animate-fadeup"
      :style="{ animationDelay: `${groupIndex * 45}ms` }"
    >
      <div class="home-section-heading">
        <span class="home-section-icon">{{ group.icon }}</span>
        <div>
          <h2>{{ $t(group.labelKey) }}</h2>
          <span>{{ group.items.length }} {{ $t('homeModulesCount') }}</span>
        </div>
      </div>

      <div class="home-module-grid" :class="`home-module-grid-${group.items.length}`">
        <article v-for="item in group.items" :key="item.id" class="home-module-card card">
          <div class="home-module-head">
            <span class="home-module-icon">{{ item.icon }}</span>
            <h3>{{ $t(item.labelKey) }}</h3>
          </div>
          <p>{{ $t(item.descriptionKey) }}</p>
          <div v-if="item.capabilities?.length" class="home-capabilities">
            <span v-for="capability in item.capabilities" :key="capability">{{ $t(capability) }}</span>
          </div>
          <button type="button" class="btn btn-secondary home-module-action" @click="navigate(item.viewId)">
            {{ $t('homeOpenModule') }} <span aria-hidden="true">→</span>
          </button>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { NAV_GROUPS, RECOMMENDED_MODULES } from '../constants/navigation.js'

const emit = defineEmits(['navigate'])

function navigate(viewId) {
  emit('navigate', viewId)
}
</script>

<style scoped>
.home-view {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.home-header {
  padding-right: 210px;
  margin-bottom: 20px;
}

.home-recommended {
  padding: 14px;
  border: 1px solid rgba(201, 168, 76, 0.28);
  border-radius: var(--r-md);
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.09), rgba(var(--color-invert-rgb), 0.025));
}

.home-recommended-heading {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  color: var(--gold);
}

.home-recommended-heading h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--fs-md);
}

.home-recommended-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.home-recommended-item {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  padding: 10px 11px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: var(--fs-sm);
  text-align: left;
  transition: border-color 0.2s, color 0.2s, transform 0.2s;
}

.home-recommended-item:hover {
  border-color: rgba(201, 168, 76, 0.55);
  color: var(--gold);
  transform: translateY(-1px);
}

.home-recommended-icon,
.home-recommended-arrow {
  flex-shrink: 0;
}

.home-recommended-item > span:nth-child(2) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-recommended-arrow {
  margin-left: auto;
  color: var(--gold);
}

.home-section {
  margin-top: 26px;
}

.home-section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.home-section-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  background: var(--bg-card);
  font-size: 19px;
}

.home-section-heading h2 {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--fs-lg);
}

.home-section-heading span:last-child {
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.home-module-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.home-module-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.home-module-grid-1 {
  grid-template-columns: minmax(0, 1fr);
}

.home-module-card {
  display: flex;
  min-height: 190px;
  flex-direction: column;
}

.home-module-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.home-module-icon {
  font-size: 25px;
}

.home-module-head h3 {
  margin: 0;
  color: var(--gold);
  font-size: var(--fs-md);
}

.home-module-card > p {
  margin: 12px 0 14px;
  color: var(--text-secondary);
  font-size: var(--fs-sm);
  line-height: 1.65;
}

.home-capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.home-capabilities span {
  padding: 4px 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: rgba(var(--color-invert-rgb), 0.035);
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.home-module-action {
  width: 100%;
  margin-top: auto;
  justify-content: space-between;
}

@media (max-width: 900px) {
  .home-recommended-list {
    grid-auto-columns: minmax(180px, 34vw);
    grid-auto-flow: column;
    grid-template-columns: none;
    overflow-x: auto;
    padding-bottom: 4px;
    scroll-snap-type: x proximity;
  }

  .home-recommended-item {
    scroll-snap-align: start;
  }

  .home-module-grid,
  .home-module-grid-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .home-header {
    padding-right: 0;
  }

  .home-section {
    margin-top: 22px;
  }

  .home-recommended {
    padding: 12px;
  }

  .home-recommended-list {
    grid-auto-columns: minmax(170px, 72vw);
  }

  .home-module-grid,
  .home-module-grid-2 {
    grid-template-columns: 1fr;
  }

  .home-module-card {
    min-height: 0;
  }
}
</style>
