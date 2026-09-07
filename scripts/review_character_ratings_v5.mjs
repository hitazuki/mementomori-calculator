import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { referenceFor } from './lib/characterRatingV5.mjs'
import { RATING_AXES, ratingSource } from '../src/utils/characterRatings.js'
import { compareSurvival } from '../src/utils/characterSurvival.js'
import { outputAdjustment, outputNotes, utilityScores } from '../doc/character-ratings/v5/decisions.mjs'
import { survivalInputs } from '../doc/character-ratings/v5/survival-inputs.mjs'
import { auxiliaryNotes } from '../doc/character-ratings/v5/auxiliary-notes.mjs'

const dir = new URL('../doc/character-ratings/',import.meta.url)
const catalog = JSON.parse(fs.readFileSync(new URL('../public/data/character-catalog/zh-CN.json',import.meta.url))).characters
const old = new Map(fs.readFileSync(new URL('v5/v4-reviews.txt',dir),'utf8').trim().split(/\r?\n/).map(line=>{const p=line.split('|');return [+p[0],p]}))
const band = (value,anchors) => anchors.filter(n=>value>=n).length
const outputAnchors = [.1,1.5,3,5,8,12,18,26,38,55]
const survivalAnchors = [1.01,1.1,1.2,1.35,1.6,1.9,2.4,3,4,8]
const specialBase = {5:8,6:9,19:8,23:8,28:9,44:8,45:9,56:9,58:9,61:9,63:8,64:7,65:8,77:8,81:7,86:8,96:10,106:3,107:4,128:4}
const cap = n => Math.max(0,Math.min(10,n))
const finiteNumber = n => Math.round(n*10000)/10000
const records = catalog.map(c=>{
  const prior = old.get(c.id), ref = referenceFor(c), utility = utilityScores[c.id]
  if (!prior || !utility || utility.length!==4) throw new Error('Missing six-axis authored review '+c.id)
  const evidence=c.skills.map(s=>s.slot).concat('W','stats')
  const authoredStates=structuredClone(survivalInputs[c.id]??[['无可确认有限乘区；次数保命等另评',{}]])
  const damageShield={29:['S1',.4,{}],35:['S2',.3,{}],38:['S2',.4,{hp:.3,defense:.5}],74:['S1',1,{hp:.4}]}[c.id]
  if (damageShield) for (const snapshot of ref.snapshots) {
    const [slot,fraction,baseEffects]=damageShield
    authoredStates.push([`${slot}基于${snapshot.enemies}目标实际直接伤害的新盾；生效/空窗见生命周期`,{...baseEffects,shieldFixedHp:snapshot.skills[slot].damage*fraction/3}])
  }
  const states=authoredStates.map(([label,effects])=>{
    const value={...effects}
    // Highest weapon passive: only confirmed percentage HP/DEF and attack shield source.
    value.hp=(value.hp??0)+ref.weapon.hp
    value.defense=(value.defense??0)+ref.weapon.defense
    value.attack=(value.attack??0)+ref.weapon.attack
    if(value.hpFromAttack) value.hpFromAttack*=1+ref.weapon.attack
    if(c.id===65 && value.shieldFixedHp) value.shieldFixedHp*=1+ref.weapon.primary
    return {label,effects:value,evidence}
  })
  const comparisons=compareSurvival(states)
  const peak=Math.max(...comparisons.flatMap(s=>s.comparisons.filter(c=>c.scenario!=='pressure').map(c=>Math.min(c.physical.withShield,c.magic.withShield))))
  const baseSurvival=Math.max(band(peak,survivalAnchors),specialBase[c.id]??0)
  const metrics=ref.snapshots.map(s=>s.perAction)
  const outputBase=metrics.map(n=>band(n,outputAnchors))
  const distribution=Math.max(0,Math.min(1,(ref.coverage-1)/4))
  const spreadAdjustment=-Math.round(outputBase[1]*(1-distribution))
  const matureAdjustment=outputAdjustment[c.id]??0
  const scores=[cap(outputBase[0]+matureAdjustment),cap(outputBase[1]+spreadAdjustment+matureAdjustment),...utility]
  const life=ref.lifecycle
  const survivalReason=(life.activeWindow==='无可确认自身防护'?prior[4]:`${life.activeWindow}；${life.replenishment}。${life.afterExpiry}。`).replace(/。+/g,'。')
  const reasons=[
    `S1/S2：${outputNotes[c.id]}`,
    `S1/S2：五目标成熟循环总伤害约${metrics[1].toFixed(1)}倍基准普攻/行动，${ref.coverage<=1?'定点攻击，缺少多目标覆盖':`有效覆盖约${ref.coverage.toFixed(1)}人`}。${ref.growth?.detail??outputNotes[c.id]}`,
    survivalReason,
    ...['protection','support','control'].map((key,i)=>auxiliaryNotes[c.id]?.[key]??prior[i+5]),
  ]
  const axes=RATING_AXES.map((key,i)=>({key,oldScore:+prior[1].split(',')[i],score:scores[i],baseBand:i<2?outputBase[i]:i===2?baseSurvival:scores[i],
    adjustments:i<2?[
      ...(i===1&&spreadAdjustment?[{points:spreadAdjustment,reason:`同一行动有效覆盖${ref.coverage.toFixed(2)}人；定点连击不等于五目标群攻。`}]:[]),
      ...(matureAdjustment?[{points:matureAdjustment,reason:outputNotes[c.id]}]:[]),
    ]:i===2&&scores[i]!==baseSurvival?[{points:scores[i]-baseSurvival,reason:`${life.replenishment}；${life.afterExpiry}；特殊容量/保命、有效续航及物魔差异分别评审。`}]:[],
    reason:reasons[i],evidence,
    reviewBasis:i<2?ref.note:i===2?`${life.activeWindow}；${life.replenishment}；${life.afterExpiry}`:`${reasons[i]}。统一按实际受益范围、成熟强度、持续/冷却和触发可靠性复核；属性按合理配队满足，不重复扣分。`,
  }))
  return {id:c.id,name:[c.title,c.name].filter(Boolean).join(' · '),schemaVersion:1,rubricVersion:'ai-capability-v5',
    sourceHash:createHash('sha256').update(JSON.stringify(ratingSource(c))).digest('hex'),axes,
    output:ref,survival:{states:comparisons,peakOrdinaryCapacity:peak,baseBand:baseSurvival,
      shortTermProtection:life.activeWindow,antiLethalCapacity:'有限容量见状态；不死、屏障和复活不折无限容量。',effectiveSustain:life.replenishment,afterExpiry:life.afterExpiry},
    conditions:prior[8],tags:prior[9],reviewedAt:'2026-09-07'}
})
if(records.length!==134||new Set(records.map(r=>r.id)).size!==134) throw new Error('Expected all 134 characters')

