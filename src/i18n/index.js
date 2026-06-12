import { createI18n } from 'vue-i18n';
import zhCN from '../locales/zh-CN.js';
import zhTW from '../locales/zh-TW.js';
import en from '../locales/en.js';
import ja from '../locales/ja.js';
import ko from '../locales/ko.js';
const baseMessages = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en': en,
  'ja': ja,
  'ko': ko
};

const savedLang = localStorage.getItem('mmt-calc-lang') || 'zh-CN';
const currentLang = baseMessages[savedLang] ? savedLang : 'zh-CN';

const i18n = createI18n({
  legacy: false, // use Composition API
  locale: currentLang,
  fallbackLocale: 'zh-CN',
  messages: baseMessages,
  warnHtmlMessage: false
});

export async function initI18n() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/master_dict_${currentLang}.json`);
    const masterDict = await res.json();
    i18n.global.setLocaleMessage(currentLang, { ...baseMessages[currentLang], ...masterDict });
  } catch (e) {
    console.error(`Failed to load master dict for ${currentLang}`, e);
  }
  document.documentElement.lang = currentLang;
}

// A small utility to save lang on change
export async function setLang(lang) {
  if (baseMessages[lang]) {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/master_dict_${lang}.json`);
      const masterDict = await res.json();
      i18n.global.setLocaleMessage(lang, { ...baseMessages[lang], ...masterDict });
    } catch (e) {
      console.error(`Failed to load master dict for ${lang}`, e);
    }
    i18n.global.locale.value = lang;
    localStorage.setItem('mmt-calc-lang', lang);
    document.documentElement.lang = lang;
  }
}

// Expose a raw translate function for non-Vue files (like constants)
export const t = (key, params) => i18n.global.t(key, params);

export default i18n;
