# 讨伐拉表技能词条与机制目录

本文是 `src/constants/raidTableCharacters.js` 与 `src/engine/raidTableCalc.js` 的可复用词条索引。新增角色时先在本文查找已有结构；只有现有结构无法准确表达技能时，才新增字段或引擎分支。

结算时序、Buff 计数、持续时间和待确认规则仍以 [skill-modeling-guide.md](./skill-modeling-guide.md) 为准；游戏内指南、MB字段与标准词条的映射见 [official-battle-guide.md](./official-battle-guide.md)。本文描述的是“代码中如何写”。

新增词条时应先在官方语义文档登记来源与规范化含义，再决定复用或扩展本文的数据结构。不要直接把中文词条名称当作引擎逻辑键。

## 1. 是否需要新增词条文档

需要。原因如下：

- 角色定义已经同时包含伤害段、状态、目标选择、事件、计数器、概率分支和结算后规则，仅靠角色样例难以判断哪些字段可以复用。
- 部分相似文本实际属于不同数据结构，例如“攻击力+30%”可能是常驻修正、可解除 Buff、不可解除状态或面板引用项。
- `type`、`condition`、`target` 和动态数值类型由机制注册表解释，新增拼写不会自动生效，并会在阵容编译阶段报错。
- 角色不得向运行内核增加专属字段；新行为应组合通用计数器、钩子、条件、效果和数值解析器。

维护原则：新增通用字段或新枚举值时同步更新本文；只新增角色数据且完全复用既有结构时，在“已使用角色”列补充角色即可。

## 2. 角色定义顶层结构

```js
{
  id: 128,
  nameKey: 'raidCharLiberia',
  speed: 3597,
  element: 5,
  jobFlags: 1,
  normal: normalPhysical,
  runtime: { counters: {}, flags: {} },
  permanentModifiers: [],
  derivedModifiers: [],
  hooks: [],
  eventHooks: [],
  skills: { s1: {}, s2: {} },
}
```

| 字段 | 用途 | 备注 |
| --- | --- | --- |
| `id` | CharacterMB ID | 同时用于运行态、面板符号项和页面键值 |
| `nameKey` | i18n 角色名键 | 五种语言必须同时补充 |
| `speed` | MB 基础速度 | 页面可覆盖；每回合开始读取 |
| `element` | 属性 | `1蓝 / 2红 / 3绿 / 4黄 / 5暗`，目前用于条件选目标 |
| `jobFlags` | 职业 | `1战士 / 2射手 / 4法师`；决定普通伤害读取物防或魔防 |
| `normal` | 普攻定义 | 复用 `normalPhysical` 或 `normalMagic` |
| `runtime` | 角色声明的计数器和标记初值 | 引擎统一初始化为 `counters / flags / skillUses / actionCount` |
| `permanentModifiers` | 常驻倍率修正 | 不生成可解除 Buff，不参与 Buff 数 |
| `derivedModifiers` | 由计数器等动态值生成的常驻修正 | 当前用于阿尔托莉亚振奋层数 |
| `hooks` | 角色阶段钩子 | 开战、行动、逐段及行动结束效果统一入口 |
| `eventHooks` | 战斗事件监听 | 编译时只为上场角色建立事件索引 |
| `skills` | `s1`、`s2` | 两者同时可用时优先 S1 |

## 3. 技能与伤害段

### 3.1 技能结构

```js
{
  key: 's1',
  nameKey: 'raidSkillCharacterS1',
  cooldown: 4,
  damageType: 'phys',
  damageSteps: [],
  hooks: [],
  ignoredKeys: [],
}
```

`damageType` 当前出现：

| 值 | 含义 | 使用方式 |
| --- | --- | --- |
| `phys` | 物理主动伤害 | 按职业校验，结算 DEF 路与物防路 |
| `mag` | 魔法主动伤害 | 按职业校验，结算 DEF 路与魔防路 |
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
| `criticalCondition` | 技能自身的必定暴击条件 | 成立时本段强制暴击；不成立时回退到全局必暴配置 |

### 3.3 暴击追加段

