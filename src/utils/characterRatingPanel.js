// Shared editorial reference; independent of the raid's guaranteed-critical mode.
// Ratios describe the common panel after its 30% ATK/HP bonus, before EX stats.
export const CHARACTER_RATING_PANEL = Object.freeze({
  version: 'panel-reference-2026-10-30', level: 500,
  attack: 1, hp: 2.5, primary: .2, defenseToAttack: .2,
  panelAttackBonus: .3, panelHpBonus: .3,
  critRate: .5, baseCritDamage: .5, extraCritDamage: .6,
  defense: 6000000, physicalDefense: 6000000, magicDefense: 6000000,
  penetration: 11950, specificPenetration: 65700,
  damageBonus: 0, elementAdvantage: 0,
})
// Exact Lv500 row in src/constants/level_coefficient.csv; tested against it.
export const RATING_LEVEL_COEFFICIENTS = Object.freeze({cDef:834953,cPdef:1382434,cMdef:1341126,cPen:1725,cPmPen:16660})
export const panelStatFactor = (extra, kind='attack') => (1+CHARACTER_RATING_PANEL[kind==='hp'?'panelHpBonus':'panelAttackBonus']+extra)/(1+CHARACTER_RATING_PANEL[kind==='hp'?'panelHpBonus':'panelAttackBonus'])
export function ratingDamagePass(defense, penetration, defenseConstant, penetrationConstant) {
  return defenseConstant/(Math.max(0,defense)*penetrationConstant/(Math.max(0,penetration)+penetrationConstant)+defenseConstant)
}
export function panelDefensePass(effects={},damageType='physical') {
  const p=CHARACTER_RATING_PANEL,c=RATING_LEVEL_COEFFICIENTS
  const defense=ratingDamagePass(p.defense*(1-(effects.defenseDown??0)),(p.penetration+(effects.flatPenetration??0))*(1+(effects.penetration??0)),c.cDef,c.cPen)
  const magic=damageType==='magic'
  const specific=ratingDamagePass(p[magic?'magicDefense':'physicalDefense']*(1-(effects.specificDefenseDown??0)),(p.specificPenetration+(effects.flatSpecificPenetration??0))*(1+(effects.specificPenetration??0)),c[magic?'cMdef':'cPdef'],c.cPmPen)
  return defense*specific
}
// One fixed physical reference for all characters, including magic/direct attacks.
export const PANEL_BASE_DAMAGE = (1+CHARACTER_RATING_PANEL.critRate*(CHARACTER_RATING_PANEL.baseCritDamage+CHARACTER_RATING_PANEL.extraCritDamage))*panelDefensePass()
export function panelDamageReference(component,effects={},enemies=1,damageBonus=0,gearAttack=0) {
  const p=CHARACTER_RATING_PANEL,v=key=>effects[key]??0
  const {coefficient,hits=1,targets=1,basis='attack'}=component
  if(![1,5].includes(enemies)||![coefficient,hits,targets,damageBonus,gearAttack].every(n=>Number.isFinite(n)&&n>=0))throw Error('Invalid panel damage input')
  if(!['attack','primary-direct','attack-direct','fixed-direct'].includes(basis))throw Error('Unsupported panel damage basis')
  for(const [key,value]of Object.entries(effects)){
    if(key==='damageType'){if(!['physical','magic'].includes(value))throw Error('Invalid damage type')}
    else if(key==='guaranteedCrit'){if(typeof value!=='boolean')throw Error('Invalid critical condition')}
    else if(!Number.isFinite(value)||value<(key==='critRate'?-.5:0))throw Error('Invalid panel effect: '+key)
  }
  const attack=panelStatFactor(gearAttack)*(1+v('attack'))+v('attackFromHp')*p.hp*panelStatFactor(v('panelHp'),'hp')+v('attackFromDefense')*p.defenseToAttack*(1+v('panelDefense'))
  const critical=component.canCrit===false||basis!=='attack'?1:1+(effects.guaranteedCrit?1:Math.max(0,Math.min(1,p.critRate+v('critRate'))))*(p.baseCritDamage+p.extraCritDamage+v('critDamage'))
  const defense=basis==='attack'?panelDefensePass(effects,effects.damageType??'physical'):1
  const source=basis==='fixed-direct'?1:basis==='primary-direct'?p.primary*(1+v('primary')):attack
  const bonus=basis==='attack'||component.damageBucket===true?1+damageBonus+v('damage'):1
  const count=hits*(targets===0?1:Math.min(targets,enemies)),damage=coefficient*count*source*critical*defense*bonus
  return {damage,equivalentBasicHits:damage/PANEL_BASE_DAMAGE,factors:{coefficient,count,source,critical,defense,bonus}}
}
