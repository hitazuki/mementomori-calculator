import { createI18n } from 'vue-i18n';
import zhCN from '../locales/zh-CN.js';
import zhTW from '../locales/zh-TW.js';
import en from '../locales/en.js';
import ja from '../locales/ja.js';
import ko from '../locales/ko.js';
import masterDict from '../locales/master_dict.json';

const messages = {
  'zh-CN': { ...zhCN, ...(masterDict['zh-CN'] || {}) },
  'zh-TW': { ...zhTW, ...(masterDict['zh-TW'] || {}) },
  'en': { ...en, ...(masterDict['en'] || {}) },
  'ja': { ...ja, ...(masterDict['ja'] || {}) },
  'ko': { ...ko, ...(masterDict['ko'] || {}) }
};

const savedLang = localStorage.getItem('mmt-calc-lang') || 'zh-CN';
const currentLang = messages[savedLang] ? savedLang : 'zh-CN';

const i18n = createI18n({
  legacy: false, // use Composition API
  locale: currentLang,
  fallbackLocale: 'zh-CN',
  messages
});

// A small utility to save lang on change
export function setLang(lang) {
  if (messages[lang]) {
    i18n.global.locale.value = lang;
    localStorage.setItem('mmt-calc-lang', lang);
    document.documentElement.lang = lang;
  }
}

// Initial setup
document.documentElement.lang = currentLang;

// Expose a raw translate function for non-Vue files (like constants)
export const t = (key, params) => i18n.global.t(key, params);

export default i18n;
