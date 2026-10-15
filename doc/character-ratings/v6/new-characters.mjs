// New v6 reviews have no historical six-axis scores. All levels and three
// weapon tiers were reviewed against the catalog; hashes are review evidence.
export const newCharacters = {
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
