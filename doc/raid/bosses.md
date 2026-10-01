# 讨伐Boss模板证据

## ［黄金圣剑士］阿尔托莉亚

- 远程源：[GuildRaidBossMB.json](https://github.com/moonheart/mementomori-masterbook/blob/master/Master/GuildRaidBossMB.json)，`Id=17`、`NameKey=[GuildRaidBossName17]`，核对日期2026-10-01。
- 静态字段：`EnemyRank=240`、`ElementType=3`（苍翠）、`Defense=20`、`PhysicalDamageRelax=500000`、`MagicDamageRelax=500000`。防御力20保留原值，不按角色面板或其他Boss推算。
- 本地技能文本：`public/data/character-catalog/zh-CN/details/7.json` 中角色154的P2“同伴情谊”，`PassiveSkillDescription1540043`：战斗开始时最大生命增幅100%、承受伤害降幅60%，无法解除。
- 远程 `PassiveSkillMB` 的Boss被动 `5502154004` 引用同一名称；Lv221档包括 `5502154004303`。项目按Lv240最高档技能文本，将60%常驻承伤降低声明为模板的 `damageReductionRate=0.6`，与增伤/承伤增加在同一渠道加减。不模拟最大生命变化。
- P2第1回合行动开始施加的魔防+30%依赖Boss行动。当前Boss不行动，因此模板保留静态魔防，不追加此行动触发效果。其他Boss主动技能、狂暴与条件被动仍在木桩模型边界外。
- 尚无受控战斗日志隔离确认此Boss的60%承伤降低与增伤加算；当前结算沿用项目通用增减伤口径。

## 属性克制

- [官方属性克制说明](https://mementomori.zendesk.com/hc/zh-tw/articles/51398837036825)：忧蓝→业红→苍翠→流金→忧蓝；天光和幽冥相互克制。克制目标时攻击伤害增加25%，其他关系没有减伤惩罚。
- `elementAdvantage` 默认开启，关闭时只取消此25%增伤。索尼娅属性取MB的忧蓝，光士与黄金圣剑士取苍翠。
- 实现复用 `src/engine/damageCalc.js` 的25%加算增伤口径，进入攻击者当前段的 `damageRate`。队伍属性加成仍独立结算。
