import test from 'node:test'
import assert from 'node:assert/strict'

import { calcDamage, calcDamageRate, buildDynamicHeatmapData, buildSweepData } from '../src/engine/damageCalc.js'

test('calcDamageRate follows the two-step effective defense formula', () => {
  const def = 5_000_000
  const pen = 11_950
  const cDef = 834_953
  const cPen = 1_725

  const effectiveDef = def * (cPen / (pen + cPen))
  const expected = cDef / (effectiveDef + cDef)

  assert.equal(calcDamageRate(def, pen, cDef, cPen), expected)
})

test('calcDamage combines attack, bonuses, crit, and both defense paths', () => {
  const result = calcDamage({
    baseAtk: 1_000_000,
    atkBonus: 0.2,
    skillCoeff: 5,
    def: 3_000_000,
    pmDef: 4_000_000,
    pen: 10_000,
    pmPen: 20_000,
    cDef: 800_000,
    cPmDef: 1_200_000,
    cPen: 2_000,
    cPmPen: 15_000,
    dmgBonus: 0.3,
    critMult: 1.5,
    eleAdvantage: true,
  })

  const rawDmg = 1_000_000 * 1.2 * 5
  const drDef = calcDamageRate(3_000_000, 10_000, 800_000, 2_000)
  const drPm = calcDamageRate(4_000_000, 20_000, 1_200_000, 15_000)
  const expectedFinal = rawDmg * (1 + 0.3 + 0.25) * 1.5 * drDef * drPm

  assert.equal(result.rawDmg, Math.round(rawDmg))
  assert.equal(result.finalDmg, Math.round(expectedFinal))
  assert.equal(result.dmgRatePct, +((drDef * drPm) * 100).toFixed(2))
  assert.equal(result.ehpMultiplier, +(1 / (drDef * drPm)).toFixed(4))
  assert.equal(result.defEhpMultiplier, +(1 / drDef).toFixed(4))
  assert.equal(result.pmEhpMultiplier, +(1 / drPm).toFixed(4))
})

test('buildSweepData refreshes level-derived constants during scans', () => {
  const { yData } = buildSweepData({
    sweepKey: 'atkLevel',
    min: 499,
    max: 500,
    steps: 2,
    baseParams: {
      baseAtk: 1_000_000,
      skillCoeff: 5.25,
      def: 5_000_000,
      pmDef: 5_000_000,
      pen: 11_950,
      pmPen: 31_200,
      cPen: 999_999,
      cPmPen: 999_999,
      cDef: 834_953,
      cPmDef: 1_382_434,
      atkLevel: 500,
      defLevel: 500,
    },
  })

  assert.notEqual(yData[0].finalDmg, yData[1].finalDmg)
})

test('buildDynamicHeatmapData keeps chart values numeric while retaining full results', () => {
  const { data, zMin, zMax } = buildDynamicHeatmapData({
    xKey: 'def',
    yKey: 'pen',
    zKey: 'ehpMultiplier',
    xMin: 1_000_000,
    xMax: 2_000_000,
    xSteps: 2,
    yMin: 0,
    yMax: 1_000,
    ySteps: 2,
    baseParams: {
      baseAtk: 1_000_000,
      skillCoeff: 5.25,
      def: 5_000_000,
      pmDef: 5_000_000,
      pen: 11_950,
      pmPen: 31_200,
      atkLevel: 500,
      defLevel: 500,
    },
  })

  assert.equal(data.length, 4)
  assert.equal(Array.isArray(data[0].value), true)
  assert.equal(typeof data[0].value[2], 'number')
  assert.equal(typeof data[0].result.ehpMultiplier, 'number')
  assert.equal(zMin, Math.min(...data.map(point => point.value[2])))
  assert.equal(zMax, Math.max(...data.map(point => point.value[2])))
})
