import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const records=JSON.parse(fs.readFileSync(new URL('../doc/character-ratings/v6/review.json',import.meta.url))).records
const axis=(id,key)=>records.find(r=>r.id===id).axes.find(a=>a.key===key).reason

test('all character reasons omit unconditional rubric filler and qualify only modeled shields',()=>{
  for(const r of records) {
    for(const a of r.axes) assert.doesNotMatch(a.reason,/盾按完整时计，不死\/屏障另评|无另列计数成长|各条件状态/)
    const shield=r.survival.states.some(s=>s.comparisons[0].physical.factors.shield>0)
    assert.equal(r.axes.find(a=>a.key==='toughness').reason.includes('（完整护盾）'),shield)
    assert.equal(r.axes.find(a=>a.key==='survival').reason.includes('（护盾耗尽后）'),shield)
  }
})

test('Christmas Stella has no unrelated protection text while real finite defenses retain their limits',()=>{
  for(const key of ['toughness','survival']) assert.doesNotMatch(axis(132,key),/盾|不死|屏障/)
  assert.match(axis(132,'survival'),/10次主动恢复/)
  assert.match(axis(6,'toughness'),/不死3回合/)
  assert.match(axis(18,'survival'),/盾仅一次/)
  assert.match(axis(18,'survival'),/第5回合/)
  for(const id of [15,58,64,72,76,87,132]) for(const key of ['burst','late']) {
    assert.doesNotMatch(axis(id,key),/护盾|屏障|阻绝|叠物防|满140%生命|双防100%/)
  }
})
