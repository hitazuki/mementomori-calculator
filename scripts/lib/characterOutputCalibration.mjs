import fs from 'node:fs'
import { stageReference } from './characterRatingV6.mjs'
import { panelBaseline } from './characterPanelReport.mjs'
import { CHARACTER_RATING_PANEL, PANEL_BASE_DAMAGE } from '../../src/utils/characterRatingPanel.js'
export const outputCalibration=JSON.parse(fs.readFileSync(new URL('../../doc/character-ratings/v6/output-calibration.json',import.meta.url),'utf8'))
export function outputBand(value, axis) {
  if(!Number.isFinite(value)||value<0||!['burst','late'].includes(axis))throw Error('Invalid output band input')
  return outputCalibration.outputAnchors.filter(v=>value+1e-9>=v).length
}
const merge=(a,b)=>({...a,...b,effects:{...a.effects,...b.effects},components:{...a.components,...b.components},slots:Object.fromEntries(['S1','S2','N'].map(k=>[k,{...a.slots?.[k],...b.slots?.[k]}]))})
// Explicit reviews of conditional states, not keyword-based inference.
const overrides={
  9:{slots:{S1:{guaranteedCrit:false,critRate:.25},S2:{guaranteedCrit:false,critRate:.25}}},
  6:{effects:{attack:.4}},25:{effects:{attack:1.5}},47:{effects:{attack:.35}},
  50:{components:{S2:'4.5,8,0'},slots:{S1:{attack:0},S2:{attack:.108}},scenarios:{1:{slots:{S2:{attack:.036}}}}},
  52:{slots:{S1:{damage:.6}}},58:{components:{S2:'3.55,7,0'},slots:{S2:{guaranteedCrit:false}}},
  69:{components:{S2:'7.75,1,5'}},95:{effects:{attack:.225}},
  102:{effects:{attack:.5},scenarios:{5:{effects:{attack:.5},components:{S2:'6.7,5,0'}}}},
  112:{components:{S2:'19,1,3'}},125:{components:{S2:'12.6,1,3'}},
  128:{slots:{S1:{damage:.1},S2:{damage:.1}}},130:{fourEventReplay:false,components:{S2:'15.2,5,0'}},
  155:{slots:{S1:{attack:0,damage:.14},S2:{attack:.59,damage:.2}},components:{S2:'4.5,10,0'}},
}
const lateOverrides={
  ...overrides,
  50:{effects:{attack:.2},slots:{S1:{attack:.2},S2:{attack:.2}},components:{S2:'4.5,8,0'}},
  102:{scenarios:{5:{effects:{attack:.55},components:{S2:'6.7,5,0'}}}},
  130:{components:{S2:'15.2,5,0'}},
  155:{slots:{S1:{attack:.59,damage:.14},S2:{attack:.59,damage:.2}},components:{S2:'4.5,10,0'}},
}
const midpoint=new Set([9,19,30,35,45,56,60,61,63,77,79,82,85,97,99,105,106,123,129,131,134,140,141,149])
const metric=s=>({burst:s.openingDamage[1],late:s.snapshots[1].perAction})
export function outputCalibrationReference(c,stages,hash,output) {
  const review=outputCalibration.records[c.id]
  if(!review||review.sourceHash!==hash)throw Error('Output calibration requires source review: '+c.id)
  const base=review.events4?stages.quick:stages.opening
  if(!base)throw Error('Missing four-event sample '+c.id)
  let burst=metric(base).burst,late=metric(stages.mature).late
  const samples={burst:[{config:base.config,weight:1}],late:[{config:stages.mature.config,weight:1}]}
  if(midpoint.has(c.id)) {
    const low=review.events4?base:stages.opening
    const high=review.events4?base:stages.mature
    const lowConfig=merge(low.config,stages.lower.config)
    // Round-based progression stays at the actual first two rounds in burst;
    // only special conditions are averaged, never unlock a late skill early.
    const burstHigh=review.rounds?base:high
    burst=(metric(stageReference(c,lowConfig)).burst+metric(burstHigh).burst)/2
    late=(metric(stageReference(c,merge(stages.mature.config,stages.lower.config))).late+metric(stages.mature).late)/2
    samples.burst=[{config:lowConfig,weight:.5},{config:burstHigh.config,weight:.5}]
    samples.late=[{config:merge(stages.mature.config,stages.lower.config),weight:.5},{config:stages.mature.config,weight:.5}]
  }
  for(const [key,overridesForKey]of [['burst',overrides],['late',lateOverrides]])if(overridesForKey[c.id]) {
    const config=merge(key==='burst'?base.config:stages.mature.config,overridesForKey[c.id])
    const sample=stageReference(c,config)
    if(key==='burst')burst=metric(sample).burst;else late=metric(sample).late
    samples[key]=[{config,weight:1}]
  }
  // Known probability is applied once, to the whole correlated state. No extra
  // 50% vulnerability discount; do not multiply independently averaged terms.
  if(c.id===155)for(const key of ['burst','late']) {
    const config=merge(key==='burst'?base.config:stages.mature.config,{
      effects:{attack:.5},slots:{S1:{attack:key==='burst'?0:.5,damage:0},S2:{attack:.5,damage:0}},components:{S2:'3.6,10,0'},
    })
    samples[key]=[
      {config,weight:.3},
      {config:merge(config,{slots:{S1:{damage:.4},S2:{damage:.4}},components:{S2:'5.4,10,0'}}),weight:.7},
    ]
  }
  for(const key of ['burst','late'])for(const sample of samples[key])sample.config={...sample.config,panelVersion:CHARACTER_RATING_PANEL.version}
  const evaluate=(key,index)=>samples[key].reduce((sum,s)=>{
    const ref=stageReference(c,s.config)
    return sum+ref.openingDamage[index]*s.weight
  },0)
  const burstTotals=[0,1].map(i=>evaluate('burst',i))
  const lateActions=[0,1].map(i=>evaluate('late',i)/2)
  const cycleActions=[0,1].map(i=>samples.late.reduce((sum,s)=>sum+stageReference(c,s.config).snapshots[i].perAction*s.weight,0))
  // Temporary form and post-expiry two-action windows are folded in damage space, rather
  // than subtracting arbitrary score tiers or treating the form as permanent.
  const afterExpiry=c.id===61&&output.phase?stageReference(c,{disabled:['S2'],panelVersion:CHARACTER_RATING_PANEL.version}):null
  const expiryValues=afterExpiry?[0,1].map(i=>[evaluate('late',i)/2,afterExpiry.openingDamage[i]/2]):null
  if(expiryValues)expiryValues.forEach((values,i)=>lateActions[i]=(values[0]+values[1])/2)
  const normalized={burst:Math.max(burstTotals[0]/2,burstTotals[1]/6),late:Math.max(lateActions[0],lateActions[1]/3)}
  return {version:outputCalibration.version,reviewedAt:outputCalibration.reviewedAt,sourceHash:hash,targets:[1,5],groupBenchmark:3,
    panel:CHARACTER_RATING_PANEL,baseDamage:PANEL_BASE_DAMAGE,
    events4:review.events4,rounds:review.rounds,special:review.special,note:review.note,samples,expiryValues,
    ...(review.conditionReason?{conditionReason:review.conditionReason}:{}),
    burstTotals,lateActions,cycleActions,windowActions:2,normalized,
    scores:[outputBand(normalized.burst,'burst'),outputBand(normalized.late,'late')],
    previousScores:review.previousAxes.map(a=>a.score)}
}

