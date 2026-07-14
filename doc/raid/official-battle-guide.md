# 游戏内战斗指南语义与 MB 映射

本文整理游戏内“指南”的官方战斗语义，并建立 MB、文本资源、战斗日志与讨伐引擎结构之间的映射。目标是避免仅凭技能中文描述猜测时序、数值基准、目标选择或状态行为。

当前内容覆盖用户提供的第一、第二批截图；后续截图继续追加到本文。本文不表示所有规则均已由讨伐引擎实现。

## 1. 文档职责与证据优先级

- [skill-modeling-guide.md](./skill-modeling-guide.md)：项目采用的结算口径、假设和待确认事项。
- [skill-term-reference.md](./skill-term-reference.md)：角色声明可使用的数据字段和机制注册表。
- 本文：官方术语的语义、MB来源以及映射到引擎时应采用的规范化概念。

同一规则存在冲突时按以下顺序判断：

1. 角色最高等级、Ex3 的技能描述：确认该技能明确写出的覆盖或例外。
2. 游戏内指南与对应 `HelpMainText`：确认术语未被技能覆盖时的一般规则。
3. MB字段：确认ID、冷却、技能等级、子技能、EffectGroup等结构事实。
4. 受控战斗日志：确认实际触发顺序、分类、持续时间补偿、叠层与目标。
5. 项目约定：以上信息仍不能唯一确定时采用，必须明确标记为假设。

官方指南描述一般规则；角色技能明确写出的特殊规则和经日志验证的行为可以覆盖一般规则，但需要在角色定义及测试中记录证据。

## 2. MB到标准词条的映射链

### 2.1 数据来源

| 数据文件/来源 | 关键字段 | 可确认内容 | 不能单独确认的内容 |
| --- | --- | --- | --- |
| `ActiveSkillMB.json` | `Id`、`NameKey`、`SkillInitCoolTime`、`SkillMaxCoolTime`、`ActiveSkillInfos[].OrderNumber/DescriptionKey/SubSetSkillIds` | 主动技能ID、等级/专武档位描述、最大冷却和子技能集合 | 子技能的真实执行时序、命中段数、状态类别 |
| `PassiveSkillMB.json` | `PassiveSkillInfos[].PassiveSubSetSkillInfos[].PassiveTrigger/SubSetSkillId/PassiveGroupId` | 被动子技能及触发枚举原始值 | `PassiveTrigger` 数字的业务含义；必须有枚举表或日志验证 |
| `EffectGroupMB.json` | `Id`、`NameKey`、`DescriptionKey`、`IsHide`、`IsTurnHide`、`EffectGroupInfoList[].EffectGroupId/OrderNumber` | EffectGroup展示组、名称、描述、可见性及组内关联 | 可解除性、Buff计数、运行时叠层和刷新规则 |
| `SkillDescriptionLinkTextMB.json` | `TargetTextKey`、`LinkTextKeys` | 技能描述中的标准词条链接到哪条官方指南 | 角色技能的具体数值与时序 |
| `TextResourceZhCnMB.json`及其他语言 | `StringKey`、`Text` | 官方名称、技能文本和指南正文 | 引擎字段本身 |
| 战斗日志 | `SkillCategory`、`EffectTurn`、施法者/目标/授予者、子结果顺序 | 可解除分类、实际持续值、目标、触发顺序、偷取/复制等运行行为 | 未在该场战斗出现的分支 |

当前同步到仓库的技能与EffectGroup MB主要是索引与说明层，并不包含完整的子技能执行定义。因此不能期待只读取这几份MB就自动生成完整角色逻辑。

### 2.2 标准词条链接示例

游戏内这一组战斗指南在 `TextResource*MB` 中的完整索引如下：

| 指南内容 | `StringKey` | `TextResource Id` |
| --- | --- | ---: |
| 主动/被动技能 | `[HelpMainText2210]` | `21907` |
| 回合 | `[HelpMainText2220]` | `21909` |
| 技能目标指定 | `[HelpMainText2211]` | `21911` |
| 攻击类型 | `[HelpMainText2212]` | `21913` |
| 增益/弱化通则 | `[HelpMainText2213]` | `21915` |
| 增益效果种类 | `[HelpMainText2214]` | `21917` |
| 弱化效果种类 | `[HelpMainText2215]` | `21919` |
| 其他效果 | `[HelpMainText2216]` | `21921` |
| 概率上升/下降 | `[HelpMainText2217]` | `21923` |
| 能力值基准与涵盖范围 | `[HelpMainText2218]` | `21925` |
| 行动与行动顺序 | `[HelpMainText2219]` | `21927` |

上述键在项目使用的简中、繁中、英文、日文、韩文MB中均存在，且ID一致。

| 标准词条 | `SkillDescriptionLinkTextMB.Id` | `TargetTextKey` | 官方说明键 |
| --- | ---: | --- | --- |
| 脱力 | `17` | `[SkillDescriptionLinkText17]` | `HelpMainText_Skill_Enfeeble` |
| 迟缓 | `18` | `[SkillDescriptionLinkText18]` | `HelpMainText_Skill_Delay` |
| 轻快 | `32` | `[SkillDescriptionLinkText32]` | `HelpMainText_Skill_Hasten` |

