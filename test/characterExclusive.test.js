import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { characterExclusiveEffects } from '../scripts/lib/characterExclusive.mjs'
import { readCharacterCatalog } from '../scripts/lib/characterCatalog.mjs'

test('missing equipment links recover all rarity upgrades from active and passive skill MB',()=>{
  const character={Id:97,ActiveSkillIds:[97001],PassiveSkillIds:[97004]}
  const active=new Map([[97001,{ActiveSkillInfos:[{EquipmentRarityFlags:0,DescriptionKey:'normal'},{EquipmentRarityFlags:128,DescriptionKey:'ssr'},{EquipmentRarityFlags:512,DescriptionKey:'lr'}]}]])
  const passive=new Map([[97004,{PassiveSkillInfos:[{EquipmentRarityFlags:256,DescriptionKey:'ur'}]}]])
  const text=key=>({normal:'base',ssr:'five targets',ur:'500% shield',lr:'420% damage',dedicated:'extra effect without a skill row'}[key]??'')
  assert.deepEqual(characterExclusiveEffects(character,active,passive,undefined,text),[
    {level:1,text:'five targets'},{level:2,text:'500% shield'},{level:3,text:'420% damage'},
  ])
  assert.equal(characterExclusiveEffects(character,active,passive,{Description2Key:'dedicated'},text)[1].text,'extra effect without a skill row')
  assert.throws(()=>characterExclusiveEffects(character,active,passive,undefined,()=>''),/Missing exclusive skill text/)
  assert.deepEqual(characterExclusiveEffects({Id:1},new Map(),new Map(),undefined,text),[])
})

test('Cusie publishes three weapon upgrades in all five locales without inventing passive stats',()=>{
  for(const locale of ['zh-CN','zh-TW','en','ja','ko']) {
    const catalog=readCharacterCatalog(new URL('../public/data/character-catalog/',import.meta.url), locale)
    const c=catalog.characters.find(c=>c.id===97)
    assert.deepEqual(c.exclusiveEffects.map(e=>e.level),[1,2,3])
    assert.ok(c.exclusiveEffects.every(e=>e.text.length>10))
    assert.equal(c.exclusivePassives.length,0)
  }
})
