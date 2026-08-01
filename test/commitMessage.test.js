import test from 'node:test'
import assert from 'node:assert/strict'
import { commitHeader, validateCommitMessage } from '../scripts/validate_commit_message.js'

test('commit message validator accepts supported Conventional Commit headers', () => {
  for (const message of [
    'feat(raid): add manual action order',
    'fix: clear redundant round override',
    'refactor(engine)!: replace action order contract',
    'docs(raid/table): explain deterministic overrides',
  ]) {
    assert.equal(validateCommitMessage(message).valid, true, message)
  }
})

test('commit message validator rejects unsupported or malformed headers', () => {
  for (const message of [
    '',
    'update raid table',
    'feature(raid): add order editor',
    'FEAT(raid): add order editor',
    'feat(raid):',
    'feat (raid): add order editor',
  ]) {
    assert.equal(validateCommitMessage(message).valid, false, message)
  }
})

test('commit message validator ignores Git template comments', () => {
  const message = '# Please enter the commit message\n\nfix(ui): align order controls\n\n# Changes to be committed'
  assert.equal(commitHeader(message), 'fix(ui): align order controls')
  assert.equal(validateCommitMessage(message).valid, true)
})