解析流程：技能描述中出现标准词条链接键时，先通过 `SkillDescriptionLinkTextMB` 找到 `LinkTextKeys`，再从对应语言 `TextResource*MB` 读取官方定义。词条名称不是逻辑本身，逻辑应映射到本文定义的规范化语义。

当前 `SkillDescriptionLinkTextMB` 的映射范围可分为：

- `Id=1–33`：通用标准状态，其中1–32已纳入下面的增益/弱化表，33为“晕厥免疫”。
- `Id=1001–1031`：角色专属状态名称，统一链接到“角色专属增益/弱化”指南。它们只提供名称分类，不能据此生成通用机制；必须继续读取角色描述、EffectGroup和日志。
- 部分通用修正（例如输出伤害上升、承受伤害下降）没有独立 `TargetTextKey`，只存在于 `[HelpMainText2214/2215]` 综合正文中。

### 2.3 建议的词条登记格式

```js
{
  termId: 'delay',
  aliases: ['迟缓'],
  textLinkIds: [18],
  helpTextKeys: ['HelpMainText_Skill_Delay'],
  effectGroupIds: [],
  normalizedMechanics: ['cooldownRecoveryRateDown'],
  evidence: ['officialGuide', 'characterDescription'],
  implementationStatus: 'notImplemented',
  notes: [],
}
```

`effectGroupIds` 应按具体角色技能补充，不能假设同名词条永远只对应一个 EffectGroupId。

## 3. 技能、行动和触发时机

官方综合指南文本：`[HelpMainText2210]`（技能）与 `[HelpMainText2219]`（行动）。

### 3.1 主动技能

- 角色行动时按技能顺序发动当前可用的主动技能；技能发动后进入冷却。
- 每次角色行动结束时，冷却恢复1；归零后可再次发动。
- 所有主动技能均在冷却时执行普通攻击。
- 因技能效果再次发动主动技能，不计入角色行动次数。

| 官方概念 | 规范化概念 | 当前引擎 |
| --- | --- | --- |
| 最大冷却 | `skill.cooldown` | 已支持，来源为 `SkillMaxCoolTime` |
| 行动结束恢复冷却 | `actionEnd.cooldownRecovery` | 已支持固定恢复1 |
| 再次发动主动技能 | `extraSkillCast` | 未实现；未来不得增加 `actionCount` |
| 全技能冷却后普攻 | `normalAttackFallback` | 已支持 |

### 3.2 被动技能

- 被动在指定时机自动触发；未写明触发时机的被动在战斗开始时触发。
- 多个技能同时满足条件时，按角色行动顺序依次触发。
- 未命中的攻击不能触发依赖“攻击/受到攻击”的被动；普攻强化附带的效果可以触发被动。
- 被动通常不触发其他被动；官方列出的特殊被动可以例外。

| 技能描述 | 规范化触发器 | 备注 |
| --- | --- | --- |
| 未注明触发时机的被动、战斗开始时 | `battleStart` | 优先于第1回合开始时 |
| 回合开始时、第N回合开始时 | `roundStart` | 全局TURN阶段；当前引擎尚无该钩子 |
| 每回合行动开始时 | `actionStart` | 单个角色行动阶段 |
| 受到攻击时/后 | `onAttacked` / `afterAttacked` | 当前木桩模式未实现 |
| 失去战斗能力时 | `onDefeated` | 当前木桩模式未实现 |

禁止把“回合开始时”直接映射成 `actionStart`。二者属于不同计时体系。

### 3.3 行动与速度

- 通常每名角色每个全局回合行动一次；主动技能或普攻结束后，本次行动结束。
- 晕厥、沉睡等使角色无法行动时，仍直接结束本次行动。
- 额外发动主动技能、触发被动、伤害反弹均不计入角色行动次数。
- 每回合开始时按当时速度决定本回合行动顺序；本回合内的速度变化不重排，下一回合重新判定。

当前讨伐引擎的回合开始速度快照与冻结顺序符合官方规则。控制效果、额外施法和反弹尚未实现。

## 4. 两种“回合”与持续时间

官方综合指南键为 `[HelpMainText2220]`。

### 4.1 全局TURN

“第N回合”“第N回合起”“N回合内”、回合开始/结束、本回合和过去N回合，通常指战斗画面顶部的TURN。

- 回合开始时：TURN切换后、任一角色行动前。
- 回合结束时：所有角色完成行动后、下一TURN显示前。
- 本回合：当前TURN显示后至进入下一TURN前。
- 过去N回合：按全局TURN向前回溯。

引擎映射为 `roundStart`、`roundEnd`、`durationRounds` 和全局回合历史；当前只完整支持Boss状态的 `durationRounds` 与回合末到期。

### 4.2 角色行动次数

“效果持续N回合”通常指状态附带者结束N次行动后消失：

- 状态附带后立即生效。
- 若在该角色本次行动开始至行动结束之间获得，持续次数从其下一次行动结束开始计算。
- 其他时间已存在的状态在角色本次行动结束时消耗一次持续次数。

当前友方状态的 `duration` 与 `remainingActions` 按此规则实现。新增词条时必须明确 `durationBasis: 'targetActions' | 'globalRounds'`，不能只保存数字。

## 5. 能力值的三层基准

