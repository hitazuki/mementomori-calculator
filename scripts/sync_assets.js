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
const BOI_AUTH_URL = 'https://prd1-auth.mememori-boi.com/api/auth/getDataUri';
const APK_URL_TEMPLATE = 'https://mememori-game.com/apps/mementomori_{version}.apk';
const ASSETSTUDIO_RELEASE_URL = 'https://api.github.com/repos/aelurum/AssetStudio/releases/latest';
const FALLBACK_ASSETSTUDIO_ASSET = {
  name: 'AssetStudioModCLI_net9_linux64.zip',
  browser_download_url: 'https://github.com/aelurum/AssetStudio/releases/download/v0.19.0/AssetStudioModCLI_net9_linux64.zip',
};

const VERSION_FILE = path.join(PROJECT_ROOT, 'public/data/asset_version.txt');
const ASSET_CATALOG_VERSION_FILE = path.join(PROJECT_ROOT, 'public/data/asset_catalog_version.txt');
const CHARACTERS_DATA_FILE = path.join(PROJECT_ROOT, 'public/data/characters.json');
const ITEM_MASTER_FILE = path.join(PROJECT_ROOT, 'data/Master/ItemMB.json');
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

function encodeMsgpackString(value) {
  const bytes = Buffer.from(value, 'utf8');
  if (bytes.length < 32) return Buffer.concat([Buffer.from([0xa0 | bytes.length]), bytes]);
  if (bytes.length < 256) return Buffer.concat([Buffer.from([0xd9, bytes.length]), bytes]);
  if (bytes.length < 65536) {
    const header = Buffer.alloc(3);
    header[0] = 0xda;
    header.writeUInt16BE(bytes.length, 1);
    return Buffer.concat([header, bytes]);
  }

  const header = Buffer.alloc(5);
  header[0] = 0xdb;
  header.writeUInt32BE(bytes.length, 1);
  return Buffer.concat([header, bytes]);
}

function encodeMsgpackInteger(value) {
  if (value >= 0 && value < 128) return Buffer.from([value]);
  if (value >= 0 && value < 256) return Buffer.from([0xcc, value]);
  if (value >= 0 && value < 65536) {
    const buffer = Buffer.alloc(3);
    buffer[0] = 0xcd;
    buffer.writeUInt16BE(value, 1);
    return buffer;
  }

  const buffer = Buffer.alloc(9);
  buffer[0] = 0xd3;
  buffer.writeBigInt64BE(BigInt(value), 1);
  return buffer;
}

function encodeMsgpackMap(value) {
  const entries = Object.entries(value);
  if (entries.length >= 16) {
    throw new Error('Small MessagePack encoder only supports fixmap values.');
  }

  const parts = [Buffer.from([0x80 | entries.length])];
  for (const [key, entryValue] of entries) {
    parts.push(encodeMsgpackString(key));
    if (typeof entryValue === 'string') {
      parts.push(encodeMsgpackString(entryValue));
    } else if (Number.isInteger(entryValue)) {
      parts.push(encodeMsgpackInteger(entryValue));
    } else {
      throw new Error(`Unsupported MessagePack value for ${key}: ${typeof entryValue}`);
    }
  }

  return Buffer.concat(parts);
}

class MsgpackDecoder {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  readByte() {
    return this.buffer[this.offset++];
  }

  readString(length) {
    const value = this.buffer.subarray(this.offset, this.offset + length).toString('utf8');
    this.offset += length;
    return value;
  }

  skip(length) {
    this.offset += length;
    return null;
  }

