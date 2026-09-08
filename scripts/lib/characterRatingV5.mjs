import fs from 'node:fs'
import { damageReference, ratingCycle, growthRequirement, criticalExtension, RATING_PANEL } from '../../src/utils/characterRatingModel.js'
import { effects, skillEffects, componentOverrides, singleOverrides, scenarioEffects, outputNotes } from '../../doc/character-ratings/v5/decisions.mjs'
import { dots, external } from '../../doc/character-ratings/v5/secondary-inputs.mjs'

const folder = new URL('../../doc/character-ratings/v5/', import.meta.url)
export const readRows = name => fs.readFileSync(new URL(name, folder), 'utf8').trim().split(/\r?\n/).filter(s => s && !s.startsWith('#')).map(s => s.split('|'))
const inputs = new Map(readRows('attack-inputs.txt').map(([id,...rest]) => [+id, Object.fromEntries(['S1','S2','N'].map((key,i)=>[key,rest[i]]))]))
const growth = new Map(readRows('growth.txt').map(([id,event,initial,cap,perEvent,detail]) => [+id, {event,initial:+initial,cap:+cap,perEvent:+perEvent,detail}]))
const lifecycle = new Map(readRows('lifecycle.txt').map(([id,activeWindow,replenishment,afterExpiry]) => [+id,{activeWindow,replenishment,afterExpiry}]))
const parse = expression => expression.split('+').map(part => {
  const [coefficient,hits,targets] = part.replace(/^p/,'').split(',').map(Number)
  return {coefficient,hits,targets,basis:part.startsWith('p')?'primary-direct':'attack'}
})
export function weaponReference(character) {
  const result = {attack:0,hp:0,defense:0,primary:0,critDamage:0,penetration:0,specificPenetration:0,excluded:[]}
  for (const p of character.exclusivePassives.at(-1)?.parameters ?? []) {
    const map = {'攻击力':'attack','生命':'hp','防御力':'defense','暴击伤害强化':'critDamage','力量':'primary','魔力':'primary','战技':'primary'}
    if (map[p.name] && p.percent) result[map[p.name]] += p.value/100
    else if (p.name === '防御穿透' && !p.percent) result.penetration += p.value/1725
    else if (p.name === '物魔防御穿透' && !p.percent) result.specificPenetration += p.value/16660
    else result.excluded.push({name:p.name,value:p.value,percent:p.percent,reason:'命中/抗暴/吸血另作可靠性或续航评价；基础属性派生及未确认的评级换算不伪装成固定最终倍率。'})
  }
  return result
}

function criticalChain(coefficient, hits, chance, weapon, additions = {}) {
  // After the first critical, remaining hits are guaranteed. First hit remains stochastic.
  return Array.from({length:hits},(_,i) => damageReference({coefficient}, {...additions,critRate:1-(1-chance)**(i+1)-.5,critDamage:weapon.critDamage},1,0,weapon.attack))
}

