import test from 'node:test'
import assert from 'node:assert/strict'
import { decodeScoreOverrides, encodeScoreOverrides } from '../src/store/scorePersistence.js'
import { readStorage, writeStorage, removeStorage } from '../src/utils/storage.js'

const defaults = { a: { score: 12 }, b: { score: 5 }, c: { score: 7 } }

test('legacy scores migrate known numeric overrides without trusting stored metadata', () => {
  const raw = JSON.stringify({ a: { score: 0, batch: 999 }, b: { score: -1 }, c: { score: '25' }, unknown: { score: 99 } })
  assert.deepEqual(decodeScoreOverrides(raw, defaults, true), { a: 0 })
})

test('versioned storage rejects corruption and unknown versions, and reset stores no overrides', () => {
  for (const raw of ['broken', 'null', '[]', '{"version":4,"overrides":{"a":9}}']) {
    assert.deepEqual(decodeScoreOverrides(raw, defaults), {})
  }
  const encoded = encodeScoreOverrides({ a: { score: 20 }, b: { score: Infinity }, c: { score: 7 } }, defaults)
  assert.deepEqual(decodeScoreOverrides(encoded, defaults), { a: 20 })
  assert.deepEqual(JSON.parse(encodeScoreOverrides(defaults, defaults)), { version: 3, overrides: {} })
})

test('unavailable storage never prevents startup or changing preferences', t => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem() { throw Error('denied') }, setItem() { throw Error('full') }, removeItem() { throw Error('denied') } } })
  t.after(() => descriptor ? Object.defineProperty(globalThis, 'localStorage', descriptor) : delete globalThis.localStorage)
  assert.equal(readStorage('key'), null)
  assert.equal(writeStorage('key', 'value'), false)
  assert.doesNotThrow(() => removeStorage('key'))
})
