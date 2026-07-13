# 卡罗：讨伐拉表接入证据

- MB：`CharacterMB[40]`、`ActiveSkillMB[40001/40002]`、`PassiveSkillMB[40003/40004]`；档位 Lv240 / EX3。
- 日志：`y1800mrl.json` 中卡罗为 `Guid 21`。开战全体防御 `4000420101` 与自身防御 `4000430201` 均为 `SkillCategory: 2`，以可解除 Buff 状态保留。
- S1 沉默使用 `4000150102`；`y1800mrl.json` 的成功记录为 `SkillCategory: 3 / EffectType: 6003 / EffectTurn: 1`。因此以 1 回合、零倍率的可解除 Boss 弱化保留，并使用成功/失败场景开关；木桩不行动，沉默造成的技能禁用不模拟。
- S2 在 Boss 无 Buff 的固定场景中施加防御降低 `4000230101`（`SkillCategory: 3`），防御 -40% 并进入 DEF 路。
- 敌方 Buff 驱散、受击治疗不进入当前木桩模型。
