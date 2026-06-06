/** 脚本: copy_character_icons.js
 * 用途: 将原始的角色头像资源复制到项目的公开资源(public assets)目录中。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const SRC_DIRS = [
  path.resolve(PROJECT_ROOT, 'asset_downloader/data/Assets/Assets'),
  path.resolve(PROJECT_ROOT, 'asset_downloader/data/Assets/Assets-export')
];
const DEST_DIR = path.resolve(PROJECT_ROOT, 'public/images/characters');

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

let files = [];
for (const dir of SRC_DIRS) {
  files = files.concat(walkSync(dir));
}

let count = 0;
const copiedIds = new Set();

for (const srcPath of files) {
  const file = path.basename(srcPath);
  
  if (file.includes('#')) continue;

  const match = file.match(/^CHR_(\d{6})_00_m(?:_offwhite)?\.png$/i);
  if (match) {
    const id = parseInt(match[1], 10);
    
    if (!isNaN(id) && !copiedIds.has(id)) {
      const destPath = path.join(DEST_DIR, `${id}.png`);
      fs.copyFileSync(srcPath, destPath);
      copiedIds.add(id);
      count++;
    }
  }
}

console.log(`Successfully copied ${count} character icons to ${DEST_DIR}`);
