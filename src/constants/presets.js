// src/constants/presets.js
import { t } from '../i18n/index.js'

export const getScenarioPresets = () => [
  {
    id: 't240_boss',
    label: t('scenarioPveEarly'),
    desc: t('scenarioDescPveEarly'),
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
    label: t('scenarioPveMid'),
    desc: t('scenarioDescPveMid'),
    params: {
      baseAtk: 50_000_000, skillCoeff: 5.25,
      def: 5_000_000, pmDef: 10_000_000,
      pen: 18950, pmPen: 55000,
      cDef: 834953, cPmDef: 1382434, cPen: 1725, cPmPen: 16660,
      dmgBonus: 0.8, defDebuff: 0.2, critMult: 2.0, factionBonus: 1.15, damageType: 'phys',
    }
  }
]

export const getCompareBuildsDefault = () => [
  { id: 1, name: t('buildNamePrefix') + '1', pen: 11950, pmPen: 31200, dmgBonus: 0.3,  defDebuff: 0 },
  { id: 2, name: t('buildNamePrefix') + '2',  pen: 4950,  pmPen: 48500, dmgBonus: 0.3,  defDebuff: 0 },
  { id: 3, name: t('buildNamePrefix') + '3',   pen: 11950, pmPen: 31200, dmgBonus: 0.8,  defDebuff: 0 },
  { id: 4, name: t('buildNamePrefix') + '4', pen: 11950, pmPen: 31200, dmgBonus: 0.3,  defDebuff: 0.2 },
]

export const getSweepVariables = () => [
  { key: 'pen',        label: t('xPen'), min: 0, max: 20000 },
  { key: 'pmPen',      label: t('pmPen'), min: 0, max: 60000 },
  { key: 'def',        label: t('targetDef'), min: 0, max: 20000000 },
  { key: 'pmDef',      label: t('targetPhysDef') + '/' + t('targetMagDef'), min: 0, max: 20000000 },
  { key: 'atkLevel',   label: t('atkLevel', {lvl:''}), min: 1, max: 999 },
  { key: 'defLevel',   label: t('defLevel', {lvl:''}), min: 1, max: 999 },
]

export const getTableVariables = () => [
  { key: 'baseAtk',    label: t('baseAtk'),   defaultValues: '1000000, 2000000, 5000000, 10000000' },
  { key: 'skillCoeff', label: t('skillCoeff'),   defaultValues: '3.0, 5.25, 8.0, 15.0' },
  { key: 'def',        label: t('targetDef'), defaultValues: '1000000, 3000000, 5000000, 10000000, 20000000' },
  { key: 'pmDef',      label: t('targetPhysDef') + '/' + t('targetMagDef'), defaultValues: '1000000, 5000000, 10000000, 20000000' },
  { key: 'pen',        label: t('pen'), defaultValues: '0, 4950, 11950, 18950, 25000' },
  { key: 'pmPen',      label: t('pmPen'), defaultValues: '0, 15000, 31200, 55000, 80000' },
  { key: 'dmgBonus',   label: t('dmgBonus'),   defaultValues: '0, 0.3, 0.5, 0.8, 1.0, 1.5' },
  { key: 'defDebuff',  label: t('defDebuff'), defaultValues: '0, 0.2, 0.4, 0.6, 0.8' },
  { key: 'critMult',   label: t('critMult'),   defaultValues: '1.5, 2.0, 2.5, 3.0' },
  { key: 'atkLevel',   label: t('atkLevel', {lvl:''}), defaultValues: '240, 300, 400, 500, 600' },
  { key: 'defLevel',   label: t('defLevel', {lvl:''}), defaultValues: '240, 300, 400, 500, 600' },
]
