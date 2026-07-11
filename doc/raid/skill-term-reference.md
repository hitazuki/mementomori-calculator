# 讨伐拉表技能词条与机制目录

本文是 `src/constants/raidTableCharacters.js` 与 `src/engine/raidTableCalc.js` 的可复用词条索引。新增角色时先在本文查找已有结构；只有现有结构无法准确表达技能时，才新增字段或引擎分支。

结算时序、Buff 计数、持续时间和待确认规则仍以 [skill-modeling-guide.md](./skill-modeling-guide.md) 为准。本文描述的是“代码中如何写”。

## 1. 是否需要新增词条文档

需要。原因如下：

- 角色定义已经同时包含伤害段、状态、目标选择、事件、计数器、概率分支和结算后规则，仅靠角色样例难以判断哪些字段可以复用。
- 部分相似文本实际属于不同数据结构，例如“攻击力+30%”可能是常驻修正、可解除 Buff、不可解除状态或面板引用项。
- `type`、`channel`、`target` 等值目前由引擎分支解释，新增拼写不会自动生效；需要有一份受支持值清单。
- 角色专属机制可以暂时使用专用字段，但必须记录适用范围，避免以后误当通用词条复制。

维护原则：新增通用字段或新枚举值时同步更新本文；只新增角色数据且完全复用既有结构时，在“已使用角色”列补充角色即可。

## 2. 角色定义顶层结构

```js
{
  id: 128,
  nameKey: 'raidCharLiberia',
  speed: 3597,
  element: 5,
  normal: normalPhysical,
  permanentModifiers: [],
  battleStartEffects: [],
  passives: [],
  eventPassives: [],
  afterCriticalHitBossStatus: null,
  skills: { s1: {}, s2: {} },
}
```

| 字段 | 用途 | 备注 |
| --- | --- | --- |
| `id` | CharacterMB ID | 同时用于运行态、面板符号项和页面键值 |
| `nameKey` | i18n 角色名键 | 五种语言必须同时补充 |
| `speed` | MB 基础速度 | 页面可覆盖；每回合开始读取 |
| `element` | 属性 | `1蓝 / 2红 / 3绿 / 4黄 / 5暗`，目前用于条件选目标 |
| `normal` | 普攻定义 | 复用 `normalPhysical` 或 `normalMagic` |
| `permanentModifiers` | 常驻倍率修正 | 不生成可解除 Buff，不参与 Buff 数 |
| `battleStartEffects` | 开战效果 | 全员速度排序前依站位顺序施加 |
| `passives` | 行动阶段被动 | 支持周期和条件判断 |
| `eventPassives` | 全队事件监听 | 当前只有自损监听 |
| `afterCriticalHitBossStatus` | 每个暴击伤害段后的 Boss 状态 | 当前为光士专用入口 |
| `skills` | `s1`、`s2` | 两者同时可用时优先 S1 |

## 3. 技能与伤害段

### 3.1 技能结构

```js
{
  key: 's1',
  nameKey: 'raidSkillCharacterS1',
  cooldown: 4,
  damageType: 'phys',
  beforeDamageEvents: ['selfDamage'],
  damageSteps: [],
  effects: [],
  afterDamageRules: [],
  ignoredKeys: [],
}
```

`damageType` 当前出现：

| 值 | 含义 | 使用方式 |
| --- | --- | --- |
| `phys` | 物理主动伤害 | 当前木桩不计算防御，但保留标签 |
| `mag` | 魔法主动伤害 | 同上 |
| `direct` | STR 等直接伤害 | 默认仍可暴击、吃增伤并触发段后机制 |
| `support` | 纯辅助技能 | `damageSteps: []`，仍正常进入冷却和效果阶段 |

### 3.2 固定伤害段

```js
{ stat: 'ATK', percent: 640, hits: 5, damageType: 'phys' }
```

