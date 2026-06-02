import zhCN from '../locales/zh-CN.js';
import zhTW from '../locales/zh-TW.js';
import en from '../locales/en.js';
import ja from '../locales/ja.js';
import ko from '../locales/ko.js';

const messages = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en': en,
  'ja': ja,
  'ko': ko
};

let currentLang = localStorage.getItem('mmt-calc-lang') || 'zh-CN';
if (!messages[currentLang]) currentLang = 'zh-CN';

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (messages[lang]) {
    currentLang = lang;
    localStorage.setItem('mmt-calc-lang', lang);
    updateDOMTranslations();
    document.documentElement.lang = lang;
    
    // Dispatch a custom event so views can re-render if needed
    window.dispatchEvent(new CustomEvent('languagechanged', { detail: { lang } }));
  }
}

export function t(key, params = {}) {
  const dict = messages[currentLang];
  let text = dict[key] || messages['zh-CN'][key] || key;
  
  if (params && typeof params === 'object') {
    Object.keys(params).forEach(k => {
      text = text.replace(new RegExp(`{${k}}`, 'g'), params[k]);
    });
  }
  return text;
}

export function updateDOMTranslations() {
  document.title = t('appTitle');
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = t('appDesc');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      el.title = t(key);
    }
  });
}

// Initial setup
document.documentElement.lang = currentLang;
