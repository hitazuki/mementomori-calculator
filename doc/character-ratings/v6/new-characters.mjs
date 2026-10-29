// New v6 reviews have no historical six-axis scores. All levels and three
// weapon tiers were reviewed against the catalog; hashes are review evidence.
export const newCharacters = {
  156: {
    sourceHash: 'c223353fb9e5b50e34f564b9405909f1eca086e081a8095ff5a0b6c7e6d7c62c',
    reviewedAt: '2026-10-29',
    input: { S1: '10.2,1,3', S2: '8.7,5,0+p15,3,1', N: '1,1,1' },
    effects: { damage: .5 },
    note: '每层5%输出伤害，10层共50%；高血每回合2层，第5回合满层，低血每回合1层。满层S1为1020%三目标、单敌三倍；S2为870%随机5连击并追击3次力量1500%直接伤害，追击明示必暴，仅追加确认的暴击乘区。',
    growth: { event: '回合开始附加层数', initial: 0, cap: 10, perEvent: 2, totalEvents: 5, detail: '自身生命至少50%时每回合2层，最快第5回合满；低血每回合1层，最迟第10回合满；不消耗、不重置，死亡仍可给友军附层。' },
    lifecycle: { activeWindow: '开局50%减伤与75%阻绝，无需先行动；受击后存活才对该敌人叠层，后续攻击每层再加3%阻绝，最高90%', replenishment: '常驻减伤与基础阻绝不消耗；敌方每次攻击后存活附1层，最高5层，无回复渠道', afterExpiry: '敌人行动结束解除其全部层数，下一次攻击不预支90%阻绝；自身无治疗、护盾或复活' },
    states: [
      { label: '首击或敌人行动结束后', effects: { reduction: .5, block: .75 }, evidence: ['P1','P2'] },
      { label: '同一敌人已有5层，下一次攻击前', effects: { reduction: .5, block: .9 }, evidence: ['P1','P2'] },
    ],
    auxiliary: [
      { key: 'protection', score: 2, reason: 'P2存活受击后降低该敌人5%防御穿透每层，最多25%；敌人行动结束即解除，保护后续友军的窗口有限。75%至90%阻绝仅保护自身。' },
      { key: 'support', score: 8, reason: 'P1每回合给2名最高攻击其他友军叠输出伤害，每层5%、最高50%，无法驱散；自身高血每回合2层，最快第5回合满层，低血较慢，死亡仍可附层。' },
      { key: 'control', score: 0, reason: '无沉默、晕厥、减速等行动干扰。' },
    ],
    conditions: '最高专武攻击+18%、防御穿透7000与物魔防御穿透7000已计入。高血最快第5回合满层；开局不预支满层追击。力量直接伤害明示必暴，按基础暴伤计，不额外套攻击、双防或未确认的增伤区。',
    tags: 'damageUp@P1+W,accuracy@P1+W,reduction@P1,block@P2,penetrationDown@P2,direct@S2,critical@S2',
  },

  157: {
    sourceHash: '099a8fcd947031fc77e2a8779a446a8dd5ac5bf01da08ccb1ff2c3d9c5769bd9',
    reviewedAt: '2026-10-15',
    input: { S1: '6.4,1,5', S2: '12.8,5,1', N: '1,1,1' },
    effects: { attack: .6, specificDefenseDown: .2 },
    note: '暂定评分：专武被动属性缺失，不补造。S1为640%五目标群攻；S2为320%最低魔防单体5连击，第3次升至960%、第4次起1280%。',
    growth: { event: '每回合开始自身作为法师获得2层神圣指引', initial: 0, cap: 12, perEvent: 2, totalEvents: 6,
      detail: '自身每回合2层，每层5%攻击/命中，第6回合满60%；主攻友军法师同速、非法师每回合1层。S2第3/4次施放提高倍率，CD4且无加速冷却时约第10/14回合；不提前计入前两行动。' },
    stages: { thirdCast: { effects: { attack: .6 }, components: { S2: '9.6,5,1' } } },
    lifecycle: {
      activeWindow: 'P2开局75%减伤常驻；P1开局自身流金200%攻击盾3回合，第2次起流金600%，非流金始终100%',
      replenishment: 'P1每结束3次自身行动后可在回合开始补盾，持续3回合；第13回合起停止补发，提前破盾有空窗',
      afterExpiry: '无冷却干预时约第1/4/7/10回合补盾，最后护盾到期后仅保留75%减伤；自身无治疗或复活，不把第14回合S2第四次与持续补盾合并' },
    states: [
      { label: '开局盾；不预支同回合指引顺序', effects: { reduction: .75, shieldAttack: 2 }, evidence: ['P1','P2'] },
      { label: '第4回合第二次补盾，指引8层参照', effects: { reduction: .75, shieldAttack: 6, attack: .4 }, evidence: ['P1','P2'] },
      { label: '第7/10回合，满指引且完整护盾', effects: { reduction: .75, shieldAttack: 6, attack: .6 }, evidence: ['P1','P2'] },
      { label: '提前破盾或最后护盾到期后', effects: { reduction: .75 }, evidence: ['P1','P2'] },
    ],
    auxiliary: [
      { key: 'protection', score: 8, reason: 'P1与W保护2名主攻友军：流金目标初次200%攻击盾、第二次起600%，非流金100%；盾3回合、间隔3次自身行动，第13回合起不再补发。S1使5敌弱化命中降低30%，持续4回合；不等于稳定免控。' },
      { key: 'support', score: 8, reason: 'P2每回合给1名主攻友军5%攻击与命中，法师每回合10%，最高60%且无法驱散；S1攻击前降低5敌20%魔防，持续4回合、CD4。增益选择按最高攻击，不保证固定同一人满层。' },
      { key: 'control', score: 0, reason: '无沉默、晕厥、减速等行动干扰。' },
    ],
    conditions: '暂定评分：当前MB缺少专武被动属性，暂按无额外专武属性计算。流金护盾强化按合理配队满足；护盾早期停止补发，S2高倍率另需第3/4次施放。减魔防需弱化生效；回合开始盾与加攻顺序未确认，开局盾不预支指引加攻。',
    tags: 'attack@P2,accuracy@P2,reduction@P2,shield@P1+W,accuracyDown@S1,defenseDown@S1',
  },
  155: {
    sourceHash: 'ae1c581614f5a3a7af0fccf642c8a4fb30c8a8e5c645303721c83db0e995e2e7',
    reviewedAt: '2026-10-15',
    input: { S1: '3.2,8,0', S2: '5.4,10,0', N: '1,1,1' },
    effects: { attack: .59 },
    slots: { S1: { damage: .28 }, S2: { damage: .4 } },
    note: 'S1为320%随机8连击，攻击前70%概率附加40%易伤；S2为360%随机10连击，目标已有弱化时升至540%。成熟条件取易伤已生效及第2回合加攻达到上限；随机连击可分散。',
    growth: { event: '仅第1回合全队实际自损总量', initial: 0, cap: .59, perEvent: 0, totalEvents: null,
      detail: '第2回合仅结算一次来源加攻=min(第1回合全队实际自损总量×30%, 生效前攻击×50%)；统一面板上限0.59，之后不重复成长。自身满血S1两次20%当前生命自损合计1.08，给0.324加攻；来伤或其他顺序会改变实际量。' },
    lifecycle: {
      activeWindow: 'P2开局自身与2名主攻友军结界3回合：初始5%阻绝，每次全队受击或自损后增加3%，最多50%；15次事件达上限，不能保护触发前伤害',
      replenishment: '结界仅开局一次，不补发；4次事件为17%阻绝，持续期内仍可继续成长',
      afterExpiry: '第4回合起结界消失，无额外防护或回复；S1两次、S2一次20%当前生命自损持续消耗生命，自身死亡解除友军结界' },
    states: [
      { label: '开局，首次受击前', effects: { block: .05 }, evidence: ['P2'] },
      { label: '累计4次受击/自损后，结界尚在', effects: { block: .17 }, evidence: ['P2'] },
      { label: '累计15次受击/自损后，结界尚在', effects: { block: .5 }, evidence: ['P2'] },
      { label: '第4回合起结界到期', effects: {}, evidence: ['P2'] },
    ],
    auxiliary: [
      { key: 'protection', score: 7, reason: 'P2与W开局给2名主攻友军结界3回合，阻绝5%起、全队累计15次受击或自损后达50%；4次事件仅17%。仅一次且自身死亡即解除，不能按常驻全队50%阻绝。' },
      { key: 'support', score: 8, reason: 'S1随机8连击，攻击前70%概率附加40%易伤；合理至少2名其他业红友军时持续2回合，CD4。强易伤可辅助队友，但随机分散、弱化抵抗及覆盖空窗限制可靠性。' },
      { key: 'control', score: 0, reason: '无沉默、晕厥、减速等行动干扰。' },
    ],
    conditions: '最高专武攻击+18%、防御穿透7000已计入；力量+8%不擅自换成攻击。P1仅第2回合结算第1回合实际自损，满加攻与S2强化均为条件样本；易伤持续2回合按至少2名其他业红友军满足。结界只持续开局3回合。',
    tags: 'attack@P1,speed@P1,block@P2+W,vulnerability@S1',
  },
  154: {
    sourceHash: '3eadbd3509939fe596c0b2b241bec2fd4576c596399649ea91763ae7a98a5b31',
    reviewedAt: '2026-09-30',
    input: { S1: '7.2,1,3', S2: '21.6,4,0', N: '1,1,1' },
    note: 'S1为720%三目标群攻；S2为540%随机四连击，累计15次全队主动恢复后升至2160%四连击。吸血与圣剑光辉的被动恢复不计数，未知队友频率不换算回合。',
    growth: { event: '全队主动恢复事件', initial: 0, cap: 15, perEvent: 1, totalEvents: 15,
      detail: '累计15次主动恢复解锁S2四倍伤害；自身S1/S2各触发1次，CD均4，无计数消耗或重置描述。4次事件仍未强化；不把15次门槛预支为首轮。' },
    lifecycle: {
      activeWindow: 'P2开局生命+100%、减伤60%常驻；首行动才追加自身与1名主攻友军生命+30%、魔防+30%，生命条件按合理属性队满足',
      replenishment: '每次全队主动恢复将全体圣剑光辉补至3层；魔法攻击后仍存活才消耗1层，回复承伤80%且不超过该目标最大生命20%',
      afterExpiry: '光辉耗尽后仍保留常驻生命与减伤；物理攻击不触发光辉恢复，致命伤后不能回血，自身死亡解除全队光辉' },
    states: [
      { label: '先行动前', effects: { hp: 1, reduction: .6 }, evidence: ['P2'] },
      { label: '首行动后，合理属性队', effects: { hp: 1.3, magicDefense: .3, reduction: .6 }, evidence: ['P2'] },
      { label: '光辉耗尽，常驻增益保留', effects: { hp: 1.3, magicDefense: .3, reduction: .6 }, evidence: ['P1', 'P2'] },
    ],
    auxiliary: [
      { key: 'protection', score: 6, reason: 'P2首行动给1名主攻友军30%生命与30%魔防；S1全队30%弱化抵抗2回合、CD4。P1全队3层受魔法伤后回血，须存活、每次80%承伤且封顶20%最大生命，主动恢复补层；双主动仅小额低血单疗，自身死亡解除光辉。' },
      { key: 'support', score: 0, reason: '无友军增伤、加攻、加速、减防或驱散等进攻辅助。' },
      { key: 'control', score: 0, reason: '无沉默、晕厥、减速等行动干扰。' },
    ],
    conditions: '最高专武攻击+18%已计入；弱化抗性与抗暴评级不折固定减伤。P2生命条件按至少2名同属性或天光其他友军满足；15次计数只认主动恢复，不含吸血或光辉被动回复。',
    tags: 'health@P2,reduction@P2,defense@P2,heal@S1+S2+P1,resistance@S1+stats',
  },
}