```js
{
  stat: 'ATK', percent: 525,
  hits: {
    type: 'conditional',
    condition: { type: 'guaranteedCritical' },
    whenTrue: 10,
    whenFalse: 6,
  },
}
```

`hits` 和 `percent` 都可以是固定数字或动态数值定义。佛罗伦斯 S1 使用 `conditional` 数值解析器在必暴时取10段，否则取6段。

### 3.4 按技能历史变化段数

```js
{
  stat: 'ATK', percent: 740,
  hits: { type: 'skillUsesLinear', skillKey: 's2', base: 4, increment: 1, max: 6 },
}
```

计算公式为 `min(base + usesBefore × increment, max)`。历史次数在当前技能全部结算后增加。当前用于鹭丝堤卡 S2。

### 3.5 按运行态变化倍率

```js
{
  stat: 'ATK', hits: 7,
  percent: {
    type: 'counterLinear', counter: 'justice', base: 540, perStack: 150, max: 1140,
  },
}
```

`counterLinear` 从角色通用运行态读取计数器。计数器必须在角色 `runtime.counters` 中声明，否则阵容编译失败。相同解析器也可用于 `derivedModifiers[].rate`。

### 3.6 伤害段结束效果

```js
{
  stat: 'ATK', percent: 670, hits: 4,
  afterEffects: [{
    type: 'emitEvent', event: 'selfDamage',
    condition: { type: 'counterAtLeast', counter: 'analysis', count: 3 },
  }],
}
```

`damageSteps[].afterEffects` 在该伤害段的全部命中结算后、下一个伤害段读取动态段数和倍率前执行。效果走普通效果注册表、条件编译和行动详情记录，详情阶段为 `afterDamageStep`。它不是任意角色钩子，不会在每次命中后重复执行；逐命中效果继续使用 `afterHit` / `afterCriticalHit`。

当前用于アイシェ S1：首轮4段结束时读取解析层数，达到3层才再次广播一次自伤；第二轮4段随后读取第二次自伤后的解析状态。未注册效果、条件或未知计数器在编译期拒绝。

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
| `defensePenetrationRate` | 防御贯通百分比变化 | `页面配置防御贯通 × (1 + defensePenetrationRate)` | 科迪 |

当前尚无 `fixedSpeed`、暴击率、命中等友方 Modifier 通道。Boss 防御百分比不属于本表的 `modifiers[channel]`，应使用 Boss 状态的三个防御字段；不要把防御降低写进 `damageRate`。

## 5. 面板引用符号项 `symbolicModifiers`

面板引用不按归一攻击力 `1` 换算，而是与纯数值倍率分别汇总。

| `kind` | 表达式 | 示例 |
| --- | --- | --- |
| `sourceAttackOverTargetAttack` | `coefficient × ATK_来源 / ATK_目标` | 阿尔托莉亚给最慢友军加攻；穆瓦诺复制攻击 Buff 后的来源数值 |
| `targetBaseDefenseOverTargetAttack` | `coefficient × DEF0_目标 / ATK_目标` | 利伯瑞娅、静的防御转攻击 |

```js
symbolicModifiers: [
  { kind: 'sourceAttackOverTargetAttack', coefficient: 0.5, sourceId: 93 },
]
```

前端将每个符号项独立显示为“系数 × ATK_来源 / ATK_目标”，并标注数值来源。不同 `sourceId` 或目标面板的项不能合并为同一条普通攻击加成；即使当前所有角色 ATK 归一化而数值恰好相同，仍须保留来源差异。穆瓦诺复制时将复制到的 `attackRate` 转为以被复制目标为 `sourceId` 的符号项；原施加者仍保留在复制状态的 Buff 来源字段，不能与数值来源混用。

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
| `targetCondition` | 对每个已选目标分别判断的运行时条件；不满足时跳过该目标的本次效果 |
| `recordSkipped` | `targetCondition` 不满足时，在行动详情保留该目标的“已跳过”记录 |
| `replacementKey` | 同一来源的不同EffectGroup档位共享替换槽；新档整体替换旧档，不并存 |

### 6.1 状态类别

