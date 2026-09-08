import { referenceFor } from './characterRatingV5.mjs'
import { damageReference, criticalExtension } from '../../src/utils/characterRatingModel.js'

export function stageReference(c,config) {
  // Petra's passive replaces normals; Rosalie's post-S2 source attack is for nearby allies.
  const applied={...config,effects:{...(c.id===88?{attackFromHp:0}:{}),...config.effects},components:{...(c.id===14?{N:'2.2,2,0'}:{}),...(c.id===97?{S1:'4.2,1,5'}:{}),...config.components}}
  const ref=referenceFor(c,applied)
  if(c.id===8) for(const snapshot of ref.snapshots) {
    const chance=Math.min(1,.5+(config.effects?.critRate??.9)+.4)
    const chain=criticalExtension(6,10,chance), skill=snapshot.skills.S1
    const segment=damageReference({coefficient:5.25,hits:chain.expectedHits,targets:0},{...skill.effects,critRate:chance-.5},snapshot.enemies,0,ref.weapon.attack)
    Object.assign(skill,{damage:segment.damage,equivalentBasicHits:segment.equivalentBasicHits,segments:[segment],chain})
    snapshot.perAction=ref.cycle.cycle.reduce((n,key)=>n+snapshot.skills[key].equivalentBasicHits,0)/ref.cycle.cycle.length
  }
  const firstActions=[...ref.cycle.opening,...ref.cycle.cycle,...ref.cycle.cycle].slice(0,2)
  return {config,cycle:ref.cycle,snapshots:ref.snapshots,firstActions,openingDamage:ref.snapshots.map(s=>firstActions.reduce((n,key)=>n+s.skills[key].damage/.3125,0)),
    note:ref.note}
}
