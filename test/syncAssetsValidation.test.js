import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { formatCharacterIconDiff, missingIds, readExpectedCharacterIds } from '../scripts/sync_assets.js';

function makeTempFile(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mmt-sync-assets-'));
  const file = path.join(dir, 'characters.json');
  fs.writeFileSync(file, JSON.stringify(content), 'utf8');
  return { dir, file };
}

test('readExpectedCharacterIds reads object-shaped character data', () => {
  const { dir, file } = makeTempFile({
    1: { id: 1 },
    140: { id: 140 },
    invalid: { id: null },
  });

  try {
    assert.deepEqual([...readExpectedCharacterIds(file)].sort((a, b) => a - b), [1, 140]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('missingIds reports expected character icons absent from exported results', () => {
  assert.deepEqual(missingIds(new Set([1, 2, 148]), new Set([1, 2])), [148]);
});

test('formatCharacterIconDiff summarizes missing and extra exported character IDs', () => {
  const diff = formatCharacterIconDiff(new Set([1, 2, 148]), new Set([1, 3]));

  assert.match(diff, /expected=3/);
  assert.match(diff, /exported=2/);
  assert.match(diff, /missingExpected\(2\)=2, 148/);
  assert.match(diff, /extraExported\(1\)=3/);
});
