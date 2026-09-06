<template>
  <span class="raid-character-skill-slot" :class="{ 'raid-skill-icon': iconId && !failed }">
    <img v-if="iconId && !failed" :src="`${baseUrl}images/skills/${iconId}.png`" alt="" width="48" height="48" loading="lazy" decoding="async" @error="failed = true">
    <span :class="{ 'raid-skill-icon-label': iconId && !failed }">{{ slot }}</span>
  </span>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RAID_SKILL_ICONS } from '../../constants/raid/skillIcons.js'

const props = defineProps({ characterId: { type: Number, required: true }, slot: { type: String, required: true } })
const baseUrl = import.meta.env.BASE_URL
const iconId = computed(() => RAID_SKILL_ICONS[props.characterId]?.[props.slot])
const failed = ref(false)
watch(iconId, () => { failed.value = false })
</script>

<style scoped>
.raid-skill-icon { position: relative; width: 48px; height: 48px; flex-basis: 48px; overflow: hidden; padding: 0; background: transparent; }
.raid-skill-icon img { display: block; width: 100%; height: 100%; object-fit: contain; }
.raid-skill-icon-label { position: absolute; right: 0; bottom: 0; padding: 1px 4px; border-radius: 4px 0 0 0; background: #14121de6; color: #fff; font-size: 10px; line-height: 1.3; }
</style>
