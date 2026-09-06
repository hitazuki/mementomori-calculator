<template>
  <article class="card rating-card">
    <header class="rating-header"><h2>{{ t('ratingTitle') }}</h2><span class="rating-badge">{{ t('ratingBadge') }}</span></header>
    <p class="rating-caption">{{ t('ratingScope') }}</p>
    <p v-if="loading" role="status">{{ t('catalogLoading') }}</p>
    <p v-else-if="missing">{{ t('ratingMissing') }}</p>
    <p v-else-if="error" role="alert">{{ t('catalogError') }} <button class="btn btn-ghost" @click="load">{{ t('catalogRetry') }}</button></p>
    <template v-else-if="rating">
      <p v-if="freshness !== 'current'" class="rating-warning" role="status">{{ t(freshness === 'stale' ? 'ratingStale' : 'ratingUnverified') }}</p>
      <div class="rating-content">
        <div class="rating-visual">
          <svg viewBox="0 0 320 285" role="img" :aria-label="chartDescription">
            <title>{{ chartDescription }}</title>
            <polygon v-for="step in [1,2,3,4,5]" :key="step" :points="ring(step)" class="radar-grid"/>
            <line v-for="(_, index) in RATING_AXES" :key="index" x1="160" y1="145" :x2="point(index, 5)[0]" :y2="point(index, 5)[1]" class="radar-grid"/>
            <polygon :points="shape" class="radar-shape"/>
            <circle v-for="(axis, index) in rating.axes" :key="axis.key" :cx="point(index, axis.score)[0]" :cy="point(index, axis.score)[1]" :r="activeAxis === index ? 5 : 3" class="radar-dot"/>
            <text v-for="(axis, index) in rating.axes" :key="axis.key" :x="labelPoint(index)[0]" :y="labelPoint(index)[1]" text-anchor="middle" dominant-baseline="middle" class="radar-label">
              <tspan :x="labelPoint(index)[0]" dy="-5">{{ t('ratingAxis_' + axis.key) }}</tspan>
              <tspan :x="labelPoint(index)[0]" dy="17">{{ axis.score }} / 5</tspan>
            </text>
          </svg>
          <p class="rating-caption">{{ t('ratingScale') }}</p>
        </div>
        <ol class="rating-reasons">
          <li v-for="(axis, index) in rating.axes" :key="axis.key">
            <button class="rating-axis" :class="{ selected: activeAxis === index }" :aria-pressed="activeAxis === index" @click="activeAxis = index">
              <span><strong>{{ t('ratingAxis_' + axis.key) }}</strong><b>{{ axis.score }} / 5</b></span>
              <span lang="zh-CN">{{ axis.reason }}</span>
            </button>
          </li>
        </ol>
      </div>
      <p class="rating-conditions"><strong>{{ t('ratingConditions') }}</strong><span lang="zh-CN">{{ rating.conditions }}</span></p>
      <details class="rating-evidence">
        <summary>{{ t('ratingEvidence') }} · {{ t('ratingAxis_' + rating.axes[activeAxis].key) }}</summary>
        <div v-for="source in evidence" :key="source.key" lang="zh-CN"><h4>{{ source.title }}<small v-if="source.cooldown != null"> · {{ t('raidCharacterCooldownValue', { n: source.cooldown }) }}</small></h4><p>{{ source.text }}</p></div>
      </details>
      <p class="rating-caption">{{ t('ratingProvenance', { date: rating.assessedAt, version: rating.rubricVersion }) }} · {{ rating.author }}</p>
      <p v-if="locale !== 'zh-CN'" class="rating-caption">{{ t('ratingLanguage') }}</p>
    </template>
  </article>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RATING_AXES, radarPoint, ratingSource, validRating } from '../utils/characterRatings.js'
