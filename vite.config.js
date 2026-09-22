import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { watchUiLocales } from './scripts/vite_ui_locales.mjs'

export default defineConfig({
  base: '/mementomori-calculator/',
  plugins: [vue(), watchUiLocales()],
  build: { manifest: true },
})
