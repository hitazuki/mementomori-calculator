import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { stageReference } from '../scripts/lib/characterRatingV6.mjs'
import { RATING_AXES, radarPoint } from '../src/utils/characterRatings.js'
import { filterCharacters, ratingIndex } from '../src/utils/characterCatalog.js'
import { survivalCapacity } from '../src/utils/characterSurvival.js'
import { createHash } from 'node:crypto'
import { ratingSource } from '../src/utils/characterRatings.js'
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'))
const catalog=read('../public/data/character-catalog/zh-CN.json').characters
const reviews=read('../doc/character-ratings/v6/review.json').records
const score=(id,key)=>reviews.find(r=>r.id===id).axes.find(a=>a.key===key).score

test('all seven-axis ratings retain reproducible lower, opening, mature and upper samples',()=>{
  assert.equal(reviews.length,134)
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
    assert.equal(r.output.readiness,null)
    assert.equal(score(id,'late'),Math.max(...r.output.comparison.matureBands,...r.output.comparison.lowerBands))
  }
  const cusie=reviews.find(r=>r.id===97)
  assert.equal(cusie.output.stages.opening.snapshots[1].skills.S1.components[0].coefficient,4.2)
  assert.equal(cusie.output.stages.opening.snapshots[1].skills.S1.components[0].targets,5)
  assert.equal(cusie.survival.states[0].effects.shieldAttack,5)
  assert.ok(Math.abs(cusie.survival.peakOrdinaryCapacity-(1+5/3)/.6)<1e-9)
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
  assert.equal(score(71,'survival'),7)
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
    for(let j=1;j<sorted.length;j++) assert.ok(index[sorted[j-1].id].scores[RATING_AXES[i]]>=index[sorted[j].id].scores[RATING_AXES[i]])
  }
  const labels=fs.readFileSync(new URL('../src/locales/characterCatalog.js',import.meta.url),'utf8')
  for(const key of RATING_AXES) {
    const match=labels.match(new RegExp('"ratingAxis_'+key+'": "([^"]+)"'))
    assert.equal([...match[1]].length,4)
  }
})