export function referenceFor(character, stage = {}) {
  const id = character.id, input = inputs.get(id)
  if (!input || !outputNotes[id]) throw new Error('Missing authored attack review '+id)
  const weapon = weaponReference(character)
  const base = {...effects[id],...stage.effects}
  if(id===38||id===89) base.attack*=1+weapon.attack
  for (const k of ['primary','critDamage','penetration','specificPenetration']) base[k] = (base[k]??0)+weapon[k]
  const components = {...input,...componentOverrides[id],...stage.components}
  const active = character.skills.filter(s=>/^S[12]$/.test(s.slot) && !stage.disabled?.includes(s.slot)).map(s=>({slot:s.slot,cooldown:s.cooldown}))
  // These changes recur in the mature form. Finite transformations are kept out.
  if (id===83 && !stage.early) active.find(s=>s.slot==='S2').selfReduction=5
  if (id===126) active.find(s=>s.slot==='S2').selfReduction=1
  const cycle = ratingCycle(active, id===109 ? {normalReduction:1,normalEvery:3}: {})
  const snapshots = [1,5].map(enemies => {
    const variants = {...components,...(enemies===1?singleOverrides[id]:{}),...stage.components,...stage.scenarios?.[enemies]?.components}
    const mode = enemies===1?'single':'area'
    const skills = Object.fromEntries(['S1','S2','N'].map(slot => {
      const components = parse(variants[slot])
      const state = {...base,...scenarioEffects[id]?.[mode],...skillEffects[id]?.[slot]}
      if (id===9 && slot==='S2') delete state.guaranteedCrit
      if (id===27 && enemies===1 && slot==='S2') state.defenseDown=.8
      if (id===58 && slot==='S2') Object.assign(state,{specificDefenseDown:.4,damage:.2})
      if (id===132 && slot==='S2') Object.assign(state,{specificDefenseDown:.4,damage:.2})
      Object.assign(state,stage.scenarios?.[enemies]?.effects,stage.slots?.[slot],stage.scenarios?.[enemies]?.slots?.[slot])
      // Weapon contributions are additional to skill increments, including slot overrides.
      for (const k of ['critDamage','penetration','specificPenetration']) if (skillEffects[id]?.[slot]?.[k]!==undefined) state[k]+=weapon[k]
      let results = components.map(component=>damageReference(component,state,enemies,0,weapon.attack))
      if (id===16 && slot==='S1') results.push({damage:results[0].damage*.25,equivalentBasicHits:results[0].equivalentBasicHits*.25,factors:{derivedFrom:'S1 actual damage',fraction:.25}})
      if ((id===15 && slot==='S1')||(id===70 && slot==='S2')) {
        const first = components[0], chance=id===70?.9:.5
        results = criticalChain(first.coefficient,first.hits,chance,weapon)
        if (id===70) results.push(damageReference({...components[1],hits:1-(1-chance)**4},{...state,guaranteedCrit:true},1,0,weapon.attack))
      }
      if (id===18 && slot==='S1') {
        results=Array.from({length:6},(_,i)=>{
          // Expected attack at hit i, based on at least one earlier critical.
          const chance=stage.early ? Math.min(1,.5+(state.critRate??0)) : .8
          return damageReference({coefficient:5.15},{...state,attack:.5*(1-(1-chance)**i)},1,0,weapon.attack)
        })
      }
      if (id===33 && slot==='S1') results=Array.from({length:5},(_,i)=>damageReference({coefficient:2.3},{...state,attack:.1*i*.5},1,0,weapon.attack))
      if (id===65 && slot==='S2') results=Array.from({length:3},(_,i)=>damageReference({coefficient:components[0].coefficient,hits:1,targets:2},{...state,defenseDown:.15*i},enemies,0,weapon.attack))
      if (id===20 && slot==='S2') results=[damageReference({coefficient:3*(1+weapon.hp)*.35,targets:3,basis:'fixed-direct'},{},enemies)]
      if (id===60 && slot==='S2') results=[damageReference({coefficient:3*(2.2+weapon.hp)*(stage.pastDamageHp??2)*.2,targets:3,basis:'fixed-direct'},{},enemies)]
      if (id===74 && slot==='S1') results=[damageReference({coefficient:Math.min(3*.2,5*(1+weapon.attack)),basis:'fixed-direct'},{},enemies)]
      const damage=results.reduce((n,r)=>n+r.damage,0)
      const dot=dots[id]?.slot===slot?dots[id]:null
      const targetCount=dot?Math.min(dot.targets,enemies):0
      const delayed=!dot?0:dot.chance*(dot.basis==='currentHp'?3*(1-(1-dot.value)**dot.ticks)*targetCount:
        dot.basis==='actualDamage'?damage*dot.value*dot.ticks:(1+weapon.attack+(state.attack??0))*dot.value*dot.ticks*targetCount)
      return [slot,{components,effects:state,segments:results,damage,delayedDamage:delayed,delayedAssumptions:dot,
        equivalentBasicHits:(damage+delayed)/.3125}]
    }))
    return {enemies,skills,perAction:cycle.cycle.reduce((sum,slot)=>sum+skills[slot].equivalentBasicHits,0)/cycle.cycle.length,
      twoActiveTotal:skills.S1.equivalentBasicHits+skills.S2.equivalentBasicHits}
  })
  const g = growth.get(id)
  const burst = id===8 ? {
    assumptions:'标准有效基础暴率50%；S1攻击前40%抗暴率下降成功生效，所有段命中。专武暴击评级不直接换算暴率；敌方额外抗暴、弱化抵抗及目标差异未模拟。',
    samples:[0,1,2,9,15].map(round=>{
      const passiveCrit=Math.min(15,round)*.06
      const chance=Math.min(1,RATING_PANEL.critRate+passiveCrit+.4)
      const chain=criticalExtension(6,10,chance)
      const result=damageReference({coefficient:5.25,hits:chain.expectedHits,targets:0},{...base,critRate:passiveCrit+.4},1,0,weapon.attack)
      return {round,critChance:chance,...chain,...result}
    }),
    limitation:'0回合样本为不计被动成长的对照；S1的减抗暴仅用于该技能，不延续到下一回合S2。S2击杀追击不计单个存活敌人的常态。',
  } : undefined
  const coverage = Math.max(...['S1','S2'].flatMap(slot=>parse(components[slot]).filter(c=>c.coefficient>0).map(c=>c.targets===0?5*(1-.8**c.hits):Math.min(5,c.targets))), ...([20,60].includes(id)?[3]:[1]))
  const phase = id===61 ? {label:'神咒解放8回合窗口；不是永久循环',duration:8,afterExpiryCycle:ratingCycle(active.filter(s=>s.slot!=='S2')).cycle,
    afterExpiryPerAction:snapshots.map(s=>(s.skills.S1.equivalentBasicHits+3*s.skills.N.equivalentBasicHits)/4)} : null
  return {panel:RATING_PANEL,weapon,cycle,snapshots,coverage,phase,...(burst?{burst}:{}),growth:g?{...g,totalEvents: id===36||id===137?null:growthRequirement(g)}:null,
    lifecycle:lifecycle.get(id)??{activeWindow:'无可确认自身防护',replenishment:'无补充渠道',afterExpiry:'无额外长期生存机制'},
    note:outputNotes[id],external:external[id]??null,
    externalSamples:id===60?[0,1,2,4].map(hp=>({past20RoundsDamageInMaxHp:hp,perTargetDirectDamage:3*(2.2+weapon.hp)*hp*.2})):id===74?[3,30,300].map(hp=>({enemyCurrentHp:hp,perTargetDirectDamage:Math.min(hp*.2,5*(1+weapon.attack))})):null,
    limitations:['固定面板成熟条件快照；循环不模拟敌方行动、控制和速度。','延迟伤害按完整持续期、不净化且目标存活的条件样本，当前生命毒逐次递减，不能当首行动爆发。','直接/外部伤害不套未经证实的乘区；见该角色原文及专项说明。']}
}
