<template>
  <div ref="catalogRoot" class="catalog-view" @click="followCharacterLink">
    <header class="view-header"><h1 class="view-title">📖 {{ t('catalogTitle') }}</h1><p class="view-desc">{{ t('catalogDescription') }}</p></header>
    <p v-if="loading" role="status">{{ t('catalogLoading') }}</p>
    <div v-else-if="error" class="card" role="alert">{{ t('catalogError') }} <button class="btn btn-secondary" @click="load">{{ t('catalogRetry') }}</button></div>
    <template v-else>
      <template v-if="!selectedId">
        <section class="card catalog-controls">
          <div class="catalog-search"><input v-model="search" class="form-input" :placeholder="t('catalogSearch')" :aria-label="t('catalogSearch')"><select v-model="sort" class="form-select" :aria-label="t('catalogSort')"><option value="id">{{ t('catalogId') }}</option><option value="speed">{{ t('catalogSpeed') }} ↓</option><option value="rating">{{ t('catalogSortRating') }} ↓</option></select><select v-if="sort === 'rating'" v-model="ratingAxis" class="form-select" :aria-label="t('catalogRatingAxis')"><option v-for="axis in RATING_AXES" :key="axis" :value="axis">{{ t('ratingAxis_' + axis) }}</option></select></div>
          <p v-if="sort === 'rating' && ratingLoading" role="status">{{ t('catalogRatingLoading') }}</p>
          <p v-else-if="sort === 'rating' && ratingError" role="alert">{{ t('catalogRatingError') }} <button class="btn btn-ghost" @click="loadRatings">{{ t('catalogRetry') }}</button></p>
          <div class="catalog-elements" role="group" :aria-label="t('raidElementFilter')"><button v-for="value in [0,1,2,3,4,5,6]" :key="value" class="btn" :class="element === value ? 'btn-primary' : 'btn-ghost'" :aria-pressed="element === value" @click="element = value"><img v-if="value" :src="`${base}images/elements/icon_element_${value}.png`" alt="">{{ value ? elementName(value) : t('catalogAll') }}</button></div>
          <p aria-live="polite">{{ t('catalogCount', { n: filtered.length }) }}</p>
        </section>
        <div v-if="filtered.length" class="catalog-grid"><button v-for="character in filtered" :key="character.id" class="card catalog-card" @click="open(character.id)"><CharacterCatalogImage :path="characterThumbnailPath(character.id)" :fallback="character.name.slice(0,1)"/><span><small>{{ character.title }}</small><strong>{{ character.name }}</strong><span><CharacterCatalogTraits :element="character.element" :job="character.job"/></span><small>{{ character.rarity }} · {{ t('catalogSpeed') }} {{ character.speed ?? '—' }} · #{{ character.id }}</small><small v-if="sort === 'rating' && ratings" class="catalog-rating-score">{{ t('ratingAxis_' + ratingAxis) }} · {{ ratings[character.id]?.scores?.[ratingAxis] != null ? ratings[character.id].scores[ratingAxis] + ' / ' + RATING_MAX : t('catalogRatingPending') }}<span v-if="ratings[character.id]?.status === 'stale'"> · {{ t('catalogRatingStale') }}</span></small></span></button></div>
        <p v-else>{{ t('catalogEmpty') }}</p>
      </template>
      <template v-else-if="selectedId">
        <button class="btn btn-ghost catalog-back" @click="open(null)">← {{ t('catalogBack') }}</button>
        <div v-if="selected" class="catalog-detail">
          <aside class="card catalog-profile"><CharacterCatalogImage :path="characterThumbnailPath(selected.id)" :fallback="selected.name.slice(0,1)" priority/><p>{{ selected.title }}</p><h2>{{ selected.name }}</h2><p><CharacterCatalogTraits :element="selected.element" :job="selected.job"/></p><dl><dt>{{ t('catalogRarity') }}</dt><dd>{{ selected.rarity }}</dd><dt>{{ t('catalogSpeed') }}</dt><dd>{{ selected.speed ?? '—' }}</dd><dt>{{ t('catalogId') }}</dt><dd>{{ selected.id }}</dd></dl><CharacterCatalogProfile v-if="selected.skills" :character="selected"/></aside>
          <section class="catalog-skills"><p v-if="detailLoading" role="status">{{ t('catalogLoading') }}</p><p v-else-if="detailError" class="card" role="alert">{{ t('catalogError') }} <button class="btn btn-secondary" @click="loadDetail">{{ t('catalogRetry') }}</button></p><template v-else-if="selected.skills"><CharacterCatalogRating :character="selected"/><article v-for="skill in selected.skills" :key="skill.id" class="card catalog-skill"><header><CharacterCatalogImage :path="`images/skills/${skill.id}.png`" :fallback="skill.slot"/><div><small>{{ skill.slot }}<template v-if="skill.cooldown != null"> · {{ t('raidCharacterCooldownValue', { n: skill.cooldown }) }}</template></small><h3>{{ skill.name }}</h3></div></header><p class="catalog-level-note">{{ t('catalogLevelNote') }}</p><div v-for="(level, index) in skill.levels" :key="level.level" class="catalog-level" :class="{ 'catalog-max-level': index === skill.levels.length - 1 }"><strong>{{ t('raidCharacterMbSkillLevel', { n: level.level }) }}</strong><small> · {{ t('catalogUnlock', { n: level.unlockLevel }) }}</small><p class="catalog-skill-text">{{ level.text }}</p></div></article><article v-if="selected.exclusiveEffects?.length" class="card catalog-skill"><h3>{{ t('catalogExclusive') }}</h3><div v-for="effect in selected.exclusiveEffects" :key="effect.level" class="catalog-level"><strong>{{ t('raidCharacterMbExclusiveLevel', { n: effect.level }) }}</strong><p class="catalog-skill-text">{{ effect.text }}</p></div></article></template></section>
        </div><p v-else role="status">{{ t('catalogLoading') }}</p>
      </template>
      <footer class="catalog-source">{{ t('catalogSource') }}</footer>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onActivated, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import CharacterCatalogRating from '../components/CharacterCatalogRating.vue'
