import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { fileURLToPath, pathToFileURL } from 'url';
import { copyCharacterIcons, copyItemIcons } from './copy_icons_utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const VARS_URL = 'https://mememori-game.com/apps/vars.js';
const APK_URL_TEMPLATE = 'https://mememori-game.com/apps/mementomori_{version}.apk';
const ASSETSTUDIO_RELEASE_URL = 'https://api.github.com/repos/aelurum/AssetStudio/releases/latest';
const FALLBACK_ASSETSTUDIO_ASSET = {
  name: 'AssetStudioModCLI_net9_linux64.zip',
  browser_download_url: 'https://github.com/aelurum/AssetStudio/releases/download/v0.19.0/AssetStudioModCLI_net9_linux64.zip',
};

const VERSION_FILE = path.join(PROJECT_ROOT, 'public/data/asset_version.txt');
const CHARACTERS_DATA_FILE = path.join(PROJECT_ROOT, 'public/data/characters.json');
const CHARACTER_DEST_DIR = path.join(PROJECT_ROOT, 'public/images/characters');
const ITEM_DEST_DIR = path.join(PROJECT_ROOT, 'public/images/items');
const WORK_DIR = process.env.SYNC_ASSETS_WORK_DIR
  ? path.resolve(process.env.SYNC_ASSETS_WORK_DIR)
  : path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'mmt-calculator-asset-sync');

const HTTP_TIMEOUT_MS = Number(process.env.SYNC_ASSETS_HTTP_TIMEOUT_MS || 10 * 60 * 1000);
const TEXTURE_EXPORT_RETRIES = Number(process.env.SYNC_ASSETS_TEXTURE_EXPORT_RETRIES || 2);

function log(message) {
  console.log(`[sync-assets] ${message}`);
}

function warn(message) {
  console.warn(`[sync-assets] ${message}`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function countFiles(dir, pattern) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((file) => pattern.test(file)).length;
}

function readCharacterIconIds(dir) {
  if (!fs.existsSync(dir)) return new Set();

  return new Set(
    fs.readdirSync(dir)
      .map((file) => file.match(/^(\d+)\.png$/)?.[1])
      .filter(Boolean)
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isInteger(id) && id > 0),
  );
}

function readItemIconIds(dir) {
  if (!fs.existsSync(dir)) return new Set();

  return new Set(
    fs.readdirSync(dir)
      .map((file) => file.match(/^Item_(\d{4})\.png$/)?.[1])
      .filter(Boolean)
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isInteger(id) && id >= 0),
  );
}

export function readExpectedCharacterIds(filePath = CHARACTERS_DATA_FILE) {
  if (!fs.existsSync(filePath)) return new Set();

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const entries = Array.isArray(data) ? data : Object.values(data);
  const ids = entries
    .map((entry) => Number(entry?.id ?? entry?.Id ?? entry))
    .filter((id) => Number.isInteger(id) && id > 0);

  return new Set(ids);
}

export function missingIds(expectedIds, actualIds) {
  return [...expectedIds]
    .filter((id) => !actualIds.has(id))
    .sort((a, b) => a - b);
}

function parseAddressableKeys(catalogPath) {
  return parseAddressableCatalog(catalogPath).keys;
}

function parseAddressableCatalog(catalogPath) {
  if (!fs.existsSync(catalogPath)) return { keys: [], buckets: new Map(), entries: [] };

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const { keys, keyByOffset } = parseCatalogKeys(catalog.m_KeyDataString || '');
  const { buckets, bucketByKey } = parseCatalogBuckets(catalog.m_BucketDataString || '', keyByOffset);
  const entries = parseCatalogEntries(catalog, keys);

  return { keys, buckets, bucketByKey, entries };
}

function parseCatalogKeys(dataString) {
  const buffer = Buffer.from(dataString, 'base64');
  if (buffer.length < 4) return { keys: [], keyByOffset: new Map() };

  let offset = 0;
  const count = buffer.readInt32LE(offset);
  offset += 4;
  const keys = [];
  const keyByOffset = new Map();

  for (let index = 0; index < count && offset < buffer.length; index++) {
    const keyOffset = offset;
    const type = buffer[offset];
    offset += 1;

    if (type !== 0 || offset + 4 > buffer.length) break;

    const length = buffer.readInt32LE(offset);
    offset += 4;
    if (offset + length > buffer.length) break;

    const key = buffer.subarray(offset, offset + length).toString('utf8');
    keys.push(key);
    keyByOffset.set(keyOffset, key);
    offset += length;
  }

  return { keys, keyByOffset };
}