  readValue() {
    const type = this.readByte();
    if (type <= 0x7f) return type;
    if (type >= 0xe0) return type - 256;
    if (type >= 0xa0 && type <= 0xbf) return this.readString(type & 0x1f);
    if (type >= 0x90 && type <= 0x9f) return this.readArray(type & 0x0f);
    if (type >= 0x80 && type <= 0x8f) return this.readMap(type & 0x0f);

    if (type === 0xc0) return null;
    if (type === 0xc2) return false;
    if (type === 0xc3) return true;
    if (type === 0xca) {
      const value = this.buffer.readFloatBE(this.offset);
      this.offset += 4;
      return value;
    }
    if (type === 0xcb) {
      const value = this.buffer.readDoubleBE(this.offset);
      this.offset += 8;
      return value;
    }
    if (type === 0xcc) return this.readByte();
    if (type === 0xcd) {
      const value = this.buffer.readUInt16BE(this.offset);
      this.offset += 2;
      return value;
    }
    if (type === 0xce) {
      const value = this.buffer.readUInt32BE(this.offset);
      this.offset += 4;
      return value;
    }
    if (type === 0xcf) {
      const value = this.buffer.readBigUInt64BE(this.offset);
      this.offset += 8;
      return Number(value);
    }
    if (type === 0xd0) {
      const value = this.buffer.readInt8(this.offset);
      this.offset += 1;
      return value;
    }
    if (type === 0xd1) {
      const value = this.buffer.readInt16BE(this.offset);
      this.offset += 2;
      return value;
    }
    if (type === 0xd2) {
      const value = this.buffer.readInt32BE(this.offset);
      this.offset += 4;
      return value;
    }
    if (type === 0xd3) {
      const value = this.buffer.readBigInt64BE(this.offset);
      this.offset += 8;
      return Number(value);
    }
    if (type === 0xd9) return this.readString(this.readByte());
    if (type === 0xda) {
      const length = this.buffer.readUInt16BE(this.offset);
      this.offset += 2;
      return this.readString(length);
    }
    if (type === 0xdb) {
      const length = this.buffer.readUInt32BE(this.offset);
      this.offset += 4;
      return this.readString(length);
    }
    if (type === 0xdc) {
      const length = this.buffer.readUInt16BE(this.offset);
      this.offset += 2;
      return this.readArray(length);
    }
    if (type === 0xdd) {
      const length = this.buffer.readUInt32BE(this.offset);
      this.offset += 4;
      return this.readArray(length);
    }
    if (type === 0xde) {
      const length = this.buffer.readUInt16BE(this.offset);
      this.offset += 2;
      return this.readMap(length);
    }
    if (type === 0xdf) {
      const length = this.buffer.readUInt32BE(this.offset);
      this.offset += 4;
      return this.readMap(length);
    }
    if (type === 0xc4) return this.skip(this.readByte());
    if (type === 0xc5) {
      const length = this.buffer.readUInt16BE(this.offset);
      this.offset += 2;
      return this.skip(length);
    }
    if (type === 0xc6) {
      const length = this.buffer.readUInt32BE(this.offset);
      this.offset += 4;
      return this.skip(length);
    }
    if (type === 0xd4) return this.skip(2);
    if (type === 0xd5) return this.skip(3);
    if (type === 0xd6) return this.skip(5);
    if (type === 0xd7) return this.skip(9);
    if (type === 0xd8) return this.skip(17);
    if (type === 0xc7) return this.skip(this.readByte() + 1);
    if (type === 0xc8) {
      const length = this.buffer.readUInt16BE(this.offset);
      this.offset += 2;
      return this.skip(length + 1);
    }
    if (type === 0xc9) {
      const length = this.buffer.readUInt32BE(this.offset);
      this.offset += 4;
      return this.skip(length + 1);
    }

    throw new Error(`Unsupported MessagePack type 0x${type.toString(16)} at offset ${this.offset - 1}.`);
  }

  readArray(length) {
    return Array.from({ length }, () => this.readValue());
  }

  readMap(length) {
    const value = {};
    for (let index = 0; index < length; index++) {
      value[this.readValue()] = this.readValue();
    }
    return value;
  }
}

