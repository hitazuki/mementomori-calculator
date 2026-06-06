/** 脚本: fetch_ultra_sale.js
 * 用途: 通过请求 Tamamo API 批量抓取最新的限时组合包数据，并保存到本地 JSON 文件中。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const OUT_PATH = path.join(PROJECT_ROOT, 'doc', 'items', 'UltraSalePack', 'ultra-sale-packs.json');

(async () => {
  console.log('Fetching Ultra Sale Packs from Tamamo API...');
  
  const prices = [11800, 6000, 3000, 1500, 1000, 650, 160];
  const towerTypes = [
    { id: 2, name: '鐒＄銇' },
    { id: 3, name: '钘嶃伄濉? },
    { id: 4, name: '绱呫伄濉? },
    { id: 5, name: '缈犮伄濉? },
    { id: 6, name: '榛勩伄濉? },
    { id: 7, name: '鍏ㄥ' },
  ];
  const categories = [
    { id: 0, name: 'rank' },
    { id: 1, name: 'quest' },
  ];

  const allData = {};

  // Tower packs
  for (const tower of towerTypes) {
    for (const price of prices) {
      const url = `https://api.tamamo.dev/getUltraSalePack/${tower.id}?price=${price}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const key = `tower_${tower.id}_${price}`;
        allData[key] = json.data || [];
        console.log(`[OK] ${key.padEnd(20)} -> ${allData[key].length} packs`);
      } catch (e) {
        console.log(`[FAIL] ${url} - ${e.message}`);
      }
    }
  }

  // Category packs
  for (const cat of categories) {
    for (const price of prices) {
      const url = `https://api.tamamo.dev/getUltraSalePack/${cat.id}?price=${price}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const key = `${cat.name}_${price}`;
        allData[key] = json.data || [];
        console.log(`[OK] ${key.padEnd(20)} -> ${allData[key].length} packs`);
      } catch (e) {
        console.log(`[FAIL] ${url} - ${e.message}`);
      }
    }
  }

  // Ensure directory exists
  const dir = path.dirname(OUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(OUT_PATH, JSON.stringify(allData, null, 2));
  console.log(`\n馃帀 Successfully fetched and saved to:`);
  console.log(OUT_PATH);
})();