const props = defineProps({ character: { type: Object, required: true } })
const { t, locale } = useI18n()
const rating = ref(null), loading = ref(false), error = ref(false), missing = ref(false)
const freshness = ref('unknown'), activeAxis = ref(0)
const cache = new Map()
let version = 0, controller
async function load() {
  const request = ++version, character = props.character, language = locale.value
  controller?.abort()
  controller = new AbortController()
  loading.value = true; error.value = false; missing.value = false; rating.value = null; freshness.value = 'unknown'
  try {
    let data = cache.get(character.id)
    if (!data) {
      const response = await fetch(`${import.meta.env.BASE_URL}data/character-ratings/${character.id}.json`, { signal: controller.signal })
      if (request !== version) return
      if (response.status === 404) { missing.value = true; return }
      if (!response.ok) throw new Error('HTTP ' + response.status)
      data = await response.json()
      if (!validRating(data, character.id)) throw new Error('Invalid rating')
      cache.set(character.id, data)
    }
    let state = 'unknown'
    if (globalThis.crypto?.subtle && data.sourceHashes[language]) {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(ratingSource(character))))
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
      state = hash === data.sourceHashes[language] ? 'current' : 'stale'
    }
    if (request !== version) return
    rating.value = data; freshness.value = state
  } catch (cause) { if (request === version && cause.name !== 'AbortError') error.value = true }
  finally { if (request === version) loading.value = false }
}
watch(() => [props.character, locale.value], load, { immediate: true })
watch(() => props.character.id, () => { activeAxis.value = 0 })
onUnmounted(() => { version++; controller?.abort() })
const point = radarPoint
const labelPoint = index => radarPoint(index, 5, 118)
const ring = score => RATING_AXES.map((_, index) => point(index, score).join(',')).join(' ')
const shape = computed(() => rating.value?.axes.map((axis, index) => point(index, axis.score).join(',')).join(' '))
const evidence = computed(() => rating.value?.sources.filter(source => rating.value.axes[activeAxis.value].evidence.includes(source.key)) ?? [])
const chartDescription = computed(() => t('ratingTitle') + ': ' + (rating.value?.axes.map(axis => t('ratingAxis_' + axis.key) + ' ' + axis.score + '/5').join(', ') ?? ''))
</script>

<style scoped>
.rating-card { margin-bottom:20px; }.rating-header { display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; }.rating-header h2 { margin:0; font-size:var(--fs-lg); }.rating-badge { border:1px solid var(--gold); border-radius:20px; padding:3px 10px; color:var(--gold); font-size:var(--fs-xs); }.rating-caption { font-size:var(--fs-xs); color:var(--text-secondary); line-height:1.6; }.rating-content { display:grid; grid-template-columns:minmax(240px, 0.9fr) minmax(0,1.1fr); gap:18px; align-items:center; }.rating-visual svg { width:100%; max-height:310px; }.radar-grid { fill:none; stroke:var(--border-subtle); stroke-width:1; }.radar-shape { fill:var(--gold-dim); stroke:var(--gold); stroke-width:2; }.radar-dot { fill:var(--gold); }.radar-label { fill:var(--text-primary); font-size:11px; }.rating-reasons { padding:0; margin:0; list-style:none; display:grid; gap:6px; }.rating-axis { width:100%; text-align:left; border:1px solid transparent; border-radius:8px; background:transparent; color:var(--text-primary); padding:9px 10px; cursor:pointer; font:inherit; }.rating-axis:hover,.rating-axis.selected { border-color:var(--gold); background:var(--gold-dim); }.rating-axis > span:first-child { display:flex; justify-content:space-between; gap:12px; font-size:var(--fs-sm); }.rating-axis b { color:var(--gold); white-space:nowrap; }.rating-axis > span:last-child { display:block; margin-top:4px; font-size:var(--fs-xs); line-height:1.6; color:var(--text-secondary); }.rating-conditions { border-top:1px solid var(--border-subtle); padding-top:14px; line-height:1.7; font-size:var(--fs-sm); }.rating-conditions strong { display:block; margin-bottom:4px; }.rating-warning { color:var(--gold); border:1px solid var(--gold); border-radius:8px; padding:10px; }.rating-evidence summary { cursor:pointer; color:var(--gold); font-size:var(--fs-sm); }.rating-evidence p { white-space:pre-line; overflow-wrap:anywhere; line-height:1.8; font-size:var(--fs-sm); }.rating-evidence h4 { margin-bottom:8px; }
@media(max-width:1100px) { .rating-content { grid-template-columns:1fr; }.rating-visual { max-width:340px; width:100%; margin:auto; } }
</style>