| 常量 | 值 | Buff 数 | 当前用途 |
| --- | --- | --- | --- |
| `REMOVABLE_BUFF` | `removableBuff` | 计入 | 攻击、暴伤、护盾、吸血等可解除 Buff |
| `UNREMOVABLE_STATE` | `unremovableState` | 不计 | 被动、守护、不可解除护盾和加攻 |
| `REMOVABLE_DEBUFF` | `removableDebuff` | 不计友方 Buff | Boss 沙尘、易伤、减速 |
| `UNREMOVABLE_DEBUFF` | `unremovableDebuff` | 不计 | 不可解除的 Boss 弱化；当前穆瓦诺 S1 的物理防御降低为实例 |
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

`targetCondition` 同样在选出目标后、逐个目标判断。`targetRemovableDebuffCountAtMost` 读取该目标当前的 `removableDebuff` 数量；梅琳 S1 用它表达“目标无弱化才施加攻击 Buff”，不影响同一技能中其他 EffectGroup 的独立结算。

`effectGroupId` 通常是固定整数；当前也允许使用 `conditional` 值定义选择MB的实际整数档位。莉贝“动き出した時間”在单Boss无弱化/有弱化时分别使用 `10200330101 / 10200330102`。动态档位必须同时声明稳定的 `replacementKey`，否则不同档位会被误认为可并存状态。

`removeStatusesEffect({ target, count, statusClass })` 按目标当前状态顺序移除至多 `count` 个指定类别状态，并在行动详情记录被移除的完整状态。梅琳 S1 的攻击条件先读取净化前的弱化数，再移除最多 2 个可解除弱化，避免将“有弱化时不加攻击”的分支错误地改写为净化后的无弱化分支。

### 6.3 友方 Buff 复制 `type: 'copyStatuses'`

通过 `copyStatusesEffect()` 创建：

```js
copyStatusesEffect({
  id: 'character-copy-buffs',
  nameKey: 'raidBuffCharacterCopy',
  target: 'self',
  sourceTarget: 'highestBuffCountOther',
  copyAttackRateAsSourceAttack: true,
})
```

复制会从 `sourceTarget` 选出的第一个目标读取所有可复制的 `removableBuff` 状态，并附加给 `target`。被复制的状态保留原 `effectGroupId`、原施加者、当前剩余行动次数与结算时数值；原目标的 Buff 不会移除。`copyAttackRateAsSourceAttack: true` 只改变复制体的取值方式：原状态不变，复制体的攻击率以被复制目标 ATK 为数值来源，作为独立符号项展示；原施加者仅表示该 Buff 的来源。不可解除状态和标记为 `copyable: false` 的状态不会被复制。并列目标沿用选择器的站位顺序。当前实例：穆瓦诺（Lv240）在 `actionStart` 复制 Buff 数最高的其他友军全部可复制 Buff，每隔 4 次自身行动再次触发。

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
  condition: { type: 'probabilityEnabled', key: 'characterDebuffSuccess' },
  recordSkipped: true,
})
```

| 字段 | 含义 |
| --- | --- |
| `durationRounds` | 全局回合持续时间；`null` 为永久 |
| `addStacks` | 每次成功施加增加层数 |
| `maxStacks` | 层数上限 |
| `damageRatePerStack` | 每层承伤增幅，汇入 `damageRate` 渠道 |
| `defenseRatePerStack` | 每层防御百分比增减，汇入 DEF 路面板修正 |
| `physicalDefenseRatePerStack` | 每层物防百分比增减，仅影响战士/射手伤害 |
| `magicDefenseRatePerStack` | 每层魔防百分比增减，仅影响法师伤害 |
| `statusClass` | 弱化的可解除类别；默认 `removableDebuff`，需明确标记的不可解除弱化写 `UNREMOVABLE_DEBUFF` |
| `condition` | 可使用 `probabilityEnabled` 读取 `config.probabilityOverrides` |
| `recordSkipped` | 条件失败时仍向详情记录“已跳过”事件 |

同 `id` 再次施加会增加层数并刷新整组持续回合。当前实例：光士易伤、利伯瑞娅沙尘、静易伤与速度降低、莉贝/阿尔托莉亚气绝，以及卡罗沉默、摩嘉娜受回复量降低、穆瓦诺延迟。行为效果未进入木桩模型的异常使用 `damageRatePerStack: 0`，但仍是可供弱化数量联动读取的独立 Boss EffectGroup。

光士使用角色 `afterCriticalHit` 钩子：每一暴击段结算后施加，因此当前段使用旧层数，下一段使用新层数。无条件段后效果使用 `afterHit`；其他命中、伤害类型条件应通过钩子条件扩展。

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
hook('afterDamage', [{
  type: 'setCooldown',
  target: 'self',
  skills: ['s1', 's2'],
  value: 0,
  eventType: 'cooldownReset',
}], {
  condition: { type: 'bossStacksAtLeast', statusId: 'liberia-sand', count: 4 },
  onceKey: 'liberiaCooldownReset',
})
```

