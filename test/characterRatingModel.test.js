import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { damageReference, ratingCycle, orderedDamage, growthRequirement, effectiveRecovery, protectionTrace } from '../src/utils/characterRatingModel.js'
import { referenceFor } from '../scripts/lib/characterRatingV5.mjs'
import { ratingSource, RATING_AXES } from '../src/utils/characterRatings.js'
const read = p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'))
const catalog=read('../public/data/character-catalog/zh-CN.json').characters
const character=id=>catalog.find(c=>c.id===id)
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`)

test('final damage combines coefficient, distribution and applicable multipliers',()=>{
  const a=damageReference({coefficient:6,hits:4,targets:0},{attack:.5,damage:.3})
  near(a.equivalentBasicHits,6*4*1.5*1.3)
  near(damageReference({coefficient:6,targets:3},{},5).equivalentBasicHits,18)
  near(damageReference({coefficient:6,targets:3},{},1).equivalentBasicHits,6)
  near(damageReference({coefficient:6,basis:'primary-direct'},{attack:3,critRate:1,defenseDown:1,damage:4}).damage,1.5)
  near(damageReference({coefficient:6,basis:'fixed-direct'},{attack:3,critRate:1,defenseDown:1}).damage,6)
  assert.ok(damageReference({coefficient:1},{defenseDown:.8}).damage > damageReference({coefficient:1},{defenseDown:.4}).damage*1.25)
})

test('post-hit attack growth cannot increase the hit that generates it',()=>{
  const steps=orderedDamage([
    {component:{coefficient:1},after:{attack:1}},
    {component:{coefficient:1}},
  ])
  near(steps[0].equivalentBasicHits,1)
  near(steps[1].equivalentBasicHits,2)
  const c=referenceFor(character(33))
  assert.ok(c.snapshots[0].skills.S1.segments[0].damage<c.snapshots[0].skills.S1.segments[4].damage)
})

test('event maturity, consumed resources and finite transformations stay explicit',()=>{
  assert.equal(growthRequirement({initial:4,cap:10,perEvent:4}),2)
  assert.equal(referenceFor(character(148)).growth.totalEvents,8)
  assert.match(referenceFor(character(148)).growth.detail,/4次主动/)
  assert.equal(referenceFor(character(63)).growth.totalEvents,20)
  assert.match(referenceFor(character(63)).growth.detail,/消耗全部/)
  assert.equal(referenceFor(character(61)).phase.duration,8)
  assert.ok(!referenceFor(character(61)).phase.afterExpiryCycle.includes('S2'))
  assert.equal(referenceFor(character(36)).growth.totalEvents,null)
  const late=referenceFor(character(135))
  assert.match(late.growth.detail,/第15回合/)
  assert.match(late.lifecycle.replenishment,/第13回合停止/)
})

test('single enemy cannot satisfy three debuffed enemies; replenishment cadence changes cycles',()=>{
  const c=referenceFor(character(122))
  near(c.snapshots[1].skills.S2.damage/c.snapshots[0].skills.S2.damage,2)
  const ordinary=ratingCycle([{slot:'S1',cooldown:4},{slot:'S2',cooldown:4}])
  assert.equal(ordinary.cycle.length,4)
  assert.equal(ordinary.cycle.filter(s=>s==='N').length,2)
  const accelerated=referenceFor(character(83))
  assert.deepEqual(accelerated.cycle.cycle,['S1','S2'])
  assert.throws(()=>ratingCycle([],{normalEvery:0}))
})

test('long-lived one-shot shields deplete early and never regenerate by waiting',()=>{
  const trace=protectionTrace([
    {time:1,kind:'shield',amount:3,duration:10},
    {time:2,kind:'hit',amount:3},
    {time:3,kind:'hit',amount:.5},
    {time:7,kind:'hit',amount:.1},
  ])
  assert.equal(trace[1].shield,0)
  assert.equal(trace[2].hp,.5)
  assert.equal(trace[3].shield,0)
  const expiry=protectionTrace([{time:1,kind:'shield',amount:3,duration:4},{time:5,kind:'hit',amount:1}])
  assert.equal(expiry[1].hp,0)
})

test('periodic shields leave depletion gaps, replace old value, and duration refresh is not refill',()=>{
  const trace=protectionTrace([
    {time:1,kind:'shield',amount:1,duration:4},
    {time:2,kind:'hit',amount:1.2},
    {time:3,kind:'shield',mode:'duration',amount:1,duration:4},
    {time:4,kind:'hit',amount:.3},
    {time:5,kind:'shield',amount:1,duration:4},
    {time:6,kind:'shield',amount:1,duration:4},
  ])
  assert.equal(trace[2].shield,0)
  near(trace[3].hp,.5)
  assert.equal(trace[5].shield,1)
})

test('short immortality expires; late healing cannot rescue a fatal hit',()=>{
  const trace=protectionTrace([
    {time:1,kind:'immortal',duration:3},
    {time:1,kind:'hit',amount:10},
    {time:3,kind:'heal',amount:.1},
    {time:4,kind:'hit',amount:.2},
    {time:5,kind:'heal',amount:1},
  ])
  assert.ok(trace[1].hp>0)
  assert.equal(trace[3].hp,0)
  assert.equal(trace[4].hp,0)
  assert.match(referenceFor(character(6)).lifecycle.replenishment,/仅一次/)
  assert.match(referenceFor(character(6)).lifecycle.activeWindow,/3回合/)
})

test('barriers consume per qualifying hit, not per round; recovery discounts overheal and healing reduction',()=>{
  const trace=protectionTrace([
    {time:1,kind:'barrier',amount:2},
    {time:1,kind:'hit',amount:.6},
    {time:1,kind:'hit',amount:.6},
    {time:1,kind:'hit',amount:.6},
  ])
  near(trace[3].hp,.4)
  near(effectiveRecovery({raw:1,missing:.2}),.2)
  near(effectiveRecovery({raw:1,missing:1,recoveryFactor:.25}),.25)
  assert.equal(effectiveRecovery({raw:1,missing:1,alive:false}),0)
  assert.throws(()=>protectionTrace([{time:1,kind:'shield',amount:-1,duration:4}]))
})

test('all 134 v5 assessments retain six decisions, reproducible final references and source hashes',()=>{
  const review=read('../doc/character-ratings/v5/review.json')
  const current=new Set(read('../public/data/character-ratings/status.json').current)
  assert.equal(review.records.length,134)
  for(const r of review.records){
    assert.deepEqual(r.axes.map(a=>a.key),RATING_AXES)
    if(current.has(r.id)) {
      assert.deepEqual(r.output,referenceFor(character(r.id)))
      assert.equal(r.sourceHash,createHash('sha256').update(JSON.stringify(ratingSource(character(r.id)))).digest('hex'))
    }
    assert.ok(r.axes.every(a=>Number.isInteger(a.baseBand)&&a.reviewBasis&&a.evidence.length))
    const published=read(`../public/data/character-ratings/${r.id}.json`)
    assert.deepEqual(published.axes.map(a=>a.score),r.axes.map(a=>a.score))
    assert.deepEqual(published.quantitative.finalOutput,r.output)
  }
  const comparisons=read('../doc/character-ratings/v5/inversions.json')
  assert.equal(comparisons.pairs.length,comparisons.count)
  assert.ok(comparisons.pairs.every(p=>p.values[0]>=p.values[1] && p.scores[0]<p.scores[1] && p.reason.length>0))
})
