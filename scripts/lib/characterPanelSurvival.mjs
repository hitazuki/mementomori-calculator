import { CHARACTER_RATING_PANEL as panel, RATING_LEVEL_COEFFICIENTS as coeff, panelStatFactor, ratingDamagePass } from '../../src/utils/characterRatingPanel.js'
import { weaponReference } from './characterRatingV5.mjs'

export function panelSurvivalStates(character,states,output) {
  const weapon=weaponReference(character)
  const historical=character.id<154
  return states.map(state=>{
    const e={...state.effects}
    // Historical v5 authors pre-added weapon stats. Recover skill increments
    // before separating panel and combat channels; keep the input snapshot.
    const attack=(e.attack??0)-(historical?weapon.attack:0)
    const hp=(e.hp??0)-(historical?weapon.hp:0)
    const defense=(e.defense??0)-(historical?weapon.defense:0)
    const attackScale=panelStatFactor(weapon.attack)*(1+Math.max(0,attack))
    const hpFromAttack=(e.hpFromAttack??0)/(historical?1+weapon.attack:1)*panelStatFactor(weapon.attack)/panel.hp
    const hpScale=panelStatFactor(weapon.hp,'hp')*(1+Math.max(0,hp))+hpFromAttack
    let fixedShield=e.shieldFixedHp??0
    if(character.id===65)fixedShield*=panel.primary/.25*3/panel.hp
    const damageShield={29:['S1',.4],35:['S2',.3],38:['S2',.4],74:['S1',1]}[character.id]
    if(damageShield&&fixedShield){
      const index=state.label.includes('5目标')?1:0
      fixedShield=output.snapshots[index].skills[damageShield[0]].damage*damageShield[1]/panel.hp
    }
    const shield=(e.shieldAttack??0)*attackScale/panel.hp+(e.shieldHp??0)*hpScale+fixedShield
    const comparisons=[0,.25,1].map((damageBonus,i)=>{
      const result=type=>{
        const magic=type==='magic',specificBase=panel[magic?'magicDefense':'physicalDefense'],specificCoeff=coeff[magic?'cMdef':'cPdef']
        const beforeDef=ratingDamagePass(panel.defense,panel.penetration,coeff.cDef,coeff.cPen)
        const afterDef=ratingDamagePass(panel.defense*(1+weapon.defense)*(1+Math.max(0,defense)),panel.penetration,coeff.cDef,coeff.cPen)
        const beforeSpecific=ratingDamagePass(specificBase,panel.specificPenetration,specificCoeff,coeff.cPmPen)
        const afterSpecific=ratingDamagePass(specificBase*(1+(e[magic?'magicDefense':'physicalDefense']??0)),panel.specificPenetration,specificCoeff,coeff.cPmPen)
        const reduction=(1+damageBonus)/(1+damageBonus-(e.reduction??0)),block=1/(1-(e.block??0))
        const factors={hp:hpScale,defense:beforeDef/afterDef,specificDefense:beforeSpecific/afterSpecific,damage:reduction,block,shield}
        const multiplier=factors.defense*factors.specificDefense*reduction*block
        return {factors,withoutShield:hpScale*multiplier,withShield:(hpScale+shield)*multiplier}
      }
      return {scenario:['neutral','reference','pressure'][i],physical:result('physical'),magic:result('magic')}
    })
    return {...state,panelVersion:panel.version,panelEffects:{hp:Math.max(0,hp),attack:Math.max(0,attack),defense:Math.max(0,defense),weaponHp:weapon.hp,weaponAttack:weapon.attack,weaponDefense:weapon.defense,attackScale,hpScale,shield},comparisons}
  })
}
