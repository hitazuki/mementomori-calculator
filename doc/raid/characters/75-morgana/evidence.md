# 摩嘉娜：讨伐拉表接入证据

## 接入条件

- CharacterMB ID：75；Lv240、Ex3。
- 基础速度 2715，业红（ElementType 2），普通攻击为魔法。
- 证据：`CharacterMB.json`、`ActiveSkillMB.json`（75001 / 75002）、`PassiveSkillMB.json`（75003 / 75004）、`EffectGroupMB.json` 中 CasterIconId 75 的条目。

## 证据表

| 项目 | 结论 | 来源类型 | 精确位置 | 确认程度 |
| --- | --- | --- | --- | --- |
| S1 | 自伤后随机目标 5 × 420% ATK 魔法伤害 | 游戏数据 | ActiveSkill 75001 Ex1 | 已确认 |
| S1弱化 | 每段50%概率施加2回合、受回复量-20% | 游戏数据+日志 | EffectGroup `7500130202`；`g1820` / `g1820-2` / `g1820-3` 的敌方镜像 `550407500130202` | 已确认 |
| S2 | 自伤后 3 + 奋起之心层数次、最多 7 × 580% ATK 魔法伤害 | 游戏数据 | ActiveSkill 75002 Lv3 / Ex3 | 已确认 |
| 奋起之心 | 任一友军受到自伤时，自身攻 +10%，最多 4 层、不可驱散 | 游戏数据 | PassiveSkill 75003 / EffectGroup 7500300101 | 已确认 |
| 团结的力量 | 开战攻 +10%，每名其他业红 +10%，最多 +50%，不可驱散 | 游戏数据 | PassiveSkill 75004 Lv3 / EffectGroup 7500430101 | 已确认 |

## 建模

- 分类：B（由既有 `selfDamage` 事件、计数器与线性值组合）+ C（通用“其他同属性上阵人数”值解析器）。
- 自伤在 `beforeDamage` 发出，因此本次 S1/S2 会先获得一层奋起之心；事件也监听其他上阵角色的自伤。
- S1 的每个命中段在段后尝试施加 `7500130202`；日志成功记录为 `SkillCategory: 3 / EffectType: 5021 / EffectTurn: 2`，因此作为 2 回合、零倍率的可解除 Boss 弱化保留并参与弱化数量联动。确定场景开启时每段均成功，关闭时每段均失败。
- `7500300101` 与 `7500430101` 为不可驱散常驻状态，不计入可驱散 Buff 数。

## 明确忽略

| 描述内容 | i18n key | 原因 |
| --- | --- | --- |
| S1 满两层后的治疗 | `raidIgnoredHealing` | 木桩模型不结算 HP。 |
| S1 每段降低受治疗量 | `raidIgnoredHealingReceivedDown` | 弱化状态与联动已保留；木桩不结算其对HP回复量的影响。 |
| 物防与护盾 | `raidIgnoredDefenseBuff` / `raidIgnoredShield` | 木桩不结算防御与护盾。 |