function parseCatalogBuckets(dataString, keyByOffset) {
  const buffer = Buffer.from(dataString, 'base64');
  const buckets = [];
  const bucketByKey = new Map();
  if (buffer.length < 4) return { buckets, bucketByKey };

  let offset = 0;
  const count = buffer.readInt32LE(offset);
  offset += 4;

  for (let index = 0; index < count && offset + 8 <= buffer.length; index++) {
    const keyIndex = buffer.readInt32LE(offset);
    offset += 4;
    const entryCount = buffer.readInt32LE(offset);
    offset += 4;
    const entryIndexes = [];

    for (let entry = 0; entry < entryCount && offset + 4 <= buffer.length; entry++) {
      entryIndexes.push(buffer.readInt32LE(offset));
      offset += 4;
    }

    const key = keyByOffset.get(keyIndex) || '';
    const bucket = { key, entryIndexes };
    buckets.push(bucket);
    if (key) bucketByKey.set(key, bucket);
  }

  return { buckets, bucketByKey };
}

function parseCatalogEntries(catalog, keys) {
  const buffer = Buffer.from(catalog.m_EntryDataString || '', 'base64');
  if (buffer.length < 4) return [];

  const count = buffer.readInt32LE(0);
  const entries = [];

  for (let index = 0; index < count; index++) {
    const offset = 4 + index * 28;
    if (offset + 28 > buffer.length) break;

    const internalIdIndex = buffer.readInt32LE(offset);
    const providerIndex = buffer.readInt32LE(offset + 4);
    const dependenciesBucketIndex = buffer.readInt32LE(offset + 8);
    const primaryKeyIndex = buffer.readInt32LE(offset + 20);
    const resourceTypeIndex = buffer.readInt32LE(offset + 24);
    const internalId = catalog.m_InternalIds?.[internalIdIndex] || '';
    const primaryKey = keys[primaryKeyIndex] || '';
    const bundleName = path.basename(internalId.replace(/\\/g, '/'));

    entries.push({
      internalId,
      primaryKey,
      providerId: catalog.m_ProviderIds?.[providerIndex] || '',
      dependenciesBucketIndex,
      resourceType: catalog.m_resourceTypes?.[resourceTypeIndex]?.m_ClassName || '',
      bundleName: bundleName.endsWith('.bundle') ? bundleName : '',
    });
  }

  return entries;
}

function readCatalogCharacterIds(bundleDir) {
  const catalogPath = path.resolve(bundleDir, '..', 'catalog.json');
  const ids = new Set();

  for (const key of parseAddressableKeys(catalogPath)) {
    const match = key.match(/^CharacterIcon\/CHR_(\d{6})\/CHR_\d{6}_00_m(?:_offwhite)?$/);
    if (!match) continue;

    const id = Number.parseInt(match[1], 10);
    if (Number.isInteger(id) && id > 0) ids.add(id);
  }

  return ids;
}

function readCatalogItemIds(bundleDir) {
  const catalogPath = path.resolve(bundleDir, '..', 'catalog.json');
  const ids = new Set();

  for (const key of parseAddressableKeys(catalogPath)) {
    const match = key.match(/^Icon\/Item\/Item_(\d{4})$/);
    if (!match) continue;

    const id = Number.parseInt(match[1], 10);
    if (Number.isInteger(id) && id >= 0) ids.add(id);
  }

  return ids;
}

function isTargetIconCatalogKey(key) {
  return /^CharacterIcon\/CHR_\d{6}\/CHR_\d{6}_00_m$/.test(key)
    || /^Icon\/Item\/Item_\d{4}$/.test(key);
}

export function resolveTargetBundleNames(bundleDir) {
  const catalogPath = path.resolve(bundleDir, '..', 'catalog.json');
  const { keys, buckets, bucketByKey, entries } = parseAddressableCatalog(catalogPath);
  const bundleNames = new Set();

  keys.forEach((key) => {
    if (!isTargetIconCatalogKey(key)) return;

    const assetEntryIndexes = bucketByKey.get(key)?.entryIndexes || [];
    for (const assetEntryIndex of assetEntryIndexes) {
      const assetEntry = entries[assetEntryIndex];
      if (!assetEntry) continue;

      const dependencyBucket = buckets[assetEntry.dependenciesBucketIndex];
      const dependencyEntryIndexes = dependencyBucket?.entryIndexes || [];

      for (const dependencyEntryIndex of dependencyEntryIndexes) {
        const bundleName = entries[dependencyEntryIndex]?.bundleName;
        if (bundleName) bundleNames.add(bundleName);
      }

      if (assetEntry.bundleName) bundleNames.add(assetEntry.bundleName);
    }
  });

  return bundleNames;
}

