import test from 'node:test'
import assert from 'node:assert/strict'
import { validateTranslations } from '../scripts/lib/translationValidation.mjs'

test('translation validation inspects spread messages and detects missing keys', () => {
  const module = { nestedFeature: 'Value {count}' }
  const result = validateTranslations({ en: { common: 'Hello', ...module }, ja: { common: 'こんにちは' } })
  assert.equal(result.keyCount, 2)
  assert.match(result.errors.join(), /ja: missing.*nestedFeature/)
})

test('translations require the same named/list placeholders, regardless of order or repetition', () => {
  assert.deepEqual(validateTranslations({ en: { text: '{count} {0} {count}' }, ja: { text: '{0} {count}' } }).errors, [])
  assert.match(validateTranslations({ en: { text: '{count}' }, ja: { text: '{n}' } }).errors.join(), /placeholder mismatch/)
})
