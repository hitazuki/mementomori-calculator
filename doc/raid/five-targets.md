# 五目标木桩建模与证据

本次为C类通用选敌与状态机制扩展。无死亡、血量推进和敌方行动，不扩展这些模拟边界。

- 游戏文本证据：本地 `characterMbTexts/zh-CN.js` 的全部51名已接入角色主动技能与相关普攻/被动，配合现有声明式技能档位。
- 统计证据：用户提供的随机多段攻击站位矩阵，总数据量50435，各列样本数未知。距离倒数公式对25格的概率RMSE约0.557个百分点，不能据此确认为游戏公式。
- 项目约定：距离权重 `1/(abs(己方站位-敌方站位)+1)` 归一化。多段独立有放回，N名目标加权不放回。每个技能伤害段先选批次目标，再按站位结算。相同目标组内的重复批次锁定所选目标。固定种子采用Mulberry32，默认1。
- 固定面板使最高攻击、力量、速度、血量等条件并列，按站位取前N体；物理/魔法防御最低选择器读取目标当前状态。
- 未确认：距离权重的真实底层公式、连续选敌相关性、N名目标是否使用同样的权重。当前实现均为上述确定的项目约定。
- 未模拟：死亡追击、真实血量变化、敌方伤害及现有 `ignoredKeys` 明示的效果，保持原范围。
- 特殊核对：瓦尔丽黛S1随机单体锁定；梅琳S2最高血量3体；光士S1群攻后力量最高单体直接伤害及降攻；夏日萨宾娜晕厥和追击取命中集合内血量并列首位；科迪/利伯瑞娅命中前逐体弱化；露昕鲁自损监听对全体加彩光；娜塔夏回合开始恶化仅前3体；冬季史黛拉沉默仅前2体；厄瑞涅第三次S2切换固定最高攻击目标；黄昏佛罗伦斯强化普攻为五体群攻；莉莉珂特强化普攻为随机三段。

## 角色选敌核对表

下表由已审核的声明式技能生成，所有伤害段必须显式声明选敌。单目标仍折叠为一体，攻击次数保持原值。

| Character ID | S1 | S2 |
| --- | --- | --- |
| 7 | {"type":"randomHit"} | {"type":"randomGroup","count":5} |
| 8 | {"type":"randomHit"} | {"type":"randomGroup","count":5} |
| 26 | support | {"type":"first","count":3} |
| 27 | {"type":"randomHit"} | {"type":"randomGroup","count":5} |
| 29 | {"type":"randomGroup","count":4} | support |
| 30 | {"type":"randomGroup","count":5}; {"type":"first","count":1} | {"type":"randomSingle","count":1} |
| 40 | {"type":"randomGroup","count":3} | {"type":"randomGroup","count":5} |
| 46 | {"type":"randomGroup","count":5} | {"type":"randomGroup","count":5} |
| 47 | {"type":"randomSingle"} | {"type":"first","count":1} |
| 48 | {"type":"randomHit"} | {"type":"randomGroup","count":4} |
| 50 | {"type":"first","count":3} | {"type":"randomHit"} |
| 52 | {"type":"first","count":1} | {"type":"randomGroup","count":4} |
| 58 | {"type":"randomGroup","count":5} | {"type":"randomHit"} |
| 61 | {"type":"first","count":1}; {"type":"first","count":1} | {"type":"randomHit"} |
| 63 | {"type":"randomGroup","count":5} | {"type":"randomHit"} |
| 70 | {"type":"randomGroup","count":5} | {"type":"randomHit"}; {"type":"previousHit"} |
| 75 | {"type":"randomHit"} | {"type":"randomHit"} |
| 78 | {"type":"randomHit"} | {"type":"first","count":1} |
| 80 | {"type":"randomGroup","count":3} | {"type":"randomHit"} |
| 81 | {"type":"randomGroup","count":3} | {"type":"first","count":1} |
| 85 | {"type":"first","count":1} | {"type":"first","count":2}; {"type":"first","count":2} |
| 88 | {"type":"randomGroup","count":5} | {"type":"randomHit"} |
| 89 | {"type":"randomHit"} | {"type":"randomHit"} |
| 90 | {"type":"randomHit"} | {"type":"lowestPhysicalDefense"} |
| 92 | {"type":"randomHit"} | {"type":"randomGroup","count":3} |
| 93 | {"type":"randomHit"} | {"type":"randomHit"} |
| 99 | {"type":"randomHit"} | {"type":"first","count":3} |
| 100 | {"type":"randomGroup","count":5} | {"type":"randomGroup","count":3} |
| 102 | {"type":"randomHit"} | {"type":"randomHit"} |
| 105 | {"type":"randomGroup","count":3} | {"type":"first","count":3} |
| 107 | {"type":"randomGroup","count":5} | {"type":"first","count":1} |
| 109 | {"type":"randomGroup","count":5} | {"type":"conditional","condition":{"type":"skillUsesAtLeast","skillKey":"s2","count":2},"whenTrue":{"type":"first"},"whenFalse":{"type":"randomHit"}} |
| 112 | {"type":"randomHit"} | {"type":"randomGroup","count":3} |
| 113 | {"type":"randomHit"} | {"type":"first","count":1} |
| 114 | {"type":"randomGroup","count":5} | {"type":"randomHit"} |
| 115 | {"type":"first","count":1} | {"type":"first","count":1} |
| 122 | {"type":"randomGroup","count":5} | {"type":"randomHit"} |
| 124 | {"type":"first","count":3} | {"type":"first","count":1} |
| 126 | {"type":"randomGroup","count":4} | {"type":"randomHit"} |
| 128 | {"type":"randomHit"} | {"type":"randomHit"} |
| 129 | {"type":"randomHit"} | {"type":"randomGroup","count":3} |
| 130 | {"type":"randomHit"}; {"type":"randomHit"} | {"type":"randomHit"} |
| 132 | {"type":"randomGroup","count":5} | {"type":"randomHit"} |
| 135 | {"type":"randomGroup","count":5} | {"type":"lowestMagicDefense"} |
| 137 | {"type":"randomGroup","count":5} | {"type":"first","count":2} |
| 148 | {"type":"randomHit"} | {"type":"randomHit"} |
| 150 | {"type":"randomHit"} | {"type":"randomHit"} |
| 151 | {"type":"randomGroup","count":5} | {"type":"randomHit"} |
| 153 | {"type":"randomGroup","count":5} | {"type":"randomHit"} |
| 154 | {"type":"randomGroup","count":3} | {"type":"randomHit"} |
| 155 | {"type":"randomHit"} | {"type":"randomHit"} |
