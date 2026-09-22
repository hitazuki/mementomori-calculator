import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope } from 'vue'
import { fetchJson, isDictionary } from '../src/utils/fetchJson.js'
import { createLanguageLoader } from '../src/i18n/languageLoader.js'
import { useAsyncResource } from '../src/composables/useAsyncResource.js'

const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

test('the last language choice wins even if earlier requests finish later', async () => {
  const en = deferred(), ja = deferred()
  const applied = []
  const select = createLanguageLoader({
    load: language => ({ en, ja })[language].promise,
    apply: language => applied.push(language),
    reportError: assert.fail,
  })
  const first = select('en'), last = select('ja')
  ja.resolve({}); await last
  en.resolve({}); await first
  assert.deepEqual(applied, ['ja'])
})

test('an obsolete language failure does not replace a successful selection', async () => {
  const old = deferred()
  const select = createLanguageLoader({ load: lang => lang === 'en' ? old.promise : Promise.resolve({}), apply() {}, reportError: assert.fail })
  const first = select('en')
  assert.equal(await select('ja'), true)
  old.reject(new Error('offline'))
  assert.equal(await first, false)
})

test('resources recover on retry and ignore stale or disposed requests', async () => {
  const scope = effectScope()
  const pending = []
  const resource = scope.run(() => useAsyncResource(() => {
    const request = deferred(); pending.push(request); return request.promise
  }, []))
  const failed = resource.load()
  pending[0].reject(new Error('offline')); await failed
  assert.ok(resource.error.value)
  const stale = resource.load(), latest = resource.load()
  pending[2].resolve([2]); await latest
  pending[1].resolve([1]); await stale
  assert.deepEqual(resource.data.value, [2])
  assert.equal(resource.error.value, null)
  assert.equal(resource.loading.value, false)
  const disposed = resource.load()
  scope.stop()
  pending[3].resolve([3]); await disposed
  assert.deepEqual(resource.data.value, [2])
})

test('JSON requests reject HTTP and invalid dictionary data', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 503 }))
  await assert.rejects(fetchJson('/data'), /HTTP 503/)
  globalThis.fetch = async () => new Response('{"key":42}')
  await assert.rejects(fetchJson('/data', { validate: isDictionary }), /Invalid data/)
  globalThis.fetch = async () => new Response('{"key":"value"}')
  assert.deepEqual(await fetchJson('/data', { validate: isDictionary }), { key: 'value' })
})

test('JSON requests abort after timeout and honor caller cancellation', async t => {
  t.mock.method(globalThis, 'fetch', (url, { signal }) => new Promise((resolve, reject) => {
    if (signal.aborted) reject(signal.reason)
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  }))
  await assert.rejects(fetchJson('/slow', { timeoutMs: 5 }), { name: 'TimeoutError' })
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(fetchJson('/cancelled', { signal: controller.signal }), { name: 'AbortError' })
})
