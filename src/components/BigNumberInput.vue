<template>
  <input 
    type="text" 
    :value="displayValue" 
    @focus="onFocus"
    @blur="onBlur"
    @change="onChange"
    @input="onInput"
  />
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: [Number, String], default: 0 }
})
const emit = defineEmits(['update:modelValue'])

const isFocused = ref(false)
const localValue = ref('')

function formatBigNumber(num) {
  if (num === null || num === undefined) return ''
  return Number(num).toLocaleString()
}

function parseBigNumber(str) {
  if (!str && str !== 0) return 0
  let val = String(str).toLowerCase().trim()
  let mult = 1
  if (val.endsWith('k')) { mult = 1e3; val = val.slice(0, -1) }
  else if (val.endsWith('w')) { mult = 1e4; val = val.slice(0, -1) }
  else if (val.endsWith('m')) { mult = 1e6; val = val.slice(0, -1) }
  else if (val.endsWith('b')) { mult = 1e9; val = val.slice(0, -1) }
  
  val = val.replace(/,/g, '').replace(/[^\d.-]/g, '')
  
  const num = parseFloat(val)
  return isNaN(num) ? 0 : Math.round(num * mult)
}

const displayValue = computed(() => {
  if (isFocused.value) {
    return localValue.value
  }
  return formatBigNumber(props.modelValue)
})

function onFocus(e) {
  isFocused.value = true
  localValue.value = props.modelValue === 0 ? '' : String(props.modelValue)
  setTimeout(() => e.target.select(), 0)
}

function onBlur(e) {
  isFocused.value = false
  commitValue(e.target.value)
}

function onChange(e) {
  commitValue(e.target.value)
}

function onInput(e) {
  localValue.value = e.target.value
}

function commitValue(str) {
  const parsed = parseBigNumber(str)
  emit('update:modelValue', parsed)
}
</script>
