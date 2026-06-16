import fs from 'fs';
import path from 'path';

function asArray(value) {
  return Array.isArray(value) ? value : [value];
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;

  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkSync(fullPath, filelist);
    } else {
      filelist.push(fullPath);
    }
  }

  return filelist;
}

function copyIfChanged(srcPath, destPath) {
  if (fs.existsSync(destPath)) {
    const srcStat = fs.statSync(srcPath);
    const destStat = fs.statSync(destPath);

    if (srcStat.size === destStat.size) {
      return false;
    }
  }

  fs.copyFileSync(srcPath, destPath);
  return true;
}

function collectFiles(srcDir) {
  return asArray(srcDir).flatMap((dir) => walkSync(dir));
}

export function copyCharacterIcons(srcDir, destDir, { log = console.log } = {}) {
  ensureDir(destDir);

  let copied = 0;
  let skipped = 0;
  const ids = new Set();

  for (const srcPath of collectFiles(srcDir)) {
    const file = path.basename(srcPath);
    if (file.includes('#')) continue;

    const match = file.match(/^CHR_(\d{6})_00_m(?:_offwhite)?\.png$/i);
    if (!match) continue;

    const id = Number.parseInt(match[1], 10);
    if (!Number.isFinite(id) || ids.has(id)) continue;

    ids.add(id);
    const destPath = path.join(destDir, `${id}.png`);
    if (copyIfChanged(srcPath, destPath)) {
      copied++;
    } else {
      skipped++;
    }
  }

  log(`Character icons: ${copied} copied, ${skipped} unchanged, ${ids.size} matched.`);
  return { copied, skipped, ids };
}

export function copyItemIcons(srcDir, destDir, { log = console.log } = {}) {
  ensureDir(destDir);

  let copied = 0;
  let skipped = 0;
  const ids = new Set();

  for (const srcPath of collectFiles(srcDir)) {
    const file = path.basename(srcPath);
    if (file.includes('#')) continue;

    const match = file.match(/^Item_(\d{4})\.png$/i);
    if (!match) continue;

    const id = Number.parseInt(match[1], 10);
    if (!Number.isFinite(id) || ids.has(id)) continue;

    ids.add(id);
    const destPath = path.join(destDir, file);
    if (copyIfChanged(srcPath, destPath)) {
      copied++;
    } else {
      skipped++;
    }
  }

  log(`Item icons: ${copied} copied, ${skipped} unchanged, ${ids.size} matched.`);
  return { copied, skipped, ids };
}

