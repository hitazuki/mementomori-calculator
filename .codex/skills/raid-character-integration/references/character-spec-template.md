# 规范化角色草案

在写代码前填写；字段名以 `doc/raid/skill-term-reference.md` 和当前代码为准，不把本模板当作 schema。

## 身份与轮转

- `id` / `nameKey` / `speed` / `element`：
- `normal`：
- S1 `cooldown` / `damageSteps`：
- S2 `cooldown` / `damageSteps`：

## 状态与事件

| 所属 | trigger | effect type | target | condition | duration clock | EffectGroupId | 读状态时点 | 写状态时点 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| character / s1 / s2 / event |  |  |  |  | `duration` / `durationRounds` |  |  |  |

## 运行时与展示

- `permanentModifiers` / `derivedModifiers`：
- `runtime.counters` / `runtime.flags`：
- `eventHooks`：
- `ignoredKeys`：
- 新增概率配置：
- 新增 i18n keys（五语）：
- UI 展示变化：

## 复用判定

- 等级：A / B / C / D
- 复用机制：
- 新增通用机制及中性命名：
- 编译期无效数据行为：
- 模型边界变化：

## 最小测试矩阵

| 场景 | 关键行动 | 关键前置状态 | 期望伤害段 / 快照 / 后置状态 |
| --- | --- | --- | --- |
| 默认 |  |  |  |
| 条件成功 |  |  |  |
| 条件失败 |  |  |  |
| 到期 / 刷新 / 上限 |  |  |  |
