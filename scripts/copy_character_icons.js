import path from 'path';
import { fileURLToPath } from 'url';
import { copyCharacterIcons } from './copy_icons_utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const SRC_DIRS = [
  path.resolve(PROJECT_ROOT, 'asset_downloader/data/Assets/Assets'),
  path.resolve(PROJECT_ROOT, 'asset_downloader/data/Assets/Assets-export'),
];
const DEST_DIR = path.resolve(PROJECT_ROOT, 'public/images/characters');

const result = copyCharacterIcons(SRC_DIRS, DEST_DIR);
console.log(`Successfully processed ${result.ids.size} character icons in ${DEST_DIR}`);

