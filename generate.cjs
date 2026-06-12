const fs = require('fs');
let code = fs.readFileSync('src/engine/ultraSalePlanner.js', 'utf8');
code = code.replace('for (let i = 0; i < maxIterations; i++) {', 'for (let i = 0; i < maxIterations; i++) { console.log(`Iteration ${i}, states: ${states.length}`);');
const wrapper = code + `
import fs from 'fs';
import { calculatePackCE } from './packCalc.js';
const packsRaw = JSON.parse(fs.readFileSync('public/data/ultraSalePacks.json', 'utf8'));
const permanentPacksRaw = JSON.parse(fs.readFileSync('src/constants/permanentPacks.json', 'utf8'));
const itemScores = JSON.parse(fs.readFileSync('src/constants/itemScores.json', 'utf8'));
const calculatedPacks = calculatePackCE(packsRaw, itemScores);
const calculatedPermanentPacks = calculatePackCE(permanentPacksRaw, itemScores);
console.log('Starting...');
buildUltraSalePlanOptions(calculatedPacks, {
  lanes: [
    { id: 'quest', cat: 'quest', enabled: true, startProgress: '45-09', endProgress: '48-01', batchSize: 6 },
    { id: 'rank', cat: 'rank', enabled: true, startProgress: 630, endProgress: 660, batchSize: 1 },
    { id: 'tower_infinite', cat: 'tower', tower: 'origin_tower_infinite', enabled: true, startProgress: 2444, endProgress: 2555, batchSize: 6 },
    { id: 'tower_blue', cat: 'tower', tower: 'origin_tower_blue', enabled: true, startProgress: 1000, endProgress: 1100, batchSize: 1 },
    { id: 'tower_red', cat: 'tower', tower: 'origin_tower_red', enabled: true, startProgress: 1099, endProgress: 1100, batchSize: 1 },
    { id: 'tower_green', cat: 'tower', tower: 'origin_tower_green', enabled: true, startProgress: 1500, endProgress: 1800, batchSize: 1 },
    { id: 'tower_yellow', cat: 'tower', tower: 'origin_tower_yellow', enabled: true, startProgress: 1500, endProgress: 1800, batchSize: 1 }
  ],
  budget: 0,
  permanentPacks: calculatedPermanentPacks,
  diamondScore: 1,
  freeDiamondScore: 1,
  maxStatesPerTier: 350,
});
`;
fs.writeFileSync('src/engine/temp_runner.mjs', wrapper);