官方综合指南键为 `[HelpMainText2218]`。

| 官方名称 | 规范化键 | 涵盖范围 | 引擎状态 |
| --- | --- | --- | --- |
| 角色培育能力数值 | `trainedStat` | 潜能、武具基础/附加属性、神装、套装、专武被动、符石、秘仪、玩家等级等 | 当前不输入实际面板 |
| 状态效果生效前的能力数值 | `preStatusStat` | `trainedStat` 加属性加成、魔女赠礼等；不含战斗中Buff/弱化 | 已实现编队属性加成；符号项中的 `ATK_x/DEF0_x` 抽象表达该层 |
| 战斗期间的能力数值 | `combatStat` | `preStatusStat` 加全部战斗中Buff/弱化、加护和公会战效果 | 当前仅对归一攻击、速度及少量修正建模 |

- `preStatusStat` 是 `combatStat` 的计算基础，也可直接用于战斗条件判断。
- 战斗开始时触发的Buff/弱化属于 `combatStat`，不回写 `preStatusStat`。
- 战斗开始时技能优先于第1回合开始时技能。
- 普通“能力数值上升/下降”以 `preStatusStat` 为增减基准。
- 防御贯通的百分比提升同样按状态生效前的防御贯通为基准；讨伐拉表先在页面配置值上加入幽冥3人加成1000，再应用 `defensePenetrationRate`。
- “脱力”是例外：攻击力降幅以当时 `combatStat` 为基准。

新增按面板取值的效果必须记录 `statBasis`：

```text
trained | preStatus | combat | sourceAtCast | targetBeforeApply
```

“状态效果生效前的目标能力值”应在附加该状态之前建立快照。同一阶段中更早施加的状态是否计入，需结合技能描述、MB子技能顺序和日志确认。

## 6. 目标指定规则

官方综合指南键为 `[HelpMainText2211]`。

| 官方方式 | 一般规则 | 当前引擎 |
| --- | --- | --- |
| 随机 | 面前目标权重较高；若有优先条件则先筛选再随机 | 未实现随机权重 |
| 排序 | 按指定能力值升/降序选前N名；同值按站位从上到下 | 仅用页面固定攻击优先级或特定简化选择器 |
| 面前 | 选择相同站位敌人；目标失能时从存活敌人随机 | 未实现 |
| 附近 | 从基准角色及其两侧角色中选择；无合法两侧目标时强制随机1人 | 当前 `adjacent` 只表示线性相邻，不等同完整官方“附近” |

排序技能还需遵守：连续攻击每次重排；战斗开始时和第1回合开始时使用 `preStatusStat`；其他技能使用当时 `combatStat`。因此页面固定攻击优先级只是规划模式近似。

目标影响优先级：混乱 → 面前/附近 → 隐身 → 排序 → 挑衅 → 随机。透明和失去战斗能力的角色不会成为目标。当前木桩模式尚未实现这条目标管线。

## 7. 攻击类型

官方综合指南键为 `[HelpMainText2212]`。

| 类型 | 官方语义 | 当前拉表 |
| --- | --- | --- |
| 物理攻击 | 受物理防御和物理暴击伤害降低影响 | 保留 `phys` 标签，木桩忽略防御 |
| 魔法攻击 | 受魔法防御和魔法暴击伤害降低影响 | 保留 `mag` 标签，木桩忽略防御 |
| 直接攻击 | 无视防御力、物理防御力和魔法防御力 | 使用 `direct`；是否暴击由当前项目假设决定，指南本段未证明一定可暴击 |

不能仅因伤害基准为STR或其他能力值就自动判断为直接攻击；应以技能描述和子技能类型为准。

## 8. 标准状态词条

### 8.1 能力上升、能力下降与脱力

| 词条 | 官方键 | 规范化逻辑 |
| --- | --- | --- |
| 能力数值上升 | `HelpMainText_Skill_IncreasedStat` | `preStatusStat × rate` 加到 `combatStat` |
| 能力数值下降 | `HelpMainText_Skill_DecreasedStat` | `preStatusStat × rate` 从 `combatStat` 扣除 |
| 脱力 | `HelpMainText_Skill_Enfeeble` | 以附加目标当时 `combatStat.attack` 为基准降低攻击 |

脱力不能复用普通百分比攻击下降的静态基准；未来应实现独立 `statBasis: 'combat'` 或专用数值解析器。

### 8.2 迟缓与轻快

| 词条 | 官方键 | 规范化逻辑 |
| --- | --- | --- |
| 迟缓 | `HelpMainText_Skill_Delay` | 降低主动技能冷却恢复速度，最低不能低于0 |
| 轻快 | `HelpMainText_Skill_Hasten` | 提高主动技能冷却恢复速度，与迟缓相互抵消 |

建议统一表示为：

```text
actionEndCooldownRecovery = max(0, 1 + hasten - delay)
```

当前引擎只有固定行动末恢复1和即时 `cooldownReduction`，尚未实现冷却恢复速度通道。迟缓不应建模为一次性增加当前冷却，轻快也不等同一次性减冷却。

### 8.3 增益效果种类映射

完整来源为 `[HelpMainText2214]`（`Id=21917`）。表中“链接ID”对应 `SkillDescriptionLinkTextMB.Id`；空白表示当前没有独立标准链接记录，仍可从综合指南键读取定义。

