export function paidDiamondsForPriceValue(price) {
  return Math.round(price / 2)
}

export function getPackOriginalValue(pack) {
  if (Number.isFinite(pack.originalValue)) return pack.originalValue
  if (Number.isFinite(pack.value) && Number.isFinite(pack.rechargeValue)) return pack.value - pack.rechargeValue
  return Number(pack.value) || 0
}

export function getPackPaidDiamonds(pack) {
  if (Number.isFinite(pack.paidDiamonds)) return pack.paidDiamonds
  return paidDiamondsForPriceValue(pack.price)
}
