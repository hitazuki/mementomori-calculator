/** Script: extract_master_data.js
 * Purpose: Extracts and processes game master data (e.g. dictionaries, localized text) into lightweight JSON files.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Default Master data directory
const MASTER_DIR = process.argv[2] || path.resolve(PROJECT_ROOT, 'data/Master');

console.log(`Reading Master data from: ${MASTER_DIR}`);

// Output paths
const CHARACTERS_OUT = path.resolve(PROJECT_ROOT, 'src/constants/characters.json');
const MYSTERIUM_OUT = path.resolve(PROJECT_ROOT, 'src/constants/mysterium_data.json');
const LOCALES_OUT = path.resolve(PROJECT_ROOT, 'src/locales/master_dict.json');

const loadJson = (filename) => {
  const filepath = path.join(MASTER_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.error(`Missing file: ${filepath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
};

const charactersMB = loadJson('CharacterMB.json');
const collectionsMB = loadJson('CharacterCollectionMB.json');
const colLevelsMB = loadJson('CharacterCollectionLevelMB.json');
const destinyMB = loadJson('GachaDestinyAddCharacterMB.json');

const langFiles = {
  'zh-CN': 'TextResourceZhCnMB.json',
  'zh-TW': 'TextResourceZhTwMB.json',
  'en': 'TextResourceEnUsMB.json',
  'ja': 'TextResourceJaJpMB.json',
  'ko': 'TextResourceKoKrMB.json'
};

const texts = {};
for (const [lang, filename] of Object.entries(langFiles)) {
  try {
    const list = loadJson(filename);
    texts[lang] = {};
    for (const item of list) {
      texts[lang][item.StringKey] = item.Text;
    }
  } catch (e) {
    console.warn(`Failed to load ${filename}`);
  }
}

// Keys we need to include in the dictionary
const requiredKeys = new Set();

const limitedIds = new Set(destinyMB.map(d => d.CharacterId));

// 1. Process Characters
const outCharacters = {};
for (const c of charactersMB) {
  if (c.IsIgnore) continue;
  
  const cid = c.Id;
  const isLimited = limitedIds.has(cid);
  
  outCharacters[cid] = {
    id: cid,
    nameKey: c.NameKey,
    name2Key: c.Name2Key || null,
    elementType: c.ElementType || 1,
    isLimited: isLimited
  };
  
  requiredKeys.add(c.NameKey);
  if (c.Name2Key) requiredKeys.add(c.Name2Key);
}

// Standard parameter keys
const paramNames = {
  1: '[BattleParameterTypeHp]',
  2: '[BattleParameterTypeAttackPower]',
  3: '[BattleParameterTypePhysicalDamageRelax]',
  4: '[BattleParameterTypeMagicDamageRelax]',
  5: '[BattleParameterTypeHit]',
  6: '[BattleParameterTypeAvoidance]',
  7: '[BattleParameterTypeCritical]',
  8: '[BattleParameterTypeCriticalResist]',
  9: '[BattleParameterTypeCriticalDamageEnhance]',
  10: '[BattleParameterTypePhysicalCriticalDamageRelax]',
  11: '[BattleParameterTypeMagicCriticalDamageRelax]',
  12: '[BattleParameterTypeDefensePenetration]',
  13: '[BattleParameterTypeDefense]',
  14: '[BattleParameterTypeDamageEnhance]',
  15: '[BattleParameterTypeDebuffHit]',
  16: '[BattleParameterTypeDebuffResist]',
  17: '[BattleParameterTypeDamageReflect]',
  18: '[BattleParameterTypeHpDrain]',
  19: '[BattleParameterTypeSpeed]'
};

Object.values(paramNames).forEach(k => requiredKeys.add(k));

// 2. Process Collection Levels
const colScores = {};
for (const cl of colLevelsMB) {
  if (cl.CharacterRarityFlags === 512) {
    const cid = cl.CollectionId;
    const params = [];
    const baseParams = [];
    
    const infos = cl.BattleParameterChangeInfos || [];
    for (const p of infos) {
      const ptype = p.BattleParameterType;
      let ctype = p.ChangeParameterType || 1;
      const rawVal = p.Value;
      
      if ([9, 10, 11, 17, 18].includes(ptype) && ctype === 1) {
        ctype = 2; // Treat as percentage
      }
      
      const key = paramNames[ptype] || `[UnknownParam_${ptype}]`;
      params.push({
        ptype,
        nameKey: key,
        ctype, // 1: Fixed, 2: Percent, 3: Growth
        val: rawVal
      });
    }
    
    const baseInfos = cl.BaseParameterChangeInfos || [];
    for (const p of baseInfos) {
      const ptype = p.BaseParameterType;
      let ctype = p.ChangeParameterType || 1;
      const rawVal = p.Value;
      
      // Map base parameters to custom keys
      let key = '';
      if (ptype === 1) key = 'appBasicStr'; // 腕力
      else if (ptype === 2) key = 'appBasicDex'; // 技�?      else if (ptype === 3) key = 'appBasicMag'; // 魔力
      else if (ptype === 4) key = 'appBasicStm'; // 耐久�?      else key = `[UnknownBaseParam_${ptype}]`;
      
      baseParams.push({
        ptype,
        nameKey: key,
        ctype,
        val: rawVal
      });
    }
    
    colScores[cid] = { params, baseParams };
  }
}

// 3. Process Collections
const outCollections = [];
for (const col of collectionsMB) {
  if (col.IsIgnore) continue;
  
  const cid = col.Id;
  const reqChars = col.RequiredCharacterIds || [];
  
  if (!colScores[cid]) continue;
  
  requiredKeys.add(col.NameKey);
  
  outCollections.push({
    id: cid,
    nameKey: col.NameKey,
    reqCids: reqChars,
    params: colScores[cid].params,
    baseParams: colScores[cid].baseParams
  });
}

// 4. Generate Dictionary
const masterDict = {
  'zh-CN': {
    'appBasicStr': '腕力',
    'appBasicDex': '技�?,
    'appBasicMag': '魔力',
    'appBasicStm': '耐久�?
  },
  'zh-TW': {
    'appBasicStr': '腕力',
    'appBasicDex': '技�?,
    'appBasicMag': '魔力',
    'appBasicStm': '耐久�?
  },
  'en': {
    'appBasicStr': 'STR',
    'appBasicDex': 'DEX',
    'appBasicMag': 'MAG',
    'appBasicStm': 'STA'
  },
  'ja': {
    'appBasicStr': '腕力',
    'appBasicDex': '技�?,
    'appBasicMag': '魔力',
    'appBasicStm': '耐久�?
  },
  'ko': {
    'appBasicStr': '완력',
    'appBasicDex': '기력',
    'appBasicMag': '마력',
    'appBasicStm': '내구�?
  }
};

for (const key of requiredKeys) {
  for (const lang of Object.keys(langFiles)) {
    if (texts[lang] && texts[lang][key]) {
      masterDict[lang] = masterDict[lang] || {};
      masterDict[lang][key] = texts[lang][key];
    }
  }
}

// Create directories if they don't exist
const ensureDir = (filepath) => {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

ensureDir(CHARACTERS_OUT);
ensureDir(MYSTERIUM_OUT);
ensureDir(LOCALES_OUT);

fs.writeFileSync(CHARACTERS_OUT, JSON.stringify(outCharacters, null, 2), 'utf8');
console.log(`Wrote characters -> ${CHARACTERS_OUT}`);

fs.writeFileSync(MYSTERIUM_OUT, JSON.stringify(outCollections, null, 2), 'utf8');
console.log(`Wrote mysteriums -> ${MYSTERIUM_OUT}`);

fs.writeFileSync(LOCALES_OUT, JSON.stringify(masterDict, null, 2), 'utf8');
console.log(`Wrote dictionary -> ${LOCALES_OUT}`);