| 官方词条 | 链接ID/官方键 | 规范化机制 | 当前状态 |
| --- | --- | --- | --- |
| 能力数值上升 | `HelpMainText_Skill_IncreasedStat` | 基于 `preStatusStat` 的属性修正 | 攻击、速度等部分支持 |
| 输出伤害上升 | `HelpMainText_Skill_IncreasedDamageDealing` | `damageRate`正修正 | 已支持 |
| 承受伤害下降 | `HelpMainText_Skill_DecreasedDamageTaken` | 目标侧承伤负修正 | 未模拟己方受击 |
| 回血量上升 | `HelpMainText_Skill_IncreasedIncomingHealingPotency` | `healingReceivedRate`，作用于恢复/再生/吸血 | 未实现 |
| 伤害免疫 | `1` / `HelpMainText_Skill_Invulnerable` | 伤害管线归零，不消耗屏障或护盾 | 未实现 |
| 多重屏障 | `2` / `HelpMainText_Skill_MultiBarrier` | 按层抵消整次伤害 | 只作为Buff计数状态 |
| 护盾 | `3` / `HelpMainText_Skill_Shield` | 消耗护盾值，溢出扣生命 | 只作为Buff计数状态 |
| 结界 | `4` / `HelpMainText_Skill_ForceField` | 对指定伤害类型比例减伤；与阻绝取最强 | 未实现 |
| 弱化效果免疫 | `5` / `HelpMainText_Skill_DebuffImmunity` | 阻止新弱化，既有弱化不失效 | 未实现 |
| 控制效果免疫 | `6` / `HelpMainText_Skill_Unhindered` | 仅免疫沉默/晕厥/沉睡/混乱 | 未实现 |
| 沉默免疫 | `7` / `HelpMainText_Skill_SilenceImmunity` | 阻止新沉默，既有沉默不失效 | 未实现 |
| 晕厥免疫 | `33` / `HelpMainText_Skill_FaintedImmunity` | 阻止新晕厥，既有晕厥不失效 | 未实现 |
| 挑衅 | `8` / `HelpMainText_Skill_Taunt` | 影响随机目标，不影响指定目标 | 未实现 |
| 隐身 | `9` / `HelpMainText_Skill_Stealth` | 排除单体目标，但不能规避面前指定 | 未实现 |
| 透明 | `10` / `HelpMainText_Skill_Invisibility` | 排除敌我双方目标 | 未实现 |
| 晕厥反击 | `11` / `HelpMainText_Skill_CounterXX` | `afterAttacked`概率附加晕厥 | 未实现 |
| 再生 | `12` / `HelpMainText_Skill_Regeneration` | `actionStart`恢复 | 未实现生命值 |
| 不死之身 | `13` / `HelpMainText_Skill_Immortality` | 致命伤保留1生命 | 未实现 |
| 伤害反弹特化 | `14` / `HelpMainText_Skill_CounterShift` | 替代普通反弹公式；必定命中，不计攻击次数 | 未实现 |
| 献身 | `15` / `HelpMainText_Skill_Devotion` | 代承受并包含超量伤害；与共鸣合并为一次 | 未实现 |
| 增益效果护罩 | `16` / `HelpMainText_Skill_BuffCover` | 优先承受解除/夺取，不阻止时长或层数变化 | 未实现 |
| 轻快 | `32` / `HelpMainText_Skill_Hasten` | 提高行动末冷却恢复速度 | 未实现 |
| 角色专属增益 | `HelpMainText_Skill_Character-SpecificBuffs` | 按具体EffectGroup声明 | 部分支持 |

多重屏障与护盾同时存在时先消耗多重屏障；伤害免疫存在时两者均不消耗。多种多重屏障的消耗优先级依次比较：剩余持续时间较短、触发阈值较高、剩余层数较少。

结界作用于攻击、共鸣、献身和反弹伤害，不作用于持续伤害；计算位置在输出/承伤增减之后、护盾/共鸣/献身之前。结界与阻绝同时存在时只采用减伤最强者，不应直接相乘或相加。

### 8.4 弱化效果种类映射

完整来源为 `[HelpMainText2215]`（`Id=21919`）。