import CharacterCatalogTraits from '../components/CharacterCatalogTraits.vue'
import CharacterCatalogProfile from '../components/CharacterCatalogProfile.vue'
import CharacterCatalogImage from '../components/CharacterCatalogImage.vue'
import { RATING_AXES, RATING_MAX } from '../utils/characterRatings.js'
import { filterCharacters, ratingIndex } from '../utils/characterCatalog.js'
import { characterThumbnailPath } from '../utils/imageAssets.js'
const { t, locale } = useI18n()
const base = import.meta.env.BASE_URL
const search = ref(''), element = ref(0), sort = ref('id'), selectedId = ref(null)
const characters = ref([]), loading = ref(false), error = ref(false)
const selectedDetail = ref(null), detailLoading = ref(false), detailError = ref(false)
const ratings = ref(null), ratingAxis = ref('burst'), ratingLoading = ref(false), ratingError = ref(false)
async function loadRatings() {
  if (ratingLoading.value) return
  ratingLoading.value = true; ratingError.value = false
  try {
    const response = await fetch(base + 'data/character-ratings/index.json')
    if (!response.ok) throw new Error('HTTP ' + response.status)
    ratings.value = ratingIndex(await response.json())
  } catch { ratingError.value = true }
  finally { ratingLoading.value = false }
}
watch(sort, value => { if (value === 'rating' && !ratings.value) loadRatings() })
const cache = new Map()
const catalogRoot = ref(null)
let request = 0
async function load() {
  const version = ++request, language = locale.value
  loading.value = true; error.value = false
  try {
    if (!cache.has(language)) {
      const response = await fetch(`${base}data/character-catalog/${language}/index.json`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (data.schemaVersion !== 2 || !Number.isInteger(data.shardSize) || !Array.isArray(data.characters)) throw new Error('Invalid catalog')
      cache.set(language, data)
    }
    if (version === request) characters.value = cache.get(language).characters
  } catch { if (version === request) error.value = true }
  finally { if (version === request) loading.value = false }
}
watch(locale, load, { immediate: true })
const filtered = computed(() => filterCharacters(characters.value, { search: search.value, element: element.value, sort: sort.value, ratingAxis: ratingAxis.value, ratings: ratings.value ?? {} }))
const selected = computed(() => selectedDetail.value?.id === selectedId.value ? selectedDetail.value : characters.value.find(character => character.id === selectedId.value))
const detailCache = new Map()
let detailRequest = 0, detailController
async function loadDetail() {
  const id = selectedId.value, language = locale.value
  if (!id) return
  const version = ++detailRequest, key = `${language}/${id}`
  detailController?.abort(); detailController = new AbortController()
  selectedDetail.value = detailCache.get(key) ?? null; detailLoading.value = !selectedDetail.value; detailError.value = false
  if (selectedDetail.value) return
  try {
    const index = cache.get(language)
    const shardSize = index?.shardSize ?? 20
    const shard = Math.floor((id - 1) / shardSize)
    const response = await fetch(`${base}data/character-catalog/${language}/details/${shard}.json`, { signal: detailController.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    const character = data.schemaVersion === 2 && data.characters?.find(item => item.id === id)
    if (!character) throw new Error('Invalid character detail')
    detailCache.set(key, character)
    if (version === detailRequest) selectedDetail.value = character
  } catch (cause) { if (version === detailRequest && cause.name !== 'AbortError') detailError.value = true }
  finally { if (version === detailRequest) detailLoading.value = false }
}
watch([selectedId, locale], loadDetail)
const elementName = value => t(['catalogAll','raidElementBlue','raidElementRed','raidElementGreen','raidElementYellow','raidElementLight','raidElementDark'][value] ?? 'raidCharacterUnknown')
async function scrollToStart() {
  await nextTick()
  // The app scrolls its shared view container, not the window.
  catalogRoot.value?.closest('.view')?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}
function readHash() { selectedId.value = Number(location.hash.match(/^#characters\/(\d+)$/)?.[1]) || null; scrollToStart() }
function open(id) { selectedId.value = id; location.hash = id ? `characters/${id}` : 'characters'; scrollToStart() }
function followCharacterLink(event) {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  const href = event.target.closest?.('a')?.getAttribute('href')
  const id = href?.match(/^#characters\/(\d+)$/)?.[1]
  if (!id) return
  event.preventDefault()
  open(Number(id))
}
onMounted(() => { readHash(); window.addEventListener('hashchange', readHash) })
onActivated(scrollToStart)
onUnmounted(() => { request++; detailRequest++; detailController?.abort(); window.removeEventListener('hashchange', readHash) })
</script>

<style scoped>
.catalog-controls { margin-bottom: 20px; }.catalog-search { display: flex; flex-wrap: wrap; gap: 12px; }.catalog-rating-score { color:var(--gold) !important; }.catalog-search input { flex: 1; min-width: 0; }.catalog-search select { width: auto; }.catalog-elements { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }.catalog-elements img { width: 22px; height: 22px; vertical-align: middle; margin-right: 5px; }.catalog-controls p { margin: 14px 0 0; color: var(--text-secondary); }
.catalog-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap: 12px; }.catalog-card { display: flex; gap: 14px; align-items: center; text-align: left; cursor: pointer; color: var(--text-primary); margin: 0; padding: 16px; }.catalog-card:hover { border-color: var(--gold); }.catalog-card > span:last-child { display: grid; gap: 5px; min-width: 0; }.catalog-card strong { font-size: var(--fs-base); }.catalog-card small { color: var(--text-secondary); }.catalog-back { margin-bottom: 16px; }.catalog-detail { display: grid; grid-template-columns: 320px minmax(0,1fr); gap: 24px; align-items: start; }.catalog-profile { position: static; }.catalog-profile h2 { margin: 0; }.catalog-profile dl { display: grid; grid-template-columns: 1fr auto; gap: 12px; }.catalog-profile dd { margin: 0; }.catalog-profile dt { color: var(--text-secondary); }.catalog-skill { margin-bottom: 16px; }.catalog-skill header { display: flex; gap: 12px; align-items: center; }.catalog-skill h3 { margin: 4px 0; }.catalog-skill-text { white-space: pre-line; line-height: 1.85; overflow-wrap: anywhere; }.catalog-skill summary { cursor: pointer; color: var(--gold); padding: 12px 0; }.catalog-level { border-top: 1px solid var(--border-subtle); padding-top: 14px; }.catalog-max-level > strong { color:var(--gold); }.catalog-level-note { color:var(--text-muted); font-size:var(--fs-sm); }.catalog-source { margin-top: 28px; color: var(--text-muted); font-size: var(--fs-xs); }
@media(max-width:700px) { .catalog-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; }.catalog-card { flex-direction: column; align-items: flex-start; padding: 12px; }.catalog-detail { grid-template-columns: 1fr; }.catalog-profile { position: static; }.catalog-search { flex-wrap: wrap; } }
</style>
