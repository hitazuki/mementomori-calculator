import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { stageReference } from '../scripts/lib/characterRatingV6.mjs'
import { RATING_AXES, radarPoint } from '../src/utils/characterRatings.js'
import { filterCharacters, ratingIndex } from '../src/utils/characterCatalog.js'
import { survivalCapacity } from '../src/utils/characterSurvival.js'
import { createHash } from 'node:crypto'
import { ratingSource } from '../src/utils/characterRatings.js'
import { readCharacterCatalog } from '../scripts/lib/characterCatalog.mjs'
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'))
const catalog=readCharacterCatalog(new URL('../public/data/character-catalog/',import.meta.url)).characters
const reviews=read('../doc/character-ratings/v6/review.json').records
const score=(id,key)=>reviews.find(r=>r.id===id).axes.find(a=>a.key===key).score

test('Superbia Elfriede opens below ten stacks and applies critical only to explicit direct follow-ups',()=>{
  const r=reviews.find(r=>r.id===156),opening=r.output.stages.opening,mature=r.output.stages.mature
  assert.deepEqual(r.axes.map(a=>a.score),[9,10,10,10,2,8,0])
  assert.equal(opening.snapshots[0].skills.S1.components[0].coefficient,20.4)
  assert.equal(opening.snapshots[1].skills.S1.components[0].coefficient,6.8)
  assert.equal(opening.snapshots[0].skills.S1.effects.damage,.1)
  assert.equal(opening.snapshots[0].skills.S2.effects.damage,.2)
  assert.equal(opening.snapshots[0].skills.S2.components.length,1)
  assert.equal(mature.snapshots[0].skills.S1.components[0].coefficient,30.6)
  const direct=mature.snapshots[0].skills.S2.segments[1]
  assert.equal(direct.factors.critical,1.5)
  assert.equal(direct.factors.defense,1)
  assert.equal(direct.factors.bonus,1)
  assert.equal(direct.damage,15*3*.25*1.5)
  assert.equal(r.output.growth.totalEvents,5)
  assert.equal(r.survival.states[0].comparisons[0].physical.withoutShield,8)
  assert.equal(r.survival.initiative.penalty,0)
  assert.match(r.axes[4].reason,/行动结束即解除/)
})

test('provisional Lamis keeps late S2 casts separate from shields that stop before round thirteen',()=>{
  const r=reviews.find(r=>r.id===157)
  assert.deepEqual(r.axes.map(a=>a.score),[5,8,9,8,8,8,0])
  assert.match(r.conditions,/暂定评分/)
  assert.match(r.conditions,/缺少专武被动属性/)
  assert.equal(r.output.weapon.attack,0)
  const {lower,opening,thirdCast,mature}=r.output.stages
  assert.equal(lower.snapshots[0].skills.S2.components[0].coefficient,3.2)
  assert.equal(opening.snapshots[0].skills.S1.effects.attack,.1)
  assert.equal(opening.snapshots[0].skills.S2.effects.attack,.2)
  assert.equal(thirdCast.snapshots[0].skills.S2.components[0].coefficient,9.6)
  assert.equal(mature.snapshots[0].skills.S2.components[0].coefficient,12.8)
  assert.equal(mature.snapshots[0].skills.S2.components[0].hits,5)
  assert.equal(r.output.growth.totalEvents,6)
  assert.equal(r.survival.states[0].effects.shieldAttack,2)
  assert.equal(r.survival.states[2].effects.shieldAttack,6)
  assert.ok(Math.abs(r.survival.states[2].comparisons[0].physical.withShield-16.8)<1e-9)
  assert.equal(r.survival.states[3].comparisons[0].physical.withShield,4)
  assert.equal(r.survival.initiative.penalty,0)
  assert.match(r.output.lifecycle.replenishment,/第13回合起停止/)
  assert.equal(r.output.role,'单群兼顾')
})

test('Guardian Alexandra keeps first-round self-harm, conditional damage and expiring wards separate',()=>{
  const r=reviews.find(r=>r.id===155)
  assert.deepEqual(r.axes.map(a=>a.score),[9,10,2,0,7,8,0])
  const {lower,opening,mature,quick}=r.output.stages
  assert.equal(lower.snapshots[0].skills.S2.components[0].coefficient,3.6)
  assert.equal(opening.snapshots[0].skills.S1.effects.attack,0)
  assert.equal(opening.snapshots[0].skills.S2.effects.attack,.324)
  assert.equal(mature.snapshots[0].skills.S2.components[0].coefficient,5.4)
  assert.equal(mature.snapshots[0].skills.S2.effects.attack,.59)
  assert.equal(quick.snapshots[0].skills.S1.components[0].hits,8)
  assert.equal(quick.snapshots[0].skills.S2.components[0].hits,10)
  assert.equal(r.output.growth.totalEvents,null)
  assert.equal(r.output.readiness.events,4)
  assert.deepEqual(r.survival.states.map(s=>s.effects.block??0),[.05,.17,.5,0])
  assert.equal(r.survival.states[2].comparisons[0].physical.withoutShield,2)
  assert.equal(r.survival.states[3].comparisons[0].physical.withoutShield,1)
  assert.equal(r.survival.initiative.penalty,0)
  assert.ok(Math.abs(r.survival.initiative.effectiveSpeed-3114*1.3)<1e-9)
  assert.equal(r.output.role,'随机连击')
  assert.match(r.axes[4].reason,/仅一次且自身死亡即解除/)
  assert.match(r.axes[0].reason,/不代表开局连续两行动/)
  assert.doesNotMatch(r.axes[0].reason,/阻绝|0\.59/)
  assert.match(r.axes[1].reason,/含冷却普攻的完整循环，平均每行动/)
  assert.match(r.axes[1].reason,/任意弱化只触发S2/)
})

