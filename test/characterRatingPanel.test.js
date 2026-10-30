import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {getCoeffByLevel} from '../src/constants/levelTable.js'
import {calcDamageRate} from '../src/engine/damageCalc.js'
import {CHARACTER_RATING_PANEL as p,RATING_LEVEL_COEFFICIENTS as c,PANEL_BASE_DAMAGE,panelDamageReference,panelStatFactor} from '../src/utils/characterRatingPanel.js'
import {panelSurvivalStates} from '../scripts/lib/characterPanelSurvival.mjs'
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`)
const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url),'utf8'))
test('rating panel uses exact level-500 constants and an independently calculated common denominator',()=>{
  const {level,...expected}=getCoeffByLevel(500)
  assert.equal(level,500)
  assert.deepEqual(c,expected)
  near(p.hp,2.5);near(p.primary,.2);near(p.defenseToAttack,.2)
  near(PANEL_BASE_DAMAGE,1.55*calcDamageRate(6000000,11950,c.cDef,c.cPen)*calcDamageRate(6000000,65700,c.cPdef,c.cPmPen))
  near(panelDamageReference({coefficient:1}).equivalentBasicHits,1)
  near(panelDamageReference({coefficient:1},{guaranteedCrit:true}).equivalentBasicHits,2.1/1.55)
  for(const attack of [NaN,Infinity,-1])assert.throws(()=>panelDamageReference({coefficient:1},{attack}))
  assert.throws(()=>panelDamageReference({coefficient:1},{damageType:'direct'}))
})
test('weapon panel attack is separate from combat attack and flat penetration precedes rate buffs',()=>{
  near(panelStatFactor(.18),1.48/1.3)
  near(panelDamageReference({coefficient:1},{attack:.5},1,0,.18).equivalentBasicHits,1.48/1.3*1.5)
  const expected=calcDamageRate(6000000,(11950+7000)*1.4,c.cDef,c.cPen)/calcDamageRate(6000000,11950,c.cDef,c.cPen)
  near(panelDamageReference({coefficient:1},{flatPenetration:7000,penetration:.4}).equivalentBasicHits,expected)
  near(panelDamageReference({coefficient:1},{defenseDown:.4}).equivalentBasicHits,calcDamageRate(3600000,11950,c.cDef,c.cPen)/calcDamageRate(6000000,11950,c.cDef,c.cPen))
})
test('life and attribute shields use the confirmed ratios and separate weapon life from skill life',()=>{
  const character={id:999,exclusivePassives:[{parameters:[{name:'攻击力',percent:true,value:18},{name:'生命',percent:true,value:22}]}]}
  const states=panelSurvivalStates(character,[{label:'shield',effects:{hp:1,shieldAttack:5,attack:.5,shieldFixedHp:15*.2/2.5}}],{})
  const value=states[0].comparisons[0].physical
  near(value.withoutShield,(1.52/1.3)*2)
  near(value.factors.shield,5/2.5*(1.48/1.3)*1.5+1.2)
  const defense=panelSurvivalStates({id:999,exclusivePassives:[]},[{label:'defense',effects:{defense:1}}],{})[0].comparisons[0]
  near(defense.physical.withoutShield,calcDamageRate(6000000,11950,c.cDef,c.cPen)/calcDamageRate(12000000,11950,c.cDef,c.cPen))
})
test('panel recalibration preserves historical stages and the three auxiliary axes',()=>{
  const records=read('../doc/character-ratings/v6/review.json').records,baseline=read('../doc/character-ratings/v6/panel-baseline.json').records
  for(const r of records){
    assert.equal(r.sourceHash,baseline[r.id].sourceHash)
    assert.equal(createHash('sha256').update(JSON.stringify(r.axes.slice(4))).digest('hex'),baseline[r.id].auxiliaryAxesHash)
    assert.equal(r.outputCalibration.panel.version,p.version)
    assert.ok(Object.values(r.output.stages).every(s=>!s.config.panelVersion))
    for(const samples of Object.values(r.outputCalibration.samples)){
      near(samples.reduce((n,s)=>n+s.weight,0),1)
      assert.ok(samples.every(s=>s.config.panelVersion===p.version))
    }
  }
})
