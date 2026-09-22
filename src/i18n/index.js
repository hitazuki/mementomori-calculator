import { readStorage, writeStorage } from '../utils/storage.js'
import { createI18n } from 'vue-i18n';
import { ref } from 'vue'
import { fetchJson, isDictionary } from '../utils/fetchJson.js'
import { createLanguageLoader } from './languageLoader.js'
import zhCN from '../locales/generated/zh-CN.json'

const localeLoaders = {
  'zh-CN': () => Promise.resolve(zhCN),
  'zh-TW': () => import('../locales/generated/zh-TW.json').then(module => module.default),
  en: () => import('../locales/generated/en.json').then(module => module.default),
  ja: () => import('../locales/generated/ja.json').then(module => module.default),
  ko: () => import('../locales/generated/ko.json').then(module => module.default),
}
const baseMessages = new Map([['zh-CN', Promise.resolve(zhCN)]])
function loadBaseMessages(lang) {
  if (!baseMessages.has(lang)) baseMessages.set(lang, localeLoaders[lang]().catch(error => {
    baseMessages.delete(lang)
    throw error
  }))
  return baseMessages.get(lang)
}

const savedLang = readStorage('mmt-calc-lang') || 'zh-CN';
const currentLang = Object.hasOwn(localeLoaders, savedLang) ? savedLang : 'zh-CN';

const i18n = createI18n({
  legacy: false, // use Composition API
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: { 'zh-CN': zhCN }
});

export const languageError = ref(false)
export const languageSelection = ref(currentLang)
const dictionaries = new Map()
const selectLanguage = createLanguageLoader({
  async load(lang) {
    if (!dictionaries.has(lang)) {
      dictionaries.set(lang, fetchJson(`${import.meta.env.BASE_URL}data/master_dict_${lang}.json`, { validate: isDictionary })
        .catch(error => { dictionaries.delete(lang); throw error }))
    }
    const [base, master] = await Promise.all([loadBaseMessages(lang), dictionaries.get(lang)])
    return { ...base, ...master }
  },
  apply(lang, messages) {
    i18n.global.setLocaleMessage(lang, messages)
    i18n.global.locale.value = lang
    writeStorage('mmt-calc-lang', lang)
    document.documentElement.lang = lang
    languageError.value = false
  },
  reportError() { languageError.value = true },
})

export function initI18n() {
  document.documentElement.lang = i18n.global.locale.value
  return setLang(currentLang)
}

export function setLang(lang) {
  if (!Object.hasOwn(localeLoaders, lang)) return Promise.resolve(false)
  languageSelection.value = lang
  languageError.value = false
  return selectLanguage(lang)
}

// Expose a raw translate function for non-Vue files (like constants)
export const t = (key, params) => i18n.global.t(key, params);

export default i18n;