| 官方词条 | 链接ID/官方键 | 规范化机制 | 当前状态 |
| --- | --- | --- | --- |
| 能力数值下降 | `HelpMainText_Skill_DecreasedStat` | 基于 `preStatusStat` 的属性负修正 | 未完整实现 |
| 脱力 | `17` / `HelpMainText_Skill_Enfeeble` | 基于当前 `combatStat.attack` 的攻击下降 | 未实现 |
| 输出伤害下降 | `HelpMainText_Skill_DecreasedDamageDealing` | `damageRate`负修正 | 注册表可表达，暂无角色 |
| 承受伤害上升 | `HelpMainText_Skill_IncreasedDamageTaken` | 目标侧 `damageRate`正修正 | Boss易伤已支持 |
| 回血量下降 | `HelpMainText_Skill_DecreasedIncomingHealingPotency` | `healingReceivedRate`负修正 | 未实现 |
| 迟缓 | `18` / `HelpMainText_Skill_Delay` | 降低行动末冷却恢复速度 | 未实现 |
| 沉默 | `19` / `HelpMainText_Skill_Silence` | 本次行动只能普攻 | 未实现 |
| 晕厥 | `20` / `HelpMainText_Skill_Fainted` | 跳过主动/普攻并结束行动 | 未实现 |
| 沉睡 | `21` / `HelpMainText_Skill_Sleep` | 跳过行动，并按回合或条件解除 | 未实现 |
| 混乱 | `22` / `HelpMainText_Skill_Confusion` | 指定目标改为敌我随机，部分友方/双向技能例外 | 未实现 |
| 中毒 | `23` / `HelpMainText_Skill_Poison` | `actionStart`按当前生命百分比伤害，上限为附带者攻击 | 未实现 |
| 燃烧 | `24` / `HelpMainText_Skill_Burn` | 同中毒的当前生命百分比与攻击上限 | 未实现 |
| 流血 | `25` / `HelpMainText_Skill_Bleed` | `actionStart`按附加者攻击快照造成伤害 | 未实现 |
| 侵蚀 | `26` / `HelpMainText_Skill_Erosion` | `actionStart`按施法技能总伤害快照造成伤害 | 未实现 |
| 恶化 | `27` / `HelpMainText_Skill_Aggravation` | 持续伤害增幅；中毒/燃烧仍受攻击上限 | 未实现 |
| 不治 | `28` / `HelpMainText_Skill_Blight` | 阻止恢复/再生/吸血 | 未实现 |
| 增益效果免疫 | `29` / `HelpMainText_Skill_BuffImmunity` | 阻止可解除增益及其条件刷新，不影响已有和不可解除增益 | 未实现 |
| 禁锢 | `30` / `HelpMainText_Skill_Bind` | 攻击无法被闪避 | 未实现 |
| 共鸣 | `31` / `HelpMainText_Skill_Resonance` | 一方受击时另一方承受比例伤害，含超量伤害 | 未实现 |
| 角色专属弱化 | `HelpMainText_Skill_Character-SpecificDebuffs` | 按具体EffectGroup声明 | 沙尘、易伤等部分支持 |

控制效果是沉默、晕厥、沉睡、混乱的集合。持续伤害是中毒、燃烧、流血、侵蚀的集合，必须保存伤害基准、附加者和施法时伤害快照，不能只保存一个百分比。

## 9. 增益/弱化效果通则

官方综合指南键为 `[HelpMainText2213]`。

### 9.1 分类、附加成功率与持续时间

- 增益是有利状态，弱化是不利状态；施加称为“附加”，持有称为“附带”。
- 未写附加/解除概率时，技能基础概率按100%理解，但弱化最终成功率仍受弱化命中和抵抗影响。
- 效果只在持续时间归零前有效；通常在附带者行动结束时持续时间减1。
- 行动过程中获得的状态立即生效，并从下一次行动结束开始计时。
- 特定技能可以增加或减少持续时间。

当前概率开关只是确定成功/失败场景，尚未计算弱化命中与抵抗。官方指南给出的组合方式见第10节；双方基础能力值如何换算为“成功率”以及最终概率是否另有上下限，仍需从客户端公式或日志确认。

### 9.2 重复附加、替换与叠层

- 一般同类型状态可以重复存在，但具体状态可能另有规则。
- 脱力、晕厥、中毒、流血、燃烧、侵蚀、恶化重复时，保留同类型中持续时间最长、效果最强的部分。
- 同一角色附加的相同且不可叠加状态，新的效果直接替换旧效果。
- 可叠层状态随附加次数增强，并受层数上限约束；解除后层数归零。
- 直接增减层数不是“附加/解除”，不受弱化命中和抵抗影响；目标没有对应状态时不生效。
- 只改变层数不会重置持续时间。

当前引擎对友方同来源同EffectGroup采用整体替换，对Boss状态通常增加层数并刷新持续时间，不能作为所有状态的统一规则。后续状态定义应显式增加：

```js
{
  reapplyPolicy: 'coexist' | 'replace' | 'keepStrongestLongest' | 'addStacks',
  durationRefresh: 'refresh' | 'preserve',
  stackRemoval: 'all' | 'amount',
}
```

沙尘等角色专属状态继续以技能描述和日志为准，不应仅按通则推断。

### 9.3 解除、持续时间增减、复制与夺取

- 当可选状态多于技能处理数量时，一般随机选择目标状态。
- 对敌方增益进行解除、缩短，或对敌方施加/复制弱化时，通常仍受弱化命中与抵抗影响。
- 解除多种状态时，若无特殊说明，对每个状态分别进行成功判定。
- 复制获得状态但不移除原状态；夺取会解除并获得目标增益。
- 献身、共鸣、无法被解除的状态不可复制或夺取；复制/夺取获得的效果不能更新强度。
- 指南对中毒、燃烧的持续伤害上限/伤害量，以及脱力降幅的计算基准列出特殊处理：使用附加目标的 `combatStat`。

当前木桩模式不模拟解除、缩短、复制或夺取。以后实现时需要保留来源、原始施法快照、可复制/可夺取标记和每个EffectGroup的独立成功判定。

### 9.4 无法被解除的状态

