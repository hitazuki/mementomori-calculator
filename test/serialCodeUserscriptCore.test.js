import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const userscriptPath = new URL('../public/userscripts/mememori-code-batch.user.js', import.meta.url)
const source = await readFile(userscriptPath, 'utf8')
const context = vm.createContext({ __MMT_SERIAL_CODE_TEST_MODE__: true })
vm.runInContext(source, context)
const core = context.__MMT_SERIAL_CODE_CORE__
const plain = value => JSON.parse(JSON.stringify(value))

test('userscript selects all official page languages and has complete translations', () => {
  assert.equal(core.API_TIMEOUT_MS, 15000)
  assert.equal(core.localeFromHtml('ja'), 'ja')
  assert.equal(core.localeFromHtml('en'), 'en')
  assert.equal(core.localeFromHtml('zh-cmn-Hant'), 'zh-TW')
  assert.equal(core.localeFromHtml('zh-cmn-Hans'), 'zh-CN')
  assert.equal(core.localeFromHtml('ko'), 'ko')
  assert.equal(core.localeFromHtml('unknown'), 'en')

  for (const translations of Object.values(core.messages)) {
    assert.deepEqual(Object.keys(translations).sort(), [...core.LOCALES].sort())
    for (const locale of core.LOCALES) assert.ok(translations[locale])
  }
})

test('account merge deduplicates identities and preserves stable local ids', () => {
  const local = [{
    id: 'local-a', alias: 'Old alias', serverId: '3', serverName: 'Asia', playerId: '123',
    updatedAt: '2026-08-01T00:00:00Z', createdAt: '2026-08-01T00:00:00Z',
  }]
  const incoming = [
    {
      id: 'import-a', alias: 'New alias', serverId: '3', serverName: 'Asia', playerId: '123',
      updatedAt: '2026-08-02T00:00:00Z', createdAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'local-a', alias: 'Second account', serverId: '1', serverName: 'Japan', playerId: '999',
      updatedAt: '2026-08-02T00:00:00Z', createdAt: '2026-08-02T00:00:00Z',
    },
  ]
  const merged = plain(core.mergeAccounts(local, incoming))

  assert.equal(merged.length, 2)
  assert.equal(merged[0].id, 'local-a')
  assert.equal(merged[0].alias, 'New alias')
  assert.equal(merged[1].id, 'import-1:999')
})

test('legacy success history migrates and remains account-specific', () => {
  const legacy = {
    '3:123:MEMENTO777': '2026-08-10T00:00:00Z',
  }
  const migrated = plain(core.normalizeRedemptions(legacy))

  assert.equal(migrated['3:123:MEMENTO777'].status, 'success')
  assert.equal(core.redemptionKey('3', '123', 'memento777'), '3:123:MEMENTO777')
  assert.equal(migrated['3:999:MEMENTO777'], undefined)
})

test('backup validation and merge keep local successes', () => {
  const account = {
    id: 'a', alias: 'Main', serverId: '3', serverName: 'Asia', playerId: '123',
    createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z',
  }
  const backup = core.createBackup([account], {
    '3:123:MEMENTO777': { status: 'success', redeemedAt: '2026-08-10T00:00:00Z', batchKey: 'no-expiry' },
  }, '2026-08-10T01:00:00Z')
  const parsed = plain(core.parseBackup(JSON.stringify(backup)))

  assert.equal(parsed.type, 'mmt-serial-code-backup')
  assert.equal(parsed.accounts.length, 1)
  assert.throws(() => core.parseBackup('{"schemaVersion":1}'))
  assert.throws(() => core.parseBackup(JSON.stringify({
    ...backup,
    redemptions: { invalid: { status: 'success', redeemedAt: 'not-a-date' } },
  })))

  const merged = plain(core.mergeRedemptions({
    '3:123:MEMENTO777': { status: 'success', redeemedAt: '2026-08-11T00:00:00Z', batchKey: 'no-expiry' },
  }, parsed.redemptions))
  assert.equal(merged['3:123:MEMENTO777'].redeemedAt, '2026-08-11T00:00:00Z')
})

test('multi-account tasks are account-major and use safe delays', () => {
  const accounts = [
    { id: 'a', serverId: '3', playerId: '123' },
    { id: 'b', serverId: '1', playerId: '999' },
  ]
  const history = {
    '3:123:CODE1': { status: 'success', redeemedAt: '2026-08-10T00:00:00Z' },
  }
  const tasks = plain(core.buildTasks(accounts, ['CODE1', 'CODE2'], history))

  assert.deepEqual(tasks.map(task => `${task.accountId}:${task.code}`), ['a:CODE2', 'b:CODE1', 'b:CODE2'])
  assert.equal(core.delayFor(tasks[0], tasks[1]), 10000)
  assert.equal(core.delayFor(tasks[1], tasks[2]), 4000)
  assert.equal(core.delayFor(tasks[2], null), 0)
})

test('an account failure advances past all remaining tasks for that account', () => {
  const tasks = [
    { accountId: 'a', code: 'CODE1' },
    { accountId: 'a', code: 'CODE2' },
    { accountId: 'a', code: 'CODE3' },
    { accountId: 'b', code: 'CODE1' },
  ]

  assert.equal(core.nextAccountTaskIndex(tasks, 0), 3)
  assert.equal(core.nextAccountTaskIndex(tasks, 3), 4)
})
