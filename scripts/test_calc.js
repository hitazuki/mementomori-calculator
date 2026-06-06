/** 脚本: test_calc.js
 * 用途: 独立的本地测试脚本，用于验证礼包性价比核心计算引擎(packCalc.js)的逻辑是否正确。
 */
import fs from 'fs'
import { calculateMysteriumRankings } from '../src/engine/mysteriumCalc.js'

const defaultScoringTemplate = [
  { group: '基础基建', key: 'appLevelCap', ctype: 1, baseVal: 5, score: 50 },
  { group: '四大基础属�?, key: 'appBasicStr', ctype: 3, baseVal: 30, score: 4 },
  { group: '四大基础属�?, key: 'appBasicDex', ctype: 3, baseVal: 30, score: 4 },
  { group: '四大基础属�?, key: 'appBasicMag', ctype: 3, baseVal: 30, score: 4 },
  { group: '四大基础属�?, key: 'appBasicStm', ctype: 3, baseVal: 30, score: 4 },
  
  { group: '核心攻防', key: '[BattleParameterTypeAttackPower]', ctype: 1, baseVal: 5000, score: 0 },
  { group: '核心攻防', key: '[BattleParameterTypeAttackPower]', ctype: 2, baseVal: 0.02, score: 20 },
  { group: '核心攻防', key: '[BattleParameterTypeHp]', ctype: 2, baseVal: 0.05, score: 50 },
  { group: '核心攻防', key: '[BattleParameterTypeDefense]', ctype: 2, baseVal: 0.01, score: 10 },
  { group: '核心攻防', key: '[BattleParameterTypeDefense]', ctype: 3, baseVal: 15, score: 1 },
  { group: '核心攻防', key: '[BattleParameterTypePhysicalDamageRelax]', ctype: 1, baseVal: 3000, score: 0 },
  { group: '核心攻防', key: '[BattleParameterTypePhysicalDamageRelax]', ctype: 2, baseVal: 0.02, score: 10 },
  { group: '核心攻防', key: '[BattleParameterTypeMagicDamageRelax]', ctype: 1, baseVal: 3000, score: 0 },
  { group: '核心攻防', key: '[BattleParameterTypeMagicDamageRelax]', ctype: 2, baseVal: 0.02, score: 10 },

  { group: '破甲穿�?, key: '[BattleParameterTypeDefensePenetration]', ctype: 1, baseVal: 200, score: 10 },
  { group: '破甲穿�?, key: '[BattleParameterTypeDamageEnhance]', ctype: 1, baseVal: 250, score: 5 },

  { group: '暴击体系', key: '[BattleParameterTypeCritical]', ctype: 3, baseVal: 70, score: 5 },
  { group: '暴击体系', key: '[BattleParameterTypeCriticalDamageEnhance]', ctype: 2, baseVal: 0.1, score: 120 },
  { group: '暴击体系', key: '[BattleParameterTypeCriticalResist]', ctype: 1, baseVal: 1500, score: 0 },
  { group: '暴击体系', key: '[BattleParameterTypeCriticalResist]', ctype: 3, baseVal: 70, score: 5 },
  { group: '暴击体系', key: '[BattleParameterTypePhysicalCriticalDamageRelax]', ctype: 2, baseVal: 0.1, score: 80 },
  { group: '暴击体系', key: '[BattleParameterTypeMagicCriticalDamageRelax]', ctype: 2, baseVal: 0.1, score: 80 },

  { group: '命中与闪�?, key: '[BattleParameterTypeHit]', ctype: 1, baseVal: 1500, score: 0 },
  { group: '命中与闪�?, key: '[BattleParameterTypeHit]', ctype: 3, baseVal: 70, score: 3 },
  { group: '命中与闪�?, key: '[BattleParameterTypeHit]', ctype: 2, baseVal: 0.015, score: 15 },
  { group: '命中与闪�?, key: '[BattleParameterTypeAvoidance]', ctype: 1, baseVal: 1500, score: 0 },
  { group: '命中与闪�?, key: '[BattleParameterTypeAvoidance]', ctype: 3, baseVal: 50, score: 2 },

  { group: '异常状�?, key: '[BattleParameterTypeDebuffHit]', ctype: 2, baseVal: 0.015, score: 5 },
  { group: '异常状�?, key: '[BattleParameterTypeDebuffHit]', ctype: 3, baseVal: 70, score: 2 },
  { group: '异常状�?, key: '[BattleParameterTypeDebuffResist]', ctype: 1, baseVal: 1500, score: 0 },
  { group: '异常状�?, key: '[BattleParameterTypeDebuffResist]', ctype: 3, baseVal: 70, score: 2 },

  { group: '特殊机制', key: '[BattleParameterTypeHpDrain]', ctype: 2, baseVal: 0.05, score: 100 },
  { group: '特殊机制', key: '[BattleParameterTypeDamageReflect]', ctype: 2, baseVal: 0.03, score: 60 }
]

const chars = JSON.parse(fs.readFileSync('./src/constants/characters.json', 'utf8'))
const dict = JSON.parse(fs.readFileSync('./src/locales/master_dict.json', 'utf8'))['zh-CN']
const cols = JSON.parse(fs.readFileSync('./src/constants/mysterium_data.json', 'utf8'))

const res = calculateMysteriumRankings(chars, cols, defaultScoringTemplate, 3)

for (let i = 0; i < 15; i++) {
  const r = res.rankings[i]
  const names = r.chars.map(c => dict[c.nameKey] + (c.name2Key ? `(${dict[c.name2Key]})` : '')).join(' + ')
  console.log(`${i+1}. ${names} | CE: ${r.marginalCe.toFixed(1)} | Score: ${r.score.toFixed(1)} | Cost: ${r.cost}`)
}


