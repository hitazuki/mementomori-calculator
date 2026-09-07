// Additional damage. Values describe the mature level and are NOT keyword extraction.
// DOT totals assume the target survives all ticks and is not cleansed; each target's
// damage-linked DOT uses that target's share, rather than multiplying the total twice.
export const dots = {
  3:{slot:'S2',basis:'attack',value:.35,ticks:2,targets:5,chance:1},
  10:{slot:'S1',basis:'currentHp',value:.05,ticks:2,targets:4,chance:1},
  13:{slot:'S1',basis:'attack',value:.07,ticks:3,targets:1,chance:1},
  19:{slot:'S1',basis:'attack',value:.1,ticks:2,targets:1,chance:1,condition:'目标高于50%生命'},
  20:{slot:'S1',basis:'attack',value:.25,ticks:4,targets:5,chance:1},
  23:{slot:'S2',basis:'attack',value:.1,ticks:2,targets:3,chance:.6},
  31:{slot:'S1',basis:'attack',value:.2,ticks:2,targets:1,chance:.5},
  33:{slot:'S2',basis:'attack',value:.1,ticks:1,targets:2,chance:.7},
  37:{slot:'S2',basis:'actualDamage',value:.2,ticks:2,targets:5,chance:1,condition:'晕厥判定后目标无弱化的互斥分支'},
  46:{slot:'S2',basis:'currentHp',value:.15,ticks:2,targets:5,chance:1,condition:'目标魔力低于自己'},
  59:{slot:'S2',basis:'attack',value:.5,ticks:1,targets:5,chance:1},
  68:{slot:'S2',basis:'actualDamage',value:.5,ticks:4,targets:1,chance:.7},
  71:{slot:'S1',basis:'currentHp',value:.05,ticks:4,targets:4,chance:1},
  82:{slot:'S1',basis:'attack',value:.5,ticks:1,targets:5,chance:.7},
  103:{slot:'S2',basis:'currentHp',value:.1,ticks:2,targets:3,chance:.7},
  105:{slot:'S2',basis:'currentHp',value:.05,ticks:1,targets:3,chance:1},
  108:{slot:'S2',basis:'actualDamage',value:.1,ticks:2,targets:5,chance:.7},
  125:{slot:'S1',basis:'attack',value:.5,ticks:2,targets:5,chance:1},
}
export const external = {
  17:'复活每场一次，承伤×15%直接伤害及反伤以实际来伤为基数，不能当每次行动追加。',
  28:'夺取增益的内容与叠加顺序取决于敌人，未假造通用最大攻击/防御。',
  34:'每次受击50%概率附加一回合攻击20%流血；没有敌方行动表，不虚构受击次数。',
  35:'共鸣取队友实际伤害×80%，归进攻辅助；不计为自己的重复攻击或盾生成来源。',
  41:'低于20%生命才追加力量340%直接伤害；剩余生命与击杀停止条件另评，不当全程。',
  49:'反伤取实际可反弹的来伤，物理来伤回复与反伤不能构成自给无限循环。',
  60:'承伤记录限定过去20回合；采用累计2倍自身最大生命的中段样本，不代表按20次固定攻击。',
  69:'反伤需要受到实际攻击；满血强化反伤不与盾耗尽后的状态拼接。',
  74:'min(20%目标当前生命,500%自身当前攻击)；按目标当前生命3/30/300个基础攻击单位比较封顶。',
  100:'复制增益每4行动一次，复制内容不可确定；不当确定攻击、防御或周期大盾。',
}
