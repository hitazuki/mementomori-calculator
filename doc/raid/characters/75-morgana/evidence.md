# 摩嘉娜：讨伐拉表接入证据

## 接入条件

- CharacterMB ID：75；Lv240、Ex3。
- 基础速度 2715，业红（ElementType 2），普通攻击为魔法。
- 证据：`CharacterMB.json`、`ActiveSkillMB.json`（75001 / 75002）、`PassiveSkillMB.json`（75003 / 75004）、`EffectGroupMB.json` 中 CasterIconId 75 的条目。

## 证据表

| 项目 | 结论 | 来源类型 | 精确位置 | 确认程度 |
| --- | --- | --- | --- | --- |
| S1 | 自伤后随机目标 5 × 420% ATK 魔法伤害 | 游戏数据 | ActiveSkill 75001 Ex1 | 已确认 |
| S2 | 自伤后 3 + 奋起之心层数次、最多 7 × 580% ATK 魔法伤害 | 游戏数据 | ActiveSkill 75002 Lv3 / Ex3 | 已确认 |
| 奋起之心 | 任一友军受到自伤时，自身攻 +10%，最多 4 层、不可驱散 | 游戏数据 | PassiveSkill 75003 / EffectGroup 7500300101 | 已确认 |
| 团结的力量 | 开战攻 +10%，每名其他业红 +10%，最多 +50%，不可驱散 | 游戏数据 | PassiveSkill 75004 Lv3 / EffectGroup 7500430101 | 已确认 |

## 建模

- 分类：B（由既有 `selfDamage` 事件、计数器与线性值组合）+ C（通用“其他同属性上阵人数”值解析器）。
- 自伤在 `beforeDamage` 发出，因此本次 S1/S2 会先获得一层奋起之心；事件也监听其他上阵角色的自伤。
- `7500300101` 与 `7500430101` 为不可驱散常驻状态，不计入可驱散 Buff 数。

## 明确忽略

| 描述内容 | i18n key | 原因 |
| --- | --- | --- |
| S1 满两层后的治疗 | `raidIgnoredHealing` | 木桩模型不结算 HP。 |
| S1 每段降低受治疗量 | `raidIgnoredHealingReceivedDown` | 木桩不结算治疗。 |
| 物防与护盾 | `raidIgnoredDefenseBuff` / `raidIgnoredShield` | 木桩不结算防御与护盾。 |
