import { computed } from 'vue'

import { getCoeffByLevel } from '../constants/levelTable.js'

export function useDamageParams(store) {
  const currentAtkCoeff = computed(() => getCoeffByLevel(store.atkLevel))
  const currentDefCoeff = computed(() => getCoeffByLevel(store.defLevel))

  const expectedCPmDef = computed(() => {
    const coeff = currentDefCoeff.value
    if (!coeff) return undefined
    return store.damageType === 'mag' ? coeff.cMdef : coeff.cPdef
  })

  const isAtkCustom = computed(() => {
    const coeff = currentAtkCoeff.value
    return !coeff || store.cPen !== coeff.cPen || store.cPmPen !== coeff.cPmPen
  })

  const isDefCustom = computed(() => {
    const coeff = currentDefCoeff.value
    return !coeff || store.cDef !== coeff.cDef || store.cPmDef !== expectedCPmDef.value
  })

  function onAtkLevelChange() {
    const coeff = currentAtkCoeff.value
    if (!coeff) return
    store.cPen = coeff.cPen
    store.cPmPen = coeff.cPmPen
  }

  function onDefLevelChange() {
    const coeff = currentDefCoeff.value
    if (!coeff) return
    store.cDef = coeff.cDef
    store.cPmDef = store.damageType === 'mag' ? coeff.cMdef : coeff.cPdef
  }

  function setDamageType(type) {
    const wasCustom = isDefCustom.value
    store.damageType = type
    const coeff = currentDefCoeff.value
    if (coeff && !wasCustom) {
      store.cPmDef = type === 'mag' ? coeff.cMdef : coeff.cPdef
    }
  }

  return {
    isAtkCustom,
    isDefCustom,
    onAtkLevelChange,
    onDefLevelChange,
    setDamageType,
  }
}
