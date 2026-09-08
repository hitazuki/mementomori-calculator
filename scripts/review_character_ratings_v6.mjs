import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { stageReference } from './lib/characterRatingV6.mjs'
import { RATING_AXES, RATING_VERSION, ratingSource } from '../src/utils/characterRatings.js'
import { compareSurvival } from '../src/utils/characterSurvival.js'
import { lower, opening, upper, quick, defenseScores, lateCost, reviewNotes } from '../doc/character-ratings/v6/stages.mjs'

const root=new URL('../',import.meta.url), read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'))
const catalog=read('public/data/character-catalog/zh-CN.json').characters
const previous=read('doc/character-ratings/v5/review.json').records
const folder=new URL('doc/character-ratings/v6/',root)
const band=(n,anchors)=>anchors.filter(v=>n>=v).length
const lateAnchors=[.1,1.5,3,5,8,12,18,26,38,55]
const burstAnchors=[.1,2,4,7,11,17,25,37.5,55,80]
const equivalent = n => `${Math.round(n*100)}%`
// Re-read all three official weapon upgrades on 2026-09-08, confirmed against
// moonheart's text MB and skill rarity flags. Passive equipment rows remain absent.
const reviewedSources={97:'cea803c4d259ef7b0b7aefe07bfe846bd5b94021c553efb82ee57b485726df4e'}
function capacityText(states,withShield=true) {
  const range=type=>{
    const values=states.map(s=>s.comparisons[0][type][withShield?'withShield':'withoutShield'])
    const min=Math.min(...values),max=Math.max(...values)
    return Math.abs(max-min)<1e-9?equivalent(min):`${equivalent(min)}–${equivalent(max)}`
  }
  const physical=range('physical'),magic=range('magic')
  return physical===magic?`${physical}（各条件状态）`:`物理${physical}／魔法${magic}（各条件状态）`
}
// Five-target total is compared with a separate 3x benchmark, never with one target's total.
const roleValues=snapshots=>snapshots.map((s,i)=>s.perAction/(i?3:1))
const merge=(a={},b={})=>({...a,...b,effects:{...a.effects,...b.effects},components:{...a.components,...b.components},
  slots:Object.fromEntries(['S1','S2','N'].map(k=>[k,{...a.slots?.[k],...b.slots?.[k]}])),scenarios:{...a.scenarios,...b.scenarios}})
