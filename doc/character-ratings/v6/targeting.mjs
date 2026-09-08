// Reviewed against catalog skill text. These branches cannot be inferred from
// expected-damage components: kill follow-ups are excluded there, and mixed
// ally/enemy selection uses a fractional expectation rather than actual targets.
export const targetingReviews = {
  8: { S2: { add: ['single'], detail: '多目标群攻；击杀后追击单体', quote: '再对当前生命值最低的敌人追加' } },
  16: { S1: { add: ['single'], detail: '3目标群攻；追击最低生命百分比单体', quote: '对生命值百分比最低的敌人追加技能总伤害' } },
  17: { S1: { add: ['group'], detail: '单体连击；本回合击杀后追加5目标群攻', quote: '再随机对5名敌人追加' } },
  18: { S2: { add: ['single'], detail: '多目标群攻；击杀后追击单体', quote: '再对生命值百分比最低的敌人追加' } },
  47: {
    S1: { detail: '选定单体连击；目标死亡、透明或隐身时换敌', quote: '随机对1名敌人进行8次攻击' },
    S2: { add: ['group'], detail: '单体连击；击杀后追加5目标群攻', quote: '再随机对5名敌人追加' },
  },
  54: { S2: { replace: ['group'], detail: '敌我混选5目标；对敌伤害、对友治疗', quote: '随机对5名敌人与友军发动技能' } },
  96: { S2: { add: ['random'], detail: '最高攻击单体连击；概率追加随机单体攻击', quote: '每次攻击之后，30%概率随机对敌人追加' } },
  105: {
    S1: { detail: '3目标群攻，重复2次；满足层数时3次', quote: '随机对3名敌人造成' },
    S2: { detail: '攻击力最高的3目标群攻', quote: '对攻击力最高的3名敌人造成' },
  },
  123: { S2: { detail: '3目标群攻；仅剩1敌时改为3次单体攻击', quote: '如果存活在场上的敌人数为1名，攻击次数增加为3次' } },
}