| 字段 | 含义 | 当前值/规则 |
| --- | --- | --- |
| `stat` | 倍率基准 | `ATK` 进入 ATK 总计；`STR` 等进入独立符号总计 |
| `percent` | 单段技能百分比 | 写百分数数值，例如 `640` |
| `hits` | 对木桩结算的段数 | 每段独立读取 Buff、Boss 状态和暴击 |
| `damageType` | 本段类型 | 可与技能顶层类型不同，例如光士 S1 |
| `originalTargetCount` | 原技能目标数 | 仅用于展示；单体木桩仍只结算一次目标 |
| `conditionKey` | 已固定成立的口径说明 | 只用于详情说明，不由引擎动态判定 |

### 3.3 暴击追加段

```js
{
  stat: 'ATK', percent: 525, hits: 6,
  criticalExtraHits: { maxHits: 10 },
}
```

默认必暴时直接使用 `maxHits`，关闭必暴时使用原 `hits`。当前用于佛罗伦斯 S1。它只适合“必暴场景下确定追加到固定总段数”的技能；概率追加、逐段独立判定或追加段倍率不同应新增更通用的步骤结构。

### 3.4 按技能历史变化段数

```js
{
  stat: 'ATK', percent: 740,
  hitsByUse: { skillKey: 's2', base: 4, increment: 1, max: 6 },
}
```

计算公式为 `min(base + usesBefore × increment, max)`。历史次数在当前技能全部结算后增加。当前用于鹭丝堤卡 S2。

### 3.5 按运行态变化倍率

```js
{
  stat: 'ATK', hits: 7,
  dynamicPercent: {
    type: 'artoriaJustice', base: 540, perStack: 150, max: 1140,
  },
}
```

当前 `dynamicPercent.type` 只有 `artoriaJustice`，属于角色专属解析器。若后续出现同类“按计数器增加倍率”，应改造成通用的 `counterScaling`，明确计数器键、读取时点、每层增量和上限，而不是继续增加角色名类型。

## 4. 修正渠道 `modifiers`

```js
{ id: 'effect-atk', channel: 'attackRate', rate: 0.3, nameKey: 'raidBuffEffectAttack' }
```

| `channel` | 含义 | 计算方式 | 已使用角色 |
| --- | --- | --- | --- |
| `attackRate` | 百分比攻击增幅 | 同渠道相加，进入 `1 + attackRate + 面板引用项` | 佛罗伦斯、芬里尔、梅琳、茉缇、鹭丝堤卡、阿尔托莉亚 |
| `damageRate` | 输出增伤及承伤增减 | 角色与 Boss 来源相加后形成一个乘区 | 佛罗伦斯；Boss 状态另见下文 |
| `criticalDamageBonus` | 暴击伤害加成 | 加到全局基础暴伤加成；不暴击时不使用 | 梅琳 |
| `speedRate` | 百分比速度变化 | `基础速度 × (1 + speedRate)` | 阿尔托莉亚 |

当前尚无 `fixedSpeed`、防御、暴击率、命中等通道。不要只在角色定义中写新 `channel`；未加入引擎支持的通道会被忽略。

## 5. 面板引用符号项 `symbolicModifiers`

面板引用不按归一攻击力 `1` 换算，而是与纯数值倍率分别汇总。

| `kind` | 表达式 | 示例 |
| --- | --- | --- |
| `sourceAttackOverTargetAttack` | `coefficient × ATK_来源 / ATK_目标` | 阿尔托莉亚给最慢友军加攻 |
| `targetBaseDefenseOverTargetAttack` | `coefficient × DEF0_目标 / ATK_目标` | 利伯瑞娅、静的防御转攻击 |

```js
symbolicModifiers: [
  { kind: 'sourceAttackOverTargetAttack', coefficient: 0.5, sourceId: 93 },
]
```

符号项只作用于 `stat: 'ATK'` 的主动伤害段，并继续乘增伤和暴击。新增 `kind` 时必须同步增加键生成、显示公式、合并测试和文档说明。

## 6. 友方状态 `type: 'status'`

推荐通过 `statusEffect()` 创建：

