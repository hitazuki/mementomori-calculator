import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { damageReference } from '../src/utils/characterRatingModel.js'
import { fourEvents } from '../doc/character-ratings/v6/four-events.mjs'
const records=JSON.parse(fs.readFileSync(new URL('../doc/character-ratings/v6/review.json',import.meta.url))).records
const get=id=>records.find(r=>r.id===id)
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`)

test('all self-harm and active-recovery reference windows use four events, not full stacks',()=>{
  for(const id of Object.keys(fourEvents).map(Number)) assert.equal(get(id).output.readiness.events,4)
  for(const [id,attack] of [[92,.2],[114,.2],[124,.32],[132,.4],[148,.24],[150,.24]]) {
    near(get(id).output.stages.quick.snapshots[0].skills.S1.effects.attack,attack)
  }
  assert.equal(get(80).output.stages.quick.snapshots[0].skills.S2.components[0].coefficient,4.8)
  assert.equal(get(103).output.stages.quick.snapshots[0].skills.S2.components[0].coefficient,4.8)
  assert.ok(!get(150).output.stages.quick.firstActions.includes('S2'))
})

test('Aisha replays with the third and fourth event attack separately and retains S2 bounds',()=>{
  const a=get(130),q=a.output.stages.quick.snapshots[0],high=a.output.stages.quickUpper.snapshots[0]
  assert.deepEqual(q.skills.S1.eventCounts,[3,4])
  near(q.skills.S1.segments[0].factors.source,1.48)
  near(q.skills.S1.segments[1].factors.source,1.58)
  near(q.skills.S1.equivalentBasicHits,6.7*4*(1.48+1.58))
  near(q.skills.S2.equivalentBasicHits,7.6*5*1.58)
  near(high.skills.S2.equivalentBasicHits,15.2*5*1.58)
  assert.ok(a.output.stages.quick.openingDamage[0]<get(93).output.stages.quick.openingDamage[0])
  assert.ok(a.output.stages.quickUpper.openingDamage[0]>get(93).output.stages.quick.openingDamage[0])
  assert.equal(a.axes[0].score,10)
  assert.match(a.axes[0].reason,/上界不保证每段/)
})

test('equivalent coefficients include critical and nonlinear defense multipliers only when applicable',()=>{
  const base=damageReference({coefficient:1})
  near(damageReference({coefficient:1},{critRate:.5}).damage/base.damage,1.5/1.25)
  near(damageReference({coefficient:1},{critRate:2}).damage/base.damage,1.5/1.25)
  near(damageReference({coefficient:1},{defenseDown:.5}).damage/base.damage,4/3)
  near(damageReference({coefficient:1},{defenseDown:.8}).damage/base.damage,5/3)
  near(damageReference({coefficient:1},{critRate:.5,defenseDown:.5,specificDefenseDown:.5}).damage/base.damage,(1.5/1.25)*(4/3)**2)
  near(damageReference({coefficient:1,basis:'fixed-direct'},{critRate:.5,defenseDown:.8}).damage,1)
})
