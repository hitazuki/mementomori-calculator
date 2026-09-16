// Calculate amounts only. Scores remain authored reviews of scope and timing.
export function effectiveHealing({amount, repeats=1, alive=true}, {deficit,reduction=0}) {
  if (![amount,repeats,deficit,reduction].every(Number.isFinite) || amount<0 || !Number.isInteger(repeats) || repeats<0 || deficit<0 || reduction<0 || reduction>1) throw new Error('Invalid healing input')
  const raw=alive?amount*repeats*(1-reduction):0
  return {raw,effective:Math.min(raw,deficit),overheal:Math.max(0,raw-deficit),lethalCapacityAdded:0}
}
export function cleanseAmount({targets,count,probability=1}, {affected,removablePerTarget}) {
  if (![targets,probability,affected,removablePerTarget].every(Number.isFinite) || targets<0 || probability<0 || probability>1 || affected<0 || removablePerTarget<0 || (count!==null&&(!Number.isFinite(count)||count<0))) throw new Error('Invalid cleanse input')
  return Math.min(targets,affected)*Math.min(count??removablePerTarget,removablePerTarget)*probability
}
export function teamCareReference(profile) {
  if(!Number.isInteger(profile.score)||profile.score<0||profile.score>10) throw new Error('Invalid team care score')
  return {version:'team-care-v1',...profile,
    healingAmounts:profile.heals.map(event=>({...event,rawPerRecipient:event.amount*event.repeats})),
    cleanseAmounts:profile.cleanses.map(event=>({...event,maxRemovals:event.count===null?null:event.targets*event.count,allDebuffs:event.count===null})),
    limitations:'Raw amounts only; effective healing is capped by actual missing HP. No assumed lifesteal, deficit or debuff scenarios. Trigger frequency, timing and expiry are reviewed separately. Scores are authored, not inferred from raw totals.'}
}
