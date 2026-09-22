<template>
  <VChart v-if="active" ref="chart" v-bind="$attrs" :option="activeOption" />
</template>

<script setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, ref, shallowRef, watch } from 'vue'
import VChart from 'vue-echarts'

defineOptions({ inheritAttrs: false })
const props = defineProps({ option: { type: Object, required: true } })
const active = ref(true)
const chart = shallowRef(null)
const interaction = shallowRef(null)

// Retain only small interaction state, not the ECharts instance or its series data.
const activeOption = computed(() => {
  if (!interaction.value) return props.option
  const option = { ...props.option }
  for (const key of ['dataZoom', 'legend']) {
    if (!option[key] || !interaction.value[key]) continue
    const entries = Array.isArray(option[key]) ? option[key] : [option[key]]
    option[key] = entries.map((entry, index) => ({ ...entry, ...interaction.value[key][index] }))
  }
  return option
})
watch(() => props.option, () => { if (active.value) interaction.value = null })
onDeactivated(() => {
  const option = chart.value?.getOption()
  interaction.value = option ? {
    dataZoom: option.dataZoom?.map(({ start, end }) => ({ start, end })),
    legend: option.legend?.map(({ selected }) => ({ selected })),
  } : null
  // KeepAlive has already detached the custom element. Its disconnected callback
  // cannot perform a later unmount cleanup, so release the instance explicitly.
  chart.value?.dispose()
  active.value = false
})
onActivated(() => { active.value = true })
onBeforeUnmount(() => chart.value?.dispose())

defineExpose({ getDataURL: options => chart.value?.getDataURL(options) })
</script>
