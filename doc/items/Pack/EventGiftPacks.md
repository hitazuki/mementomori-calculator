# 活动礼包

数据源：`src/constants/eventPacks.json`，由 `scripts/gen_all_packs.js` 合并至礼包全览。

以下内容按用户提供的游戏截图录入，价格单位为日元，两包均限购1次。

| 名称 | 价格 | 付费钻石 | 圣天使宝箱 | 召唤券 |
| --- | ---: | ---: | ---: | --- |
| 周年纪念组合包1 | 6,000 | 3,000 | 1 | 命运召唤券 ×5 |
| 周年纪念组合包2 | 11,800 | 5,900 | 1 | 魔女的奥秘召唤券 ×20 |

圣天使宝箱使用本地 `public/images/items/Item_0195.png`，与截图图标一致。
官方 Master 数据 `TreasureChestMB` 中 `Id=122`、`IconId=195`、`NameKey=[TreasureChestName120]`；运行时保留合成计价键 `[99,4]`。
名称直接取自各语言 `TextResource*MB.json` 的同一文本键，不自行翻译：

| 语言 | 官方名称 |
| --- | --- |
| 简中 | 圣天使宝箱 |
| 繁中 | 聖天使寶箱 |
| 英文 | Chest of the Seraph |
| 日文 | 聖天使の宝箱 |
| 韩文 | 성천사의 보물상자 |

来源：[游戏 Master 数据镜像](https://github.com/moonheart/mementomori-masterbook/tree/master/Master)，核对日期：2026-10-15。
按用户要求，每个礼盒以1件圣遗物估值，跟随圣天使的神谕召唤本周50抽的推算单价动态变化，不添加独立手填评分。
两种召唤券分别使用本地 `Item_0054.png` 和 `Item_0178.png`。
