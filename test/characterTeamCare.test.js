import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { effectiveHealing, cleanseAmount, teamCareReference } from '../scripts/lib/characterTeamCare.mjs'
import { readCharacterCatalog } from '../scripts/lib/characterCatalog.mjs'
import { ratingSource } from '../src/utils/characterRatings.js'

const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'))

test('ordinary healing is bounded by actual missing HP and never adds lethal capacity',()=>{
  assert.equal(effectiveHealing({amount:.74},{deficit:.5}).effective,.5)
  assert.equal(effectiveHealing({amount:.83},{deficit:.5}).effective,.5)
  assert.equal(effectiveHealing({amount:.83},{deficit:0}).effective,0)
  const repeated=effectiveHealing({amount:.2,repeats:4},{deficit:.3})
  assert.equal(repeated.raw,.8)
  assert.equal(repeated.effective,.3)
  assert.equal(repeated.lethalCapacityAdded,0)
  assert.equal(effectiveHealing({amount:.4},{deficit:.5,reduction:.5}).effective,.2)
  assert.equal(effectiveHealing({amount:4,alive:false},{deficit:1}).effective,0)
  assert.throws(()=>effectiveHealing({amount:1},{deficit:.5,reduction:2}))
})

test('cleansing counts only removable effects on affected targets, including all-cleanse and chance',()=>{
  assert.equal(cleanseAmount({targets:3,count:2},{affected:1,removablePerTarget:4}),2)
  assert.equal(cleanseAmount({targets:3,count:null},{affected:2,removablePerTarget:4}),8)
  assert.equal(cleanseAmount({targets:3,count:null},{affected:0,removablePerTarget:4}),0)
  assert.equal(cleanseAmount({targets:3,count:null},{affected:3,removablePerTarget:0}),0)
  assert.equal(cleanseAmount({targets:1,count:1,probability:.3},{affected:1,removablePerTarget:2}),.3)
})

test('all 28 reviewed care profiles retain matching source hashes and published references',()=>{
  const profiles=read('../doc/character-ratings/v6/team-care.json')
  const records=read('../doc/character-ratings/v6/review.json').records
  const catalog=readCharacterCatalog(new URL('../public/data/character-catalog/',import.meta.url)).characters
  assert.equal(Object.keys(profiles).length,28)
  for(const [id,profile] of Object.entries(profiles)) {
    const c=catalog.find(c=>c.id===Number(id))
    assert.equal(profile.sourceHash,createHash('sha256').update(JSON.stringify(ratingSource(c))).digest('hex'))
    const reference=teamCareReference(profile)
    assert.equal(reference.assumptions,undefined)
    assert.equal(reference.scenarios,undefined)
    assert.equal(reference.bands,undefined)
    const r=records.find(r=>r.id===Number(id))
    assert.deepEqual(r.teamCare,reference)
    assert.equal(r.axes.find(a=>a.key==='protection').score,profile.score)
    const published=read(`../public/data/character-ratings/${id}.json`)
    assert.deepEqual(published.quantitative.teamCare,reference)
    for(const h of profile.heals) {
      assert.ok(Number.isFinite(h.amount)&&h.amount>=0)
      assert.ok(Number.isInteger(h.targets)&&h.targets>=0&&h.targets<=4)
      assert.ok(Number.isInteger(h.repeats)&&h.repeats>=1)
    }
  }
})