test('Aine full-team Shields unlock the second-action burst without assuming shields survive',()=>{
  const r=reviews.find(r=>r.id===65)
  assert.deepEqual(r.axes.map(a=>a.score),[7,6,6,8,9,4,0])
  const {lower,opening,mature}=r.output.stages
  assert.equal(lower.snapshots[0].skills.S2.components[0].coefficient,3.8)
  assert.equal(lower.snapshots[0].skills.S2.effects.attack,0)
  assert.equal(opening.snapshots[0].skills.S1.effects.attack,.15)
  assert.equal(opening.snapshots[0].skills.S2.effects.attack,.3)
  assert.equal(opening.snapshots[0].skills.S2.components[0].coefficient,11.4)
  assert.deepEqual(opening.firstActions,['S1','S2'])
  assert.equal(opening.snapshots[0].skills.S2.damage,mature.snapshots[0].skills.S2.damage)
  assert.ok(opening.openingDamage[0]>lower.openingDamage[0]*2)
  assert.equal(r.output.growth.totalEvents,10)
  assert.match(r.conditions,/5名存活友军/)
  assert.match(r.conditions,/少人或破盾会延迟/)
  assert.match(r.axes[4].reason,/其他友军600%→800%/)
  assert.match(r.axes[4].reason,/新盾替换旧盾/)
  assert.equal(r.survival.initiative.penalty,0)
})

test('golden Artoria keeps the fifteen-heal unlock late and magical recovery outside lethal capacity',()=>{
  const r=reviews.find(r=>r.id===154)
  assert.deepEqual(r.axes.map(a=>a.score),[5,8,8,9,6,0,0])
  for(const phase of ['lower','opening','quick']) {
    assert.equal(r.output.stages[phase].snapshots[0].skills.S2.components[0].coefficient,5.4)
  }
  assert.equal(r.output.stages.mature.snapshots[0].skills.S2.components[0].coefficient,21.6)
  assert.equal(r.output.growth.totalEvents,15)
  assert.equal(r.output.readiness.events,4)
  assert.ok(Math.abs(r.output.stages.opening.openingDamage[0]-(7.2+5.4*4)*1.18)<1e-9)
  assert.ok(Math.abs(r.output.stages.mature.snapshots[0].perAction-(7.2+21.6*4+2)*1.18/4)<1e-9)
  assert.equal(r.output.role,'单群兼顾')
  assert.equal(r.survival.states[0].comparisons[0].physical.withoutShield,5)
  assert.ok(Math.abs(r.survival.states[1].comparisons[0].physical.withoutShield-5.75)<1e-9)
  assert.ok(Math.abs(r.survival.states[1].comparisons[0].magic.withoutShield-6.6125)<1e-9)
  assert.equal(r.survival.initiative.penalty,0)
  assert.equal(r.teamCare.heals.find(h=>h.slot==='P1').targets,4)
  assert.match(r.axes[4].reason,/须存活/)
})

test('Cusie reviewed weapon stats affect output and finite shields without treating CRIT RES as mitigation',()=>{
  const r=reviews.find(r=>r.id===97)
  assert.deepEqual(r.axes.map(a=>a.score),[4,3,8,4,7,4,0])
  assert.equal(r.output.weapon.attack,.18)
  assert.equal(r.output.weapon.defense,.05)
  assert.equal(r.output.weapon.excluded.find(p=>p.name==='暴击抗性').value,10)
  assert.ok(Math.abs(r.output.stages.opening.openingDamage[1]-45.312)<1e-9)
  const full=r.survival.states.find(s=>s.effects.shieldAttack)
  const empty=r.survival.states.find(s=>!s.effects.shieldAttack)
  assert.ok(Math.abs(full.comparisons[0].physical.withShield-(1+5/3*1.18)*1.025/.6)<1e-9)
  assert.ok(Math.abs(empty.comparisons[0].physical.withoutShield-1.025/.6)<1e-9)
})

