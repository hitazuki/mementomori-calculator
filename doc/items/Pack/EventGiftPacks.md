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

## 团结任务组合包

按用户截图录入：PT650，付费钻石×325、截图中间票券×4、団結の箱×1，每日限购1次。
名称及图标映射按远程 Master 核对（2026-10-31）；图标使用远程资源文件，不从截图裁取。

| 语言 | 礼包 | 宝箱 | 票券 |
| --- | --- | --- | --- |
| 简中 | 团结任务组合包 | 团结宝箱 | 团结任务券 |
| 繁中 | 團結任務組合包 | 團結寶箱 | 團結任務券 |
| 英文 | United Missions Pack | United Missions Chest | United Missions Ticket |
| 日文 | 団結ミッションパック | 団結の箱 | 団結ミッションチケット |
| 韩文 | 단합 미션 팩 | 단합의 상자 | 단합 미션 티켓 |

名称取自远程 `TextResource*MB.json` 的 `[ShopCommonProductName673]`、`[TreasureChestName159]`、`[ItemName343]`，礼包中的 `<br>` 转为适合列表显示的文本。
`TreasureChestMB Id=159` 对应 `IconId=279`；`ItemMB Id=343` 对应 `ItemType=57, ItemId=1, IconId=278`。运行时保留合成计价键。

- MB 来源：[Master 数据镜像](https://github.com/moonheart/mementomori-masterbook/tree/master/Master)。
- 图标来源：[Item_0278.png](https://list.moonheart.dev/p/public/mmtm/AddressableConvertAssets/Icon/Item/Item_0278.png)、[Item_0279.png](https://list.moonheart.dev/p/public/mmtm/AddressableConvertAssets/Icon/Item/Item_0279.png)。
- 本地发布资源：`public/images/items/Item_0278.png`、`public/images/items/Item_0279.png`。
票券使用合成键 `[99,6]`，按用户要求暂计0；宝箱使用合成键 `[99,5]`，动态取以下奖励总价值最高的一项：

- 未鉴定符石Lv3×20
- 圣装钢×1300（注意评分以千枚为基准）
- 首领挑战券×8
- 无穷之塔挑战券×8
- 上级封印钥匙×10（使用推算后的钥匙单价）

计算为 `max(20×S(17,6), 1300×S(13,3), 8×S(19,1), 8×S(20,1), 10×S(18,3))`，不新增手填评分。

礼包全览展开说明会动态显示当前最高价值选项的本地化名称、数量和钻石价值；并列最高时列出全部并列选项，修改道具评分后同步更新。