- 不计入角色身上附带的增益/弱化总数，但可以满足“附带某个特定状态”的条件。
- 不受解除、持续时间增减、复制、夺取影响。
- 不受增益/弱化免疫、弱化命中或弱化抵抗影响。
- 除部分特例外不显示图标。
- 仍可触发以“获得主动技能附加的增益”或“被主动技能附加弱化”为条件的技能。

这支持当前鹭丝堤卡Buff计数只统计可解除 EffectGroup 的实现。`unremovableState` 与 `unremovableDebuff` 应同时保留“是否计总数”和“是否可匹配特定状态条件”两种独立属性，不能用一个布尔值代替全部语义；木桩表的 Boss 快照也保留并展示不可解除弱化，供后续功能直接读取。

## 10. 概率上升与下降

第三批截图已在本地MB中确认，无需以截图人工转录：

- 文件：`TextResourceZhCnMB.json`
- `Id`：`21923`
- `StringKey`：`[HelpMainText2217]`
- 内容：概率上升、概率下降，以及暴击率、命中率、弱化效果命中率的完整计算范例。

### 10.1 一般概率的加减方式

暴击和命中先根据双方基础能力值计算基础“成功率”，再加减概率型状态：

```text
最终暴击率
= 暴击能力对抗得到的成功率
+ 攻击者暴击率修正
- 目标抗暴率修正

最终命中率
= 命中能力对抗得到的成功率
+ 攻击者命中率修正
- 目标闪避率修正
```

“上升/下降”应统一存为带符号修正值：上升为正，下降为负。目标侧对抗属性按照减号进入，因此目标抗暴率下降或闪避率下降会反向提高攻击者的最终成功率。

官方示例确认：

- 基础暴击成功率60%，攻击者暴击率上升30% → 最终90%。
- 基础暴击成功率60%，目标抗暴率上升30% → 最终30%。
- 基础命中成功率50%，攻击者命中率下降30% → 最终20%。
- 基础命中成功率50%，目标闪避率下降30% → 最终80%。

指南没有在该条目中说明最终概率的统一截断范围，因此暂不把 `clamp(0, 1)` 写成已确认官方规则。

### 10.2 弱化效果命中的乘算方式

弱化效果与暴击/命中的直接加减不同。技能提供的附加概率作为外层基准，能力对抗成功率和概率状态进入括号：

```text
最终弱化附加率
= 技能基础附加率
× (1
   + 施法者弱化能力对抗成功率
   + 施法者弱化命中率修正
   - 目标弱化抵抗率修正)
```

官方示例确认：

- 技能基础附加率50%，能力对抗成功率10%，弱化命中率上升20%：`50% × (100% + 10% + 20%) = 65%`。
- 同样条件下目标弱化抵抗率上升20%：`50% × (100% + 10% - 20%) = 45%`。
- 弱化命中率下降20%同样得到45%；目标弱化抵抗率下降20%则得到65%。

这里的“施法者弱化能力对抗成功率”是双方弱化命中数值与弱化抵抗数值计算后的结果，不等于技能自身的基础附加率。

### 10.3 推荐的规范化字段

```js
{
  probability: {
    kind: 'critical' | 'hit' | 'debuffApply',
    baseChance: 0.5,                // 弱化技能自身概率；暴击/命中可为空
    opposedStatFormula: 'pending',  // 双方能力值换算公式尚待确认
    sourceRateChannel: 'debuffAccuracyRate',
    targetRateChannel: 'debuffResistanceRate',
  },
}
```

建议的修正渠道：

| 概率类型 | 施法者/攻击者渠道 | 目标对抗渠道 |
| --- | --- | --- |
| 暴击 | `criticalRate` | `criticalResistanceRate` |
| 命中 | `accuracyRate` | `evasionRate` |
| 弱化附加 | `debuffAccuracyRate` | `debuffResistanceRate` |

不要把弱化附加率复用为普通加法概率，也不要把技能基础附加率与能力值对抗成功率合并成一个字段。

### 10.4 当前讨伐引擎口径

- `guaranteedCritical=true` 直接跳过暴击能力对抗与概率修正。
- 命中与闪避不参与当前拉表。
- `probabilityOverrides` 将指定弱化固定为成功或失败，不计算基础附加率、弱化命中或抵抗。

因此第三批规则暂作为未来概率模块的官方公式骨架，不改变现有金标结果。

## 11. 其他效果映射

完整来源为 `[HelpMainText2216]`（`Id=21921`）。

