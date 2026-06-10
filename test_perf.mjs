import fs from 'fs';
import { planUltraSalePurchases, buildUltraSalePlanOptions } from './src/engine/ultraSalePlanner.js';

const packs = JSON.parse(fs.readFileSync('./src/data/ultraSalePacks.json', 'utf-8'));
const settings = {
  budget: 118000,
  currentPrice: 160,
  topUpBudgetRatio: 5,
  lanes: [
    { id: 'quest', enabled: true, from: '15-12', to: '16-28', maxBatch: 2 },
    { id: 'rank', enabled: true, from: 180, to: 200, maxBatch: 2 },
    { id: 'tower', enabled: true, from: 300, to: 350, maxBatch: 2 },
    { id: 'blueTower', enabled: true, from: 100, to: 150, maxBatch: 1 },
    { id: 'redTower', enabled: true, from: 100, to: 150, maxBatch: 1 },
    { id: 'greenTower', enabled: true, from: 100, to: 150, maxBatch: 1 },
    { id: 'yellowTower', enabled: true, from: 100, to: 150, maxBatch: 1 }
  ],
  permanentPacks: [
    { price: 160, value: 160, paidDiamonds: 50 },
    { price: 10000, value: 10000, paidDiamonds: 5000 }
  ],
  maxStates: 50,
  maxStatesPerTier: 50,
  maxStatesPerCursor: 10,
  perBucketStates: 2
};

console.time('plan');
const res = planUltraSalePurchases(packs, settings);
console.timeEnd('plan');
console.log('Steps:', res.steps.length);