export function outputCalibrationReport(records) {
  const changed=records.filter(r=>r.outputCalibration.previousScores.some((v,i)=>v!==r.axes[i].score)).length
  const previousScores=r=>panelBaseline.records[r.id].scores.slice(0,2)
  const scaleChanged=records.filter(r=>previousScores(r).some((v,i)=>v!==r.axes[i].score)).length
  const distribution=Array.from({length:10},(_,i)=>{
    const score=i+1
    return `|${score}|${outputCalibration.outputAnchors[i]*100}%|${records.filter(r=>r.axes[0].score===score).length}|${records.filter(r=>r.axes[1].score===score).length}|`
  }).join('\n')
  return '# 输出统一量尺与高端分档 · 2026-10-30\n\n基线：ai-capability-v6，远端main提交9ef07af2189878be029c74e5d82f9dcd53f0d8e9的doc/character-ratings/v6/review.json；不是历史v5。138名原分已逐项核对一致。另列本次公共面板重算前的本地分数，基线保存在panel-baseline.json。\n\n138名、276项输出决定；'+changed+'名角色相较原始评审分数变化，'+scaleChanged+'名角色因本次公共面板重算而改变输出分。保留整数能力分档、单敌与五敌独立量尺择优，五敌阈值为单敌3倍；不是线性伤害比例。爆发与持续均使用同一两行动窗口的平均每行动伤害，仅早期/成熟状态不同，共用固定阈值[0.1,2,4,7,11,17,30,50,85,140]（100%基准普攻为1）。1–6分下界不变，7–10分下界改为3000%、5000%、8500%、14000%；不随角色池自动归一化、不要求两轴分别出现10分。完整冷却循环另作参考，不混入任一轴。没有成长、衰减、资源变化且条件相同的角色应同分；不强制人为抬高持续分。附加规则：自伤/主动恢复爆发4事件、持续满层；回合成长按实际回合；特殊条件在伤害中折中，不是实战概率；艾谢S2依用户指定按每段1520%生命条件上限计算。当前使用panel-reference-2026-10-30实际面板与独立技能加攻区；亚历珊卓已知70%易伤只加权一次、关联S2强化联合结算。防御容量一并重算，三项辅助维度保持不变。\n\n|分数|等效倍率下界（单敌或五敌总计÷3）|爆发人数|后期人数|\n|---|---|---|---|\n'+distribution+'\n\n|角色|基线9ef07af 爆发/后期|调整前 爆发/后期|当前 爆发/后期|早期两行动平均 单/五敌|成熟两行动平均 单/五敌|事件/回合/特殊条件|\n|---|---|---|---|---|---|---|\n'+records.map(r=>{const c=r.outputCalibration;return `|${r.id} ${r.name}|${c.previousScores.join('/')}|${previousScores(r).join('/')}|${c.scores.join('/')}|${c.burstTotals.map(v=>Math.round(v*50)+'%').join(' / ')}|${c.lateActions.map(v=>Math.round(v*100)+'%').join(' / ')}|${[c.events4?'4事件/满层':'',c.rounds?'实际回合':'',c.special?(c.conditionReason??'条件折中'):''].filter(Boolean).join('；')||'固定技能'}|`}).join('\n')+'\n'
}
