// Four total relevant events, including own skill events. These are per-skill
// state references, not a claim that both skills fit a single four-event trace.
const sample=(config,reason,extra={})=>({events:4,config,reason:`累计4次事件参照（分技能比较，非连续行动轨迹）；${reason}`,...extra})
export const fourEvents={
  75:sample({effects:{attack:.9},components:{S2:'5.8,7,0'}},'4次全队自损满40%加攻，合理红队另有50%；S2七段。'),
  80:sample({components:{S2:'4.8,4,0'}},'须自身收到主动恢复；4次未达6次门槛，S2仍为480%×4。'),
  89:sample({effects:{attack:.25},slots:{S1:{damage:.08},S2:{damage:.08}}},'4次全队自损给8%易伤；来源攻击按原文独立计算。'),
  92:sample({effects:{attack:.2},components:{S2:'4.8,1,3'}},'4次主动恢复给20%加攻；不预支第7回合三倍S2。'),
  93:sample({effects:{attack:.4},components:{S2:'11.4,7,0'}},'4次全队自损满40%加攻，S2为1140%×7。'),
  102:sample({scenarios:{1:{effects:{attack:.3}},5:{effects:{attack:.3}}}},'4次自损给20%加攻；另取1名弱化敌人的10%加攻，S2多种弱化不自动满足。'),
  103:sample({components:{S2:'4.8,1,3'}},'4次全队主动恢复未达15次门槛，S2仍为480%三目标；毒伤不提前结算。'),
  114:sample({effects:{attack:.2}},'4次全队主动恢复给20%加攻；不预支晚回合技能变化。'),
  124:sample({effects:{attack:.32}},'4次全队主动恢复给32%加攻；未达10次门槛。'),
  130:sample({effects:{attack:.4},components:{S1:'6.7,8,0',S2:'7.6,5,0'},fourEventReplay:true},
    'S1按第3次30%加攻、重放第4次40%逐波计算；S2按4层40%加攻，760%–1520%×5逐段受目标剩余生命影响。低血收尾约9档，血量保持时可达10档，上界不保证每段达到。',
    {upperConfig:{components:{S2:'15.2,5,0'}}}),
  132:sample({effects:{attack:.4}},'4次全队主动恢复给40%加攻；前期技能乘区不借用后期强化。'),
  148:sample({effects:{attack:.24},components:{S2:'5.4,5,0'}},'每主动自损2次，4次为2个主动；24%加攻、S2为540%×5，非满8层。'),
  150:sample({effects:{attack:.24,critRate:.24}},'4次全队主动恢复给24%攻击/暴率；S2仍需第7回合，不因计数满足提前解锁。'),
}
