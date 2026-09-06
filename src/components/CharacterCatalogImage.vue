<template>
  <span class="catalog-image"><img v-if="!failed" :src="`${base}${path}`" alt="" loading="lazy" decoding="async" @error="failed = true"><span v-else>{{ fallback }}</span></span>
</template>
<script setup>
import { ref, watch } from 'vue'
const props = defineProps({ path: String, fallback: String })
const base = import.meta.env.BASE_URL
const failed = ref(false)
watch(() => props.path, () => { failed.value = false })
</script>
<style scoped>
.catalog-image { display: inline-flex; width: 60px; height: 60px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 12px; background: var(--gold-dim); color: var(--gold); overflow: hidden; }
img { width: 100%; height: 100%; object-fit: contain; }
</style>
