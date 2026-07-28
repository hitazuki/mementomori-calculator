# 亚缇（58）讨伐接入证据

## 事实来源

- `CharacterMB`：ID 58，业红属性，魔法师，速度2734。
- `ActiveSkillMB` / `PassiveSkillMB`：Lv240、EX3下S1为350%且先施加魔防-40%/承伤+20%；S2为7×200%；被动初始8层抗暴，伤害阻绝为90%。
- `r1820-2.json`：亚缇为 `Guid=41`。开战写入 `5800330101 / SkillCategory=4`，并将 `5800400101` 的EffectCount逐次写到8。
- S1在伤害前向各目标写入 `5800140101 / SkillCategory=3 / EffectTurn=4`；当此前受击已耗尽层数时，随后EffectCount从1写到3，确认“无自身状态补3层”分支。木桩无受击，状态始终存在，因此每次S1补2层。

## 复用判定

- 等级：B（现有机制组合）。
- S1复用单一 `bossStatus` 同时写入 `damageRatePerStack=0.2` 与 `magicDefenseRatePerStack=-0.4`；S2复用 `bossStatusCountAtLeast` 强制暴击。
- 抗暴层数使用已有角色计数器保留开战8层与S1补层；受击消耗和阻绝明确置于木桩边界外。

