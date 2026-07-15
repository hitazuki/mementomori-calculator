import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  downloadMoonheartCharacterIcon,
  isValidPng,
  moonheartCharacterPath,
  moonheartCharacterUrl,
  syncAssets,
  syncMoonheartCharacterIcons,
} from '../scripts/sync_assets.js';

function makeTempWorkspace(characterIds) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mmt-moonheart-assets-'));
  const expectedFile = path.join(root, 'characters.json');
  const destDir = path.join(root, 'images');
  const characters = Object.fromEntries(characterIds.map((id) => [id, { id }]));
  fs.writeFileSync(expectedFile, JSON.stringify(characters), 'utf8');
  return { root, expectedFile, destDir };
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  return chunk;
}

function validPng() {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', Buffer.alloc(13)),
    pngChunk('IEND'),
  ]);
}

function fakeResponse(status, body, contentType = 'text/plain') {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => name.toLowerCase() === 'content-type' ? contentType : null },
    text: async () => buffer.toString('utf8'),
    arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  };
}

test('Moonheart character paths use six-digit source IDs and numeric destination IDs', () => {
  assert.equal(moonheartCharacterPath(149), 'CHR_000149/CHR_000149_00_m.png');
  assert.equal(
    moonheartCharacterUrl(149, 'https://example.test/root/'),
    'https://example.test/root/CHR_000149/CHR_000149_00_m.png',
  );
  assert.throws(() => moonheartCharacterPath(0), /Invalid character ID/);
});

test('PNG validation rejects non-PNG and truncated PNG responses', () => {
  const png = validPng();
  assert.equal(isValidPng(png), true);
  assert.equal(isValidPng(Buffer.from('not a png')), false);
  assert.equal(isValidPng(png.subarray(0, png.length - 1)), false);
});

test('default asset sync downloads only missing character icons and preserves existing files', async () => {
  const { root, expectedFile, destDir } = makeTempWorkspace([1, 2]);
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, '1.png'), 'existing');
  const requested = [];

  try {
    const result = await syncAssets({
      expectedFile,
      destDir,
      baseUrl: 'https://example.test/characters',
      fetchImpl: async (url) => {
        requested.push(url);
        return fakeResponse(200, validPng(), 'image/png');
      },
      retries: 0,
      logFn: () => {},
    });

    assert.deepEqual(result.targets, [2]);
    assert.deepEqual(result.downloaded, [2]);
    assert.deepEqual(result.unavailable, []);
    assert.deepEqual(requested, ['https://example.test/characters/CHR_000002/CHR_000002_00_m.png']);
    assert.equal(fs.readFileSync(path.join(destDir, '1.png'), 'utf8'), 'existing');
    assert.deepEqual(fs.readFileSync(path.join(destDir, '2.png')), validPng());
    assert.equal(fs.readdirSync(root).some((name) => name.includes('asset_version')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('sync keeps successful downloads when another Moonheart icon is not published yet', async () => {
  const { root, expectedFile, destDir } = makeTempWorkspace([2, 3]);
  const warnings = [];

  try {
    const result = await syncMoonheartCharacterIcons({
      expectedFile,
      destDir,
      baseUrl: 'https://example.test/characters',
      fetchImpl: async (url) => url.includes('000002')
        ? fakeResponse(200, validPng(), 'image/png')
        : fakeResponse(500, 'failed to get obj: object not found'),
      retries: 0,
      logFn: () => {},
      warnFn: (message) => warnings.push(message),
    });

    assert.deepEqual(result.downloaded, [2]);
    assert.deepEqual(result.unavailable, [3]);
    assert.equal(fs.existsSync(path.join(destDir, '2.png')), true);
    assert.equal(fs.existsSync(path.join(destDir, '3.png')), false);
    assert.match(warnings[0], /not available yet/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('invalid PNG and network errors leave no destination or temporary files', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mmt-moonheart-failure-'));
  const destDir = path.join(root, 'images');

  try {
    await assert.rejects(
      downloadMoonheartCharacterIcon(4, {
        destDir,
        fetchImpl: async () => fakeResponse(200, validPng().subarray(0, 20), 'image/png'),
        retries: 0,
      }),
      /invalid or truncated PNG/,
    );
    await assert.rejects(
      downloadMoonheartCharacterIcon(5, {
        destDir,
        fetchImpl: async () => { throw new Error('network unavailable'); },
        retries: 0,
      }),
      /network unavailable/,
    );

    assert.equal(fs.existsSync(path.join(destDir, '4.png')), false);
    assert.equal(fs.existsSync(path.join(destDir, '5.png')), false);
    assert.deepEqual(fs.existsSync(destDir) ? fs.readdirSync(destDir) : [], []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