function decodeMsgpack(buffer) {
  return new MsgpackDecoder(buffer).readValue();
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

export function readExpectedItemIconIds(filePath = ITEM_MASTER_FILE) {
  if (!fs.existsSync(filePath)) return new Set();

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const entries = Array.isArray(data) ? data : Object.values(data);
  const ids = entries
    .map((entry) => Number(entry?.IconId ?? entry?.iconId))
    .filter((id) => Number.isInteger(id) && id >= 0);

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
  if (!fs.existsSync(catalogPath)) return { keys: [], buckets: [], bucketByKey: new Map(), entries: [] };

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const { keys, keyByOffset } = parseCatalogKeys(catalog.m_KeyDataString || '');
  const { buckets, bucketByKey } = parseCatalogBuckets(catalog.m_BucketDataString || '', keyByOffset);
  const entries = parseCatalogEntries(catalog, keys);

  return { keys, buckets, bucketByKey, entries };
}

function getCatalogPathForBundleDir(bundleDir) {
  return path.resolve(bundleDir, '..', 'catalog.json');
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
  const catalogPath = getCatalogPathForBundleDir(bundleDir);
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
  const catalogPath = getCatalogPathForBundleDir(bundleDir);
  const ids = new Set();

  for (const key of parseAddressableKeys(catalogPath)) {
    const match = key.match(/^Icon\/Item\/Item_(\d{4})$/);
    if (!match) continue;

    const id = Number.parseInt(match[1], 10);
    if (Number.isInteger(id) && id >= 0) ids.add(id);
  }

  return ids;
}

function catalogIconTarget(key) {
  const characterMatch = key.match(/^CharacterIcon\/CHR_(\d{6})\/CHR_\d{6}_00_m(?:_offwhite)?$/);
  if (characterMatch) {
    return { type: 'character', id: Number.parseInt(characterMatch[1], 10) };
  }

  const itemMatch = key.match(/^Icon\/Item\/Item_(\d{4})$/);
  if (itemMatch) {
    return { type: 'item', id: Number.parseInt(itemMatch[1], 10) };
  }

  return null;
}

function isWantedCatalogIconKey(key, targets = {}) {
  const target = catalogIconTarget(key);
  if (!target) return false;

  if (target.type === 'character' && targets.characterIds?.size) {
    return targets.characterIds.has(target.id);
  }

  if (target.type === 'item' && targets.itemIds?.size) {
    return targets.itemIds.has(target.id);
  }

  return !targets.characterIds?.size && !targets.itemIds?.size;
}

export function resolveTargetBundleNames(bundleDir, targets = {}) {
  const catalogPath = getCatalogPathForBundleDir(bundleDir);
  const { keys, buckets, bucketByKey, entries } = parseAddressableCatalog(catalogPath);
  const bundleNames = new Set();

  keys.forEach((key) => {
    if (!isWantedCatalogIconKey(key, targets)) return;

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

function prepareAssetStudioInputDir(bundleDir, { targets = {}, outputName = 'target-bundles', fallbackToFull = true } = {}) {
  if (process.env.SYNC_ASSETS_FULL_BUNDLE_SCAN === '1') {
    log('Using full bundle directory because SYNC_ASSETS_FULL_BUNDLE_SCAN=1.');
    return bundleDir;
  }

  const bundleNames = resolveTargetBundleNames(bundleDir, targets);
  if (bundleNames.size === 0) {
    if (fallbackToFull) {
      warn('Could not resolve target icon bundles from catalog; falling back to full bundle directory.');
      return bundleDir;
    }
    warn('Could not resolve target icon bundles from catalog.');
    return null;
  }

  const targetDir = path.join(WORK_DIR, outputName);
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
    if (fallbackToFull) {
      warn('Resolved target icon bundles, but none were present on disk; falling back to full bundle directory.');
      return bundleDir;
    }
    warn('Resolved target icon bundles, but none were present on disk.');
    return null;
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

function replaceUriFormat(format, value) {
  return format.includes('{0}') ? format.replace('{0}', value) : format.replace('{}', value);
}

function unityFetchHeaders() {
  return {
    'user-agent': 'UnityPlayer/2021.3.10f1 (UnityWebRequest/1.0, libcurl/7.80.0-DEV)',
    'x-unity-version': '2021.3.10f1',
  };
}

async function fetchBoiDataUri(appVersion) {
  const body = encodeMsgpackMap({ CountryCode: 'CN', UserId: 0 });
  const response = await fetchWithTimeout(BOI_AUTH_URL, {
    method: 'POST',
    timeoutMs: 30_000,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      ortegaaccesstoken: '',
      ortegaappversion: appVersion,
      ortegadevicetype: '2',
      ortegauuid: '0123456789abcdef0123456789abcdef',
      'accept-encoding': 'gzip',
      'user-agent': 'BestHTTP/2 v2.3.0',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch BOI data URI: HTTP ${response.status}`);
  }

  const statusCode = response.headers.get('ortegastatuscode');
  if (statusCode && statusCode !== '0') {
    throw new Error(`BOI data URI request returned ortegastatuscode=${statusCode}`);
  }

  const data = decodeMsgpack(Buffer.from(await response.arrayBuffer()));
  const assetVersion = response.headers.get('ortegaassetversion');
  const masterVersion = response.headers.get('ortegamasterversion');
  const assetCatalogFixedUriFormat = data?.AssetCatalogFixedUriFormat;

  if (!assetVersion || !assetCatalogFixedUriFormat) {
    throw new Error('BOI data URI response did not include asset version or catalog URI format.');
  }

  return {
    assetVersion,
    masterVersion,
    appVersion: data?.AppAssetVersionInfo?.Version || appVersion,
    assetCatalogFixedUriFormat,
    rawDataUriFormat: data?.RawDataUriFormat,
  };
}

async function downloadBoiCatalog(boiInfo) {
  const outputDir = path.join(WORK_DIR, 'boi');
  const catalogPath = path.join(outputDir, 'catalog.json');
  const catalogUrl = replaceUriFormat(boiInfo.assetCatalogFixedUriFormat, `Android/${boiInfo.assetVersion}.json`);

  fs.rmSync(outputDir, { recursive: true, force: true });
  ensureDir(outputDir);
  await downloadFile(catalogUrl, catalogPath, {
    label: `BOI catalog ${boiInfo.assetVersion}`,
    retries: 2,
    headers: unityFetchHeaders(),
  });

  return catalogPath;
}

async function downloadBoiTargetBundles(boiInfo, catalogPath, targets) {
  const bundleDir = path.join(path.dirname(catalogPath), 'Android');
  ensureDir(bundleDir);

  const bundleNames = resolveTargetBundleNames(bundleDir, targets);
  if (bundleNames.size === 0) {
    warn('BOI catalog does not list bundles for currently missing master icons.');
    return { bundleDir, bundleNames, downloaded: 0, bytes: 0 };
  }

  let downloaded = 0;
  let bytes = 0;
  for (const bundleName of bundleNames) {
    const destPath = path.join(bundleDir, bundleName);
    const bundleUrl = replaceUriFormat(boiInfo.assetCatalogFixedUriFormat, `Android/${bundleName}`);
    await downloadFile(bundleUrl, destPath, {
      label: `BOI bundle ${downloaded + 1}/${bundleNames.size}`,
      retries: 2,
      headers: unityFetchHeaders(),
    });
    downloaded++;
    bytes += fs.statSync(destPath).size;
  }

  log(`Downloaded ${downloaded}/${bundleNames.size} BOI target bundles (${formatBytes(bytes)}).`);
  return { bundleDir, bundleNames, downloaded, bytes };
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

export function readAssetCatalogVersionCache() {
  if (!fs.existsSync(ASSET_CATALOG_VERSION_FILE)) return '';
  return fs.readFileSync(ASSET_CATALOG_VERSION_FILE, 'utf8').trim();
}

export function updateAssetCatalogVersionCache(version) {
  ensureDir(path.dirname(ASSET_CATALOG_VERSION_FILE));
  fs.writeFileSync(ASSET_CATALOG_VERSION_FILE, `${version}\n`, 'utf8');
}

async function downloadFile(url, destPath, { label, retries = 2, headers = {} } = {}) {
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
        headers: { 'user-agent': 'mmt-calculator-asset-sync', ...headers },
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

function currentMissingMasterIconTargets() {
  const expectedCharacterIds = readExpectedCharacterIds();
  const expectedItemIds = process.env.SYNC_ASSETS_INCLUDE_MASTER_ITEM_TARGETS === '1'
    ? readExpectedItemIconIds()
    : new Set();
  const finalCharacterIds = readCharacterIconIds(CHARACTER_DEST_DIR);
  const finalItemIds = readItemIconIds(ITEM_DEST_DIR);

  return {
    expectedCharacterIds,
    expectedItemIds,
    finalCharacterIds,
    finalItemIds,
    missingCharacterIds: new Set(missingIds(expectedCharacterIds, finalCharacterIds)),
    missingItemIds: new Set(missingIds(expectedItemIds, finalItemIds)),
  };
}

function hasMissingTargets(targets) {
  return targets.missingCharacterIds.size > 0 || targets.missingItemIds.size > 0;
}

function targetSetsFromMissing(targets) {
  return {
    characterIds: targets.missingCharacterIds,
    itemIds: targets.missingItemIds,
  };
}

function formatTargetSummary(targets) {
  return [
    `characters=${targets.missingCharacterIds.size ? formatIdList([...targets.missingCharacterIds]) : 'none'}`,
    `items=${targets.missingItemIds.size ? formatIdList([...targets.missingItemIds]) : 'none'}`,
  ].join('; ');
}

async function extractAndCopyMissingMasterIcons(assetStudioInputDir, assetStudioCli, targets, sourceLabel) {
  return withRetries(`Extract ${sourceLabel} missing master icons`, async () => {
    const textureDir = await extractTextures(assetStudioInputDir, assetStudioCli);
    const characterResult = copyCharacterIcons(textureDir, CHARACTER_DEST_DIR, { log });
    const itemResult = copyItemIcons(textureDir, ITEM_DEST_DIR, { log });
    const nextTargets = currentMissingMasterIconTargets();

    log(`${sourceLabel} character icons: ${characterResult.copied} copied, ${characterResult.skipped} unchanged, ${characterResult.ids.size} matched.`);
    log(`${sourceLabel} item icons: ${itemResult.copied} copied, ${itemResult.skipped} unchanged, ${itemResult.ids.size} matched.`);
    log(`${sourceLabel} remaining missing master icons: ${formatTargetSummary(nextTargets)}.`);

    const stillMissingRequestedCharacters = missingIds(targets.missingCharacterIds, readCharacterIconIds(CHARACTER_DEST_DIR));
    const stillMissingRequestedItems = missingIds(targets.missingItemIds, readItemIconIds(ITEM_DEST_DIR));
    if (stillMissingRequestedCharacters.length > 0 || stillMissingRequestedItems.length > 0) {
      throw new Error(
        `${sourceLabel} did not export all requested master icons: `
        + `characters=${formatIdList(stillMissingRequestedCharacters)}, `
        + `items=${formatIdList(stillMissingRequestedItems)}`,
      );
    }

    return { characterResult, itemResult, nextTargets };
  }, TEXTURE_EXPORT_RETRIES);
}

async function trySyncMissingIconsFromBoi(currentVersion, assetStudioCli) {
  const targets = currentMissingMasterIconTargets();
  if (!hasMissingTargets(targets)) {
    log('No missing master icon targets before BOI sync.');
    return { syncedAllMissingTargets: true, boiInfo: null, targets };
  }

  log(`Missing master icon targets before BOI sync: ${formatTargetSummary(targets)}.`);
  const boiInfo = await fetchBoiDataUri(currentVersion);
  log(`Current BOI asset catalog version: ${boiInfo.assetVersion}`);
  const catalogPath = await downloadBoiCatalog(boiInfo);
  const catalogBundleDir = path.join(path.dirname(catalogPath), 'Android');
  const catalogCharacterIds = readCatalogCharacterIds(catalogBundleDir);
  const catalogItemIds = readCatalogItemIds(catalogBundleDir);
  const missingCharactersInBoiCatalog = missingIds(targets.missingCharacterIds, catalogCharacterIds);
  const missingItemsInBoiCatalog = missingIds(targets.missingItemIds, catalogItemIds);

  if (missingCharactersInBoiCatalog.length > 0 || missingItemsInBoiCatalog.length > 0) {
    warn(
      `BOI catalog does not list every missing master icon: `
      + `characters=${formatIdList(missingCharactersInBoiCatalog)}, `
      + `items=${formatIdList(missingItemsInBoiCatalog)}.`,
    );
  }

  const boiTargets = {
    ...targets,
    missingCharacterIds: new Set([...targets.missingCharacterIds].filter((id) => catalogCharacterIds.has(id))),
    missingItemIds: new Set([...targets.missingItemIds].filter((id) => catalogItemIds.has(id))),
  };

  if (!hasMissingTargets(boiTargets)) {
    warn('No missing master icons are present in the current BOI catalog.');
    return { syncedAllMissingTargets: false, boiInfo, targets };
  }

  await downloadBoiTargetBundles(boiInfo, catalogPath, targetSetsFromMissing(boiTargets));
  const assetStudioInputDir = prepareAssetStudioInputDir(catalogBundleDir, {
    targets: targetSetsFromMissing(boiTargets),
    outputName: 'boi-target-bundles',
    fallbackToFull: false,
  });

  if (!assetStudioInputDir) {
    return { syncedAllMissingTargets: false, boiInfo, targets };
  }

  const result = await extractAndCopyMissingMasterIcons(assetStudioInputDir, assetStudioCli, boiTargets, 'BOI');
  return {
    syncedAllMissingTargets: !hasMissingTargets(result.nextTargets),
    boiInfo,
    targets: result.nextTargets,
    characters: result.characterResult,
    items: result.itemResult,
  };
}

export async function syncAssets() {
  ensureDir(WORK_DIR);

  const currentVersion = await checkVersion();
  const cachedVersion = readVersionCache();
  const cachedAssetCatalogVersion = readAssetCatalogVersionCache();
  const forced = process.argv.includes('--force') || process.env.SYNC_ASSETS_FORCE === '1';
  let assetStudioCli;
  let boiInfo;

  log(`Current APK version: ${currentVersion}`);
  log(`Cached APK version: ${cachedVersion}`);
  log(`Cached BOI asset catalog version: ${cachedAssetCatalogVersion || 'none'}`);

  const initialTargets = currentMissingMasterIconTargets();
  log(`Missing master icon targets: ${formatTargetSummary(initialTargets)}.`);

  if (!forced && process.env.SYNC_ASSETS_DISABLE_BOI !== '1' && hasMissingTargets(initialTargets)) {
    try {
      assetStudioCli = await prepareAssetStudioCli();
      const boiResult = await trySyncMissingIconsFromBoi(currentVersion, assetStudioCli);
      boiInfo = boiResult.boiInfo;

      if (boiResult.syncedAllMissingTargets) {
        if (boiInfo) {
          updateAssetCatalogVersionCache(boiInfo.assetVersion);
          log(`Updated ${ASSET_CATALOG_VERSION_FILE} to ${boiInfo.assetVersion}`);
        }
        updateVersionCache(currentVersion);
        log('BOI hot-update assets satisfied all missing master icons; skipping APK extraction.');
        log(`Updated ${VERSION_FILE} to ${currentVersion}`);
        return {
          changed: true,
          version: currentVersion,
          assetCatalogVersion: boiInfo?.assetVersion || cachedAssetCatalogVersion,
          characters: boiResult.characters,
          items: boiResult.items,
        };
      }
    } catch (error) {
      warn(`BOI hot-update asset sync failed; falling back to APK if needed: ${error.message}`);
    }
  }

  const targetsAfterBoi = currentMissingMasterIconTargets();
  if (!forced && !hasMissingTargets(targetsAfterBoi)) {
    if (currentVersion !== cachedVersion) {
      updateVersionCache(currentVersion);
      log('No missing master icons remain; skipping APK extraction.');
      log(`Updated ${VERSION_FILE} to ${currentVersion}`);
      return { changed: true, version: currentVersion, assetCatalogVersion: boiInfo?.assetVersion || cachedAssetCatalogVersion };
    }

    log('APK version is unchanged and no missing master icons remain. Nothing to do.');
    return { changed: false, version: currentVersion, assetCatalogVersion: boiInfo?.assetVersion || cachedAssetCatalogVersion };
  }

  if (!forced && hasMissingTargets(targetsAfterBoi)) {
    log(`Falling back to APK for remaining missing master icons: ${formatTargetSummary(targetsAfterBoi)}.`);
  }

  const apkPath = await downloadApk(currentVersion);
  const bundleDir = await extractBundles(apkPath);
  assetStudioCli ||= await prepareAssetStudioCli();
  const targetMode = !forced && hasMissingTargets(targetsAfterBoi);
  const assetStudioInputDir = prepareAssetStudioInputDir(bundleDir, {
    targets: targetMode ? targetSetsFromMissing(targetsAfterBoi) : {},
    outputName: targetMode ? 'apk-target-bundles' : 'target-bundles',
  });
  const { characterResult, itemResult } = targetMode
    ? await extractAndCopyMissingMasterIcons(assetStudioInputDir, assetStudioCli, targetsAfterBoi, 'APK')
    : await extractAndCopyIconsWithValidation(bundleDir, assetStudioInputDir, assetStudioCli);

  updateVersionCache(currentVersion);
  log(`Updated ${VERSION_FILE} to ${currentVersion}`);
  if (boiInfo) {
    updateAssetCatalogVersionCache(boiInfo.assetVersion);
    log(`Updated ${ASSET_CATALOG_VERSION_FILE} to ${boiInfo.assetVersion}`);
  }

  return {
    changed: true,
    version: currentVersion,
    assetCatalogVersion: boiInfo?.assetVersion || cachedAssetCatalogVersion,
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
