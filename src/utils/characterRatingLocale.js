import { RATING_TAGS } from './characterRatings.js'

export const RATING_LOCALES = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko']

export function ratingDisplayTexts(rating) {
  return [rating.outputRole, rating.outputRoleDetail, rating.conditions,
    ...rating.axes.map(axis => axis.reason), ...rating.tags.map(tag => RATING_TAGS[tag.key].label)]
}

export function completeRatingTranslation(rating, translations) {
  return ratingDisplayTexts(rating).every(text => typeof translations?.[text] === 'string' && translations[text].trim())
}

// Each language is fetched only when selected, and shared between character pages.
const cache = new Map()
export function loadRatingTranslations(locale, { reload = false } = {}) {
  if (locale === 'zh-CN') return Promise.resolve({})
  if (!RATING_LOCALES.includes(locale)) return Promise.reject(new Error('Unsupported rating locale'))
  if (reload) cache.delete(locale)
  if (!cache.has(locale)) {
    const request = fetch(`${import.meta.env?.BASE_URL ?? '/'}data/character-ratings/i18n/${locale}.json`, { cache: reload ? 'reload' : 'default' })
      .then(response => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json() })
      .then(data => { if (data.locale !== locale || !data.translations) throw new Error('Invalid rating translation'); return data.translations })
      .catch(error => { cache.delete(locale); throw error })
    cache.set(locale, request)
  }
  return cache.get(locale)
}
