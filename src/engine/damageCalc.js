// src/engine/damageCalc.js
import { getCoeffByLevel } from '../constants/levelTable.js'

/**
 * 核心伤害率计算 (返回通过率，0~1)
 * Damage Rate = C_def / (effective_DEF + C_def)
 * effective_DEF = DEF * (C_pen / (PEN + C_pen))
 */
export function calcDamageRate(def, pen, cDef, cPen) {
  if (cDef <= 0 || cPen <= 0) return 0
  const effectiveDef = def * (cPen / (pen + cPen))
  return cDef / (effectiveDef + cDef)
}

/**
 * 完整伤害计算
 */
export function calcDamage({
  baseAtk      = 1000000,
  skillCoeff   = 5.25,
  def          = 5000000,   // 目标防御力(DEF)
  pmDef        = 5000000,   // 目标物理/魔法防御力(P.DEF / M.DEF)
  pen          = 11950,     // 攻击方防御贯通(DEF Break)
  pmPen        = 31200,     // 攻击方物魔防御贯通(PM.DEF Break)
  cDef         = 834953,    // 防御力定数
  cPmDef       = 1382434,   // 物理/魔法防御定数
  cPen         = 1725,      // 防御贯通定数
  cPmPen       = 16660,     // 物魔防御贯通定数
  dmgBonus     = 0.3,
  defDebuff    = 0,
  critMult     = 1.5,
  factionBonus = 1.0,
}) {
  const rawDmg = baseAtk * skillCoeff

  // 减防Debuff作用于目标的最终面板防御值
  const actualDef   = def   * (1 - Math.max(0, Math.min(1, defDebuff)))
  const actualPmDef = pmDef * (1 - Math.max(0, Math.min(1, defDebuff)))

  // 计算两条路的伤害通过率（Damage Rate）
  const drDef = calcDamageRate(actualDef,   pen,   cDef,   cPen)
  const drPm  = calcDamageRate(actualPmDef, pmPen, cPmDef, cPmPen)

  // 综合防御通过率
  const defMitMultiplier = drDef * drPm

  // 计算最终伤害
  const dmgMultiplier = (1 + dmgBonus) * critMult * factionBonus * defMitMultiplier
  const finalDmg = rawDmg * dmgMultiplier

  return {
    rawDmg: Math.round(rawDmg),
    finalDmg: Math.round(finalDmg),
    
    // 穿透/伤害通过率
    drDef, 
    drPm,
    defDmgPct:  +(drDef * 100).toFixed(2),
    pmDmgPct:   +(drPm * 100).toFixed(2),
    dmgRatePct: +(defMitMultiplier * 100).toFixed(2),

    // 减伤率
    defMitPct:   +((1 - drDef) * 100).toFixed(2),
    pmMitPct:    +((1 - drPm) * 100).toFixed(2),
    totalMitPct: +((1 - defMitMultiplier) * 100).toFixed(2),

    // 等效防御
    effectiveDef:   Math.round(actualDef * cPen / (pen + cPen)),
    effectivePmDef: Math.round(actualPmDef * cPmPen / (pmPen + cPmPen)),
  }
}

/** 为图表扫描生成数据（固定单变量） */
export function buildSweepData({ sweepKey, min, max, steps, baseParams }) {
  const xData = []
  const yData = []
  const stepSize = (max - min) / Math.max(1, steps - 1)
  
  for (let i = 0; i < steps; i++) {
    const val = min + stepSize * i
    const params = { ...baseParams }
    
    if (sweepKey === 'atkLevel') {
      const coeff = getCoeffByLevel(Math.round(val))
      params.cPen = coeff.cPen
      params.cPmPen = coeff.cPmPen
    } else if (sweepKey === 'defLevel') {
      const coeff = getCoeffByLevel(Math.round(val))
      params.cDef = coeff.cDef
      params.cPmDef = params.damageType === 'mag' ? coeff.cMdef : coeff.cPdef
    } else {
      params[sweepKey] = val
    }

    const r = calcDamage(params)
    xData.push(Math.round(val))
    yData.push(r.dmgRatePct)
  }
  return { xData, yData }
}

/** 为热力图生成二维数据 */
export function buildHeatmapData({ defMin, defMax, defSteps, penMin, penMax, penSteps, cDef, cPen }) {
  const xLabels = []
  const yLabels = []
  const data = []

  const defStepSize = (defMax - defMin) / Math.max(1, defSteps - 1)
  const penStepSize = (penMax - penMin) / Math.max(1, penSteps - 1)

  for (let i = 0; i < defSteps; i++) xLabels.push(Math.round(defMin + defStepSize * i))
  for (let j = 0; j < penSteps; j++) yLabels.push(Math.round(penMin + penStepSize * j))

  for (let i = 0; i < defSteps; i++) {
    for (let j = 0; j < penSteps; j++) {
      const def = xLabels[i]
      const pen = yLabels[j]
      const dr = calcDamageRate(def, pen, cDef, cPen)
      data.push([i, j, +(dr * 100).toFixed(1)])
    }
  }
  return { data, xLabels, yLabels }
}

/** 生成交叉对比表 */
export function buildCrossTable(xVals, yVals, xKey, yKey, baseParams) {
  const rows = []
  for (const y of yVals) {
    const row = { yVal: y, cols: [] }
    for (const x of xVals) {
      const params = { ...baseParams }
      
      const applyKey = (k, v) => {
        if (k === 'atkLevel') {
          const coeff = getCoeffByLevel(Math.round(v))
          params.cPen = coeff.cPen
          params.cPmPen = coeff.cPmPen
        } else if (k === 'defLevel') {
          const coeff = getCoeffByLevel(Math.round(v))
          params.cDef = coeff.cDef
          params.cPmDef = params.damageType === 'mag' ? coeff.cMdef : coeff.cPdef
        } else {
          params[k] = v
        }
      }
      
      applyKey(xKey, x)
      applyKey(yKey, y)

      row.cols.push(calcDamage(params))
    }
    rows.push(row)
  }
  return rows
}
