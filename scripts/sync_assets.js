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

const VERSION_FILE = path.join(PROJECT_ROOT, 'public/data/asset_version.txt');
const CHARACTER_DEST_DIR = path.join(PROJECT_ROOT, 'public/images/characters');
const ITEM_DEST_DIR = path.join(PROJECT_ROOT, 'public/images/items');
const WORK_DIR = process.env.SYNC_ASSETS_WORK_DIR
  ? path.resolve(process.env.SYNC_ASSETS_WORK_DIR)
  : path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'mmt-calculator-asset-sync');

const HTTP_TIMEOUT_MS = Number(process.env.SYNC_ASSETS_HTTP_TIMEOUT_MS || 10 * 60 * 1000);

function log(message) {
  console.log(`[sync-assets] ${message}`);
}

function warn(message) {
  console.warn(`[sync-assets] ${message}`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
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

function spawnCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
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

  const release = await withRetries('Fetch AssetStudio release metadata', fetchLatestAssetStudioRelease, 2);
  const asset = chooseAssetStudioAsset(release);
  const toolDir = path.join(WORK_DIR, 'assetstudio');
  const zipPath = path.join(WORK_DIR, asset.name);

  fs.rmSync(toolDir, { recursive: true, force: true });
  ensureDir(toolDir);

  log(`Using AssetStudio release asset: ${asset.name}`);
  await downloadFile(asset.browser_download_url, zipPath, { label: asset.name, retries: 2 });
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
    await spawnCommand('dotnet', [assetStudioCli, ...args]);
  } else {
    await spawnCommand(assetStudioCli, args);
  }

  return outputDir;
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
  const assetStudioCli = await prepareAssetStudioCli();
  const textureDir = await extractTextures(bundleDir, assetStudioCli);

  const characterResult = copyCharacterIcons(textureDir, CHARACTER_DEST_DIR, { log });
  const itemResult = copyItemIcons(textureDir, ITEM_DEST_DIR, { log });

  if (characterResult.ids.size === 0 && itemResult.ids.size === 0) {
    throw new Error('Asset extraction produced no matching character or item icons.');
  }

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
