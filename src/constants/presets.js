// src/constants/presets.js
import { t } from '../i18n/index.js'

export const getScenarioPresets = () => [
  {
    id: 't240_boss',
    label: t('scenarioPveEarly'),
    desc: t('scenarioDescPveEarly'),
    params: {
      atkLevel: 240, defLevel: 240,
      baseAtk: 13_000_000, skillCoeff: 5.25,
      def: 1_699_102, pmDef: 3_150_893,
      pen: 11950, pmPen: 47700,
      cDef: 147654, cPmDef: 256027, cPen: 873, cPmPen: 10718,
      atkBonus: 0, dmgBonus: 0.3, defBonus: 0, pmDefBonus: 0, critMult: 1.5, eleAdvantage: false, damageType: 'phys',
    }
  },
  {
    id: 't500_boss',
    label: t('scenarioPveMid'),
    desc: t('scenarioDescPveMid'),
    params: {
      atkLevel: 500, defLevel: 500,
      baseAtk: 50_000_000, skillCoeff: 5.25,
      def: 5_000_000, pmDef: 10_000_000,
      pen: 18950, pmPen: 55000,
      cDef: 834953, cPmDef: 1382434, cPen: 1725, cPmPen: 16660,
      atkBonus: 0, dmgBonus: 0.8, defBonus: -0.2, pmDefBonus: -0.2, critMult: 2.0, eleAdvantage: true, damageType: 'phys',
    }
  }
]

export const getCompareBuildsDefault = () => [
  { id: 1, name: t('buildNamePrefix') + '1', pen: 11950, pmPen: 31200, atkBonus: 0, dmgBonus: 0.3,  defBonus: 0, pmDefBonus: 0 },
  { id: 2, name: t('buildNamePrefix') + '2',  pen: 4950,  pmPen: 48500, atkBonus: 0, dmgBonus: 0.3,  defBonus: 0, pmDefBonus: 0 },
  { id: 3, name: t('buildNamePrefix') + '3',   pen: 11950, pmPen: 31200, atkBonus: 0, dmgBonus: 0.8,  defBonus: 0, pmDefBonus: 0 },
  { id: 4, name: t('buildNamePrefix') + '4', pen: 11950, pmPen: 31200, atkBonus: 0, dmgBonus: 0.3,  defBonus: -0.2, pmDefBonus: -0.2 },
]

export const getSweepVariables = (t_fn = t) => [
  { key: 'pen',        label: t_fn('xPen'), min: 0, max: 20000 },
  { key: 'pmPen',      label: t_fn('pmPen'), min: 0, max: 60000 },
  { key: 'def',        label: t_fn('targetDef'), min: 0, max: 20000000 },
  { key: 'pmDef',      label: t_fn('targetPhysDef') + '/' + t_fn('targetMagDef'), min: 0, max: 20000000 },
  { key: 'atkLevel',   label: t_fn('atkLevel'), min: 1, max: 999 },
  { key: 'defLevel',   label: t_fn('defLevel'), min: 1, max: 999 },
  { key: 'defBonus',   label: t_fn('defBonus'), min: -1, max: 2.5, isBonus: true },
  { key: 'pmDefBonus', label: t_fn('pmDefBonus'), min: -1, max: 2.5, isBonus: true },
]

export const getTableVariables = (t_fn = t) => [
  { key: 'baseAtk',    label: t_fn('baseAtk'),   defaultValues: '1000000, 2000000, 5000000, 10000000' },
  { key: 'skillCoeff', label: t_fn('skillCoeff'),   defaultValues: '3.0, 5.25, 8.0, 15.0' },
  { key: 'def',        label: t_fn('targetDef'), defaultValues: '1000000, 3000000, 5000000, 10000000, 20000000' },
  { key: 'pmDef',      label: t_fn('targetPhysDef') + '/' + t_fn('targetMagDef'), defaultValues: '1000000, 5000000, 10000000, 20000000' },
  { key: 'pen',        label: t_fn('pen'), defaultValues: '0, 4950, 11950, 18950, 25000' },
  { key: 'pmPen',      label: t_fn('pmPen'), defaultValues: '0, 15000, 31200, 55000, 80000' },
  { key: 'dmgBonus',   label: t_fn('dmgBonus'),   defaultValues: '0, 0.3, 0.5, 0.8, 1.0, 1.5' },
  { key: 'defBonus',   label: t_fn('defBonus'), defaultValues: '-0.8, -0.6, -0.4, -0.2, 0' },
  { key: 'pmDefBonus', label: t_fn('pmDefBonus'), defaultValues: '-0.8, -0.6, -0.4, -0.2, 0' },
  { key: 'critMult',   label: t_fn('critMult'),   defaultValues: '1.0, 1.5, 2.0, 2.5, 3.0' },
  { key: 'atkLevel',   label: t_fn('atkLevel'), defaultValues: '240, 300, 400, 500, 600' },
  { key: 'defLevel',   label: t_fn('defLevel'), defaultValues: '240, 300, 400, 500, 600' },
]
