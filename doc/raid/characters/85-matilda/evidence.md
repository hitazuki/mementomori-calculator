# 玛提尔德（85）讨伐接入证据

## 事实来源

- `CharacterMB`：ID 85，业红属性，魔法师，速度3181；主动85001/85002，被动85003/85004。
- `ActiveSkillMB` / `PassiveSkillMB`：Lv240、EX3下S1为680%，复合Buff为50%；S2两波均为380%；精选香蕉为攻击/暴击10%、命中30%。
- `r1820-2.json`：玛提尔德为 `Guid=1`。回合开始向Guid1和Guid41施加 `8500330101 / SkillCategory=2 / EffectTurn=4`；S1先给自身写入 `8500140101 / EffectTurn=5` 并移除香蕉，另一目标没有香蕉时写入同组 `EffectTurn=1`。

## 规范化实现

| 所属 | trigger | effect | target | duration clock |
| --- | --- | --- | --- | --- |
| 被动85003 | roundStart，1/5/9 | 攻击+10%的复合Buff | self + topAttackOther×1 | 4次目标行动 |
| S1 | beforeDamage | 攻击+50%的不可解除复合状态 | self + topAttackOther×1 | 有香蕉4次，否则1次 |
| S1 | damage | 680%魔法 | Boss | 当前伤害读取S1 Buff |
| S2 | damage | 380% + 380%魔法 | Boss | 自身HP按满值，使用第二波攻击 |

## 复用判定

- 等级：C（通用目标状态条件扩展）。
- 新增 `targetHasStatus` / `targetLacksStatus`，配合共同 `replacementKey` 精确表达先判断香蕉、再替换状态的目标级分支。

