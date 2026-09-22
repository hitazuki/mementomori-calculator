import { validateTranslations } from './lib/translationValidation.mjs'

const locales = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko']
const messages = Object.fromEntries(await Promise.all(locales.map(async locale => [
  locale, (await import(`../src/locales/${locale}.js`)).default,
])))
const { errors, keyCount } = validateTranslations(messages)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  console.log(`i18n: ${keyCount} resolved keys and their placeholders match in ${locales.length} languages.`)
}
