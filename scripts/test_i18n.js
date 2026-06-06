/** Script: test_i18n.js
 * Purpose: Validates the consistency of i18n translation keys across all locale files to prevent missing strings before builds.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.join(__dirname, '../src/locales')
const locales = ['zh-CN.js', 'zh-TW.js', 'en.js', 'ja.js', 'ko.js']

const keys = {}
const allKeys = new Set()

for (const l of locales) {
  const content = fs.readFileSync(path.join(localesDir, l), 'utf-8')
  // Match word characters preceding a colon: "  keyName: "
  const matches = [...content.matchAll(/^\s*([a-zA-Z0-9_]+):/gm)]
  keys[l] = new Set(matches.map(m => m[1]))
  for (const k of keys[l]) {
    allKeys.add(k)
  }
}

let hasError = false
const missing = {}

for (const k of allKeys) {
  for (const l of locales) {
    if (!keys[l].has(k)) {
      if (!missing[l]) missing[l] = []
      missing[l].push(k)
      hasError = true
    }
  }
}

if (hasError) {
  console.error('\nâ?i18n Translation Consistency Check Failed!\n')
  for (const [lang, missingKeys] of Object.entries(missing)) {
    console.error(`Missing in ${lang}:`)
    missingKeys.forEach(k => console.error(`  - ${k}`))
  }
  console.error('')
  process.exit(1)
} else {
  console.log('âœ?i18n Translation Consistency Check Passed!')
}

