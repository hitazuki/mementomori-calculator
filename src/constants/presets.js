// src/constants/presets.js
export const SCENARIO_PRESETS = [
  {
    id: 't240_boss',
    label: 'Lv240 测服 Boss',
    desc: '常见中期公会战/幻影测试。目标防御低，穿透收益容易溢出。',
    params: {
      baseAtk: 13_000_000, skillCoeff: 5.25,
      def: 1_699_102, pmDef: 3_150_893,
      pen: 11950, pmPen: 47700,
      cDef: 147654, cPmDef: 256027, cPen: 873, cPmPen: 10718,
      dmgBonus: 0.3, defDebuff: 0, critMult: 1.5, factionBonus: 1.0, damageType: 'phys',
    }
  },
  {
    id: 't500_boss',
    label: 'Lv500 后期公会战',
    desc: '大后期目标，千万级防御，双穿极度饥渴。',
    params: {
      baseAtk: 50_000_000, skillCoeff: 5.25,
      def: 5_000_000, pmDef: 10_000_000,
      pen: 18950, pmPen: 55000,
      cDef: 834953, cPmDef: 1382434, cPen: 1725, cPmPen: 16660,
      dmgBonus: 0.8, defDebuff: 0.2, critMult: 2.0, factionBonus: 1.15, damageType: 'phys',
    }
  }
]

export const COMPARE_BUILDS_DEFAULT = [
  { id: 1, name: '平衡穿透(推荐)', pen: 11950, pmPen: 31200, dmgBonus: 0.3,  defDebuff: 0 },
  { id: 2, name: '极限物魔穿透',  pen: 4950,  pmPen: 48500, dmgBonus: 0.3,  defDebuff: 0 },
  { id: 3, name: '高增伤0减防',   pen: 11950, pmPen: 31200, dmgBonus: 0.8,  defDebuff: 0 },
  { id: 4, name: '带20%降防辅助', pen: 11950, pmPen: 31200, dmgBonus: 0.3,  defDebuff: 0.2 },
]

export const SWEEP_VARIABLES = [
  { key: 'pen',        label: '防御贯通(DEF Break)', min: 0, max: 25000 },
  { key: 'pmPen',      label: '物魔防御贯通(PM.DEF Break)', min: 0, max: 80000 },
  { key: 'def',        label: '目标防御(DEF)', min: 1000000, max: 50000000 },
  { key: 'pmDef',      label: '目标物理/魔法防御(P.DEF/M.DEF)', min: 1000000, max: 50000000 },
  { key: 'atkLevel',   label: '攻击方等级(Atk Level)', min: 1, max: 900 },
  { key: 'defLevel',   label: '防守方等级(Def Level)', min: 1, max: 900 },
]

export const TABLE_VARIABLES = [
  { key: 'baseAtk',    label: '面板攻击',   defaultValues: '1000000, 2000000, 5000000, 10000000' },
  { key: 'skillCoeff', label: '技能倍率',   defaultValues: '3.0, 5.25, 8.0, 15.0' },
  { key: 'def',        label: '目标防御(DEF)', defaultValues: '1000000, 3000000, 5000000, 10000000, 20000000' },
  { key: 'pmDef',      label: '目标物魔防御(P.DEF/M.DEF)', defaultValues: '1000000, 5000000, 10000000, 20000000' },
  { key: 'pen',        label: '防御贯通(DEF Break)', defaultValues: '0, 4950, 11950, 18950, 25000' },
  { key: 'pmPen',      label: '物魔防御贯通(PM.DEF Break)', defaultValues: '0, 15000, 31200, 55000, 80000' },
  { key: 'dmgBonus',   label: '增伤加成',   defaultValues: '0, 0.3, 0.5, 0.8, 1.0, 1.5' },
  { key: 'defDebuff',  label: '减防Debuff', defaultValues: '0, 0.2, 0.4, 0.6, 0.8' },
  { key: 'critMult',   label: '爆击倍率',   defaultValues: '1.5, 2.0, 2.5, 3.0' },
  { key: 'atkLevel',   label: '攻击方等级(Atk Level)', defaultValues: '240, 300, 400, 500, 600' },
  { key: 'defLevel',   label: '防守方等级(Def Level)', defaultValues: '240, 300, 400, 500, 600' },
]
