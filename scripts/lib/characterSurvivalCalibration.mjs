import fs from 'node:fs'
import { panelBaseline } from './characterPanelReport.mjs'

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
    burstReference:selected(r.burstState,true),sustainReference:selected(r.sustainState,false),
    ...(r.sustainWindow?{afterExpiryReference:selected(r.sustainWindow.afterState,false)}:{})}
}

export function survivalCalibrationReport(records) {
  const histogram=axis=>Array.from({length:11},(_,i)=>records.filter(r=>r.axes.find(a=>a.key===axis).score===i).length).join(' / ')
  const changed=records.filter(r=>r.axes[2].score!==panelBaseline.records[r.id].scores.slice(2,4)[0]||r.axes[3].score!==panelBaseline.records[r.id].scores.slice(2,4)[1]).length
  const decisions=records.reduce((sum,r)=>sum+r.axes.slice(2,4).filter((a,i)=>a.score!==panelBaseline.records[r.id].scores.slice(2,4)[i]).length,0)
  const capacity=ref=>`${Math.round(ref.physical*100)}% / ${Math.round(ref.magic*100)}%`
  return `# 全池生存评分重校准 · 2026-10-30

138名、276项防御决定已复核；${changed}名角色、${decisions}项分数改变。使用新的公共面板重算容量，输出同步重算，三项辅助维度保持不变。版本：${survivalCalibration.version}。旧分是panel-baseline.json中的本次面板更新前本地快照，不混用历史v5维度。

容量基础档下界（1至10）：105% / 115% / 130% / 150% / 180% / 220% / 300% / 400% / 600% / 800%。最终分是逐角色审核值，不由容量自动赋分。完整盾、次数保命与周期回复分别判断；常驻800%无需额外回血即可支撑10分。

爆防0至10分人数：${histogram('toughness')}。
持续0至10分人数：${histogram('survival')}。

“爆防容量”列为审核选定早期状态的完整盾容量；部分受击后/行动后状态只作条件候选，首次可用性由说明和initiative记录限制，不声称所有容量开局已生效。“持续参照”列为选定持续状态去盾后的容量；有限窗口与到期底座须并列审核，不把长时防护仅按到期后清零，也不把有限状态写成永久防护。朝日选择前10回合去盾状态，并另存第11回合后100%的afterExpiryReference。周期盾、回复、净化、血线条件另见逐角色修正。两列均按物理 / 魔法给出，不能把更强一路当全来源。非容量机制保留基准100%而单独评审。

|ID|角色|旧爆防/持续|新爆防/持续|爆防容量 物/魔|持续参照 物/魔|逐角色修正|
|---|---|---|---|---|---|---|
`+records.map(r=>{const c=r.survival.calibration;return `|${r.id}|${r.name}|${panelBaseline.records[r.id].scores.slice(2,4).join('/')}|${r.axes.slice(2,4).map(a=>a.score).join('/')}|${capacity(c.burstReference)}|${capacity(c.sustainReference)}|${c.note}${r.survival.initiative.note}|`}).join('\n')+'\n'
}
