export const DAILY_RECHARGE_BONUS_TIERS = [
  { paid: 100, bonus: 120 },
  { paid: 500, bonus: 480 },
  { paid: 1000, bonus: 600 },
  { paid: 2000, bonus: 1200 },
  { paid: 6000, bonus: 4800 },
  { paid: 12000, bonus: 7200 },
  { paid: 18000, bonus: 4200 },
  { paid: 24000, bonus: 5400 },
  { paid: 36000, bonus: 10800 },
]

export function cumulativeFreeDiamonds(paidDiamonds) {
  const paid = Math.max(0, Number(paidDiamonds) || 0)
  return DAILY_RECHARGE_BONUS_TIERS
    .filter(tier => paid >= tier.paid)
    .reduce((total, tier) => total + tier.bonus, 0)
}

export function marginalFreeDiamonds(beforePaidDiamonds, addedPaidDiamonds) {
  const before = Math.max(0, Number(beforePaidDiamonds) || 0)
  const added = Math.max(0, Number(addedPaidDiamonds) || 0)
  return cumulativeFreeDiamonds(before + added) - cumulativeFreeDiamonds(before)
}

export function unlockedRechargeTiers(beforePaidDiamonds, addedPaidDiamonds) {
  const before = Math.max(0, Number(beforePaidDiamonds) || 0)
  const after = before + Math.max(0, Number(addedPaidDiamonds) || 0)
  return DAILY_RECHARGE_BONUS_TIERS.filter(tier => before < tier.paid && after >= tier.paid)
}
