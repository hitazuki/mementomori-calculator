import test from 'node:test'
import assert from 'node:assert/strict'
import { simulateRaidTable } from '../src/engine/raidTableCalc.js'
import { RAID_TABLE_CHARACTERS } from '../src/constants/raidTableCharacters.js'
import { createRaidRandom, enemyTargetProbabilities, selectEnemyTargets } from '../src/engine/raid/enemyTargets.js'
const enemies = Array.from({ length: 5 }, (_, i) => ({ id: `enemy-${i+1}`, position: i+1 }))
const simulate = (lineup, extra = {}) => simulateRaidTable({ bossTemplateId: 'five-targets', lineup, attackPriority: lineup, turns: 10, ...extra })
test('distance weights normalize and mirror; seeded sampling supports replacement and unique groups', () => {
  const left = enemyTargetProbabilities(1, enemies)
  const right = enemyTargetProbabilities(5, enemies)
  assert.ok(Math.abs(left.reduce((a,b)=>a+b,0)-1)<1e-12)
  assert.deepEqual(left, right.reverse())
  assert.ok(Math.abs(left[0]*100-43.7956204379562)<1e-10)
  const random = createRaidRandom(1)
  const hits = Array.from({length: 20},()=>selectEnemyTargets({type:'randomHit'},1,enemies,random)[0].id)
  assert.ok(new Set(hits).size < hits.length)
  assert.equal(new Set(selectEnemyTargets({type:'randomGroup',count:5},1,enemies,random).map(e=>e.id)).size,5)
})
test('all integrated characters support deterministic five-target battles and totals by unit', () => {
  for (const id of Object.keys(RAID_TABLE_CHARACTERS).map(Number)) {
    const first = simulate([id])
    assert.deepEqual(first, simulate([id]), `seed reproducibility ${id}`)
    assert.ok(Number.isFinite(first.teamAtkPercent), `finite ${id}`)
    assert.ok(Math.abs(first.teamAtkPercent-first.enemyTotals.reduce((sum,target)=>sum+target.atkPercent,0))<1e-7)
    for (const action of first.rounds.flatMap(round=>round.actions)) {
      assert.ok(action.damageSteps.every(step=>enemies.some(e=>e.id===step.targetId)), `target IDs ${id}`)
      assert.ok(action.damageSteps.every(step=>Number.isFinite(step.effectivePercent)), `per-target damage ${id}`)
    }
  }
})
test('enemy element is shared by all five, configuration rejects invalid values', () => {
  for (const element of [1,2,3,4,5,6]) {
    const result=simulate([27],{enemyElement:element,turns:1})
    assert.equal(result.bossTemplate.element,element)
    const rates=result.rounds[0].actions[0].damageSteps.map(s=>s.elementAdvantageRate)
    assert.ok(rates.every(rate=>rate===rates[0]))
  }
  for (const extra of [{enemyElement:0},{randomSeed:-1},{randomSeed:1.2},{randomSeed:4294967296}]) assert.throws(()=>simulate([27],extra))
})
test('multi-hit and group counts differ; locked single attacks and direct damage retain units', () => {
  const cordie=simulate([27],{turns:2}).rounds
  assert.equal(cordie[0].actions[0].damageSteps.length,5)
  assert.equal(cordie[1].actions[0].damageSteps.length,5)
  const val=simulate([47],{turns:1}).rounds[0].actions[0]
  assert.equal(new Set(val.damageSteps.map(s=>s.targetId)).size,1)
  const aa=simulate([48],{turns:2})
  assert.equal(aa.rounds[1].actions[0].damageSteps.length,4)
  assert.ok(aa.enemyTotals.some(t=>t.symbolicTotals.MAG>0))
})
test('before-hit debuffs stay on hit targets and become visible before damage', () => {
  const result=simulate([27],{turns:1,randomSeed:1})
  const action=result.rounds[0].actions[0]
  const hitIds=new Set(action.damageSteps.map(s=>s.targetId))
  for(const target of result.enemyStatusFinal) assert.equal(target.statuses.length,hitIds.has(target.id)?1:0)
  assert.ok(action.damageSteps.every(s=>s.bossStatusBefore.some(status=>status.id==='cordie-defense-down')))
  assert.notDeepEqual(action.damageSteps,simulate([27],{turns:1,randomSeed:2}).rounds[0].actions[0].damageSteps)
})
test('single enemy simulations ignore random seed and retain the legacy damage record shape', () => {
 const a=simulate([27],{bossTemplateId:'sonya',randomSeed:1})
 const b=simulate([27],{bossTemplateId:'sonya',randomSeed:2})
 assert.deepEqual(a.rounds,b.rounds)
 assert.equal(a.rounds[0].actions[0].damageSteps[0].targetId,undefined)
})
test('group attacks cover their declared target counts and each skill increments history once', () => {
  for (const [id, first, second] of [[7,1,5],[8,10,5],[29,4,0],[40,3,5],[50,6,8],[81,3,4],[100,5,3],[122,5,5],[126,4,4],[135,5,7],[112,8,3]]) {
    const result=simulate([id],{turns:2})
    assert.equal(result.rounds[0].actions[0].damageSteps.length,first,`${id} S1`)
    assert.equal(result.rounds[1].actions[0].damageSteps.length,second,`${id} S2`)
    assert.equal(result.rounds[0].actions[0].runtimeAfter.skillUses.s1,1)
  }
})
test('all declared damage steps specify enemy selection, and global and fixed debuffs preserve their scope', () => {
  for(const character of Object.values(RAID_TABLE_CHARACTERS)) for(const action of [character.normal,...Object.values(character.skills)]) for(const step of action.damageSteps) assert.ok(step.enemyTarget)
  const lucille=simulate([89],{turns:1})
  assert.ok(lucille.enemyStatusFinal.every(enemy=>enemy.statuses.some(status=>status.id==='lucille-radiant-light')))
  const natasha=simulate([105],{turns:1})
  assert.equal(natasha.rounds[0].roundStartEffects.filter(effect=>effect.type==='bossStatus').length,3)
  const luke=simulate([30],{turns:1})
  assert.equal(luke.rounds[0].actions[0].effectsApplied.filter(effect=>effect.id==='luke-attack-down').length,1)
})
test('compiler rejects invalid enemy selectors, scopes, and conditional branches', () => {
  const original=RAID_TABLE_CHARACTERS[27]
  for (const spec of [{type:'unknown'},{type:'randomGroup'},{type:'randomGroup',count:6},{type:'first',count:0},{type:'conditional',condition:{type:'guaranteedCritical'},whenTrue:{type:'randomGroup',count:7},whenFalse:{type:'first'}}]) {
    const character=structuredClone(original)
    character.skills.s1.damageSteps[0].enemyTarget=spec
    assert.throws(()=>simulateRaidTable({lineup:[27],attackPriority:[27]}, {characters:{27:character}}),/raid enemy target/)
  }
  const character=structuredClone(original)
  character.skills.s1.hooks[0].effects[0].enemyScope='unknown'
  assert.throws(()=>simulateRaidTable({lineup:[27],attackPriority:[27]}, {characters:{27:character}}),/raid enemy scope/)
})