test('all seven-axis ratings retain reproducible lower, opening, mature and upper samples',()=>{
  assert.equal(reviews.length,138)
  assert.equal(RATING_AXES.length,7)
  for(const r of reviews){
    assert.deepEqual(r.axes.map(a=>a.key),RATING_AXES)
    assert.equal(r.sourceHash,createHash('sha256').update(JSON.stringify(ratingSource(catalog.find(c=>c.id===r.id)))).digest('hex'))
    for(const stage of Object.values(r.output.stages)) {
      assert.deepEqual(stage,stageReference(catalog.find(c=>c.id===r.id),stage.config))
      assert.equal(stage.firstActions.length,2)
    }
    assert.ok(r.output.ranges.every(r=>Number.isFinite(r.minimum)&&r.maximum>=r.minimum))
    assert.ok(r.axes.find(a=>a.key==='late').score>=Math.max(...r.output.comparison.lowerBands))
    const published=read(`../public/data/character-ratings/${r.id}.json`)
    assert.deepEqual(published.axes.map(a=>a.score),r.axes.map(a=>a.score))
    assert.deepEqual(published.quantitative.finalOutput,r.output)
  }
})

test('short event routes contribute to burst while long growth is rated by late strength',()=>{
  for(const id of [75,93]) {
    const r=reviews.find(r=>r.id===id)
    assert.equal(r.output.readiness.events,4)
    assert.ok(r.output.stages.quick.openingDamage[0]>r.output.stages.opening.openingDamage[0])
    assert.ok(score(id,'burst')>=r.output.comparison.openingBand)
  }
  const song=reviews.find(r=>r.id===149)
  assert.equal(song.output.readiness.events,2)
  assert.equal(song.output.stages.quick.snapshots[0].skills.S2.components[0].hits,3)
  for(const id of [92,103,114,148,150]) {
    const r=reviews.find(r=>r.id===id)
    assert.equal(r.output.readiness.events,4)
    assert.equal(score(id,'late'),Math.max(...r.output.comparison.matureBands,...r.output.comparison.lowerBands))
  }
  const cusie=reviews.find(r=>r.id===97)
  assert.equal(cusie.output.stages.opening.snapshots[1].skills.S1.components[0].coefficient,4.2)
  assert.equal(cusie.output.stages.opening.snapshots[1].skills.S1.components[0].targets,5)
  assert.equal(cusie.survival.states[0].effects.shieldAttack,5)
  assert.ok(Math.abs(cusie.survival.peakOrdinaryCapacity-(1+5/3*1.18)*1.025/.6)<1e-9)
  for(const r of reviews) {
    assert.match(r.axes[0].reason,/等效技能倍率/)
    assert.match(r.axes[1].reason,/等效技能倍率/)
    assert.match(r.axes[2].reason,/等效生命/)
    assert.match(r.axes[3].reason,/等效生命/)
  }
})

test('burst does not borrow late skill unlocks, stacks or delayed damage',()=>{
  const florence=reviews.find(r=>r.id===8)
  assert.equal(score(8,'burst'),9)
  assert.equal(score(8,'late'),8)
  assert.ok(florence.output.stages.opening.snapshots[0].skills.S1.chain.expectedHits>9.99)
  for(const id of [61,150]) assert.ok(!reviews.find(r=>r.id===id).output.stages.opening.firstActions.includes('S2'))
  const fini=reviews.find(r=>r.id===68).output.stages.opening
  assert.ok(fini.snapshots[0].skills.S2.delayedDamage>0)
  assert.equal(fini.openingDamage[0],fini.firstActions.reduce((n,k)=>n+fini.snapshots[0].skills[k].damage/.3125,0))
  const paladea=reviews.find(r=>r.id===63).output.stages.opening.snapshots[0].skills.S2
  assert.equal(paladea.effects.guaranteedCrit,false)
  assert.equal(paladea.components[0].coefficient,9.8)
})

test('one-time shields and immortality stay distinct from enduring defenses at zero damage bonus',()=>{
  for(const id of [6,57,69,78,100]) assert.ok(score(id,'toughness')>score(id,'survival'))
  assert.equal(score(71,'survival'),6)
  assert.ok(score(114,'survival')>score(71,'survival'))
  assert.ok(score(134,'toughness')>score(71,'toughness'))
  assert.ok(Math.abs(survivalCapacity({reduction:.65,hp:1}).withoutShield-2/.35)<1e-9)
  assert.equal(survivalCapacity({block:.75}).withoutShield,4)
})

test('seven radar vertices are equally spaced and every new score dimension sorts correctly',()=>{
  const index=ratingIndex(read('../public/data/character-ratings/index.json'))
  const side=2*88*Math.sin(Math.PI/7)
  for(let i=0;i<7;i++) {
    const a=radarPoint(i,10),b=radarPoint((i+1)%7,10)
    assert.ok(Math.abs(Math.hypot(a[0]-b[0],a[1]-b[1])-side)<1e-9)
    const sorted=filterCharacters(catalog,{sort:'rating',ratingAxis:RATING_AXES[i],ratings:index})
    for(let j=1;j<sorted.length;j++) {
      const previous=index[sorted[j-1].id]?.scores?.[RATING_AXES[i]]??-1
      const current=index[sorted[j].id]?.scores?.[RATING_AXES[i]]??-1
      assert.ok(previous>=current)
    }
  }
  const labels=fs.readFileSync(new URL('../src/locales/characterCatalog.js',import.meta.url),'utf8')
  for(const key of RATING_AXES) {
    const match=labels.match(new RegExp('"ratingAxis_'+key+'": "([^"]+)"'))
    assert.equal([...match[1]].length,4)
  }
})
