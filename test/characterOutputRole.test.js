import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { characterOutputRole } from '../scripts/lib/characterOutputRole.mjs'
import { damageReference } from '../src/utils/characterRatingModel.js'
import { readCharacterCatalog } from '../scripts/lib/characterCatalog.mjs'
const records=JSON.parse(fs.readFileSync(new URL('../doc/character-ratings/v6/review.json',import.meta.url))).records
const get=id=>records.find(r=>r.id===id)
test('fixed multi-target attacks and random single-target chains count different damage units',()=>{
  assert.equal(damageReference({coefficient:1,hits:1,targets:5},{},5).equivalentBasicHits,5)
  assert.equal(damageReference({coefficient:1,hits:1,targets:5},{},1).equivalentBasicHits,1)
  assert.equal(damageReference({coefficient:1,hits:3,targets:0},{},5).equivalentBasicHits,3)
  assert.equal(damageReference({coefficient:1,hits:3,targets:0},{},1).equivalentBasicHits,3)
})
test('Cordie variants and twilight Fortina cover both modes, repeated group attacks remain group',()=>{
  for(const id of [27,72,123,151]) assert.equal(get(id).output.role,'单群兼顾')
  assert.equal(get(105).output.role,'群体输出')
  assert.deepEqual(get(105).output.targeting.skills.map(s=>s.modes),[['group'],['group']])
  assert.equal(get(93).output.role,'随机连击')
  assert.equal(get(130).output.role,'随机连击')
})
test('every role comes from active skill distribution, independent of offensive scores',()=>{
  for(const r of records) {
    assert.deepEqual(r.output.targeting,characterOutputRole(r.output.stages,r.id))
    const published=JSON.parse(fs.readFileSync(new URL(`../public/data/character-ratings/${r.id}.json`,import.meta.url)))
    assert.equal(published.outputRole,r.output.targeting.label)
    assert.equal(published.outputRoleDetail,r.output.targeting.detail)
  }
  for(const id of [20,60]) assert.equal(get(id).output.stages.mature.snapshots[1].skills.S2.components[0].targets,3)
})

test('text-reviewed branches include kill follow-ups and mixed ally/enemy selection',()=>{
  assert.equal(get(47).output.role,'单群兼顾')
  assert.match(get(47).output.targeting.detail,/击杀后追加5目标群攻/)
  assert.equal(get(54).output.role,'群体输出')
  assert.match(get(54).output.targeting.detail,/敌我混选5目标/)
  const catalog=readCharacterCatalog(new URL('../public/data/character-catalog/',import.meta.url)).characters
  for(const r of records) for(const skill of r.output.targeting.skills) {
    if(!skill.review) continue
    const source=catalog.find(c=>c.id===r.id).skills.find(s=>s.slot===skill.slot)
    assert.ok(source.levels.some(l=>l.text.includes(skill.review.quote)),`${r.id} ${skill.slot} reviewed source`)
  }
})

test('damage magnitude and single/group damage ratios do not determine targeting',()=>{
  for(const r of records) {
    const stages=structuredClone(r.output.stages)
    for(const stage of Object.values(stages)) for(const [i,snapshot] of stage.snapshots.entries()) {
      snapshot.perAction=i?1e9:1e-9
      for(const skill of Object.values(snapshot.skills)) for(const c of skill.components) {
        if(c.coefficient>0) c.coefficient=i?1e-9:1e9
      }
    }
    assert.deepEqual(characterOutputRole(stages,r.id),r.output.targeting)
  }
})
