# 精品店商城兑换列表

> 来源：用户补充截图识别，商城页签「精品店」。  
> 页签来源：`TradeShopTabMB.json` 中 `Id=13`，`TabNameKey=[TradeShopTabName13]`，简中名为“精品店”，英文 `Special`，日文 `スペシャル`，韩文 `특별`。  
> 兑换货币：免费钻石（MB 页签 `ConsumeItemInfos = [{ ItemType: 1, ItemId: 1 }]`）。截图中的价格均按免费钻石数量记录。  
> 礼盒内容来源：`TreasureChestMB.json` -> `TreasureChestItemMB.json` -> `ItemMB.json` / `TextResourceZhCnMB.json`。  
> 注意：`ChangeItemMB[76,80..88]` 中的“1 个礼盒转换为金币 x50000”是回收/转换记录，不是购买价格。

## 数据关系

```text
TradeShopTabMB[13]
  TabNameKey -> TextResourceZhCnMB = 精品店
  ConsumeItemInfos = [{ ItemType: 1, ItemId: 1 }]  # 免费钻石

截图
  商品价格、限购次数

TreasureChestMB
  NameKey / DisplayNameKey -> TextResourceZhCnMB
  TreasureChestItemIdList[] -> TreasureChestItemMB

TreasureChestItemMB
  FixItemList[] -> 固定获得内容
  LotteryRewardId != 0 时表示随机池内容
```

## 页签信息

| 字段 | 值 |
| --- | --- |
| TradeShopTabId | 13 |
| 名称 | 精品店 |
| 多语言 | 简中/繁中：精品店；英文：Special；日文：スペシャル；韩文：특별 |
| Memo | 限定特典 |
| TradeShopType | 0 |
| OpenCommandType | 28 |
| 消耗货币 | 免费钻石 (`ItemType=1`, `ItemId=1`) |
| 售价/限购来源 | 用户补充截图 |

## 兑换列表

| 序号 | TreasureChestId | 名称 | MB Memo | 图标 | 获得数量 | 限购总数 | 单次花费(免费钻石) | 内容 |
| ---: | ---: | --- | --- | --- | ---: | ---: | ---: | --- |
| 1 | 76 | 武具强化材料礼盒 | 武具強化素材ギフト | Item_0092.png | 1 | 1 | 9900 | 强化秘药 x200 / 符石兑换券 x200 |
| 2 | 80 | 圣装钢礼盒 | 聖装鋼ギフト | Item_0095.png | 1 | 1 | 9900 | 圣装钢 x48000 / 强化秘药 x100 |
| 3 | 81 | 精炼钢礼盒 | 精錬鋼ギフト | Item_0096.png | 1 | 1 | 9900 | 精炼钢 x580000 / 强化秘药 x100 |
| 4 | 82 | 金币礼盒 | ゴールドギフト | Item_0101.png | 1 | 3 | 1200 | 金币(24小时) x3 / 强化水 x800 |
| 5 | 83 | 封印宝箱礼盒 | 宝箱ギフト | Item_0102.png | 1 | 3 | 1560 | 初级封印宝箱 x5 / 中级封印宝箱 x10 / 上级封印宝箱 x20 / 首领挑战券 x16 / 潜能宝珠(1小时) x1 |
| 6 | 84 | 封印钥匙礼盒 | 鍵ギフト | Item_0103.png | 1 | 3 | 1560 | 初级封印钥匙 x10 / 中级封印钥匙 x20 / 上级封印钥匙 x50 / 无穷之塔挑战券 x16 / 潜能宝珠(1小时) x1 |
| 7 | 85 | 魔女的来信(R・忧蓝)礼袋 | 魔女の手紙ギフト　藍 | Item_0104.png | 1 | 1 | 660 | 魔女的来信(R・忧蓝) x3 / 首领挑战券 x4 / 无穷之塔挑战券 x4 |
| 8 | 86 | 魔女的来信(R・业红)礼袋 | 魔女の手紙ギフト　紅 | Item_0104.png | 1 | 1 | 660 | 魔女的来信(R・业红) x3 / 首领挑战券 x4 / 无穷之塔挑战券 x4 |
| 9 | 87 | 魔女的来信(R・苍翠)礼袋 | 魔女の手紙ギフト　翠 | Item_0104.png | 1 | 1 | 660 | 魔女的来信(R・苍翠) x3 / 首领挑战券 x4 / 无穷之塔挑战券 x4 |
| 10 | 88 | 魔女的来信(R・流金)礼袋 | 魔女の手紙ギフト　黄 | Item_0104.png | 1 | 1 | 660 | 魔女的来信(R・流金) x3 / 首领挑战券 x4 / 无穷之塔挑战券 x4 |

## 后续计算建议

精品店可直接参与商城兑换性价比计算，使用纯商城兑换口径：

```text
RewardValue = 礼盒内容总价值
ShopCE = RewardValue / 单次花费免费钻石
```

示例结构：

```js
{
  shopKey: 'premium-shop',
  shopName: '精品店',
  tradeShopTabId: 13,
  currency: { itemType: 1, itemId: 1, name: '免费钻石' },
  treasureChestId: 84,
  name: '封印钥匙礼盒',
  icon: 'Item_0103.png',
  quantity: 1,
  cost: 1560,
  limitTotal: 3,
  contents: [
    { itemType: 18, itemId: 1, name: '初级封印钥匙', quantity: 10 },
    { itemType: 18, itemId: 2, name: '中级封印钥匙', quantity: 20 },
    { itemType: 18, itemId: 3, name: '上级封印钥匙', quantity: 50 },
    { itemType: 20, itemId: 1, name: '无穷之塔挑战券', quantity: 16 },
    { itemType: 10, itemId: 11, name: '潜能宝珠(1小时)', quantity: 1 }
  ]
}
```