| 官方词条 | 规范化机制 | 关键语义 | 当前状态 |
| --- | --- | --- | --- |
| 恢复 | `heal` | 直接恢复生命值 | 未实现生命值 |
| 失去战斗能力 | `defeated` | 清除全部增益/弱化；保留当时技能冷却 | 木桩永久存活 |
| 输出伤害 | `damageDealtMetric` | 包含超出敌方剩余生命的伤害；取防护/免死等生效前数值 | 当前只计算理论倍率 |
| 承受伤害 | `damageTakenMetric` | 不含超出自身剩余生命的伤害；取防护/免死等生效后数值 | 未实现 |
| 增加/减少技能冷却 | `changeCooldown` | 直接改变当前冷却回合数 | `cooldownReduction`与`setCooldown`已部分支持 |
| 复活 | `revive` | 致命伤失能后恢复生命并返回战斗 | 未实现 |
| 必定命中 | `guaranteedHit` | 绕过命中率与闪避率 | 当前默认忽略命中 |
| 必定暴击 | `guaranteedCritical` | 攻击命中后必暴，绕过暴击率与抗暴率 | 全局配置与技能段 `criticalCondition` 已支持 |
| 无视弱化命中/抵抗 | `ignoreDebuffOpposedStats` | 仅按技能基础附加率；弱化免疫仍可阻止 | 未实现 |
| 无视多重屏障 | `ignoreMultiBarrier` | 不被屏障抵消，也不消耗层数 | 未实现 |
| 阻绝 | `isolationMitigation` | 指定伤害比例减伤，与结界取最强 | 未实现 |
| 保留1点生命值不死 | `surviveAtOneHp` | 致命伤保留1生命；不可解除/复制/夺取 | 未实现 |
| 吸收 | `absorbStat` | 对敌附加属性下降，同时获得等量属性增益；弱化失败则无增益 | 未实现 |
| 普攻强化 | `normalAttackEnhancement` | 修改普攻；不可解除/复制/夺取/改时长，按特殊优先级保留1种 | 未实现 |
| 自损伤害 | `selfDamage` | 不受防御、增伤/减伤、防护、屏障和免死影响 | 当前只广播事件，不扣生命 |
| 伤害反弹 | `damageReflection` | 按反弹值与实际承受伤害反弹；必定命中且不计攻击次数 | 未实现 |
| 反弹伤害 | `reflectedDamage` | 独立伤害类型，受防护/阻绝/不死影响，不受攻防与增伤/承伤影响 | 未实现 |
| 吸血 | `lifeSteal` | 按防护等生效后的输出伤害恢复，不含超出目标剩余生命的部分 | 仅作为Buff计数状态 |

### 11.1 输出伤害与承受伤害不是同一快照

官方明确区分两个指标：

```text
输出伤害基准
= 防护、屏障、免疫、阻绝、免死生效前的攻击伤害
+ 超出目标剩余生命的伤害

承受伤害基准
= 上述防护与免死效果生效后的实际伤害
- 超出自身剩余生命的伤害
```

因此“恢复总伤害×N%”和“恢复承受伤害×N%”必须引用不同的伤害管线快照。当前 `damageRate` 表示增伤乘区，不等同官方名词“输出伤害”指标。

### 11.2 阻绝、结界与防护顺序

- 阻绝减轻攻击、共鸣、献身和反弹伤害，不减持续伤害。
- 一般伤害中，阻绝基准位于输出/承伤增减之后，伤害免疫、多重屏障、护盾、共鸣、献身之前。
- 仅处理反弹伤害时，阻绝以伤害免疫、多重屏障和护盾生效后的数值为基准。
- 阻绝与结界同时存在时，只采用减伤最强的一种。

未来伤害管线应输出命名快照，而不是把所有防护塞进一个乘区：

```text
afterDamageRate
afterIsolationOrForceField
afterInvulnerability
afterMultiBarrier
afterShield
afterResonanceAndDevotion
afterLethalProtection
```

### 11.3 普攻强化的保留规则

普攻强化不可重复附加，重复时按以下优先级保留一种：

1. 角色对自己附加的普攻强化。
2. 获得时间较晚的普攻强化。

它不属于普通状态替换规则，后续应使用独立槽位或 `exclusiveGroup: 'normalAttackEnhancement'`。

### 11.4 自损、反弹和吸血的事件属性

- 自损不经过常规攻防、增伤、防护和免死管线，但可以触发监听“自损事件”的角色机制。
- 普通反弹依据实际承受伤害，不包含超出自身剩余生命的部分；持续伤害、共鸣、献身、被动伤害和未命中攻击不触发反弹。
- 反弹伤害必定命中且不计攻击次数。
- 吸血只由命中的主动攻击触发，不由持续伤害、共鸣、献身或被动伤害触发。

事件载荷未来至少应包含 `damageKind`、`sourceKind`、`hit`、`countsAsAttack`、`canTriggerPassive`、`overkillAmount` 与各伤害快照。

## 12. 当前引擎差距清单

| 官方规则 | 当前状态 | 后续建议 |
| --- | --- | --- |
| `battleStart`先于第1回合`roundStart` | 部分支持 | 增加独立 `roundStart`/`roundEnd` 钩子 |
| 同时触发按行动顺序 | 开战阶段目前按站位执行 | 在回合0建立官方行动顺序或用日志确认开战排序 |
| 三层能力值与生效前快照 | 符号项部分表达 | 建立属性快照模型和 `statBasis` |
| 脱力 | 未实现 | 使用目标当时 `combatStat.attack` 计算降幅 |
| 迟缓/轻快 | 未实现 | 增加冷却恢复速度通道，不复用即时减冷却 |
| 动态排序、逐段重排 | 固定攻击优先级 | 新增动态属性排序选择器和每段重选策略 |
| 随机、面前、完整附近及目标优先级 | 未实现 | 建立候选过滤、优先级、排序/权重、回退目标管线 |
| 状态重复、强度比较、叠层不刷新 | 部分硬编码 | 状态定义显式声明重附加与持续策略 |
| 暴击、命中能力对抗 | 必暴或忽略 | 补双方能力值到基础成功率的公式后接入概率渠道 |
| 弱化命中/抵抗 | 概率开关代替 | 按 `[HelpMainText2217]` 的外层基础概率乘算结构实现确定/期望/采样模式 |
| 解除、复制、夺取 | 未实现 | 保留来源与快照，按EffectGroup独立判定 |
| 被动通常不触发被动 | 未限制完整事件链 | 事件载荷增加来源类型及是否允许连锁 |
| 控制、额外施法、死亡、反弹 | 未实现 | 完善主体战斗流程后再接入 |

