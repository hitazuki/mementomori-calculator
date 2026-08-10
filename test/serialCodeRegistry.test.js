import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { groupSerialCodesByExpiry, NO_EXPIRY_BATCH_KEY } from '../src/utils/serialCodeBatches.js'

const registryPath = new URL('../public/data/serial-codes.json', import.meta.url)
const userscriptPath = new URL('../public/userscripts/mememori-code-batch.user.js', import.meta.url)

test('serial-code registry contains valid, unique entries', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  assert.equal(registry.schemaVersion, 1)
  assert.ok(Array.isArray(registry.codes))
  assert.ok(registry.codes.length > 0)

  const normalized = new Set()
  for (const entry of registry.codes) {
    assert.match(entry.code, /^[0-9a-zA-Z]{1,50}$/)
    const key = entry.code.toUpperCase()
    assert.equal(normalized.has(key), false, `duplicate serial code: ${entry.code}`)
    normalized.add(key)
    assert.equal(typeof entry.enabled, 'boolean')
    assert.ok(Array.isArray(entry.regions) && entry.regions.length > 0)
    for (const field of ['validFrom', 'expiresAt']) {
      if (entry[field] !== null) {
        assert.equal(Number.isNaN(Date.parse(entry[field])), false, `${entry.code} has invalid ${field}`)
      }
    }
  }

  assert.ok(normalized.has('MEMENTO777'))
  assert.ok(normalized.has('F8WUGDAPSE'))
})

test('userscript has install and update metadata', async () => {
  const source = await readFile(userscriptPath, 'utf8')
  assert.match(source, /\/\/ ==UserScript==/)
  assert.match(source, /@version\s+\d+\.\d+\.\d+/)
  assert.match(source, /@version\s+0\.3\.1/)
  assert.match(source, /@match\s+https:\/\/mememori-game\.com\/code\*/)
  assert.match(source, /@updateURL\s+https:\/\/hitazuki\.github\.io\/mementomori-calculator\/userscripts\/mememori-code-batch\.user\.js/)
  assert.match(source, /MAX_CONSECUTIVE_ERRORS = 2/)
  assert.match(source, /id="mmt-code-batch"/)
  assert.match(source, /function groupRegistryCodes\(registry\)/)
  assert.match(source, /@grant\s+GM_deleteValue/)
})

test('serial codes are grouped by identical expiry time', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const batches = groupSerialCodesByExpiry(registry.codes, Date.parse('2026-08-10T00:00:00Z'))

  assert.equal(batches.length, 2)
  assert.equal(batches[0].expiresAt, '2026-08-24T14:59:59Z')
  assert.deepEqual(batches[0].codes.map(item => item.code), [
    '2434mememori',
    'tokenekotoko',
    'lucky2434gacha',
  ])
  assert.equal(batches[1].key, NO_EXPIRY_BATCH_KEY)
  assert.equal(batches[1].codes.length, 5)
})
