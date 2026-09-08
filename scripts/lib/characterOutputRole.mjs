import { targetingReviews } from '../../doc/character-ratings/v6/targeting.mjs'
// Distribution labels describe skill targeting, independently of score anchors.
// targets=0 means random single-target hits, not all hits fixed on one enemy.
export function characterOutputRole(stages, characterId) {
  const skills=['S1','S2'].map(slot=>{
    const modes=new Set()
    for(const stage of Object.values(stages)) {
      if(![...stage.cycle.opening,...stage.cycle.cycle].includes(slot)) continue
      const [single,group]=stage.snapshots.map(s=>s.skills[slot])
      for(const c of group.components.filter(c=>c.coefficient>0)) {
        modes.add(c.targets>=2?'group':c.targets===0?'random':'single')
      }
      // Explicit last-enemy branches such as circus Cordie's three-hit S2.
      if(single.components.some(c=>c.coefficient>0&&c.targets<=1&&c.hits>1)&&
          group.components.some(c=>c.coefficient>0&&c.targets>=2)) modes.add('single')
    }
    const review=targetingReviews[characterId]?.[slot]
    if(review?.replace) { modes.clear(); review.replace.forEach(mode=>modes.add(mode)) }
    review?.add?.forEach(mode=>modes.add(mode))
    return {slot,modes:[...modes].sort(),...(review?{review}: {})}
  }).filter(s=>s.modes.length)
  const modes=new Set(skills.flatMap(s=>s.modes))
  const group=modes.has('group'),single=modes.has('single')||modes.has('random')
  const label=group&&single?'单群兼顾':group?'群体输出':modes.has('random')?'随机连击':single?'单体输出':'辅助为主'
  const names={group:'多目标群攻',random:'随机单体连击',single:'单体攻击'}
  const detail=skills.map(s=>`${s.slot}：${s.review?.detail??s.modes.map(m=>names[m]).join('／')}`).join('；')||'无已建模的主动攻击'
  return {label,detail,skills,rule:'skill-targeting-v1',note:'覆盖已审核的开局及后期分支；随机连击在多敌时可能分散，不等同定点集火。'}
}
