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
  assert.equal(core.REQUEST_INTERVAL_MS, 2000)
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

test('backup validation and merge preserve success and already-used terminal records', () => {
  const account = {
    id: 'a', alias: 'Main', serverId: '3', serverName: 'Asia', playerId: '123',
    createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z',
  }
  const backup = core.createBackup([account], {
    '3:123:MEMENTO777': { status: 'success', redeemedAt: '2026-08-10T00:00:00Z', batchKey: 'no-expiry' },
    '3:123:CODE2': { status: 'already-used', observedAt: '2026-08-10T00:05:00Z', batchKey: 'no-expiry' },
  }, '2026-08-10T01:00:00Z')
  const parsed = plain(core.parseBackup(JSON.stringify(backup)))

  assert.equal(parsed.type, 'mmt-serial-code-backup')
  assert.equal(parsed.accounts.length, 1)
  assert.equal(parsed.redemptions['3:123:CODE2'].status, 'already-used')
  assert.throws(() => core.parseBackup('{"schemaVersion":1}'))
  assert.throws(() => core.parseBackup(JSON.stringify({
    ...backup,
    redemptions: { invalid: { status: 'success', redeemedAt: 'not-a-date' } },
  })))

  const merged = plain(core.mergeRedemptions({
    '3:123:MEMENTO777': { status: 'success', redeemedAt: '2026-08-11T00:00:00Z', batchKey: 'no-expiry' },
    '3:123:CODE2': { status: 'already-used', observedAt: '2026-08-11T00:00:00Z', batchKey: 'no-expiry' },
  }, parsed.redemptions))
  assert.equal(merged['3:123:MEMENTO777'].redeemedAt, '2026-08-11T00:00:00Z')
  assert.equal(merged['3:123:CODE2'].observedAt, '2026-08-11T00:00:00Z')

  const successWins = plain(core.mergeRedemptions({
    '3:123:CODE2': { status: 'already-used', observedAt: '2026-08-11T00:00:00Z' },
  }, {
    '3:123:CODE2': { status: 'success', redeemedAt: '2026-08-10T00:00:00Z' },
  }))
  assert.equal(successWins['3:123:CODE2'].status, 'success')
})

test('multi-account tasks are account-major and use safe delays', () => {
  const accounts = [
    { id: 'a', serverId: '3', playerId: '123' },
    { id: 'b', serverId: '1', playerId: '999' },
  ]
  const history = {
    '3:123:CODE1': { status: 'success', redeemedAt: '2026-08-10T00:00:00Z' },
    '1:999:CODE1': { status: 'already-used', observedAt: '2026-08-10T00:00:00Z' },
  }
  const tasks = plain(core.buildTasks(accounts, ['CODE1', 'CODE2'], history))

  assert.deepEqual(tasks.map(task => `${task.accountId}:${task.code}`), ['a:CODE2', 'b:CODE2'])
  assert.equal(core.delayFor(tasks[0], tasks[1]), 2000)
  assert.equal(core.delayFor(tasks[1], null), 0)
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

test('already-used responses remain code-specific across supported languages', () => {
  assert.equal(core.isAlreadyUsedMessage('这组兑换码已被使用。'), true)
  assert.equal(core.isAlreadyUsedMessage('這組虛寶碼已兌換完畢。'), true)
  assert.equal(core.isAlreadyUsedMessage('This serial code has already been used.'), true)
  assert.equal(core.isAlreadyUsedMessage('This reward code has already been redeemed.'), true)
  assert.equal(core.isAlreadyUsedMessage('このシリアルコードは使用済みです。'), true)
  assert.equal(core.isAlreadyUsedMessage('このシリアルコードは交換済みです。'), true)
  assert.equal(core.isAlreadyUsedMessage('이미 사용한 시리얼 코드입니다.'), true)
  assert.equal(core.isAlreadyUsedMessage('The serial code has expired.'), false)
})

test('only transport failures stop the remaining tasks for an account', () => {
  assert.equal(core.shouldStopAccount({ isTimeout: true, status: 0 }), true)
  assert.equal(core.shouldStopAccount({ status: 0 }), true)
  assert.equal(core.shouldStopAccount({}), true)
  assert.equal(core.shouldStopAccount({ status: 400 }), false)
})

test('only an unrecognized 429 response stops the current run', () => {
  assert.equal(core.isRateLimitError({ status: 429 }, true), false)
  assert.equal(core.isRateLimitError({ status: 429 }, false), true)
  assert.equal(core.isRateLimitError({ status: 403 }, false), false)
  assert.equal(core.isRateLimitError({ status: 500 }, false), false)
})
