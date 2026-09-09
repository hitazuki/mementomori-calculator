import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { RATING_LOCALES, ratingDisplayTexts } from '../src/utils/characterRatingLocale.js'
import { readCharacterCatalog } from './lib/characterCatalog.mjs'

const root = new URL('../', import.meta.url)
const read = path => JSON.parse(fs.readFileSync(new URL(path, root), 'utf8'))
// Newly synced characters without an assessment keep the existing pending UI.
const ids = readCharacterCatalog(new URL('public/data/character-catalog/', root)).characters.map(c => c.id)
  .filter(id => fs.existsSync(new URL(`public/data/character-ratings/${id}.json`, root)))
const texts = [...new Set(ids.flatMap(id => ratingDisplayTexts(read(`public/data/character-ratings/${id}.json`))))].sort()
const sourceHash = createHash('sha256').update(JSON.stringify(texts)).digest('hex')
const output = new URL('public/data/character-ratings/i18n/', root)
const bundles = RATING_LOCALES.filter(locale => locale !== 'zh-CN').map(locale => {
  const authored = read(`doc/character-ratings/i18n/${locale}.json`)
  const missing = texts.filter(text => !authored[text]?.trim())
  if (missing.length) throw new Error(`${locale}: ${missing.length} untranslated rating texts; first: ${missing[0]}`)
  return { locale, sourceLocale: 'zh-CN', sourceHash, translations: Object.fromEntries(texts.map(text => [text, authored[text]])) }
})
fs.mkdirSync(output, { recursive: true })
for (const bundle of bundles) fs.writeFileSync(new URL(`${bundle.locale}.json`, output), JSON.stringify(bundle) + '\n')
console.log(`Packed ${texts.length} rating texts in ${bundles.length} translated languages.`)
