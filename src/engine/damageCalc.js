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
  atkBonus     = 0,
  skillCoeff   = 5.25,
  def          = 5000000,   // 目标防御力(DEF)
  pmDef        = 5000000,   // 目标物理/魔法防御力(P.DEF / M.DEF)
  pen          = 11950,     // 攻击方防御贯通(DEF Break)
  pmPen        = 31200,     // 攻击方物魔防御贯通(PM.DEF Break)
  cDef,
  cPmDef,
  cPen,
  cPmPen,
  dmgBonus     = 0.3,
  defBonus     = 0,
  pmDefBonus   = 0,
  critMult     = 1.5,
  eleAdvantage = false,
  damageType   = 'phys',
  atkLevel     = 500,
  defLevel     = 500,
}) {
  const coeffA = getCoeffByLevel(atkLevel)
  const coeffD = getCoeffByLevel(defLevel)
  
  const finalCPen   = cPen   !== undefined ? cPen   : (coeffA ? coeffA.cPen   : 1725)
  const finalCPmPen = cPmPen !== undefined ? cPmPen : (coeffA ? coeffA.cPmPen : 16660)
  const finalCDef   = cDef   !== undefined ? cDef   : (coeffD ? coeffD.cDef   : 834953)
  const finalCPmDef = cPmDef !== undefined ? cPmDef : (coeffD ? (damageType === 'mag' ? coeffD.cMdef : coeffD.cPdef) : 1382434)

  const actualAtk = baseAtk * (1 + atkBonus)
  const rawDmg = actualAtk * skillCoeff

  // 减防/加防作用于目标的最终面板防御值
  const actualDef   = Math.max(0, def   * (1 + defBonus))
  const actualPmDef = Math.max(0, pmDef * (1 + pmDefBonus))

  // 计算两条路的伤害通过率（Damage Rate）
  const drDef = calcDamageRate(actualDef,   pen,   finalCDef,   finalCPen)
  const drPm  = calcDamageRate(actualPmDef, pmPen, finalCPmDef, finalCPmPen)

  // 综合防御通过率
  const defMitMultiplier = drDef * drPm
  const toEhpMultiplier = rate => rate > 0 ? +(1 / rate).toFixed(4) : Infinity

  // 计算最终伤害
  const actualDmgBonus = dmgBonus + (eleAdvantage ? 0.25 : 0)
  const dmgMultiplier = (1 + actualDmgBonus) * critMult * defMitMultiplier
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

    // 等效生命倍率（防守视角）
    ehpMultiplier: toEhpMultiplier(defMitMultiplier),
    defEhpMultiplier: toEhpMultiplier(drDef),
    pmEhpMultiplier: toEhpMultiplier(drPm),

    // 等效防御
    effectiveDef:   Math.round(actualDef * finalCPen / (pen + finalCPen)),
    effectivePmDef: Math.round(actualPmDef * finalCPmPen / (pmPen + finalCPmPen)),
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
    
    delete params.cPen
    delete params.cPmPen
    delete params.cDef
    delete params.cPmDef
    
    params[sweepKey] = val

    const r = calcDamage(params)
    if (sweepKey === 'defBonus' || sweepKey === 'pmDefBonus') {
      xData.push(+(val * 100).toFixed(1))
    } else {
      xData.push(Math.round(val))
    }
    yData.push(r)
  }
  return { xData, yData }
}

/** 为动态热力图生成二维数据 */
export function buildDynamicHeatmapData({ xKey, yKey, zKey = 'dmgRatePct', xMin, xMax, xSteps, yMin, yMax, ySteps, baseParams }) {
  const xLabels = []
  const yLabels = []
  const data = []

  const xStepSize = (xMax - xMin) / Math.max(1, xSteps - 1)
  const yStepSize = (yMax - yMin) / Math.max(1, ySteps - 1)

  const formatLabel = (key, val) => {
    if (key === 'defBonus' || key === 'pmDefBonus') return +(val * 100).toFixed(1)
    return Math.round(val)
  }

  for (let i = 0; i < xSteps; i++) xLabels.push(xMin + xStepSize * i)
  for (let j = 0; j < ySteps; j++) yLabels.push(yMin + yStepSize * j)

  for (let i = 0; i < xSteps; i++) {
    for (let j = 0; j < ySteps; j++) {
      const xVal = xLabels[i]
      const yVal = yLabels[j]
      
      const params = { ...baseParams }
      
      delete params.cPen
      delete params.cPmPen
      delete params.cDef
      delete params.cPmDef
      
      params[xKey] = xVal
      params[yKey] = yVal

      const result = calcDamage(params)
      data.push({ value: [i, j, result[zKey]], result })
    }
  }

  let zMin = Infinity, zMax = -Infinity
  for (let i = 0; i < data.length; i++) {
    if (data[i].value[2] < zMin) zMin = data[i].value[2]
    if (data[i].value[2] > zMax) zMax = data[i].value[2]
  }

  const formattedXLabels = xLabels.map(v => formatLabel(xKey, v))
  const formattedYLabels = yLabels.map(v => formatLabel(yKey, v))

  return { data, xLabels: formattedXLabels, yLabels: formattedYLabels, zMin, zMax }
}

/** 生成交叉对比表 */
export function buildCrossTable(xVals, yVals, xKey, yKey, baseParams) {
  const rows = []
  for (const y of yVals) {
    const row = { yVal: y, cols: [] }
    for (const x of xVals) {
      const params = { ...baseParams }
      
      delete params.cPen
      delete params.cPmPen
      delete params.cDef
      delete params.cPmDef
      
      params[xKey] = x
      params[yKey] = y

      row.cols.push(calcDamage(params))
    }
    rows.push(row)
  }
  return rows
}
