// src/constants/levelTable.js
import csvRaw from './level_coefficient.csv?raw'

const lines = csvRaw.trim().split('\n')
const LEVEL_TABLE_MAP = new Map()
export const LEVEL_TABLE = []

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',')
  if (parts.length < 9) continue
  const level = parseInt(parts[0])
  if (isNaN(level)) continue

  const data = {
    level,
    cDef: parseInt(parts[6]) || 0,     // 防御力(DEF)
    cPdef: parseInt(parts[7]) || 0,    // 物理防御力(P.DEF)
    cMdef: parseInt(parts[8]) || 0,    // 魔法防御力(M.DEF)
    cPmPen: parseInt(parts[1]) || 0,   // 物理魔法防御贯通(PM.DEF Break)
    cPen: parseInt(parts[2]) || 0,     // 防御贯通(DEF Break)
  }
  LEVEL_TABLE.push(data)
  LEVEL_TABLE_MAP.set(level, data)
}

/** 根据等级插值查询系数 */
export function getCoeffByLevel(level) {
  if (LEVEL_TABLE_MAP.has(level)) {
    return LEVEL_TABLE_MAP.get(level)
  }

  const sorted = LEVEL_TABLE
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1]
    if (level >= a.level && level <= b.level) {
      const t = (level - a.level) / (b.level - a.level)
      return {
        level,
        cDef:   Math.round(a.cDef + t * (b.cDef - a.cDef)),
        cPdef:  Math.round(a.cPdef + t * (b.cPdef - a.cPdef)),
        cMdef:  Math.round(a.cMdef + t * (b.cMdef - a.cMdef)),
        cPmPen: Math.round(a.cPmPen + t * (b.cPmPen - a.cPmPen)),
        cPen:   Math.round(a.cPen + t * (b.cPen - a.cPen)),
      }
    }
  }
  if (level <= sorted[0].level) return sorted[0]
  return sorted[sorted.length - 1]
}

export const LEVEL_PRESETS = [
  { label: '自定义',   ...getCoeffByLevel(1) },
  { label: 'Lv200',   ...getCoeffByLevel(200) },
  { label: 'Lv300',   ...getCoeffByLevel(300) },
  { label: 'Lv400',   ...getCoeffByLevel(400) },
  { label: 'Lv500',   ...getCoeffByLevel(500) },
  { label: 'Lv560',   ...getCoeffByLevel(560) },
  { label: 'Lv600',   ...getCoeffByLevel(600) },
  { label: 'Lv660',   ...getCoeffByLevel(660) },
  { label: 'Lv700',   ...getCoeffByLevel(700) },
  { label: 'Lv720',   ...getCoeffByLevel(720) },
]

export const DEF_BENCHMARKS = [
  { label: '100万防',  def:  1_000_000, pmDef:  1_000_000 },
  { label: '300万防',  def:  3_000_000, pmDef:  3_000_000 },
  { label: '500万防',  def:  5_000_000, pmDef:  5_000_000 },
  { label: '1000万防', def: 10_000_000, pmDef: 10_000_000 },
  { label: '2000万防', def: 20_000_000, pmDef: 20_000_000 },
  { label: '5000万防', def: 50_000_000, pmDef: 50_000_000 },
]
