import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { targetAvoidance } from '../doc/character-ratings/v6/target-avoidance.mjs'

const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'))
const catalog=read('../public/data/character-catalog/zh-CN.json').characters
const records=read('../doc/character-ratings/v6/review.json').records
const evidence=read('../doc/character-ratings/v6/target-avoidance-evidence.json')
const score=(id,key)=>records.find(r=>r.id===id).axes.find(a=>a.key===key).score

test('target exclusion review covers all catalog mentions and preserves exact source evidence',()=>{
  const mentions=catalog.filter(c=>/隐身|透明/.test(JSON.stringify([c.skills,c.exclusiveEffects]))).map(c=>c.id)
  assert.deepEqual(mentions,[20,29,47,54,55,68,77,81])
  assert.deepEqual(Object.keys(targetAvoidance).map(Number),[20,29,55,68,77,81])
  for(const c of evidence.characters) {
    const live=catalog.find(x=>x.id===c.id)
    assert.deepEqual(c.skills,live.skills)
    assert.deepEqual(c.exclusiveEffects,live.exclusiveEffects)
  }
  const help=key=>evidence.help.find(x=>x.StringKey===`[HelpMainText_Skill_${key}]`).Text
  assert.match(help('Stealth'),/敌人的单体/)
  assert.match(help('Stealth'),/无法规避.*面前/)
  assert.match(help('Invisibility'),/敌我双方/)
  assert.match(help('Invisibility'),/友军皆附带「透明」/)
  assert.equal(targetAvoidance[47],undefined)
  assert.equal(targetAvoidance[54],undefined)
})

test('duration and activation distinguish long invisibility from one-time short protection',()=>{
  assert.equal(targetAvoidance[81].turns,32)
  assert.equal(targetAvoidance[68].turns,3)
  assert.equal(targetAvoidance[20].turns,null)
  assert.equal(targetAvoidance[29].maxTriggers,null)
  assert.equal(targetAvoidance[55].trigger,'battleStart')
  for(const id of [20,68,81]) {
    assert.equal(targetAvoidance[id].maxTriggers,1)
    assert.equal(targetAvoidance[id].trigger,'afterAttack')
    assert.equal(targetAvoidance[id].minLivingAllies,2)
    assert.equal(records.find(r=>r.id===id).survival.initiative.penalty,0)
  }
  assert.ok(score(81,'survival')>score(68,'survival'))
  assert.ok(score(68,'toughness')>score(68,'survival'))
  assert.ok(score(55,'toughness')>score(55,'survival'))
  assert.match(targetAvoidance[77].protection,/50%.*连带解除/)
})

test('target exclusion never inflates ordinary EHP and its structured basis reaches published data',()=>{
  const previous=read('../doc/character-ratings/v5/review.json').records
  for(const id of Object.keys(targetAvoidance).map(Number)) {
    const record=records.find(r=>r.id===id)
    const original=previous.find(r=>r.id===id)
    assert.deepEqual(record.survival.states,original.survival.states)
    const published=read(`../public/data/character-ratings/${id}.json`)
    assert.deepEqual(published.assessment.targetAvoidance,targetAvoidance[id])
    assert.equal(published.assessment.effectiveSustain,targetAvoidance[id].replenishment+'；'+targetAvoidance[id].afterExpiry)
  }
})
