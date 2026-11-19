# 拉米斯讨伐结算证据

- 2026-11-19 核对 [Master 固定版本 a72352b](https://github.com/moonheart/mementomori-masterbook/tree/a72352b72a90aa1c82946b23d5ce5aaf4e1c3245/Master)。CharacterMB 157，流金法师，速度3161，名称键 `[CharacterName157]`。五语文本按 ActiveSkillMB 157001/157002、PassiveSkillMB 157003/157004 及其名称、描述键读取。专武名称键 `[EquipmentName1041]`，最高词条记录738。面板攻击词条已包含于归一化角色面板。
- 角色图标以 CharacterIcon 资源编号157取[原始PNG](https://list.moonheart.dev/p/public/mmtm/AddressableConvertAssets/CharacterIcon/CHR_000157/CHR_000157_00_m.png)。技能图标使用远程原始的 [S1 157001](https://list.moonheart.dev/p/public/mmtm/AddressableConvertAssets/Icon/Skill/CSK_000157001.png)、[S2 157002](https://list.moonheart.dev/p/public/mmtm/AddressableConvertAssets/Icon/Skill/CSK_000157002.png)、[P1 157003](https://list.moonheart.dev/p/public/mmtm/AddressableConvertAssets/Icon/Skill/CSK_000157003.png)、[P2 157004](https://list.moonheart.dev/p/public/mmtm/AddressableConvertAssets/Icon/Skill/CSK_000157004.png)。五张图片与项目已有文件 SHA-256 一致。
- 2446/2447 样本中拉米斯的 AttackUnitGuid 和 GranterGuid 都为41。2447 第1/4/7/10回合先盾后指引；第4回合盾值为叠本轮指引前攻击力48,572,140的6倍。盾在目标第三次行动结束后到期，第13回合起不再补发。指引对自身2层/回合、第6回合封顶，非魔法职业友军1层/回合、第12回合封顶。
- 2447 的 S2 在第2/6/10/14/18/22/26回合各发动5击。连续命中目标未发生切换，精确倍率依MB；讨伐按指定口径每击重新读取魔防。S1塔日志使用157001401，为五目标档；拉表使用EX3的157001501。
- 指南键 `[HelpMainText2210]`、`[HelpMainText2219]`。同阶段不同角色按当回合冻结的行动顺序触发；第5/9/13回合塔日志与指南一致。同一角色按技能声明顺序，拉米斯先盾后指引已实测。
