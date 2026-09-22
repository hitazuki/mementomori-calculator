import { readStorage, writeStorage } from './storage.js'
import { ref, watch } from 'vue'

const saved = readStorage('mmt_theme') === 'light' ? 'light' : 'dark'
export const currentTheme = ref(saved)

export const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
}

watch(currentTheme, (val) => {
  document.documentElement.setAttribute('data-theme', val)
  writeStorage('mmt_theme', val)
}, { immediate: true })
