import { openingSpeed, laterSpeed, actionDefense } from '../../doc/character-ratings/v6/initiative.mjs'

export function defenseInitiative(character, baseScore) {
  const [bonus,source]=openingSpeed[character.id]??[0,'无已确认的自身开局加速']
  const effectiveSpeed=character.speed*(1+bonus)
  const gate=actionDefense[character.id]
  // Editorial reference tiers, not win probabilities or an action-order simulator.
  const speedCost=effectiveSpeed<3000?2:effectiveSpeed<3300?1:0
  const gapCost=gate?.action===2?1:0
  const penalty=gate?Math.min(gate.limit,speedCost+gapCost,Math.max(0,baseScore-gate.floor)):0
  const note=gate?`防护开启前速度约${Math.round(effectiveSpeed)}（基础${character.speed}${bonus?`，${source}`:''}）；${gate.note}${penalty?`开启空窗修正−${penalty}分。`:'不再扣速度分。'}`:''
  return {version:'defense-initiative-v1',baseSpeed:character.speed,openingBonus:bonus,effectiveSpeed,source,
    later:laterSpeed[character.id]??null,gate:gate??null,speedCost,gapCost,penalty,baseScore,score:baseScore-penalty,note}
}