function prepareAssetStudioInputDir(bundleDir) {
  if (process.env.SYNC_ASSETS_FULL_BUNDLE_SCAN === '1') {
    log('Using full bundle directory because SYNC_ASSETS_FULL_BUNDLE_SCAN=1.');
    return bundleDir;
  }

  const bundleNames = resolveTargetBundleNames(bundleDir);
  if (bundleNames.size === 0) {
    warn('Could not resolve target icon bundles from catalog; falling back to full bundle directory.');
    return bundleDir;
  }

  const targetDir = path.join(WORK_DIR, 'target-bundles');
  fs.rmSync(targetDir, { recursive: true, force: true });
  ensureDir(targetDir);

  let copied = 0;
  let bytes = 0;
  for (const bundleName of bundleNames) {
    const srcPath = path.join(bundleDir, bundleName);
    if (!fs.existsSync(srcPath)) continue;

    const destPath = path.join(targetDir, bundleName);
    fs.copyFileSync(srcPath, destPath);
    copied++;
    bytes += fs.statSync(srcPath).size;
  }

  if (copied === 0) {
    warn('Resolved target icon bundles, but none were present on disk; falling back to full bundle directory.');
    return bundleDir;
  }

  log(`Selected ${copied}/${bundleNames.size} catalog icon bundles for AssetStudio (${formatBytes(bytes)}).`);
  return targetDir;
}

function formatIdList(ids, limit = 20) {
  if (ids.length === 0) return 'none';
  const shown = ids.slice(0, limit).join(', ');
  return ids.length > limit ? `${shown}, ... (+${ids.length - limit} more)` : shown;
}

export function formatCharacterIconDiff(expectedIds, exportedIds, finalIds = exportedIds, catalogIds = new Set()) {
  const missingFinal = missingIds(expectedIds, finalIds);
  const missingFinalInCatalog = catalogIds.size > 0
    ? missingFinal.filter((id) => catalogIds.has(id))
    : missingFinal;
  const missingFinalNotInCatalog = catalogIds.size > 0
    ? missingFinal.filter((id) => !catalogIds.has(id))
    : [];
  const extraFinal = missingIds(finalIds, expectedIds);

  return [
    `expected=${expectedIds.size}`,
    `exported=${exportedIds.size}`,
    `final=${finalIds.size}`,
    `catalog=${catalogIds.size || 'unknown'}`,
    `missingFinal(${missingFinal.length})=${formatIdList(missingFinal)}`,
    `missingFinalInCatalog(${missingFinalInCatalog.length})=${formatIdList(missingFinalInCatalog)}`,
    `missingFinalNotInCatalog(${missingFinalNotInCatalog.length})=${formatIdList(missingFinalNotInCatalog)}`,
    `extraFinal(${extraFinal.length})=${formatIdList(extraFinal)}`,
  ].join('; ');
}

function formatCatalogIconDiff(label, exportedIds, finalIds, catalogIds) {
  const missingCatalog = catalogIds.size > 0 ? missingIds(catalogIds, finalIds) : [];
  const finalNotInCatalog = catalogIds.size > 0 ? missingIds(finalIds, catalogIds) : [];

  return [
    `${label}Exported=${exportedIds.size}`,
    `${label}Final=${finalIds.size}`,
    `${label}Catalog=${catalogIds.size || 'unknown'}`,
    `${label}MissingCatalog(${missingCatalog.length})=${formatIdList(missingCatalog)}`,
    `${label}FinalNotInCatalog(${finalNotInCatalog.length})=${formatIdList(finalNotInCatalog)}`,
  ].join('; ');
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return 'unknown size';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }

  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

