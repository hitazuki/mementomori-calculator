<template>
  <span class="catalog-traits">
    <span :title="elementName"><img :src="`${base}images/elements/icon_element_${element}.png`" :alt="elementName" width="28" height="28" decoding="async"></span>
    <span :title="jobName"><img v-if="!failed && jobFile" :src="`${base}images/jobs/icon_job_${jobFile}.png`" :alt="jobName" width="28" height="28" decoding="async" @error="failed = true"><span v-else>{{ jobName }}</span></span>
  </span>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({ element: Number, job: Number })
const { t } = useI18n()
const base = import.meta.env.BASE_URL
const failed = ref(false)
watch(() => props.job, () => { failed.value = false })
const jobFile = computed(() => ({ 1: 'warrior', 2: 'sniper', 4: 'sorcerer' })[props.job])
const jobName = computed(() => t(({ 1: 'raidJobWarrior', 2: 'raidJobSniper', 4: 'raidJobMage' })[props.job] ?? 'raidCharacterUnknown'))
const elementName = computed(() => t(['catalogAll','raidElementBlue','raidElementRed','raidElementGreen','raidElementYellow','raidElementLight','raidElementDark'][props.element] ?? 'raidCharacterUnknown'))
</script>
<style scoped>
.catalog-traits { display:inline-flex; align-items:center; gap:8px; vertical-align:middle; }.catalog-traits > span { display:inline-flex; align-items:center; }.catalog-traits img { object-fit:contain; }
</style>
