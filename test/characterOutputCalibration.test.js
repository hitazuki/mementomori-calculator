import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {stageReference} from '../scripts/lib/characterRatingV6.mjs'
import {outputCalibration, outputBand} from '../scripts/lib/characterOutputCalibration.mjs'
import {readCharacterCatalog} from '../scripts/lib/characterCatalog.mjs'
import {validRatingScore} from '../src/utils/characterRatings.js'
import {ratingIndex} from '../src/utils/characterCatalog.js'
import {panelBaseline} from '../scripts/lib/characterPanelReport.mjs'
import {panelStatFactor} from '../src/utils/characterRatingPanel.js'
const records=JSON.parse(fs.readFileSync(new URL('../doc/character-ratings/v6/review.json',import.meta.url))).records
const catalog=readCharacterCatalog(new URL('../public/data/character-catalog/',import.meta.url)).characters
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`)
test('shared output bands distinguish high damage with independent single/group benchmarks',()=>{
  const thresholds=[.1,2,4,7,11,17,30,50,85,140]
  assert.deepEqual(outputCalibration.outputAnchors,thresholds)
  for(const axis of ['burst','late'])for(const [i,value]of thresholds.entries()){
    assert.equal(outputBand(value,axis),i+1)
    assert.equal(outputBand(value-1e-6,axis),i)
  }
  assert.equal(outputBand(55.61,'burst'),8)
  assert.equal(outputBand(82.06,'late'),8)
  assert.equal(outputBand(98.43,'late'),9)
  assert.equal(outputBand(134.98,'late'),9)
  assert.equal(outputBand(174.94,'late'),10)
  assert.equal(outputBand(1000,'burst'),10)
  assert.equal(outputBand(0,'late'),0)
  for(const value of [NaN,Infinity,-1])assert.throws(()=>outputBand(value,'late'))
  const a=records.find(r=>r.id===130)
  assert.deepEqual(a.axes.slice(0,2).map(a=>a.score),[9,9])
  assert.equal(a.outputCalibration.groupBenchmark,3)
  for(const r of records) {
    const c=r.outputCalibration
    if(Math.abs(c.normalized.burst-c.normalized.late)<1e-8)assert.equal(c.scores[0],c.scores[1])
    if(c.normalized.late>=c.normalized.burst)assert.ok(c.scores[1]>=c.scores[0])
  }
  const flower=records.find(r=>r.id===105)
  near(flower.outputCalibration.normalized.burst,flower.outputCalibration.normalized.late)
  assert.equal(flower.axes[0].score,flower.axes[1].score)
})
test('both axes keep fixed shared bands rather than forcing each leaderboard to ten',()=>{
  assert.equal(Math.max(...records.map(r=>r.axes[0].score)),9)
  assert.equal(Math.max(...records.map(r=>r.axes[1].score)),10)
  const get=id=>records.find(r=>r.id===id).axes.slice(0,2).map(a=>a.score)
  assert.deepEqual(get(156),[7,9])
  assert.deepEqual(get(115),[5,8])
  assert.deepEqual(get(150),[6,10])
})
test('all axes and the lightweight index reject fractional scores',()=>{
  for(const key of ['burst','late','toughness','survival','protection','support','control']){
    assert.equal(validRatingScore(key,8),true)
    assert.equal(validRatingScore(key,8.85),false)
  }
  const index=JSON.parse(fs.readFileSync(new URL('../public/data/character-ratings/index.json',import.meta.url)))
  index.characters[0].scores.burst=8
  assert.equal(ratingIndex(index)[index.characters[0].id].scores.burst,8)
  index.characters[0].scores.burst=8.85
  assert.throws(()=>ratingIndex(index))
})

test('all output scores use reproducible panel samples and preserve the three auxiliary axes',()=>{
  assert.equal(records.length,138)
  for(const r of records){
    const c=r.outputCalibration,source=outputCalibration.records[r.id]
    assert.equal(source.sourceHash,r.sourceHash)
    assert.equal(createHash('sha256').update(JSON.stringify(r.axes.slice(4))).digest('hex'),panelBaseline.records[r.id].auxiliaryAxesHash)
    const character=catalog.find(x=>x.id===r.id)
    const burst=[0,1].map(i=>c.samples.burst.reduce((n,s)=>n+stageReference(character,s.config).openingDamage[i]*s.weight,0))
    const late=[0,1].map(i=>c.expiryValues?c.expiryValues[i].reduce((a,b)=>a+b)/2:c.samples.late.reduce((n,s)=>n+stageReference(character,s.config).openingDamage[i]/2*s.weight,0))
    burst.forEach((v,i)=>near(v,c.burstTotals[i]));late.forEach((v,i)=>near(v,c.lateActions[i]))
    assert.deepEqual(r.axes.slice(0,2).map(a=>a.score),[outputBand(Math.max(burst[0]/2,burst[1]/6),'burst'),outputBand(Math.max(late[0],late[1]/3),'late')])
    assert.deepEqual(c.targets,[1,5])
    assert.ok(r.axes.slice(0,2).every(a=>a.adjustments.length===0))
  }
})
test('Armstrong does not backfill full growth, Aisha uses four layers and round locks remain closed',()=>{
  const get=id=>records.find(r=>r.id===id).outputCalibration
  const a=get(50)
  assert.equal(a.samples.burst[0].config.slots.S1.attack,0)
  assert.equal(a.samples.burst[0].config.components.S2,'4.5,8,0')
  assert.equal(get(130).samples.burst[0].config.effects.attack,.4)
  assert.equal(get(130).samples.burst[0].config.fourEventReplay,false)
  assert.equal(get(130).samples.burst[0].config.components.S2,'15.2,5,0')
  assert.ok(get(150).samples.burst[0].config.disabled.includes('S2'))
  assert.equal(get(154).samples.burst[0].config.components.S2,'5.4,4,0')
})
test('Aisha uses the maximum health coefficient with four-stack and full-stack attack states',()=>{
  const r=records.find(r=>r.id===130),c=r.outputCalibration
  const rawSkills=6.7*8+15.2*5
  for(const i of [0,1]){
    near(c.burstTotals[i],rawSkills*panelStatFactor(.18)*1.4)
    near(c.lateActions[i],rawSkills*panelStatFactor(.18)*1.6/2)
  }
  assert.equal(c.samples.late[0].config.components.S2,'15.2,5,0')
  assert.ok(c.conditionReason.includes('1520%'))
  for(const a of r.axes.slice(0,2)){
    assert.ok(a.reason.includes(c.conditionReason))
    assert.ok(!a.reason.includes('折中'))
    assert.ok(!a.reviewBasis.includes('折中'))
  }
  assert.deepEqual(c.scores,[9,9])
})
test('Alexandra averages correlated successful and failed vulnerability states only once',()=>{
  const c=records.find(r=>r.id===155).outputCalibration
  for(const key of ['burst','late']){
    assert.deepEqual(c.samples[key].map(s=>s.weight),[.3,.7])
    const [failure,success]=c.samples[key].map(s=>s.config)
    assert.equal(failure.components.S2,'3.6,10,0')
    assert.equal(success.components.S2,'5.4,10,0')
    assert.equal(success.slots.S1.damage,.4)
    assert.equal(success.slots.S2.damage,.4)
    assert.equal(failure.slots.S1.damage,0)
    assert.equal(failure.slots.S2.damage,0)
    assert.equal(success.slots.S2.attack,.5)
  }
})
