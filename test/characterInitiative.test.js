import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { defenseInitiative } from '../scripts/lib/characterInitiative.mjs'
import { stageReference } from '../scripts/lib/characterRatingV6.mjs'
import { defenseScores } from '../doc/character-ratings/v6/stages.mjs'
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'))
const catalog=read('../public/data/character-catalog/zh-CN.json').characters
const character=id=>catalog.find(c=>c.id===id)

test('opening acceleration helps action defenses but not S2 first-round gaps',()=>{
  const rose=defenseInitiative(character(86),5)
  assert.ok(Math.abs(rose.effectiveSpeed-3094*1.3)<1e-9)
  assert.equal(rose.penalty,0)
  assert.equal(defenseInitiative({...character(86),speed:2100},5).penalty,2)
  const loki=defenseInitiative(character(4),5)
  assert.ok(Math.abs(loki.effectiveSpeed-3066*1.1)<1e-9)
  assert.equal(loki.penalty,1) // Speed cannot skip S1 to gain the S2 kill shield.
  assert.equal(defenseInitiative(character(23),8).penalty,3)
})

test('starting and automatic defenses retain their scores regardless of speed',()=>{
  for(const id of [6,57,69,90,97,105,115,129,135]) {
    assert.equal(defenseInitiative({...character(id),speed:1000},defenseScores[id][0]).penalty,0)
  }
  const mixed=defenseInitiative({...character(139),speed:1000},10)
  assert.equal(mixed.score,9) // Preserve starting shield and 70% reduction.
  assert.equal(defenseInitiative({...character(151),speed:1000},8).score,6)
})

test('later and other-ally acceleration never becomes self opening speed',()=>{
  for(const id of [59,68,93,114,129,130]) {
    const result=defenseInitiative(character(id),defenseScores[id][0])
    assert.equal(result.openingBonus,0)
    assert.ok(result.later)
  }
  assert.equal(defenseInitiative(character(151),8).openingBonus,.1)
  assert.equal(defenseInitiative(character(148),1).openingBonus,.3)
})

test('all published defensive adjustments reproduce and offensive burst stays speed-independent',()=>{
  const reviews=read('../doc/character-ratings/v6/review.json').records
  for(const r of reviews) {
    const c=character(r.id),initiative=defenseInitiative(c,defenseScores[c.id][0])
    assert.deepEqual(r.survival.initiative,initiative)
    assert.equal(r.axes[2].score,initiative.score)
    const {openingBand,quickBand}=r.output.comparison
    assert.equal(r.axes[0].score,Math.max(openingBand,quickBand-(r.output.readiness?.penalty??0)))
    assert.equal(r.axes[3].score,defenseScores[c.id][1])
    const published=read(`../public/data/character-ratings/${c.id}.json`)
    assert.deepEqual(published.assessment.defenseInitiative,initiative)
  }
  const c=character(86)
  assert.deepEqual(stageReference({...c,speed:1000},{}),stageReference({...c,speed:5000},{}))
})
