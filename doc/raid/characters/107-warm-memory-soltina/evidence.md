# ［温暖的回忆］索尔缇娜（107）讨伐接入证据

## 事实来源

- `CharacterMB`：ID 107，业红属性，战士，速度3073。
- `ActiveSkillMB`最终档：S1为480%，普通目标攻击30%/命中50%持续4次，红绿目标攻击60%并持续32次；S2为5×420%，每段40%晕厥2回合。
- `r1820-2.json`：索尔缇娜为 `Guid=11`。S1选中红属性Guid41，写入日志装备档 `10700140102 / SkillCategory=4 / EffectTurn=32`；S2五段中三段成功写入 `10700240102 / SkillCategory=3 / EffectTurn=2`。
- 开战 `10700430101 / SkillCategory=4 / EffectTurn=2` 的速度增量为1146，等于日志基础速度3821的30%。

## 复用判定

- 等级：C（通用目标属性集合条件扩展）。
- 新增 `targetElementIn` / `targetElementNotIn`，让同一最高攻击目标按红绿/其他属性选择真实EffectGroup、倍率与持续时间。
- 晕厥直接复用 `afterHit + probabilityEnabled`，确定场景开启时记录5次施加尝试，关闭时记录5次跳过。

