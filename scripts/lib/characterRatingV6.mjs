import { referenceFor } from './characterRatingV5.mjs'
import { damageReference as legacyDamageReference, criticalExtension } from '../../src/utils/characterRatingModel.js'
import { newCharacters } from '../../doc/character-ratings/v6/new-characters.mjs'
import { sourceUpdates } from '../../doc/character-ratings/v6/source-updates.mjs'

import { panelDamageReference, PANEL_BASE_DAMAGE, CHARACTER_RATING_PANEL } from '../../src/utils/characterRatingPanel.js'

export function stageReference(c,config) {
  const current=config.panelVersion===CHARACTER_RATING_PANEL.version
  const damageReference=current?panelDamageReference:legacyDamageReference
  const baseDamage=current?PANEL_BASE_DAMAGE:.3125
  // Petra's passive replaces normals; Rosalie's post-S2 source attack is for nearby allies.
  const applied={...config,effects:{...(c.id===88?{attackFromHp:0}:{}),...config.effects},components:{...(c.id===14?{N:'2.2,2,0'}:{}),...(c.id===97?{S1:'4.2,1,5'}:{}),...config.components}}
  const ref=referenceFor(c,{...applied,authored:newCharacters[c.id]})
  if(c.id===156) for(const snapshot of ref.snapshots) {
    if(snapshot.enemies===1 && !config.components?.S1) {
      const skill=snapshot.skills.S1
      const segment=damageReference({coefficient:30.6},skill.effects,1,0,ref.weapon.attack)
      skill.components=[{coefficient:30.6,hits:1,targets:1,basis:'attack'}]
      Object.assign(skill,{segments:[segment],damage:segment.damage,equivalentBasicHits:segment.equivalentBasicHits})
    }
    const skill=snapshot.skills.S2
    for(let i=0;i<skill.components.length;i++) if(skill.components[i].basis==='primary-direct') {
      // Explicit guaranteed critical: only the confirmed critical multiplier;
      // do not import attack, defense or the unconfirmed damage bucket.
      const segment=skill.segments[i]
      const critical=current?1+CHARACTER_RATING_PANEL.baseCritDamage+CHARACTER_RATING_PANEL.extraCritDamage:1.5
      segment.factors.critical=critical
      segment.damage*=critical
      segment.equivalentBasicHits*=critical
    }
    skill.damage=skill.segments.reduce((n,s)=>n+s.damage,0)
    skill.equivalentBasicHits=skill.damage/baseDamage
    snapshot.perAction=ref.cycle.cycle.reduce((n,key)=>n+snapshot.skills[key].equivalentBasicHits,0)/ref.cycle.cycle.length
    snapshot.twoActiveTotal=snapshot.skills.S1.equivalentBasicHits+skill.equivalentBasicHits
  }
  // These special attacks already calculate the correct target count; expose
  // their real components instead of the v5 zero-coefficient dispatch placeholder.
  if([20,60,74].includes(c.id)) for(const snapshot of ref.snapshots) {
    const slot=c.id===74?'S1':'S2',skill=snapshot.skills[slot]
    skill.components=[{coefficient:skill.segments[0].factors.coefficient,hits:1,targets:c.id===74?1:3,basis:'fixed-direct'}]
  }
  if(c.id===130&&config.fourEventReplay) for(const snapshot of ref.snapshots) {
    const skill=snapshot.skills.S1
    const segments=[.3,.4].map(attack=>damageReference({coefficient:6.7,hits:4,targets:0},{...skill.effects,attack},snapshot.enemies,0,ref.weapon.attack))
    Object.assign(skill,{segments,damage:segments.reduce((n,s)=>n+s.damage,0),equivalentBasicHits:segments.reduce((n,s)=>n+s.equivalentBasicHits,0),eventCounts:[3,4]})
    snapshot.perAction=ref.cycle.cycle.reduce((n,key)=>n+snapshot.skills[key].equivalentBasicHits,0)/ref.cycle.cycle.length
  }
  if(c.id===8) for(const snapshot of ref.snapshots) {
    const chance=Math.min(1,.5+(config.effects?.critRate??.9)+.4)
    const chain=criticalExtension(6,10,chance), skill=snapshot.skills.S1
    const segment=damageReference({coefficient:5.25,hits:chain.expectedHits,targets:0},{...skill.effects,critRate:chance-.5},snapshot.enemies,0,ref.weapon.attack)
    Object.assign(skill,{damage:segment.damage,equivalentBasicHits:segment.equivalentBasicHits,segments:[segment],chain})
    snapshot.perAction=ref.cycle.cycle.reduce((n,key)=>n+snapshot.skills[key].equivalentBasicHits,0)/ref.cycle.cycle.length
  }
  const firstActions=[...ref.cycle.opening,...ref.cycle.cycle,...ref.cycle.cycle].slice(0,2)
  return {config,cycle:ref.cycle,snapshots:ref.snapshots,firstActions,openingDamage:ref.snapshots.map(s=>firstActions.reduce((n,key)=>n+s.skills[key].damage/baseDamage,0)),
    note:sourceUpdates[c.id]?.output.note??ref.note}
}