// Exhaustively record numerical inversions, rather than checking only selected examples.
const inversions=[]
for(const axis of [0,1,2]) for(const a of records) for(const b of records) {
  const av=axis<2?a.output.snapshots[axis].perAction:a.survival.peakOrdinaryCapacity
  const bv=axis<2?b.output.snapshots[axis].perAction:b.survival.peakOrdinaryCapacity
  if(av<=bv+1e-9||a.axes[axis].score>=b.axes[axis].score) continue
  const difference=axis===2?`${a.survival.effectiveSustain}；${a.survival.afterExpiry}。对照：${b.survival.shortTermProtection}；${b.survival.effectiveSustain}`:
    `${a.output.note}；有效覆盖${a.output.coverage.toFixed(2)}/${b.output.coverage.toFixed(2)}人。对照：${b.output.note}`
  if(axis<2 && !a.axes[axis].adjustments.length) throw new Error('Unexplained output inversion '+a.id+'/'+b.id)
  inversions.push({axis:RATING_AXES[axis],higherMultiplier:a.id,lowerMultiplier:b.id,values:[finiteNumber(av),finiteNumber(bv)],scores:[a.axes[axis].score,b.axes[axis].score],reason:difference})
}
const changes=records.flatMap(r=>r.axes.filter(a=>a.oldScore!==a.score).map(a=>({id:r.id,name:r.name,...a})))
const write=(name,value)=>fs.writeFileSync(new URL(name,dir),value)
// One record per line keeps generated diffs bounded while preserving ordinary JSON.
const collection=(metadata,key,rows)=>JSON.stringify(metadata,null,2).slice(0,-2)+`,\n  "${key}": [\n`+rows.map(row=>'    '+JSON.stringify(row)).join(',\n')+'\n  ]\n}\n'
write('v5/review.json',collection({rubricVersion:'ai-capability-v5',outputAnchors,survivalAnchors},'records',records))
write('v5/inversions.json',collection({rubricVersion:'ai-capability-v5',count:inversions.length},'pairs',inversions))
write('reviews.txt',records.map(r=>[r.id,r.axes.map(a=>a.score).join(','),...r.axes.map(a=>a.reason),r.conditions,r.tags].join('|')).join('\n')+'\n')
write('survival-profiles.json',JSON.stringify({schemaVersion:1,version:'survival-reference-v5',reviewedAt:'2026-09-07',profiles:records.map(r=>({id:r.id,score:r.axes[2].score,note:r.axes[2].reason,states:r.survival.states.map(({comparisons,...s})=>s)}))},null,2)+'\n')
write('v5/changes.md',`# 全角色评分 v5 变更\n\n134名角色、804项评分已逐项记录；${changes.length}项分数变化。数字参照倒挂${inversions.length}对，解释保存在 inversions.json。六维顺序为单体/群体/生存/防护/辅助/干扰。\n\n|ID|角色|旧分|新分|变更轴及依据|\n|---|---|---|---|---|\n`+
  records.map(r=>`|${r.id}|${r.name}|${r.axes.map(a=>a.oldScore).join('/')}|${r.axes.map(a=>a.score).join('/')}|${r.axes.filter(a=>a.score!==a.oldScore).map(a=>`${a.key}: ${a.oldScore}→${a.score}，${a.reviewBasis}`).join('<br>')||'六维复核后维持，完整依据见 review.json'}|`).join('\n')+'\n')
console.log(`Reviewed ${records.length} characters / ${records.length*6} axes; ${changes.length} score changes; ${inversions.length} explained numerical inversions.`)
