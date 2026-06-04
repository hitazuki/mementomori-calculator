import { defineStore } from 'pinia'

export const useCalcStore = defineStore('calculator', {
  state: () => ({
    baseAtk: 1000000,
    skillCoeff: 5.25,
    def: 5000000,
    pmDef: 5000000,
    pen: 11950,
    pmPen: 31200,
    cDef: 834953,
    cPen: 1725,
    cPmDef: 1382434,
    cPmPen: 16660,
    atkBonus: 0,
    dmgBonus: 0.3,
    defBonus: 0,
    pmDefBonus: 0,
    critMult: 1.5,
    eleAdvantage: false,
    damageType: 'phys', // 'phys' for P.DEF, 'mag' for M.DEF
    atkLevel: 500,
    defLevel: 500,
  }),
  actions: {
    updateState(payload) {
      Object.assign(this.$state, payload)
    }
  }
})
