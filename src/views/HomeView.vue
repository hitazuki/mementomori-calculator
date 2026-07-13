<template>
  <div class="home-view">
    <div class="view-header animate-fadeup home-header">
      <div>
        <h1 class="view-title">⌂ {{ $t('homeTitle') }}</h1>
        <p class="view-desc">{{ $t('homeDesc') }}</p>
      </div>
    </div>

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
import { NAV_GROUPS } from '../constants/navigation.js'

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
  margin-bottom: 28px;
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

  .home-module-grid,
  .home-module-grid-2 {
    grid-template-columns: 1fr;
  }

  .home-module-card {
    min-height: 0;
  }
}
</style>
