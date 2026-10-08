# ［黄金圣剑士］阿尔托莉亚证据

核对日期2026-10-09。

## 游戏数据

- 远程源沿用项目同步工作流：`moonheart/mementomori-masterbook` 的 [CharacterMB](https://github.com/moonheart/mementomori-masterbook/blob/master/Master/CharacterMB.json)、[ActiveSkillMB](https://github.com/moonheart/mementomori-masterbook/blob/master/Master/ActiveSkillMB.json)、[PassiveSkillMB](https://github.com/moonheart/mementomori-masterbook/blob/master/Master/PassiveSkillMB.json)、[EffectGroupMB](https://github.com/moonheart/mementomori-masterbook/blob/master/Master/EffectGroupMB.json)及TextResource。
- 角色154为苍翠战士、速度3272；主动154001/154002、被动154003/154004/隐藏154005。
- S1最高专武子集为154001001、154001403、154001502。官方当前等级描述为660%，LR专武描述为720%；MB Memo仍写440%/660%，属于未同步的注释，不能覆盖正式文本与专武档。
- S2最后档为154002001、154002402、3个154002403；回复在第一子集，之后读取15次阈值，主体共4段540%或2160%。
- P1最高档154003401给全队光辉；P2开战组15400430301、首回合魔防15400400101和条件HP15400400102为三个独立状态。

## 55-53-g日志

用户引用聊天下载的 `data/battle-logs/55-53-g.json` 中，黄金圣剑士为UnitId154、BattleCharacterGuid1、GroupType0、UR稀有度。日志未满LR角色档，因此S1实际选154001302，不以其660%伤害反推LR专武最高值。

| 记录 | 实际归属与时序 | 结论 |
| --- | --- | --- |
| 首回合蜜拉80001后的15400330101 | AttackUnitGuid1、GranterGuid1，目标1/11/21/31/41；SkillCategory4，EffectCount3 | 黄金圣剑士P1响应友军回复，全队不可解除3层状态 |
| 首回合154001 | 首子集先回复目标1，再把15400500101计数增至3；下一子集给全队15400140301；最后子集物理攻击 | S1回复和抵抗Buff都在伤害前；当前主动回复也增加隐藏计数 |
| 首回合15400140301 | SkillCategory2、EffectValue30；本人EffectTurn3、其他未行动目标EffectTurn2 | 可解除、2次目标行动；本人3为行动补偿，不解释成3回合技能 |
| 首回合行动开始15400400101/15400400102 | AttackUnitGuid1、GranterGuid1，目标1与11；SkillCategory4 | 魔防与最大HP为独立不可解除状态；日志全绿队满足两名其他同属性队友条件 |
| 第2回合艾蒂涅92002 | 15400500101依次计为4、5、6 | 三次连续主动回复算3次，不因伤害单Boss投影合并 |
| 第2回合154002 | 先回复目标1，隐藏计数到7；随后4个物理伤害子集 | S2本次回复先计数，再进行4段伤害 |
| 敌方5504062001等行动内嵌光辉结果 | AttackUnitGuid1、GranterGuid1，不是敌人施加；EffectCount依次减少 | 受魔法攻击后的光辉消耗归属黄金圣剑士，但木桩不模拟敌方行动 |

日志只在累计7次时展示S2，随后黄金圣剑士失去战斗能力，未隔离15次阈值的强化伤害。14→15时点依据正式文本与MB子集顺序实现，并以结构化边界测试验证，保留此证据限制。

## 项目口径

- 全员永久存活、满HP、Boss不行动。最低HP回复目标并列按站位；此规则不声称由本日志验证。
- 魔法受击后的被动回复、光辉消耗和死亡解除忽略；保留不可解除光辉状态，木桩下始终为3层。
- 主动回复计数以效果发动次数累计，最多15，隐藏SkillCategory200标记不计Buff数；全队监听不要求黄金圣剑士本人是回复接收者。
- 魔防、HP及减伤状态不影响当前输出数值；S1可解除抵抗Buff保留并影响Buff数量。
