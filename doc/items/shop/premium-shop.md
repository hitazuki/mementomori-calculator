# 精品店礼盒内容

> 结论：MB 文件中能找到“精品店”页签，也能找到与精品店内容相符的一组礼盒/礼袋道具及其开箱内容。  
> 页签来源：`TradeShopTabMB.json` 中 `Id=13`，`TabNameKey=[TradeShopTabName13]`，简中名为“精品店”，Memo 为 `限定特典`。  
> 礼盒内容来源：`TreasureChestMB.json` -> `TreasureChestItemMB.json` -> `ItemMB.json` / `TextResourceZhCnMB.json`。  
> 注意：当前 MB 中未找到这些礼盒在精品店内的显式售价、限购和刷新规则。`ChangeItemMB[73..88]` 是“1 个礼盒转换为金币 x50000”的兑换/回收记录，不能作为精品店售价使用。

## 数据关系

```text
TradeShopTabMB[13]
  TabNameKey -> TextResourceZhCnMB = 精品店
  ConsumeItemInfos = [{ ItemType: 1, ItemId: 1 }]  # 钻石

TreasureChestMB[73..88]
  NameKey / DisplayNameKey -> TextResourceZhCnMB
  TreasureChestItemIdList[] -> TreasureChestItemMB

TreasureChestItemMB
  FixItemList[] -> 固定获得内容
  LotteryRewardId != 0 时表示随机池内容

ChangeItemMB[73..88]
  ItemType=9, ItemId=TreasureChestId, NeedCount=1 -> 金币 x50000
  该记录用于道具转换/回收，不作为购买价格。
```

## 页签信息

| 字段 | 值 |
| --- | --- |
| TradeShopTabId | 13 |
| 名称 | 精品店 |
| Memo | 限定特典 |
| TradeShopType | 0 |
| OpenCommandType | 28 |
| 消耗货币 | 钻石 (`ItemType=1`, `ItemId=1`) |
| 售价/限购 | 当前 MB 未找到可直接对应的记录 |

## 礼盒内容列表

| 序号 | TreasureChestId | 名称 | MB Memo | 图标 | 内容 | ChangeItemMB 转换 |
| ---: | ---: | --- | --- | --- | --- | --- |
| 1 | 73 | 惊喜礼盒 | スペシャルギフト | Item_0088.png | 潜能宝珠 x1000 / 经验珠(24小时) x1 / 抽奖池 `LotteryRewardId=76` | 1个 -> 金币 x50000 |
| 2 | 74 | 半价召唤礼袋 | 半額ガチャギフト | Item_0089.png | 白金召唤券 x1 | 1个 -> 金币 x50000 |
| 3 | 75 | 潜能宝珠礼袋 | 潜在宝珠ギフト | Item_0090.png | 潜能宝珠 x300 | 1个 -> 金币 x50000 |
| 4 | 76 | 武具强化材料礼盒 | 武具強化素材ギフト | Item_0092.png | 强化秘药 x200 / 符石兑换券 x200 | 1个 -> 金币 x50000 |
| 5 | 78 | 角色强化礼盒(大) | キャラ「大」強化ギフト | Item_0093.png | 经验珠(6小时) x3 / 潜能宝珠 x1500 | 1个 -> 金币 x50000 |
| 6 | 79 | 角色强化礼袋 | キャラ強化ギフト | Item_0091.png | 经验珠(2小时) x2 / 潜能宝珠 x300 | 1个 -> 金币 x50000 |
| 7 | 80 | 圣装钢礼盒 | 聖装鋼ギフト | Item_0095.png | 圣装钢 x48000 / 强化秘药 x100 | 1个 -> 金币 x50000 |
| 8 | 81 | 精炼钢礼盒 | 精錬鋼ギフト | Item_0096.png | 精炼钢 x580000 / 强化秘药 x100 | 1个 -> 金币 x50000 |
| 9 | 82 | 金币礼盒 | ゴールドギフト | Item_0101.png | 金币(24小时) x3 / 强化水 x800 | 1个 -> 金币 x50000 |
| 10 | 83 | 封印宝箱礼盒 | 宝箱ギフト | Item_0102.png | 初级封印宝箱 x5 / 中级封印宝箱 x10 / 上级封印宝箱 x20 / 首领挑战券 x16 / 潜能宝珠(1小时) x1 | 1个 -> 金币 x50000 |
| 11 | 84 | 封印钥匙礼盒 | 鍵ギフト | Item_0103.png | 初级封印钥匙 x10 / 中级封印钥匙 x20 / 上级封印钥匙 x50 / 无穷之塔挑战券 x16 / 潜能宝珠(1小时) x1 | 1个 -> 金币 x50000 |
| 12 | 85 | 魔女的来信(R・忧蓝)礼袋 | 魔女の手紙ギフト　藍 | Item_0104.png | 魔女的来信(R・忧蓝) x3 / 首领挑战券 x4 / 无穷之塔挑战券 x4 | 1个 -> 金币 x50000 |
| 13 | 86 | 魔女的来信(R・业红)礼袋 | 魔女の手紙ギフト　紅 | Item_0104.png | 魔女的来信(R・业红) x3 / 首领挑战券 x4 / 无穷之塔挑战券 x4 | 1个 -> 金币 x50000 |
| 14 | 87 | 魔女的来信(R・苍翠)礼袋 | 魔女の手紙ギフト　翠 | Item_0104.png | 魔女的来信(R・苍翠) x3 / 首领挑战券 x4 / 无穷之塔挑战券 x4 | 1个 -> 金币 x50000 |
| 15 | 88 | 魔女的来信(R・流金)礼袋 | 魔女の手紙ギフト　黄 | Item_0104.png | 魔女的来信(R・流金) x3 / 首领挑战券 x4 / 无穷之塔挑战券 x4 | 1个 -> 金币 x50000 |

## 计算使用建议

这些数据可以先作为“精品店候选礼盒内容”供后续性价比计算使用，但价格字段应保持未知，避免把回收转换误当成购买成本。

```js
{
  shopKey: 'premium-shop',
  tradeShopTabId: 13,
  treasureChestId: 84,
  name: '封印钥匙礼盒',
  icon: 'Item_0103.png',
  contents: [
    { name: '初级封印钥匙', quantity: 10 },
    { name: '中级封印钥匙', quantity: 20 },
    { name: '上级封印钥匙', quantity: 50 },
    { name: '无穷之塔挑战券', quantity: 16 },
    { name: '潜能宝珠(1小时)', quantity: 1 }
  ],
  sale: {
    currency: '钻石',
    price: null,
    limit: null,
    source: '当前 MB 未找到'
  },
  conversion: {
    source: 'ChangeItemMB[84]',
    output: [{ name: '金币', quantity: 50000 }]
  }
}
```

## 缺失信息

- 精品店中这些礼盒的购买价格未在当前 MB 中定位到。
- 精品店中这些礼盒的限购次数未在当前 MB 中定位到。
- 惊喜礼盒的 `LotteryRewardId=76` 随机池明细未在当前 `data/Master` 目录中定位到对应表。
- 若后续从截图、抓包或新增 MB 文件补足售价/限购，可直接追加 `sale.price` 和 `sale.limit` 字段。