const records=catalog.map(c=>{
  const old=previous.find(r=>r.id===c.id)
  const hash=createHash('sha256').update(JSON.stringify(ratingSource(c))).digest('hex')
  if(!old||(old.sourceHash!==hash && hash!==reviewedSources[c.id])) throw new Error('Source changed; review stage inputs first: '+c.id)
  const finite=compareSurvival(old.survival.states.map(({comparisons,...s})=>c.id===97&&s.effects.shieldAttack?{...s,effects:{...s.effects,shieldAttack:5}}:s))
  const life=c.id===97?{...old.output.lifecycle,activeWindow:'首回合忧蓝500%攻击盾6回合，仅一次；40%减伤常驻'}:c.id===93?
    {activeWindow:'P1开局一层屏障，抵消一次超过最大生命10%的伤害',replenishment:'屏障仅一次，不补发',afterExpiry:'屏障消耗后无抗伤或回血；主动自损持续消耗生命'}:old.output.lifecycle
  const note=reviewNotes[c.id]??old.output.note
  const config=lower[c.id]??{}
  const stages={lower:stageReference(c,config),opening:stageReference(c,merge(config,opening[c.id])),mature:stageReference(c,{}),upper:stageReference(c,upper[c.id]??{})}
  const readiness=quick[c.id]
  if(readiness) stages.quick=stageReference(c,readiness.mature?{}:merge(config,readiness.config))
  const floors=roleValues(stages.lower.snapshots).map(n=>band(n,lateAnchors))
  const bases=roleValues(stages.mature.snapshots).map(n=>band(n,lateAnchors))
  const penalties=bases.map((base,i)=>Math.min(Math.max(0,base-floors[i]),lateCost[c.id]??0))
  const late=Math.max(...bases.map((base,i)=>Math.max(floors[i],base-penalties[i])))
  const openingValues=stages.opening.openingDamage.map((n,i)=>n/2/(i?3:1))
  const quickValues=stages.quick?.openingDamage.map((n,i)=>n/2/(i?3:1))
  const openingBand=Math.max(...openingValues.map(n=>band(n,burstAnchors)))
  const quickBand=quickValues?Math.max(...quickValues.map(n=>band(n,burstAnchors))):0
  const burst=Math.max(openingBand,quickBand-(readiness?.penalty??0))
  const burstValues=burst>openingBand?quickValues:openingValues
  const defense=defenseScores[c.id]
  if(!defense) throw new Error('Missing independent defensive assessments '+c.id)
  const outputRole=burstValues[0]>burstValues[1]*1.15?'对单集中':burstValues[1]>burstValues[0]*1.15?'群体压血':'单群兼顾'
  const rawRanges=[0,1].map(i=>({enemies:i?5:1,minimum:Math.min(...Object.values(stages).map(s=>s.snapshots[i].perAction)),maximum:Math.max(...Object.values(stages).map(s=>s.snapshots[i].perAction))}))
  const evidence=c.skills.map(s=>s.slot).concat('W','stats')
  const values=[burst,late,...defense,...old.axes.slice(3).map(a=>a.key==='protection'&&c.id===97?7:a.score)]
  const peak=Math.max(...finite.map(s=>Math.min(s.comparisons[0].physical.withShield,s.comparisons[0].magic.withShield)))
  const reasons=[
    `等效技能倍率（前两行动合计）：单敌${equivalent(stages.opening.openingDamage[0])}、五敌总计${equivalent(stages.opening.openingDamage[1])}。${readiness?`短期强化：${equivalent(stages.quick.openingDamage[0])}/${equivalent(stages.quick.openingDamage[1])}；${readiness.reason}`:c.id===8?'S1先降抗暴，首轮96%暴率、期望近10段，成长仅补强。':old.output.growth?.detail??'无另列计数成长；条件与目标分布见技能。'}`,
    `等效技能倍率（每行动，基础→后期）：单敌${equivalent(stages.lower.snapshots[0].perAction)}→${equivalent(stages.mature.snapshots[0].perAction)}；五敌总计${equivalent(stages.lower.snapshots[1].perAction)}→${equivalent(stages.mature.snapshots[1].perAction)}。${lateCost[c.id]?note:old.output.growth?.detail??note}`,
    `${c.id===71?'等效生命：常驻200%，中毒来源/反伤400%，不能当作全来源常驻。':`等效生命：${capacityText(finite)}。`}${life.activeWindow}；盾按完整时计，不死/屏障另评。`,
    `无盾等效生命：${capacityText(finite,false)}。${life.replenishment}；${life.afterExpiry}。`,
    ...old.axes.slice(3).map(a=>a.key==='protection'&&c.id===97?'P2首回合全体100%攻击盾、忧蓝500%，持续6回合且仅一次；P1受击30%概率净化，不当作稳定群疗。':a.reason),
  ]
  const axes=RATING_AXES.map((key,i)=>{
    const base=i===0?Math.max(openingBand,quickBand):i===1?Math.max(...bases):values[i]
    return {key,score:values[i],baseBand:base,adjustments:values[i]===base?[]:[{points:values[i]-base,reason:i===0?readiness.reason:note}],reason:reasons[i],evidence,
      reviewBasis:i<2?`${reasons[i]}；单敌/五敌按独立量尺取优势定位，不将五敌总量与单敌直接比较。`:`${reasons[i]}；防护持续、消耗与回复分别评审。`}
  })
  return {...old,sourceHash:hash,conditions:c.id===97?'S1同时降低其他友军吸血；专武三档技能已补齐，源库暂无专武被动属性。':old.conditions,rubricVersion:RATING_VERSION,reviewedAt:'2026-09-08',axes,output:{...old.output,lifecycle:life,snapshots:stages.mature.snapshots,cycle:stages.mature.cycle,note,stages,readiness:readiness??null,ranges:rawRanges,role:outputRole,
    assumptions:'范围为已审核的有限条件样本，不是所有外部队伍的理论极值；开局按前两次自身行动，短计数/短回合另列条件爆发，均仅计直接伤害；后期按成熟循环，无依据的事件频率不换算回合。延迟伤害仅在完整持续期样本计入。',
    equivalentSkillUnit:'100% = 固定基准面板下无角色自增益的100%攻击普攻；含适用乘区，特殊伤害仅按最终伤害折合，不改变其原始伤害类型。',
    comparison:{groupBenchmark:3,burstAnchors,lateAnchors,lowerBands:floors,matureBands:bases,openingBand,quickBand,penalties}},
    survival:{...old.survival,shortTermProtection:life.activeWindow,states:finite,scoringScenario:'neutral',peakOrdinaryCapacity:peak,burstScore:defense[0],sustainScore:defense[1]}}
})
if(records.length!==134) throw new Error('Expected all 134 characters')
const collection=(metadata,key,rows)=>JSON.stringify(metadata,null,2).slice(0,-2)+`,\n  "${key}": [\n`+rows.map(r=>'    '+JSON.stringify(r)).join(',\n')+'\n  ]\n}\n'
fs.writeFileSync(new URL('review.json',folder),collection({rubricVersion:RATING_VERSION,burstAnchors,lateAnchors},'records',records))
const inversions=[]
for(const key of ['burst','late','toughness','survival']) for(const a of records) for(const b of records) {
  const metric=r=>key==='late'?Math.max(...roleValues(r.output.stages.mature.snapshots)):key==='burst'?
    Math.max(...[r.output.stages.opening,r.output.stages.quick].filter(Boolean).flatMap(s=>s.openingDamage.map((n,i)=>n/2/(i?3:1)))):r.survival.peakOrdinaryCapacity
  const av=metric(a),bv=metric(b),aa=a.axes.find(axis=>axis.key===key),ba=b.axes.find(axis=>axis.key===key)
  if(av>bv+1e-9 && aa.score<ba.score) inversions.push({axis:key,higherMultiplier:a.id,lowerMultiplier:b.id,
    values:[av,bv],scores:[aa.score,ba.score],reason:`${aa.reason} 对照：${ba.reason}`})
}
fs.writeFileSync(new URL('inversions.json',folder),collection({rubricVersion:RATING_VERSION,count:inversions.length},'pairs',inversions))
fs.writeFileSync(new URL('doc/character-ratings/reviews.txt',root),records.map(r=>[r.id,r.axes.map(a=>a.score).join(','),...r.axes.map(a=>a.reason),r.conditions,r.tags].join('|')).join('\n')+'\n')
fs.writeFileSync(new URL('changes.md',folder),'# 七维评分 v6\n\n旧维度不能逐项相减。保留旧六维，并列新七维；范围仅为已审核的有限样本。134名角色、938项评分。\n\n|角色|旧：单/群/生存/防护/辅助/干扰|新：爆发/后期/爆防/生存/防护/辅助/干扰|基础→后期 单敌每行动等效技能倍率|\n|---|---|---|---|\n'+records.map(r=>`|${r.id} ${r.name}|${previous.find(p=>p.id===r.id).axes.map(a=>a.score).join('/')}|${r.axes.map(a=>a.score).join('/')}|${equivalent(r.output.stages.lower.snapshots[0].perAction)}→${equivalent(r.output.stages.mature.snapshots[0].perAction)}|`).join('\n')+'\n')
console.log(`Reviewed ${records.length} characters / ${records.length*RATING_AXES.length} axes`)
