import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { requireMasterDirectory } from '../scripts/lib/masterDirectory.mjs'

test('Master generators require an explicit directory instead of a local fallback', () => {
  for (const script of ['extract_master_data.js', 'generate_character_catalog.mjs', 'generate_equipment_reinforcement.mjs', 'generate_raid_character_mb_texts.mjs']) {
    const result = spawnSync(process.execPath, [path.resolve('scripts', script)], { encoding: 'utf8' })
    assert.equal(result.status, 1, script)
    assert.match(result.stderr, /Usage: .*<master-directory>/, script)
    assert.doesNotMatch(result.stderr, /ENOENT/, script)
  }
})

test('Master directory validation accepts explicit directories and rejects invalid input', () => {
  for (const value of [undefined, '', '--check']) assert.throws(() => requireMasterDirectory(value, 'generator <master-directory>'), /Usage:/)
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mmt-master-input-'))
  try {
    assert.equal(requireMasterDirectory(directory, ''), directory)
    assert.throws(() => requireMasterDirectory(path.join(directory, 'missing'), ''), /does not exist/)
    const file = path.join(directory, 'file.json')
    fs.writeFileSync(file, '[]')
    assert.throws(() => requireMasterDirectory(file, ''), /does not exist/)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})