async function withRetries(label, fn, retries = 2) {
  let lastError;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt > retries) break;
      warn(`${label} failed on attempt ${attempt}: ${error.message}`);
    }
  }

  throw lastError;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || HTTP_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'user-agent': 'mmt-calculator-asset-sync',
        ...(options.headers || {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseText(response) {
  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le');
  }

  const sampleLength = Math.min(buffer.length, 200);
  let zeroOddBytes = 0;
  for (let i = 1; i < sampleLength; i += 2) {
    if (buffer[i] === 0) zeroOddBytes++;
  }

  if (sampleLength > 20 && zeroOddBytes > sampleLength / 4) {
    return buffer.toString('utf16le');
  }

  return buffer.toString('utf8');
}

export async function checkVersion() {
  const response = await fetchWithTimeout(VARS_URL, { timeoutMs: 30_000 });
  if (!response.ok) {
    throw new Error(`Failed to fetch vars.js: HTTP ${response.status}`);
  }

  const text = await readResponseText(response);
  const apkPathMatch = text.match(/mementomori_(?<version>\d+\.\d+\.\d+)\.apk/);
  const apkVersionMatch = text.match(/apkVersion\s*=\s*['"](?<version>\d+\.\d+\.\d+)['"]/);
  const version = apkPathMatch?.groups?.version || apkVersionMatch?.groups?.version;

  if (!version) {
    throw new Error('Could not find APK version in vars.js.');
  }

  return version;
}

export function readVersionCache() {
  if (!fs.existsSync(VERSION_FILE)) return '0.0.0';
  return fs.readFileSync(VERSION_FILE, 'utf8').trim() || '0.0.0';
}

export function updateVersionCache(version) {
  ensureDir(path.dirname(VERSION_FILE));
  fs.writeFileSync(VERSION_FILE, `${version}\n`, 'utf8');
}

async function downloadFile(url, destPath, { label, retries = 2 } = {}) {
  ensureDir(path.dirname(destPath));

  return withRetries(label || url, async () => {
    if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { force: true });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'user-agent': 'mmt-calculator-asset-sync' },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      const total = Number(response.headers.get('content-length'));
      let received = 0;
      let nextLogAt = 100 * 1024 * 1024;

      const progress = new Transform({
        transform(chunk, _encoding, callback) {
          received += chunk.length;
          if (received >= nextLogAt) {
            log(`${label || 'download'}: ${formatBytes(received)} / ${formatBytes(total)}`);
            nextLogAt += 100 * 1024 * 1024;
          }
          callback(null, chunk);
        },
      });

      await pipeline(
        Readable.fromWeb(response.body),
        progress,
        fs.createWriteStream(destPath),
      );

      log(`${label || 'download'} complete: ${formatBytes(received)}`);
      return destPath;
    } finally {
      clearTimeout(timeout);
    }
  }, retries);
}

export async function downloadApk(version) {
  const apkUrl = APK_URL_TEMPLATE.replace('{version}', version);
  const apkPath = path.join(WORK_DIR, `mementomori_${version}.apk`);
  return downloadFile(apkUrl, apkPath, { label: `APK ${version}`, retries: 2 });
}

function shouldPrintToolLine(line) {
  return /\b(error|failed|warning|warn|exception)\b/i.test(line)
    || /^\[(Error|Warning)\]/i.test(line);
}

function attachFilteredOutput(stream, write, { filterOutput = false } = {}) {
  let buffer = '';
  let suppressed = 0;

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r\n|\n|\r/);
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!filterOutput || shouldPrintToolLine(line)) {
        write(`${line}\n`);
      } else if (line.trim()) {
        suppressed++;
      }
    }
  });

  return () => {
    if (buffer.trim()) {
      if (!filterOutput || shouldPrintToolLine(buffer)) {
        write(`${buffer}\n`);
      } else {
        suppressed++;
      }
    }

    return suppressed;
  };
}

function spawnCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`);
    const { allowNonZero = false, filterOutput = false, ...spawnOptions } = options;
    const child = spawn(command, args, {
      stdio: filterOutput ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      shell: process.platform === 'win32',
      ...spawnOptions,
    });

    const flushStdout = filterOutput
      ? attachFilteredOutput(child.stdout, (line) => process.stdout.write(line), { filterOutput })
      : () => 0;
    const flushStderr = filterOutput
      ? attachFilteredOutput(child.stderr, (line) => process.stderr.write(line), { filterOutput })
      : () => 0;

    child.on('error', reject);
    child.on('exit', (code) => {
      const suppressed = flushStdout() + flushStderr();
      if (suppressed > 0) {
        log(`Suppressed ${suppressed} verbose tool log lines.`);
      }

      if (code === 0 || allowNonZero) {
        if (code !== 0) {
          warn(`${command} exited with code ${code}; exported files will be validated before accepting the result.`);
        }
        resolve(code);
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

export async function extractBundles(apkPath) {
  const outputDir = path.join(WORK_DIR, 'apk');
  fs.rmSync(outputDir, { recursive: true, force: true });
  ensureDir(outputDir);

  await spawnCommand('7z', [
    'x',
    apkPath,
    'assets/aa/Android/*',
    'assets/aa/catalog.json',
    `-o${outputDir}`,
    '-y',
  ]);

  const bundleDir = path.join(outputDir, 'assets/aa/Android');
  if (!fs.existsSync(bundleDir)) {
    throw new Error(`Expected extracted bundle directory missing: ${bundleDir}`);
  }

  return bundleDir;
}

async function fetchLatestAssetStudioRelease() {
  const response = await fetchWithTimeout(ASSETSTUDIO_RELEASE_URL, { timeoutMs: 30_000 });
  if (!response.ok) {
    throw new Error(`Failed to fetch AssetStudio release: HTTP ${response.status}`);
  }

  return response.json();
}

function chooseAssetStudioAsset(release) {
  const assets = release.assets || [];
  const candidates = assets.filter((asset) =>
    /CLI/i.test(asset.name)
    && /linux(?:64|x64)/i.test(asset.name)
    && /\.zip$/i.test(asset.name)
  );

  if (candidates.length === 0) {
    throw new Error('No Linux CLI AssetStudio release asset found.');
  }

  return candidates.find((asset) => /net9/i.test(asset.name)) || candidates[0];
}

function findAssetStudioExecutable(dir) {
  const files = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  };

  walk(dir);

  const executable = files.find((file) => /AssetStudio.*CLI|ArknightsStudioCLI/i.test(path.basename(file))
    && !/\.config$|\.json$|\.pdb$/i.test(file));

  if (!executable) {
    throw new Error(`Could not find AssetStudio CLI executable under ${dir}`);
  }

  try {
    fs.chmodSync(executable, 0o755);
  } catch {
    // chmod is not meaningful on every platform.
  }

  return executable;
}

export async function prepareAssetStudioCli() {
  if (process.env.ASSET_STUDIO_CLI) {
    return path.resolve(process.env.ASSET_STUDIO_CLI);
  }

  let asset;
  if (process.env.ASSET_STUDIO_CLI_ZIP_URL) {
    asset = {
      name: path.basename(new URL(process.env.ASSET_STUDIO_CLI_ZIP_URL).pathname),
      browser_download_url: process.env.ASSET_STUDIO_CLI_ZIP_URL,
    };
  } else {
    try {
      const release = await withRetries('Fetch AssetStudio release metadata', fetchLatestAssetStudioRelease, 2);
      asset = chooseAssetStudioAsset(release);
    } catch (error) {
      warn(`Falling back to pinned AssetStudio release after metadata fetch failed: ${error.message}`);
      asset = FALLBACK_ASSETSTUDIO_ASSET;
    }
  }

  const toolDir = path.join(WORK_DIR, 'assetstudio');
  const zipPath = path.join(WORK_DIR, asset.name);

  fs.rmSync(toolDir, { recursive: true, force: true });
  ensureDir(toolDir);

  log(`Using AssetStudio release asset: ${asset.name}`);
  if (fs.existsSync(zipPath)) {
    log(`Using cached AssetStudio archive: ${zipPath}`);
  } else {
    await downloadFile(asset.browser_download_url, zipPath, { label: asset.name, retries: 2 });
  }
  await spawnCommand('7z', ['x', zipPath, `-o${toolDir}`, '-y']);

  return findAssetStudioExecutable(toolDir);
}

export async function extractTextures(bundleDir, assetStudioCli) {
  const outputDir = path.join(WORK_DIR, 'textures');
  fs.rmSync(outputDir, { recursive: true, force: true });
  ensureDir(outputDir);

  const args = [
    bundleDir,
    '-o',
    outputDir,
    '-t',
    'sprite,tex2d',
    '--image-format',
    'png',
  ];

  if (/\.dll$/i.test(assetStudioCli)) {
    await spawnCommand('dotnet', [assetStudioCli, ...args], { allowNonZero: true, filterOutput: true });
  } else {
    await spawnCommand(assetStudioCli, args, { allowNonZero: true, filterOutput: true });
  }

  return outputDir;
}

async function extractAndCopyIconsWithValidation(bundleDir, assetStudioInputDir, assetStudioCli) {
  const expectedCharacterIds = readExpectedCharacterIds();
  const catalogCharacterIds = readCatalogCharacterIds(bundleDir);
  const catalogItemIds = readCatalogItemIds(bundleDir);
  const minCharacters = Number(
    process.env.SYNC_ASSETS_MIN_CHARACTER_ICONS
    || catalogCharacterIds.size
    || countFiles(CHARACTER_DEST_DIR, /^\d+\.png$/),
  );
  const minItems = Number(
    process.env.SYNC_ASSETS_MIN_ITEM_ICONS
    || catalogItemIds.size
    || countFiles(ITEM_DEST_DIR, /^Item_\d{4}\.png$/),
  );

  return withRetries('Extract and validate image assets', async () => {
    const textureDir = await extractTextures(assetStudioInputDir, assetStudioCli);
    const characterResult = copyCharacterIcons(textureDir, CHARACTER_DEST_DIR, { log });
    const itemResult = copyItemIcons(textureDir, ITEM_DEST_DIR, { log });
    const finalCharacterIds = readCharacterIconIds(CHARACTER_DEST_DIR);
    const finalItemIds = readItemIconIds(ITEM_DEST_DIR);

    const missingCharacterBaseline = characterResult.ids.size < minCharacters;
    const missingItemBaseline = catalogItemIds.size > 0
      ? missingIds(catalogItemIds, finalItemIds).length > 0
      : itemResult.ids.size < minItems;
    const missingFinalCharacters = missingIds(expectedCharacterIds, finalCharacterIds);
    const missingFinalCharactersInCatalog = catalogCharacterIds.size > 0
      ? missingFinalCharacters.filter((id) => catalogCharacterIds.has(id))
      : [];
    const missingFinalCharactersNotInCatalog = catalogCharacterIds.size > 0
      ? missingFinalCharacters.filter((id) => !catalogCharacterIds.has(id))
      : missingFinalCharacters;
    const characterDiff = formatCharacterIconDiff(
      expectedCharacterIds,
      characterResult.ids,
      finalCharacterIds,
      catalogCharacterIds,
    );
    const itemDiff = formatCatalogIconDiff('item', itemResult.ids, finalItemIds, catalogItemIds);

    log(`Character icon validation: ${characterDiff}`);
    log(`Item icon validation: ${itemDiff}`);

    if (missingFinalCharactersInCatalog.length > 0) {
      throw new Error(
        `Character icons are missing even though current APK catalog lists them: ${characterDiff}`,
      );
    }

    if (missingFinalCharactersNotInCatalog.length > 0) {
      warn(`Character IDs are present in characters.json but absent from current APK catalog: ${formatIdList(missingFinalCharactersNotInCatalog)}.`);
    }

    if (missingCharacterBaseline || missingItemBaseline) {
      throw new Error(
        `Exported icon count below baseline: characters ${characterResult.ids.size}/${minCharacters}, `
        + `items ${itemResult.ids.size}/${minItems}; ${characterDiff}; ${itemDiff}`,
      );
    }

    if (characterResult.ids.size === 0 && itemResult.ids.size === 0) {
      throw new Error('Asset extraction produced no matching character or item icons.');
    }

    return { characterResult, itemResult };
  }, TEXTURE_EXPORT_RETRIES);
}

export async function syncAssets() {
  ensureDir(WORK_DIR);

  const currentVersion = await checkVersion();
  const cachedVersion = readVersionCache();
  const forced = process.argv.includes('--force') || process.env.SYNC_ASSETS_FORCE === '1';

  log(`Current APK version: ${currentVersion}`);
  log(`Cached APK version: ${cachedVersion}`);

  if (!forced && currentVersion === cachedVersion) {
    log('Asset version is unchanged. Nothing to do.');
    return { changed: false, version: currentVersion };
  }

  const apkPath = await downloadApk(currentVersion);
  const bundleDir = await extractBundles(apkPath);
  const assetStudioInputDir = prepareAssetStudioInputDir(bundleDir);
  const assetStudioCli = await prepareAssetStudioCli();
  const { characterResult, itemResult } = await extractAndCopyIconsWithValidation(bundleDir, assetStudioInputDir, assetStudioCli);

  updateVersionCache(currentVersion);
  log(`Updated ${VERSION_FILE} to ${currentVersion}`);

  return {
    changed: true,
    version: currentVersion,
    characters: characterResult,
    items: itemResult,
  };
}

async function main() {
  try {
    await syncAssets();
  } catch (error) {
    const message = error?.stack || error?.message || String(error);

    if (process.env.SYNC_ASSETS_GRACEFUL_FAILURE === '1') {
      warn(message);
      if (process.env.GITHUB_ACTIONS === 'true') {
        console.log(`::warning::Image asset sync skipped: ${error.message}`);
      }
      process.exitCode = 0;
      return;
    }

    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
