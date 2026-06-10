import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n, { initI18n } from './i18n/index.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)

initI18n().then(() => {
  app.mount('#app')
})
