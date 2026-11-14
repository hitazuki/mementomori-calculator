# 埃尔芙琳黛：远程数据与日志证据

核对日期：2026-11-14。原始数据仅作临时输入。

## 远程来源

Master 基址：https://raw.githubusercontent.com/moonheart/mementomori-masterbook/master/Master/
备用：https://cdn.jsdelivr.net/gh/moonheart/mementomori-masterbook@master/Master/

查询表与记录：CharacterMB.json Id156（ElementType6、JobFlags1、Speed2949）；ActiveSkillMB.json 156001/156002；PassiveSkillMB.json 156003/156004；EffectGroupMB.json（character.json列出的8组）；EquipmentExclusiveEffectMB.json LR Id744；EquipmentMB.json；EquipmentExclusiveSkillDescriptionMB.json。

同键核对五语TextResourceZhCnMB.json / TextResourceZhTwMB.json / TextResourceEnUsMB.json / TextResourceJaJpMB.json / TextResourceKoKrMB.json：
`[CharacterName156]`、`[CharacterSubName156]`、`[ActiveSkillName156001]`、`[ActiveSkillName156002]`、`[PassiveSkillName156003]`、`[EffectGroupName15600340101]`及相关技能描述键。技能原文由现有生成器生成，只加入156。

CharacterMB无独立IconId字段，按既有资源映射使用角色156：
https://list.moonheart.dev/p/public/mmtm/AddressableConvertAssets/CharacterIcon/CHR_000156/CHR_000156_00_m.png
Python传输403后通过PowerShell取得真实PNG并目视确认形象，沿用现有角色图。

技能原始PNG：
https://list.moonheart.dev/p/public/mmtm/AddressableConvertAssets/Icon/Skill/CSK_000156001.png
其余图标末尾分别000156002/000156003/000156004；添加既有本地图的讨伐清单映射。

## 日志归属与时序

战报：https://mentemori.icu/battle_log.html?token=3126f048e6c34bafac76ca43523aba1c
JSON：https://static.mentemori.icu/battle-logs/3126f048e6c34bafac76ca43523aba1c.json

UnitId156对应BattleCharacterGuid31，等级455、LR专武512、速度2949。GUID11/21对应角色60/26。

- 第1回合TurnStartPassiveResults：AttackUnitGuid=TargetUnitGuid=GranterGuid=31，15600350401，SkillCategory4，命中50与减伤50为同一状态组。
- 同阶段15600340101：AttackUnitGuid=GranterGuid31，目标31/11/21，EffectCount1→2、EffectMaxCount10、EffectValue5、SkillCategory4、EffectTurn9999；第2回合3→4，第5回合自身9→10。各受益者独立保存层数。
- 第1回合S1选GUID20/40/10三名敌人；第3回合S2五段物理。第2回合因控制无法行动，第4回合普攻、第5回合S1；木桩不复制敌方控制。
- 15600400101虽嵌套在敌方行动，但AttackUnitGuid和GranterGuid均31，TargetUnitGuid是敌方攻击者；SkillCategory3，最大5层。不得认成暗教皇主动造成的增伤弱化。
- 15600140101为SkillCategory200内部标记，不计Buff。
- 第10及23回合仍有来源31对目标11施加Pride，支持死亡后触发描述；木桩无死亡，保留为已知模型限制。

满层S2、单/双敌S1数值由远程技能描述支持，该日志没有隔离验证。完整未确认项见character.json。
