<template>
  <div class="catalog-view">
    <header class="view-header"><h1 class="view-title">📖 {{ t('catalogTitle') }}</h1><p class="view-desc">{{ t('catalogDescription') }}</p></header>
    <p v-if="loading" role="status">{{ t('catalogLoading') }}</p>
    <div v-else-if="error" class="card" role="alert">{{ t('catalogError') }} <button class="btn btn-secondary" @click="load">{{ t('catalogRetry') }}</button></div>
    <template v-else>
      <template v-if="!selected">
        <section class="card catalog-controls">
          <div class="catalog-search"><input v-model="search" class="form-input" :placeholder="t('catalogSearch')" :aria-label="t('catalogSearch')"><select v-model="sort" class="form-select" :aria-label="t('catalogSpeed')"><option value="id">{{ t('catalogId') }}</option><option value="speed">{{ t('catalogSpeed') }} ↓</option></select></div>
          <div class="catalog-elements" role="group" :aria-label="t('raidElementFilter')"><button v-for="value in [0,1,2,3,4,5,6]" :key="value" class="btn" :class="element === value ? 'btn-primary' : 'btn-ghost'" :aria-pressed="element === value" @click="element = value"><img v-if="value" :src="`${base}images/elements/icon_element_${value}.png`" alt="">{{ value ? elementName(value) : t('catalogAll') }}</button></div>
          <p aria-live="polite">{{ t('catalogCount', { n: filtered.length }) }}</p>
        </section>
        <div v-if="filtered.length" class="catalog-grid"><button v-for="character in filtered" :key="character.id" class="card catalog-card" @click="open(character.id)"><CharacterCatalogImage :path="`images/characters/${character.id}.png`" :fallback="character.name.slice(0,1)"/><span><small>{{ character.title }}</small><strong>{{ character.name }}</strong><span>{{ elementName(character.element) }} · {{ jobName(character.job) }}</span><small>{{ character.rarity }} · {{ t('catalogSpeed') }} {{ character.speed ?? '—' }} · #{{ character.id }}</small></span></button></div>
        <p v-else>{{ t('catalogEmpty') }}</p>
      </template>
      <template v-else>
        <button class="btn btn-ghost catalog-back" @click="open(null)">← {{ t('catalogBack') }}</button>
        <div class="catalog-detail">
          <aside class="card catalog-profile"><CharacterCatalogImage :path="`images/characters/${selected.id}.png`" :fallback="selected.name.slice(0,1)"/><p>{{ selected.title }}</p><h2>{{ selected.name }}</h2><p>{{ elementName(selected.element) }} · {{ jobName(selected.job) }}</p><dl><dt>{{ t('catalogRarity') }}</dt><dd>{{ selected.rarity }}</dd><dt>{{ t('catalogSpeed') }}</dt><dd>{{ selected.speed ?? '—' }}</dd><dt>{{ t('catalogId') }}</dt><dd>{{ selected.id }}</dd></dl></aside>
          <section class="catalog-skills"><h2>{{ t('catalogSkills') }}</h2><article v-for="skill in selected.skills" :key="skill.id" class="card catalog-skill"><header><CharacterCatalogImage :path="`images/skills/${skill.id}.png`" :fallback="skill.slot"/><div><small>{{ skill.slot }}<template v-if="skill.cooldown != null"> · {{ t('raidCharacterCooldownValue', { n: skill.cooldown }) }}</template></small><h3>{{ skill.name }}</h3></div></header><small>{{ t('raidCharacterMbSkillLevel', { n: baseLevel(skill)?.level }) }}</small><p class="catalog-skill-text">{{ baseLevel(skill)?.text }}</p><details v-if="skill.levels.length > 1"><summary>{{ t('catalogLevels') }}</summary><div v-for="(level, index) in skill.levels" :key="index" class="catalog-level"><strong>{{ t(level.type === 'exclusive' ? 'raidCharacterMbExclusiveLevel' : 'raidCharacterMbSkillLevel', { n: level.level }) }}</strong><small v-if="level.type !== 'exclusive'"> · {{ t('catalogUnlock', { n: level.unlockLevel }) }}</small><p class="catalog-skill-text">{{ level.text }}</p></div></details></article><article v-if="selected.exclusiveEffects?.length" class="card catalog-skill"><h3>{{ t('catalogExclusive') }}</h3><div v-for="effect in selected.exclusiveEffects" :key="effect.level" class="catalog-level"><strong>{{ t('raidCharacterMbExclusiveLevel', { n: effect.level }) }}</strong><p class="catalog-skill-text">{{ effect.text }}</p></div></article></section>
        </div>
      </template>
      <footer class="catalog-source">{{ t('catalogSource') }}</footer>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import CharacterCatalogImage from '../components/CharacterCatalogImage.vue'