全部伤害段结束后检查；满足时将自身 S1、S2 归零。`onceKey` 保存在角色运行态，保证每场战斗最多一次。当前仅用于利伯瑞娅。

## 9. 触发阶段、被动、事件和条件

### 9.1 支持阶段

| `phase` / `trigger` | 时点 | 常见用途 |
| --- | --- | --- |
| `battleStart` | 首回合排序前 | 开战加攻、加速、初始状态 |
| `actionStart` | 当前角色选择技能前 | 周期被动、按当前 Buff 数判断 |
| `beforeDamage` | 主体伤害前 | 自损、技能 Buff、Boss 弱化 |
| `afterHit` | 每个伤害段结算后 | 无条件段后触发 |
| `afterCriticalHit` | 每个暴击伤害段结算后 | 光士逐段易伤 |
| `afterDamage` | 全部伤害段后 | Buff、减冷却、条件重置 |
| `actionEnd` | 状态消费后 | 行动次数周期效果、结束条件 |

行动详情同时保留 `statusSnapshotBeforeAction`、`statusSnapshotAtDamage` 与 `statusSnapshotAfterAction`。面板的可解除 Buff 数显示使用“行动前 → 行动后”；行动后快照在 `actionEnd` 钩子和本次应消耗的持续时间均结算完毕后生成。`afterHit` / `afterCriticalHit` 可声明在具体技能或角色顶层；运行时先执行技能钩子，再执行角色全局钩子。

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
- 条件可用于钩子、效果整体，或 `statusEffect.targetCondition`。`anyRemovableBuffCountAtLeast` 判断任一上场友军的可解除 Buff 数；`targetRemovableDebuffCountAtMost` 判断当前候选目标的可解除弱化数。

### 9.3 战斗事件

技能通过通用效果广播事件：

```js
hook('beforeDamage', [{ type: 'emitEvent', event: 'selfDamage' }])
```

角色监听结构：

```js
eventHooks: [{
  event: 'selfDamage',
  effects: [{
    type: 'changeCounter',
    counter: 'justice',
    amount: 1,
    max: 4,
  }],
}]
```

当前只有：

- 事件 `selfDamage`：自损只触发机制，不实际降低木桩模式中的生命值。
- `changeCounter`：修改监听者声明的通用计数器；阿尔托莉亚使用 `counters.justice`。

条件 `counterAtLeast` 在当前效果执行时读取所属角色的已更新计数器。事件效果按声明顺序执行，因此“先 `changeCounter`、再判断 `counterAtLeast`”读取的是加层后的值。

当前事件载荷只保存事件名与来源。新增治疗、死亡、友军施法、受击等事件时，应先扩展通用事件载荷（来源、目标、数值、技能、伤害段），再增加监听器。

## 10. 概率、条件说明和忽略项

### 10.1 概率开关

概率效果使用 `condition: { type: 'probabilityEnabled', key }`，对应键必须在默认配置和页面中有布尔值。当前键：