```js
statusEffect({
  id: 'character-s1-atk',
  effectGroupId: 123456,
  nameKey: 'raidBuffCharacterS1Attack',
  target: 'topAttack',
  targetCount: 2,
  duration: 2,
  phase: 'afterDamage',
  statusClass: RAID_STATUS_CLASSES.REMOVABLE_BUFF,
  modifiers: [
    { id: 'character-s1-atk', channel: 'attackRate', rate: 0.4 },
  ],
  symbolicModifiers: [],
})
```

| 字段 | 用途 |
| --- | --- |
| `id` | 项目内语义 ID，用于展示和专用规则引用 |
| `effectGroupId` | MB/日志 EffectGroupId；同来源同组再次施加时刷新 |
| `nameKey` | 状态名称 i18n 键 |
| `target` / `targetCount` | 目标选择器及最多目标数 |
| `duration` | 目标行动次数；`null` 表示永久 |
| `phase` | 施加阶段 |
| `statusClass` | 可解除性与 Buff 计数类别 |
| `modifiers` | 数值倍率修正；无倍率但需要计数时写空数组 |
| `symbolicModifiers` | 面板引用项 |
| `targetElement` | 施加后按属性过滤目标，当前用于阿尔托莉亚加速 |

### 6.1 状态类别

| 常量 | 值 | Buff 数 | 当前用途 |
| --- | --- | --- | --- |
| `REMOVABLE_BUFF` | `removableBuff` | 计入 | 攻击、暴伤、护盾、吸血等可解除 Buff |
| `UNREMOVABLE_STATE` | `unremovableState` | 不计 | 被动、守护、不可解除护盾和加攻 |
| `REMOVABLE_DEBUFF` | `removableDebuff` | 不计友方 Buff | Boss 沙尘、易伤、减速 |
| `UNREMOVABLE_DEBUFF` | `unremovableDebuff` | 不计 | 已预留，当前没有角色实例 |
| `INTERNAL_MARK` | `internalMark` | 不计且不作为普通状态展示 | 已预留；技能历史目前直接存在运行态 |

### 6.2 目标选择器

| `target` | 选择规则 | 并列规则/限制 |
| --- | --- | --- |
| `self` | 自身 | 单目标 |
| `adjacent` | 线性站位相邻友军 | 按站位，受 `targetCount` 限制 |
| `topAttack` | 固定攻击优先级 | 不读取局内 Buff 后攻击力 |
| `highestBuffCount` | 可解除 EffectGroup 最多者，包含自己 | 并列按站位 |
| `highestBuffCountOther` | 同上，但排除自己 | 并列按站位 |
| `lowestSpeedOther` | 效果施加前基础速度最低的其他友军 | 当前读取配置速度，不含局内速度 Buff；并列按站位 |

注意：`targetElement` 是选出候选目标后的过滤条件。若技能语义是“只在某属性角色中选择最低速者”，现有执行顺序不等价，需要新增选择器或调整解析。

## 7. Boss 状态 `type: 'bossStatus'`

推荐通过 `bossStatusEffect()` 创建：

```js
bossStatusEffect({
  id: 'character-debuff',
  effectGroupId: 123456,
  nameKey: 'raidDebuffCharacter',
  durationRounds: 2,
  addStacks: 1,
  maxStacks: 4,
  damageRatePerStack: 0.05,
  phase: 'beforeDamage',
  probabilityKey: 'characterDebuffSuccess',
})
```

| 字段 | 含义 |
| --- | --- |
| `durationRounds` | 全局回合持续时间；`null` 为永久 |
| `addStacks` | 每次成功施加增加层数 |
| `maxStacks` | 层数上限 |
| `damageRatePerStack` | 每层承伤增幅，汇入 `damageRate` 渠道 |
| `probabilityKey` | 对应 `config.probabilityOverrides`；显式为 `false` 时跳过 |

同 `id` 再次施加会增加层数并刷新整组持续回合。当前实例：光士易伤、利伯瑞娅沙尘、静易伤与速度降低。