import { filterCharacters } from '../utils/characterCatalog.js'
const { t, locale } = useI18n()
const base = import.meta.env.BASE_URL
const search = ref(''), element = ref(0), sort = ref('id'), selectedId = ref(null)
const characters = ref([]), loading = ref(false), error = ref(false)
const cache = new Map()
let request = 0
async function load() {
  const version = ++request, language = locale.value
  loading.value = true; error.value = false
  try {
    if (!cache.has(language)) {
      const response = await fetch(`${base}data/character-catalog/${language}.json`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (data.schemaVersion !== 1 || !Array.isArray(data.characters)) throw new Error('Invalid catalog')
      cache.set(language, data.characters)
    }
    if (version === request) characters.value = cache.get(language)
  } catch { if (version === request) error.value = true }
  finally { if (version === request) loading.value = false }
}
watch(locale, load, { immediate: true })
const filtered = computed(() => filterCharacters(characters.value, { search: search.value, element: element.value, sort: sort.value }))
const selected = computed(() => characters.value.find(character => character.id === selectedId.value))
const elementName = value => t(['catalogAll','raidElementBlue','raidElementRed','raidElementGreen','raidElementYellow','raidElementLight','raidElementDark'][value] ?? 'raidCharacterUnknown')
const jobName = value => t(({ 1: 'raidJobWarrior', 2: 'raidJobSniper', 4: 'raidJobMage' })[value] ?? 'raidCharacterUnknown')
// MB level descriptions can be incremental; keep the base description visible.
const baseLevel = skill => skill.levels.find(level => level.type === 'level') ?? skill.levels[0]
function readHash() { selectedId.value = Number(location.hash.match(/^#characters\/(\d+)$/)?.[1]) || null }
function open(id) { selectedId.value = id; location.hash = id ? `characters/${id}` : 'characters' }
onMounted(() => { readHash(); window.addEventListener('hashchange', readHash) })
onUnmounted(() => { request++; window.removeEventListener('hashchange', readHash) })
</script>

<style scoped>
.catalog-controls { margin-bottom: 20px; }.catalog-search { display: flex; gap: 12px; }.catalog-search input { flex: 1; min-width: 0; }.catalog-search select { width: auto; }.catalog-elements { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }.catalog-elements img { width: 22px; height: 22px; vertical-align: middle; margin-right: 5px; }.catalog-controls p { margin: 14px 0 0; color: var(--text-secondary); }
.catalog-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap: 12px; }.catalog-card { display: flex; gap: 14px; align-items: center; text-align: left; cursor: pointer; color: var(--text-primary); margin: 0; padding: 16px; }.catalog-card:hover { border-color: var(--gold); }.catalog-card > span:last-child { display: grid; gap: 5px; min-width: 0; }.catalog-card strong { font-size: var(--fs-base); }.catalog-card small { color: var(--text-secondary); }.catalog-back { margin-bottom: 16px; }.catalog-detail { display: grid; grid-template-columns: 260px minmax(0,1fr); gap: 24px; align-items: start; }.catalog-profile { position: sticky; top: 20px; }.catalog-profile h2 { margin: 0; }.catalog-profile dl { display: grid; grid-template-columns: 1fr auto; gap: 12px; }.catalog-profile dd { margin: 0; }.catalog-profile dt { color: var(--text-secondary); }.catalog-skill { margin-bottom: 16px; }.catalog-skill header { display: flex; gap: 12px; align-items: center; }.catalog-skill h3 { margin: 4px 0; }.catalog-skill-text { white-space: pre-line; line-height: 1.85; overflow-wrap: anywhere; }.catalog-skill summary { cursor: pointer; color: var(--gold); padding: 12px 0; }.catalog-level { border-top: 1px solid var(--border-subtle); padding-top: 14px; }.catalog-source { margin-top: 28px; color: var(--text-muted); font-size: var(--fs-xs); }
@media(max-width:700px) { .catalog-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; }.catalog-card { flex-direction: column; align-items: flex-start; padding: 12px; }.catalog-detail { grid-template-columns: 1fr; }.catalog-profile { position: static; }.catalog-search { flex-wrap: wrap; } }
</style>
