import { ref, watch } from 'vue'

const saved = localStorage.getItem('mmt_theme') || 'dark'
export const currentTheme = ref(saved)

export const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
}

watch(currentTheme, (val) => {
  document.documentElement.setAttribute('data-theme', val)
  localStorage.setItem('mmt_theme', val)
}, { immediate: true })