光士使用角色顶层 `afterCriticalHitBossStatus`：每一暴击段结算后施加，因此当前段使用旧层数，下一段使用新层数。若以后出现“命中后”“任意伤害后”“仅某技能段后”，应引入通用的段后触发器，而不是复用这个暴击专用入口。

## 8. 非状态即时效果与结算后规则

### 8.1 冷却减少

```js
{
  type: 'cooldownReduction',
  target: 'adjacent',
  targetCount: 2,
  amount: 2,
  phase: 'afterDamage',
}
```

将目标当前处于冷却中的 S1、S2 同时减少，最低为0。它不是 EffectGroup，也不参与 Buff 数。

### 8.2 按 Boss 层数重置冷却

```js
afterDamageRules: [{
  type: 'resetCooldownsIfBossStacks',
  bossStatusId: 'liberia-sand',
  requiredStacks: 4,
  onceKey: 'liberiaCooldownReset',
}]
```

全部伤害段结束后检查；满足时将自身 S1、S2 归零。`onceKey` 保存在角色运行态，保证每场战斗最多一次。当前仅用于利伯瑞娅。

## 9. 触发阶段、被动、事件和条件

### 9.1 支持阶段

| `phase` / `trigger` | 时点 | 常见用途 |
| --- | --- | --- |
| `battleStart` | 首回合排序前 | 开战加攻、加速、初始状态 |
| `actionStart` | 当前角色选择技能前 | 周期被动、按当前 Buff 数判断 |
| `beforeDamage` | 主体伤害前 | 自损、技能 Buff、Boss 弱化 |
| `afterHit` | 单个伤害段后 | 当前由光士段后易伤生成，不直接写在角色效果数组中 |
| `afterDamage` | 全部伤害段后 | Buff、减冷却、条件重置 |
| `actionEnd` | 状态消费后 | 行动次数周期效果、结束条件 |

### 9.2 行动周期被动

```js
{
  trigger: 'actionStart',
  every: 4,
  offset: 1,
  condition: { type: 'anyRemovableBuffCountAtLeast', count: 4 },
  effects: [],
}
```

- 没有 `every`：每次到达触发阶段都检查。
- `every: 4, offset: 1`：第1、5、9……次自身行动触发。
- 当前条件类型只有 `anyRemovableBuffCountAtLeast`，含义是任一上场友军的可解除 Buff 数达到阈值。

### 9.3 战斗事件

技能通过 `beforeDamageEvents: ['selfDamage']` 在伤害前广播事件。监听结构：

```js
eventPassives: [{
  event: 'selfDamage',
  type: 'stackSelfAttack',
  id: 'artoria-justice',
  nameKey: 'raidBuffArtoriaJustice',
  maxStacks: 4,
  ratePerStack: 0.1,
}]
```

当前只有：

- 事件 `selfDamage`：自损只触发机制，不实际降低木桩模式中的生命值。
- 监听类型 `stackSelfAttack`：给监听者增加不可解除攻击层数；当前运行态字段为 `justiceStacks`。

这两个结构均是首版专用实现。新增治疗、死亡、友军施法、受击等事件时，应先建立通用事件载荷（来源、目标、数值、技能、伤害段），再增加监听器，避免继续使用无参数字符串。

## 10. 概率、条件说明和忽略项

### 10.1 概率开关

`probabilityKey` 必须在默认配置和页面中有对应布尔值。当前键：

| 键 | 效果 |
| --- | --- |
| `liberiaSand` | 利伯瑞娅 S1 沙尘成功 |
| `shizuSpeedDown` | 静 S1 速度降低成功 |

当前只模拟确定成功/失败，不计算期望值，也不逐段重复判定。

### 10.2 `conditionKey`

当前仅作为 UI 说明，不是运行时条件表达式：

- `raidConditionDummyNoShield`：木桩无护盾，光士 S2 使用强化分支。
- `raidConditionDummyHigherHp`：木桩当前 HP 更高，静 S2 使用高倍率分支。

