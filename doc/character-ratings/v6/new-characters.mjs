// New v6 reviews have no historical six-axis scores. All levels and three
// weapon tiers were reviewed against the catalog; hashes are review evidence.
export const newCharacters = {
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