| 键 | 效果 |
| --- | --- |
| `liberiaSand` | 利伯瑞娅 S1 沙尘成功 |
| `shizuSpeedDown` | 静 S1 速度降低成功 |
| `guinevereDamageTaken` | 桂妮维亚 S1 承伤增加与脱力成功 |
| `millaDelay` | 蜜拉 S1 延迟成功 |
| `yildizBuffBlock` | 耶尔德兹 S1 Buff无效成功 |
| `winterStellaSilence` | 暗黑圣耀星史黛拉 S2 沉默成功 |
| `lilicotteSilence` | 莉莉珂特 S2 沉默成功 |
| `liebesStun` | 莉贝 S1 气绝成功 |
| `artoriaStun` | 阿尔托莉亚 S1 气绝成功 |
| `carolSilence` | 卡罗 S1 沉默成功 |
| `morganaHealingDown` | 摩嘉娜 S1 每段受回复量降低成功 |
| `mowanoDelay` | 穆瓦诺 S2 延迟成功 |

当前只模拟确定成功/失败，不计算概率期望，也不为每段独立抽样。逐段附带的效果会在每段读取同一个确定场景开关。

### 10.2 `conditionKey`

当前仅作为 UI 说明，不是运行时条件表达式：

- `raidConditionDummyNoShield`：木桩无护盾，光士 S2 使用强化分支。
- `raidConditionDummyHigherHp`：木桩当前 HP 更高，静 S2 使用高倍率分支。

若未来需要用户切换条件或由战斗状态判断，必须新增真正的 `condition` 解析器，不能只增加 `conditionKey`。

### 10.3 `ignoredKeys`

用于明确展示当前口径不模拟的技能部分，例如击杀追加、净化、治疗、驱散、护盾数值和气绝造成的无法行动。气绝状态本身以及 Boss 防御/物防/魔防弱化已进入弱化模型，不得整体列为忽略项；友方承伤侧防御 Buff 仍可因木桩不受击而忽略。

同理，沉默的技能禁用、延迟的冷却恢复停滞、Buff无效的阻止效果以及受回复量/回避/攻击降低的战斗数值可以继续列入 `ignoredKeys`，但对应可解除 EffectGroup 必须另外保留为 Boss 状态并参与弱化数量联动。

新增角色时，所有未进入倍率、状态计数、速度、冷却或事件模型的技能文本都应进入 `ignoredKeys`，并补齐五种语言说明。

## 11. 已完成通用化与后续扩展点

| 旧专用结构 | 当前通用结构 | 使用对象 |
| --- | --- | --- |
| `dynamicPercent.type = artoriaJustice` | `counterLinear` 数值解析器 | 阿尔托莉亚 S2 |
| `runtime.justiceStacks`、`stackSelfAttack` | `runtime.counters + changeCounter + eventHooks` | 阿尔托莉亚振奋 |
| `afterCriticalHitBossStatus` | `afterCriticalHit` 钩子 | 光士逐段易伤 |
| `resetCooldownsIfBossStacks` | `bossStacksAtLeast + setCooldown + onceKey` | 利伯瑞娅 S2 |
| `hitsByUse` | `skillUsesLinear` 数值解析器 | 鹭丝堤卡 S2 |
| `criticalExtraHits` | `conditional + guaranteedCritical` | 佛罗伦斯 S1 |

仍待扩展：`conditionKey` 只是木桩固定分支的说明；需要动态判断时应注册真实条件。非线性数值序列、可消费计数器和带完整载荷的战斗事件也尚未实现。

机制注册在 `DEFAULT_RAID_MECHANICS`，阵容由 `compileRaidProgram()` 编译。未注册的效果、条件、数值解析器、目标选择器以及未声明的计数器会直接报错。运行内核不得按角色 ID 判断。

