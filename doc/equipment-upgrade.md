# 装备升级收益分析

## 角色和战斗基准

- 默认使用科迪 LR+5 的 Lv500 裸装估算。调整角色等级会重算四维、生命和物魔防御。普通防御固定为 7。自定义面板填写扣除被测装备后的最大生命与三防，保留其他装备、符石、秘仪等贡献。
- 预设以 `CharacterPotentialMB.TotalBaseParameter` 取得整数等级潜力基数。计算 `潜力基数 × m + b` 后，按 `CharacterMB.BaseParameterCoefficient / BaseParameterGrossCoefficient` 分配并逐项向下取整。系数来自 `CharacterPotentialCoefficientMB` 的初始 SR、当前 LR+5 行（Id 815，稀有度 16384）。基础生命为耐力 ×10，物防为力量，魔防为魔力。 [等级潜力基数](https://raw.githubusercontent.com/moonheart/mementomori-masterbook/master/Master/CharacterPotentialMB.json) [稀有度系数](https://raw.githubusercontent.com/moonheart/mementomori-masterbook/master/Master/CharacterPotentialCoefficientMB.json)
- 用公开的角色图鉴面板核对同一公式的 LR、Lv240 结果。物防 631,721、魔防 554,510、生命 4,843,190、普通防御 7。科迪 `InitialBattleParameter.HP` 为 −2，直接加到上述已取整生命会得到 4,843,188。预设按已匹配口径使用耐力 ×10。LR+5 高等级裸装个位数与游戏未进一步核对。 [图鉴面板实测与派生关系](https://note.com/wazu_019/n/n5fe5ef49ba1c) [LR Lv240 面板记录](https://dark.namu.moe/w/%EC%BD%9C%EB%94%94(%EB%A9%94%EB%A9%98%ED%86%A0%20%EB%AA%A8%EB%A6%AC)#s-2)
- 场外耐力和场外生命的默认值均为 0%。耐力先乘耐力倍率，再按 ×10 派生生命，最后乘生命倍率。装备耐力派生的暴击抗性使用加成后的耐力 ×0.5。预设的基础生命也使用两项倍率。自定义面板中的生命已包含场外加成，倍率只作用于被测装备增量。
- 受击类型统一用于所有方案。防御路始终使用普通防御，物魔路按所选类型使用物防或魔防，并沿用攻防等级和穿透定数。每条三防方案保留原有场外和场内设置，作用于该部位基础属性对应的三防项，其他派生防御使用默认倍率 1。对应防御项的公式为 `(基准 + 装备增量 × 场外倍率) × max(0, 1 + 场内加成)`。默认场外防御 1%，物防和魔防 0%，来自常驻角色 LR+5 秘仪核对（双子座的庇翼 CollectionId=3，百分比 Value=100）。场内默认 0%，用户可以填写负值。

## 装备和打磨

- 五个套装（EquipmentSetId 10–14）各自沿真实进阶链计算，装备等级与强化等级同步且受角色等级上限约束。武器、饰品、手、头、身体、足独立成档。普通武器限定 Category=2，三职业的基础属性、四维总点数、等级链及碎片成本逐项验证后合并。
- 装备基础效果使用 `BattleParameterChangeInfo.Value × EquipmentReinforcementParameterMB.ReinforcementCoefficient`，四维使用 `AdditionalParameterTotal` 和打磨比例分配，尾数按小数余量从大到小分配以保持整数点数总和。四项滑条合计 100%，同一方案的每档使用相同配分。金币单项 13⅓%～60% 为实测推算，锁定模式可接近 0%，模拟允许 0% 边界。 [金币打磨实测](https://note.com/wazu_019/n/ne6d87154066d) [锁定打磨实例](https://note.com/wazu_019/n/n56b62cb60bf3?hl=en)
- 装备的基础效果与四维贡献分别开关。力量派生物防、命中。魔力派生魔防、弱化效果命中。战技派生闪避、暴击。耐力派生生命、暴击抗性。武器基础效果提供攻击，饰品基础效果提供弱化效果抗性。额外属性以评级点数展示。套装、神装和战斗技能效果按固定基准处理。 [官方潜在能力与战斗属性](https://mementomori.zendesk.com/hc/en-us/articles/44196520217881-About-Potential-Battle-Stats)

## 收益与成本

- 等效生命 = 最大生命 ÷ 综合伤害通过率。累计提升以扣除被测装备后的面板为基准，相邻提升比较两个真实档位；承伤降低只比较两档伤害通过率。闪避、暴击、弱化相关属性以评级展示。
- 碎片效率 = 相邻等效生命提升百分点 ÷ 本档进阶碎片数。首次装备不计效率。碎片从 `EquipmentMB.EquipmentEvolutionId` 关联 `EquipmentEvolutionMB`，按实际前后档匹配。强化材料另列，使用武器或其他部位各自的消耗表。缺少碎片成本的档位显示空值并断开效率曲线。
- 悬浮曲线对比同收益档位，≈ 表示插值结果，同时列出首个达到该收益的真实档位。图表保留用户设置的缩放区间。

## 数据复现

运行 `node scripts/generate_equipment_upgrade.mjs <master-directory>` 生成 `src/constants/equipmentUpgrade.json`。附加 `--check` 可验证快照。运行、构建和测试使用提交的精简数据。

科迪名称于 2026-11-22 核对远程 CharacterMB Id 27 和五语言名称键 `[CharacterName27]`。科迪（简繁）、Cordie、コルディ、콜디。本次预设使用纯文字。 [CharacterMB](https://raw.githubusercontent.com/moonheart/mementomori-masterbook/master/Master/CharacterMB.json) [简中](https://raw.githubusercontent.com/moonheart/mementomori-masterbook/master/Master/TextResourceZhCnMB.json) [繁中](https://raw.githubusercontent.com/moonheart/mementomori-masterbook/master/Master/TextResourceZhTwMB.json) [英语](https://raw.githubusercontent.com/moonheart/mementomori-masterbook/master/Master/TextResourceEnUsMB.json) [日语](https://raw.githubusercontent.com/moonheart/mementomori-masterbook/master/Master/TextResourceJaJpMB.json) [韩语](https://cdn.jsdelivr.net/gh/moonheart/mementomori-masterbook@master/Master/TextResourceKoKrMB.json)
