# ［卡利他使徒］罗莎莉：证据与实现口径

核对日期：2026-10-09。等级240、EX3。身份为天光法师、速度2646。

## 来源

项目同步工作流已有远程源 `moonheart/mementomori-masterbook`，本次读取该源并仅查询角色88相关记录：

- [CharacterMB](https://github.com/moonheart/mementomori-masterbook/blob/master/Master/CharacterMB.json)：角色88，主动88001/88002，被动88003/88004/88005。
- [ActiveSkillMB](https://github.com/moonheart/mementomori-masterbook/blob/master/Master/ActiveSkillMB.json)：S1最终子集88001401；S2最终为88002502与9个88002503；强化88101为88002004、88002505、9个88002506、88002307。原技能与强化技能都是CD4、10次180%魔法伤害。
- [PassiveSkillMB](https://github.com/moonheart/mementomori-masterbook/blob/master/Master/PassiveSkillMB.json)：P1明确开战1层、第2回合起+3、15层上限、消费后停止；P2最高档子集88004401；隐藏88005承担S2强化条件。
- [EffectGroupMB](https://github.com/moonheart/mementomori-masterbook/blob/master/Master/EffectGroupMB.json)：核对下表及完整canonical记录。
- 五语官方名称和描述来自仓库生成的 `public/data/character-catalog/<locale>/details/4.json`；远程中/繁/英/日TextResource也核对了灵魂献祭与相关名称。韩语使用现有官方图鉴文本。

| EffectGroup | 含义 | 模型 |
| --- | --- | --- |
| 8800130101 | S1承伤+10%，2回合 | 可解除Boss弱化，伤害前70%确定场景 |
| 8800300101 | 记忆 | 不可解除状态，独立计数器 |
| 8800300316 | 首次15层时自身最大HP×10%转攻击 | 不可解除、无文本结束时间；独立HP来源 |
| 8800330319 | 首次15层时最大HP×80%护盾，2回合 | 保留不可解除状态，忽略护盾量 |
| 8800220702 | 灵魂献祭后邻位最大HP×10%转攻击，2回合 | 不可解除，数值来源为罗莎莉 |
| 8800440101 | 开战自身与邻位结界，2回合 | 不可解除，忽略承伤与阻绝量 |

## 项目确定场景

- 记忆额外增长来自己方被附加主动技能弱化，而非Boss弱化。木桩无敌方行动，不伪造Boss弱化计数作为来源。
- 自然层数为1、4、7、10、13、15，最迟第6回合满层。提前满层勾选框启用1至6的回合选择；关闭时回退第6回合。场景在指定回合开始补至15，不模拟回合中真实敌方弱化时点。
- 首次滿层奖励在自然增长/场景补层后施加，记忆在强化S2伤害前消耗；伤害后减冷却，再给邻位施加攻击状态。消费后的所有增长停止，奖励不会再次触发。
- 两处生命转攻使用通用 `sourceMaxHpOverTargetAttack`，独立累计 `%HP`，保留来源、组队HP增幅、暴击、增伤及双防乘区。不假定HP/ATK面板比例，不并入ATK总倍率。
- 截止本次核对，无角色88的仓库战斗日志；公开远程Master无SubSetSkill/SubSkill表。可解除类别遵循文本明确不可解除的规则，内部时序与永久自身加攻的保留仍待受控日志复核。

## 验证覆盖

结构化测试覆盖自然计数、提前满层1至6与越界拒绝、首次强化时点、消费后停止、永久自身加攻、护盾/结界到期、站位与速度差异、邻位减冷却与两次行动持续、Boss弱化不增加记忆、概率关闭、暴击关闭、HP/ATK单位分离与组队HP增幅。

页面交互覆盖默认禁用提前满层选择、六个回合选项、勾选与取消、HP来源展示和技能详情。默认五人阵容黄金结果继续通过。
