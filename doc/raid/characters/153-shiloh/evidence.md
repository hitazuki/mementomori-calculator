# 小白（153）讨伐接入证据

## 事实来源

- `CharacterMB`：ID 153，流金属性，射手，速度3229；主动技能153001/153002，被动153003/153004。
- `ActiveSkillMB` / `PassiveSkillMB`：按Lv240、EX3建模。讨伐Boss满足“自动战斗・Boss战斗”强化分支，因此S1使用30%双Buff，被动153003使用50%攻击档。
- `data/battle-logs/y49-50.json`：小白为 `BattleCharacterGuid=31 / UnitId=153`。S1与行动开始被动记录的 `AttackUnitGuid=31`、`GranterGuid=31`；目标分别为攻击最高友军及自身/攻击最高其他友军。
- 日志分类：15300120202、15300120204、15300330102、15300400101/2/3均为 `SkillCategory=2`；15300430301为 `SkillCategory=4`。
- 日志持续时间：未行动目标写入4，当前行动中的小白写入5且 `IsExtendEffectTurn=true`，按项目口径统一为4次目标行动。

## 规范化实现

| 所属 | 触发 | 效果 | 目标 | 持续/读取时点 |
| --- | --- | --- | --- | --- |
| 被动153004 | battleStart | 75%承伤降低状态 | self | 永久；数值忽略，状态保留 |
| 被动153003 | roundStart，1/5/9回合 | 攻击+50% | topAttack×2 | 4次目标行动 |
| 被动153004 | actionStart，每4次自身行动 | 3个独立防御Buff | self + topAttackOther×2 | 4次目标行动 |
| S1 | beforeDamage | 暴击率+30%、暴击伤害+30% | topAttack×2 | 4次目标行动；本次伤害前生效 |
| S2 | damage | 5×动态物理倍率 | Boss | 第9回合起读取全队最高可解除Buff数 |

## 复用判定

- 等级：C（通用机制扩展）。
- 直接复用：`roundStart`、`actionStart`周期、`topAttack`、`selfAndTopAttackOther`、友方状态、可解除Buff计数、`roundAtLeast`。
- 新增通用能力：`maxLineupRemovableBuffCountLinear`；同时让`conditional`数值的真假分支可递归使用已注册值解析器。
- 模型边界不变：不新增受击、HP、死亡或敌方行动模拟。

## 最小测试矩阵

- S1：确认先施加两个EffectGroup，再以30%暴伤结算；暴击关闭时暴伤不生效但Buff仍存在。
- 被动：确认攻击最高2人、三个独立防御Buff、自身行动持续时间补偿与第5回合刷新。
- S2：第2回合仍为640%，第10回合按最高Buff数提高且940%封顶。
- 单人阵容：目标选择退化到自身，不产生重复目标。