角色模块目前同步聚合。未来启用动态加载时，由页面加载选中角色定义并通过 `simulateRaidTable(config, environment)` 注入；编译器和运行内核无需改成异步。

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
| 暴击时追加攻击 | `conditional + guaranteedCritical`，不同倍率追加使用段后钩子 |
| 每次发动增加段数 | `skillUsesLinear` |
| 按层数提高技能倍率 | `counterLinear` |
| 攻击力/增伤/暴伤/速度提高 | `modifiers[channel]` |
| 防御或他人攻击转自身攻击 | `symbolicModifiers` |
| 持续N次行动 | 友方 `status.duration` |
| 复制 Buff 数最高其他友军的所有可复制 Buff | `copyStatusesEffect({ sourceTarget: 'highestBuffCountOther' })` |
| 持续N回合的敌方异常 | `bossStatus.durationRounds` |
| 异常叠层并刷新 | `bossStatus.addStacks/maxStacks` |
| 相邻、攻击最高、Buff最多、速度最低 | `target` 选择器 |
| 技能前自损 | `beforeDamage` 钩子中的 `emitEvent` |
| 每N次自身行动触发 | `passives.every + offset` |
| 减少技能冷却 | `cooldownReduction` |
| 满足异常层数后重置冷却 | `afterDamage` 钩子 + 条件 + `setCooldown` |
| 概率成功 | `probabilityEnabled` 条件 + 配置开关 |
| 当前木桩固定满足的分支 | `conditionKey`，仅说明用途 |
| 目标带弱化时本段必定暴击 | `criticalCondition: { type: 'bossStatusCountAtLeast', count: 1 }` |
| 不参与首版的技能文本 | `ignoredKeys` |

## 新增通用词条（アイシェ、リリコット及r1820复核）

| 类别 | 名称 | 含义 |
| --- | --- | --- |
| damage step | `afterEffects` | 当前伤害段全部命中后、下一伤害段解析前执行一次通用效果列表。 |
| condition | `counterAtLeast` | 当前所属角色的已声明计数器不少于阈值。 |
| actor status | 动态 `effectGroupId` | 使用 `conditional` 选择实际MB状态档位；编译器要求两个分支均为整数。 |
| actor status | `replacementKey` | 不同EffectGroup档位共享替换槽，避免换档时短暂叠加。 |

`r1820` 同时确认并修正了既有实现：莉贝行动开始只选择自身与攻击最高的1名其他友军，且被动按“带弱化的敌人数”而不是目标弱化组数增长；单Boss只取10%/20%档。露昕鲁S2与S1一样先自伤；阿尔托莉亚正义和开战屏障现保留真实EffectGroup。

### 气绝状态与Boss属性条件

| 类别 | 名称 | 含义 |
| --- | --- | --- |
| condition | `bossElementIs` | 读取所选Boss模板的官方属性，仅在属性等于 `element` 时成立。 |
| Boss status | 气绝 | 以0倍率的 `removableDebuff` 保存真实EffectGroup并参与弱化联动；无法行动明确忽略。 |

索尼娅模板为蓝属性，光士模板为翠属性。阿尔托莉亚S1只在翠属性Boss上逐段尝试气绝；莉贝S1在主体伤害后尝试气绝。两者都使用确定成功/失败开关。编译器与角色校验器拒绝 `bossElementIs` 中未注册的属性值。

## 新增通用词条（摩嘉娜、露昕鲁）

| 类别 | 名称 | 含义 |
| --- | --- | --- |
| target selector | `all` | 按站位顺序选择当前阵容全部角色；可再使用 `targetElement` 过滤。 |
| value resolver | `otherLineupElementCountLinear` | 以施法者之外、指定属性的上阵角色数代入线性值；支持 `base`、`perStack` 和 `max`。 |
| value resolver | `bossStatusThresholds` | 以木桩状态组数量选择 `values` 的对应档位；数量超过数组末位时使用末位。 |

`bossStatusThresholds` 按不同 EffectGroup 状态计数，不把同一组的层数重复计为多个弱化效果。这与单体木桩中“目标附带的弱化效果个数”的可观测映射一致。

## 新增通用词条（弗莱可、桂妮维亚、莉贝）

| 类别 | 名称 | 含义 |
| --- | --- | --- |
| target selector | `topAttackOther` | 按固定攻击优先级选择施法者以外的友军。 |
| condition | `bossStatusCountAtLeast` | 木桩身上的不同 Boss 状态组数量不少于 `count`。 |
| condition | `actorHasStatus` | 当前行动者拥有指定运行时状态。 |
| value resolver | `bossStatusCountLinear` | 以木桩状态组数量代入 `base + perStack × count`，并按 `max` 截断。 |
| status modifier | `rate` / `coefficient` 值解析器 | 状态的倍率或符号项系数可使用已注册 value resolver；结算时按状态来源角色读取动态计数。 |

