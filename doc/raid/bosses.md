# 讨伐Boss模板证据

## ［黄金圣剑士］阿尔托莉亚

- 远程源：[GuildRaidBossMB.json](https://github.com/moonheart/mementomori-masterbook/blob/master/Master/GuildRaidBossMB.json)，`Id=17`、`NameKey=[GuildRaidBossName17]`，核对日期2026-10-01。
- 静态字段：`EnemyRank=240`、`ElementType=3`（苍翠）、`Defense=20`、`PhysicalDamageRelax=500000`、`MagicDamageRelax=500000`。防御力20保留原值，不按角色面板或其他Boss推算。
- 本地玩家角色154的P2“同伴情谊”（`PassiveSkillDescription1540043`）描述60%承伤降低；远程Boss被动 `5502154004` 引用同一名称，Lv221档包括 `5502154004303`。同名不能证明Boss具有玩家角色的相同数值，模板不再据此声明常驻减伤。
- 用户提供的Lv526小白（UR专武档）与鹭丝堤卡T1 S1暴击截图：单段实测分别为133252782、1443377139；基础面板另计组队攻击+15%及基础暴伤+50%。小白无攻击Buff、Boss易伤0层，S1为530%、暴击倍率2.36；鹭丝堤卡攻击Buff+80%、额外暴伤Buff+55%、Boss易伤2层（+30%），S1为640%、暴击倍率3.30。
- 保留MB防御20、物防500000，按额外常驻减伤0%计算，单段伤害分别为133252496、1443370363，与实测相差约0.000214%、0.000469%；60%减伤不符合这两组实测。因此移除模板的 `damageReductionRate`，按缺省0结算；不模拟最大生命变化。
- P2第1回合行动开始施加的魔防+30%依赖Boss行动。当前Boss不行动，因此模板保留静态魔防，不追加此行动触发效果。其他Boss主动技能、狂暴与条件被动仍在木桩模型边界外。
- 两组物理伤害不能同时唯一确定防御、物防、额外减伤三个未知量，也不能验证魔防；当前采用与实测高度一致的MB静态防御属性，不将微小误差反推为新的面板值。

## 属性克制

- [官方属性克制说明](https://mementomori.zendesk.com/hc/zh-tw/articles/51398837036825)：忧蓝→业红→苍翠→流金→忧蓝；天光和幽冥相互克制。克制目标时攻击伤害增加25%，其他关系没有减伤惩罚。
- `elementAdvantage` 默认开启，关闭时只取消此25%增伤。索尼娅属性取MB的忧蓝，光士与黄金圣剑士取苍翠。
- 实现复用 `src/engine/damageCalc.js` 的25%加算增伤口径，进入攻击者当前段的 `damageRate`。队伍属性加成仍独立结算。