新增的剩余指南差距：

| 官方规则 | 当前状态 | 后续建议 |
| --- | --- | --- |
| 伤害免疫→多重屏障→护盾等防护顺序 | 未实现 | 建立分阶段伤害管线和命名快照 |
| 输出伤害/承受伤害两个指标 | 未实现 | 分别记录过量伤害和防护前后数值 |
| 结界/阻绝取最强而非叠加 | 未实现 | 引入互斥减伤组 |
| 持续伤害四种基准 | 未实现 | 状态保存附加者、当前HP、攻击及施法总伤害快照 |
| 普攻强化独占槽 | 未实现 | 使用 `exclusiveGroup` 和优先级比较 |
| 自损独立伤害路径 | 仅事件 | 保留绕过字段并在引入生命值后扣血 |
| 反弹/吸血触发资格 | 未实现 | 用结构化伤害事件而非被动字符串判断 |

## 13. 新增映射时的检查清单

1. 从最高技能档位确定 `DescriptionKey`、`SubSetSkillIds`、冷却和专武条件。
2. 展开描述中的 `SkillDescriptionLinkText`，记录官方 `HelpMainText`。
3. 判断“回合”属于全局TURN还是目标行动次数。
4. 判断触发器是 `battleStart`、`roundStart`、`actionStart`、攻击前后或事件触发。
5. 为每个数值引用记录 `trained/preStatus/combat/sourceAtCast/targetBeforeApply`。
6. 为目标选择记录指定方式、排序基准、快照时点、逐段重选和回退规则。
7. 为状态记录EffectGroup、可解除性、是否计总数、持续基准、重附加、叠层、刷新、复制和夺取规则。
8. 对MB只提供数字枚举而无本地枚举表的字段，必须补日志或客户端枚举证据。
9. 将官方一般规则、角色技能例外、日志结论和项目假设分别标记。
10. 更新词条目录、角色定义、编译校验和对应单元测试。

## 14. 批次记录

- 第一批：技能/被动、行动、回合、目标指定、攻击类型。
- 第二批：能力值基准、增益/弱化通则、持续时间、重复附加、叠层、解除、复制、夺取、无法被解除。
- 第三批：概率上升/下降、暴击率、命中率、弱化效果命中率；已确认对应 `[HelpMainText2217]`。
- MB剩余指南：增益效果种类 `[HelpMainText2214]`、弱化效果种类 `[HelpMainText2215]`、其他效果 `[HelpMainText2216]`。
- 后续批次：待用户继续补充；追加时保留官方键、规范化语义、引擎状态和差距四类信息。

## 15. 讨伐引擎已接入的全局回合语义

以下条目取代本文此前“当前引擎尚无 roundStart”的状态说明：

- `roundStart` 在每个全局回合开始、速度快照和角色行动前执行。
- `everyRounds` / `roundOffset` 用于以全局回合调度被动；角色行动次数冷却仍使用既有 `every`。
- 轻快映射为 `cooldownRecoveryBonus`，在行动结束时与基础冷却恢复 1 相加，不视为即时减冷却。

## 16. `54-57-d1`日志补充映射

- 娜塔夏「中毒」实际记录为 `SkillCategory=3 / EffectGroupId=10500250102 / EffectTurn=2`；`EffectType=8001` 的5%当前HP伤害属于持续伤害，不并入主动技能伤害段。
- 娜塔夏对自身与敌方施加的「恶化」分别为 `10500300301 / 10500300401`，均为 `SkillCategory=5 / EffectTurn=1`。不可解除弱化仍应显示并参与“是否带弱化”判断。
- 帕拉底亚「正义魔女」为 `SkillCategory=4 / EffectGroupId=6300330101`，日志显示友军每次暴击都会使层数增加；20层时后续行动切换为 `ActiveSkillId=63101`，消费后该技能自身4次暴击重新积层。
- 雷金娜S1承伤增加为 `SkillCategory=3 / EffectGroupId=13700120201 / EffectTurn=4`；本日志中的实际数值为10%，说明日志目标的状态生效前攻击力不低于雷金娜。
- 伊利亚「献身」「神咒解放」分别为 `SkillCategory=4 / EffectGroupId=6100300101 / 6100330402`；神咒解放出现后，日志轮转由S1切换到零冷却S2，状态结束后S2不可发动。
- 克尔柏洛丝在第1回合自身行动后触发保命，并获得 `SkillCategory=4 / EffectGroupId=12900340202 / EffectTurn=4` 的「温柔的魔法」；状态覆盖第2至第5回合自身行动，S1/S2读取强化倍率。