`damageRatePerStack: 0` 且没有防御字段的 Boss 状态仍是可读取的弱化 EffectGroup：它不改变当前倍率，但会参与弱化数量、刷新与到期结算。防御类状态分别通过 `defenseRatePerStack`、`physicalDefenseRatePerStack`、`magicDefenseRatePerStack` 改变对应面板。运行时快照保留 EffectGroup、施加者、可解除类别、层数、每层防御修正与剩余回合；可解除与不可解除弱化都会展示，只有前者可被后续解除机制匹配。

## 新增通用词条（米赫里、波普莉、嘉德利亚、梅尔林）

| 类别 | 名称 | 含义 |
| --- | --- | --- |
| trigger | `roundStart` | 每个全局回合开始、速度排序前执行的角色钩子。 |
| hook schedule | `everyRounds` / `roundOffset` | 以全局回合而非角色行动次数调度钩子。 |
| modifier channel | `cooldownRecoveryBonus` | 在行动结束时与基础冷却恢复 1 相加；恢复值最低为 0。 |
| condition | `skillUsesAtLeast` / `skillUsesAtMost` | 当前技能本次发动前的历史使用次数比较。 |
| condition | `otherLineupElementCountAtLeast` | 阵容中除施法者外，指定属性角色数量不少于阈值。 |
| condition | `roundAtMost` | 当前全局回合不晚于指定回合。 |
| condition | `actorRemovableBuffCountAtLeast` | 当前行动者自身的可解除 Buff 数不少于阈值；用于朝日在行动结束、状态时钟消耗后决定风林火山增加 1/2/3 层。 |
| value resolver | `counterThresholds` / `skillUsesThresholds` | 以计数器或技能历史为索引从 `values` 取档；超出数组时取末档。 |

## 新增通用词条（蜜拉、艾蒂涅、宝拉、耶尔德兹、暗黑圣耀星史黛拉）

| 类别 | 名称 | 含义 |
| --- | --- | --- |
| battle event | `activeSkillHeal` | 主动技能即时回复事件；`emitEvent.target` 保存本次回复目标，供接收者计数和全队监听被动使用。 |
| target selector | `selfAndTopAttackOther` | 先选择自身，再按固定攻击优先级选择其他友军；配合 `targetCount` 表达自身加攻击最高N人。 |
| condition | `eventTargetsIncludeOwner` | 当前事件的目标列表包含监听者本人。 |
| condition | `targetElementNot` | 候选目标不是指定属性，用于同一被动对翠/非翠使用不同EffectGroup。 |
| condition | `roundAtLeast` | 当前全局回合不早于指定回合。 |
| Boss status | `replacementKey` | 不同声明ID共享一个运行时替换槽；晚档替换早档并刷新，不叠加。 |

回复事件按“效果发动次数”计数：史黛拉S2一次回复两个目标仍为一次；艾蒂涅S2连续发动三次回复则为三次。蜜拉S1在伤害后广播，其他本批即时回复在伤害前广播。回复触发的攻击状态均为不可解除状态，不计入可解除Buff数。

## 新增通用词条（科迪、凉风战神萨宾娜）

| 类别 | 名称 | 含义 |
| --- | --- | --- |
| damage step | `criticalCondition` | 条件成立时本段强制暴击；不成立时回退到全局 `guaranteedCritical` 场景。 |
| modifier channel | `defensePenetrationRate` | 以页面配置的防御贯通为基准乘算百分比变化，不影响物理/魔法防御贯通。 |

科迪S2使用 `bossStatusCountAtLeast` 强制暴击，能够在关闭全局必暴时仍正确读取Boss弱化；萨宾娜S2的“4次以上暴击”在确定场景中使用现有 `conditional + guaranteedCritical`，开启时追加1段600%，关闭时不追加。
