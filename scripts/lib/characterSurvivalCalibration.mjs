import fs from 'node:fs'

export const survivalCalibration = JSON.parse(fs.readFileSync(new URL('../../doc/character-ratings/v6/survival-calibration.json',import.meta.url),'utf8'))
export const capacityBand = capacity => survivalCalibration.capacityAnchors.filter(anchor=>capacity+1e-9>=anchor).length
// Final decisions are authored per character. Capacity bands are references,
// never keyword-derived scores or a replacement for lifecycle review.
export const calibratedDefenseScores = Object.fromEntries(Object.entries(survivalCalibration.records).map(([id,r])=>[id,[r.burstBase,r.sustain]]))

export function survivalCalibrationReference(id,states,sourceHash) {
  const r=survivalCalibration.records[id]
  if(!r||r.sourceHash!==sourceHash) throw new Error('Survival calibration requires source review: '+id)
  const selected=(index,shield)=>{
    const state=states[index]
    if(!state) throw new Error('Missing reviewed survival state: '+id+'/'+index)
    const neutral=state.comparisons.find(c=>c.scenario==='neutral')
    const field=shield?'withShield':'withoutShield'
    const physical=neutral.physical[field],magic=neutral.magic[field],capacity=Math.min(physical,magic)
    return {state:index,label:state.label,withShield:shield,physical,magic,capacity,capacityBand:capacityBand(capacity)}
  }
  return {version:survivalCalibration.version,reviewedAt:survivalCalibration.reviewedAt,...r,
    burstReference:selected(r.burstState,true),sustainReference:selected(r.sustainState,false)}
}

export function survivalCalibrationReport(records) {
  const histogram=axis=>Array.from({length:11},(_,i)=>records.filter(r=>r.axes.find(a=>a.key===axis).score===i).length).join(' / ')
  const changed=records.filter(r=>r.axes[2].score!==r.survival.calibration.previousScores[0]||r.axes[3].score!==r.survival.calibration.previousScores[1]).length
  const decisions=records.reduce((sum,r)=>sum+r.axes.slice(2,4).filter((a,i)=>a.score!==r.survival.calibration.previousScores[i]).length,0)
  const capacity=ref=>`${Math.round(ref.physical*100)}% / ${Math.round(ref.magic*100)}%`
  return `# 全池生存评分重校准 · 2026-10-29

138名、276项防御决定已复核；${changed}名角色、${decisions}项分数改变。其他五维、全部输出参考和有限容量状态数值保持不变。版本：${survivalCalibration.version}。旧分是本次开始前的v6快照，不混用历史v5维度。

容量基础档下界（1至10）：105% / 115% / 130% / 150% / 180% / 220% / 300% / 400% / 600% / 800%。最终分是逐角色审核值，不由容量自动赋分。完整盾、次数保命与周期回复分别判断；常驻800%无需额外回血即可支撑10分。

爆防0至10分人数：${histogram('toughness')}。
持续0至10分人数：${histogram('survival')}。

“爆防容量”列为审核选定早期状态的完整盾容量；部分受击后/行动后状态只作条件候选，首次可用性由说明和initiative记录限制，不声称所有容量开局已生效。“持续底座”列为选定长期状态去盾后的容量；周期盾、回复、净化、血线条件与失效另见逐角色修正。两列均按物理 / 魔法给出，不能把更强一路当全来源。非容量机制保留基准100%而单独评审。

|ID|角色|旧爆防/持续|新爆防/持续|爆防容量 物/魔|持续底座 物/魔|逐角色修正|
|---|---|---|---|---|---|---|
`+records.map(r=>{const c=r.survival.calibration;return `|${r.id}|${r.name}|${c.previousScores.join('/')}|${r.axes.slice(2,4).map(a=>a.score).join('/')}|${capacity(c.burstReference)}|${capacity(c.sustainReference)}|${c.note}${r.survival.initiative.note}|`}).join('\n')+'\n'
}
