import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { copyCharacterIcons, copyItemIcons } from '../scripts/copy_icons_utils.js';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mmt-copy-icons-'));
}

test('copyCharacterIcons normalizes music player icon names and skips duplicates', () => {
  const root = makeTempDir();
  try {
    const src = path.join(root, 'src');
    const nested = path.join(src, 'nested');
    const dest = path.join(root, 'dest');
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(src, 'CHR_000001_00_m_offwhite.png'), 'one');
    fs.writeFileSync(path.join(nested, 'CHR_000002_00_m.png'), 'two');
    fs.writeFileSync(path.join(nested, 'CHR_000002_00_m_offwhite.png'), 'two-duplicate');
    fs.writeFileSync(path.join(src, 'CHR_000003_00_m#1.png'), 'skip');

    const first = copyCharacterIcons(src, dest, { log: () => {} });
    const second = copyCharacterIcons(src, dest, { log: () => {} });

    assert.equal(first.ids.size, 2);
    assert.equal(first.copied, 2);
    assert.equal(second.copied, 0);
    assert.equal(second.skipped, 2);
    assert.equal(fs.existsSync(path.join(dest, '1.png')), true);
    assert.equal(fs.existsSync(path.join(dest, '2.png')), true);
    assert.equal(fs.existsSync(path.join(dest, '3.png')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('copyItemIcons preserves Item file names and ignores generated variants', () => {
  const root = makeTempDir();
  try {
    const src = path.join(root, 'src');
    const nested = path.join(src, 'nested');
    const dest = path.join(root, 'dest');
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(src, 'Item_0009.png'), 'diamond');
    fs.writeFileSync(path.join(nested, 'Item_0010.png'), 'gold');
    fs.writeFileSync(path.join(nested, 'Item_0011#clone.png'), 'skip');

    const result = copyItemIcons(src, dest, { log: () => {} });

    assert.equal(result.ids.size, 2);
    assert.equal(result.copied, 2);
    assert.equal(fs.readFileSync(path.join(dest, 'Item_0009.png'), 'utf8'), 'diamond');
    assert.equal(fs.readFileSync(path.join(dest, 'Item_0010.png'), 'utf8'), 'gold');
    assert.equal(fs.existsSync(path.join(dest, 'Item_0011#clone.png')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