若未来需要用户切换条件或由战斗状态判断，必须新增真正的 `condition` 解析器，不能只增加 `conditionKey`。

### 10.3 `ignoredKeys`

用于明确展示当前口径不模拟的技能部分，例如击杀追加、净化、治疗、驱散、护盾数值、眩晕、防御 Buff。它不会改变结算，只防止结构化时静默丢失描述。

新增角色时，所有未进入倍率、状态计数、速度、冷却或事件模型的技能文本都应进入 `ignoredKeys`，并补齐五种语言说明。

## 11. 当前专用机制与通用化建议

| 当前结构 | 专用对象 | 何时应通用化 |
| --- | --- | --- |
| `dynamicPercent.type = artoriaJustice` | 阿尔托莉亚 S2 | 再出现按层数/计数器改变倍率的技能时 |
| `runtime.justiceStacks`、`stackSelfAttack` | 阿尔托莉亚振奋 | 再出现不同事件计数器或可消费层数时 |
| `afterCriticalHitBossStatus` | 光士逐段易伤 | 再出现命中后、伤害后或指定段后触发时 |
| `resetCooldownsIfBossStacks` | 利伯瑞娅 S2 | 再出现更复杂状态条件或影响其他目标时 |
| `hitsByUse` | 鹭丝堤卡 S2 | 已较通用；出现递减、非线性序列时扩展 |
| `criticalExtraHits` | 佛罗伦斯 S1 | 出现概率、不同倍率或上限外条件时扩展 |
| `conditionKey` | 光士、静固定木桩分支 | 条件需要动态计算或页面可配置时 |

通用化时优先增加声明式字段和集中解析器；不要在伤害循环中按角色 ID 判断。

## 12. 新增或更新词条的流程

1. 从 MB、官方文本和战斗日志确认 EffectGroup、可解除性、段数、目标、时序和持续单位。
2. 在本文查找可复用的 `damageSteps`、`modifier channel`、状态、选择器、事件或规则。
3. 如果完全可复用，只新增角色数据、i18n 与测试，并更新本文“已使用角色”。
4. 如果组合现有词条即可表达，优先组合，不增加角色 ID 分支。
5. 如果必须新增机制，先定义稳定名称、输入字段、触发阶段、输出快照及与已有渠道的关系。
6. 同步修改常量定义、引擎解析、页面详情、五种语言、本文和结算口径文档。
7. 至少测试：施加前后快照、持续时间、叠层/刷新、并列选目标、逐段时序、关闭概率/暴击、符号项合并和默认阵容回归。

## 13. 快速复用索引

| 技能描述关键词 | 首选结构 |
| --- | --- |
| 造成N次攻击力×X%伤害 | `damageSteps[].percent + hits` |
| 暴击时追加攻击 | `criticalExtraHits`，复杂情况新增段后触发器 |
| 每次发动增加段数 | `hitsByUse` |
| 按层数提高技能倍率 | 暂用/通用化 `dynamicPercent` |
| 攻击力/增伤/暴伤/速度提高 | `modifiers[channel]` |
| 防御或他人攻击转自身攻击 | `symbolicModifiers` |
| 持续N次行动 | 友方 `status.duration` |
| 持续N回合的敌方异常 | `bossStatus.durationRounds` |
| 异常叠层并刷新 | `bossStatus.addStacks/maxStacks` |
| 相邻、攻击最高、Buff最多、速度最低 | `target` 选择器 |
| 技能前自损 | `beforeDamageEvents: ['selfDamage']` |
| 每N次自身行动触发 | `passives.every + offset` |
| 减少技能冷却 | `cooldownReduction` |
| 满足异常层数后重置冷却 | `afterDamageRules` |
| 概率成功 | `probabilityKey` + 配置开关 |
| 当前木桩固定满足的分支 | `conditionKey`，仅说明用途 |
| 不参与首版的技能文本 | `ignoredKeys` |
