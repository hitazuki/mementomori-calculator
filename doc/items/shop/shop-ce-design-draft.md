# 商城兑换性价比功能设计草案

> 临时草案，供评审与批注。  
> 当前日期：2026-06-30。  
> 术语：游戏内泛称使用“商城”，来源 `TextResource*MB.json` 的 `[ShopExchangePlace]`。

## 命名与多语言

| 用途 | StringKey | 简中 | 繁中 | 英文 | 日文 | 韩文 |
| --- | --- | --- | --- | --- | --- | --- |
| 泛称 | `[ShopExchangePlace]` | 商城 | 商城 | Shop | ショップ | 상점 |
| 精品店页签 | `[TradeShopTabName13]` | 精品店 | 精品店 | Special | スペシャル | 특별 |

页面中文建议命名为：`商城兑换性价比`。

## 功能定位

新增页面位于 `道具系统` 分类下，显示在 `礼包全览与对比` 上方，与其同级。

建议顺序：

1. 商城兑换性价比
2. 礼包全览与对比
3. 超值限时组合包查询

本页面专门处理“用商城货币兑换道具”的价值判断，不使用充值礼包的充值价值补正。

## CE 口径

充值礼包当前口径是：

```text
FinalValue = OriginalValue + RechargeValue
CE = FinalValue / PaidDiamonds
```

商城兑换应使用“指定数量商城货币的产出价值”口径：

```text
RewardValue = Σ(奖励道具数量 × 道具单价评分)
ShopCE = RewardValue / CostCount × CurrencyUnit
```

`CurrencyUnit` 默认为 1，此时 CE 表示“每消耗 1 个商城货币，换回多少钻石价值”。价格量级较大的商城可配置更易读的单位，例如古竞技商城使用 `CurrencyUnit = 1000`，此时 CE 表示每 1000 古竞技币换回的钻石价值。商城货币本身不需要额外标注价值。

示例：魔女的书库大扫除商城。

```text
RewardValue = 命运召唤券 x5 的评分价值
ShopCE = RewardValue / 375
```

## 数据结构建议

建议新增 `src/constants/shopItems.json` 或等价生成数据：

```js
{
  shopKey: 'witch-library-cleanup',
  shopName: '魔女的书库大扫除商城',
  currency: {
    itemType: 44,
    itemId: 1,
    name: '树影书签',
    iconId: 193
  },
  ceCurrencyUnit: 1,
  products: [
    {
      id: 'witch-library-cleanup-001',
      name: '命运召唤券',
      iconId: 54,
      reward: { itemType: 16, itemId: 4, quantity: 5 },
      contents: null,
      cost: 375,
      limitTotal: 2,
      source: 'screenshot'
    }
  ]
}
```

有内容物的礼盒使用 `contents` 展开计算价值：

```js
{
  id: 'premium-shop-084',
  name: '封印钥匙礼盒',
  iconId: 103,
  reward: { itemType: 9, itemId: 84, quantity: 1 },
  contents: [
    { itemType: 18, itemId: 1, quantity: 10 },
    { itemType: 18, itemId: 2, quantity: 20 },
    { itemType: 18, itemId: 3, quantity: 50 },
    { itemType: 20, itemId: 1, quantity: 16 },
    { itemType: 10, itemId: 11, quantity: 1 }
  ],
  cost: 1560,
  limitTotal: 3,
  source: 'screenshot'
}
```

## 计算引擎建议

新增 `src/engine/shopCalc.js`，复用现有道具评分能力：

- `normalizeScores`
- `getScore`
- `getItemInfo`
- `getBaseItemKey`

核心输出字段：

```js
{
  rewardValue,
  ce,
  limitTotal,
  contentDetails,
  valueShares,
  missingScoreItems
}
```

计算规则：

- 若 `contents` 存在，以 `contents` 的总价值作为 `rewardValue`。
- 若 `contents` 不存在，以 `reward` 的价值作为 `rewardValue`。
- 若 `cost` 缺失，展示价值，但 `ce = null`。
- `ce = rewardValue / cost × ceCurrencyUnit`；`ceCurrencyUnit` 默认为 1。
- 古竞技商城的 `ceCurrencyUnit = 1000`，单位为“钻石价值 / 1000 古竞技币”。
- 若内容物有未计价道具，该道具价值记为 0，并在详情中标记。

## 页面交互

页面顶部：

- 商城切换：`魔女的书库大扫除商城` / `精品店`
- 排序：`CE`、`价值`、`价格`

商品展示参考游戏截图，使用卡片网格：

- 商品图片
- 商品名
- 获得数量
- 价格
- 价值
- CE
- 限购
- 有内容物时显示可点击详情

CE 颜色仅表示当前商城内的相对性价比，不跨商城比较。以当前商城最高有效 CE 为基准：

- `CE / 最高 CE >= 90%`：金色
- `CE / 最高 CE >= 75%`：绿色
- `CE / 最高 CE >= 50%`：蓝色
- 其余有效 CE：红色
- CE 缺失或商城内没有正数 CE：灰色

相对色阶随用户调整道具评分实时重算；`ceCurrencyUnit` 只影响 CE 的显示计价单位，不影响相对颜色。

详情层展示：

- 内容物图标、名称、数量
- 单项价值
- 总价值占比
- 未计价道具提示

## 当前数据完备性

| 商城 | 内容 | 价格 | 限购 | CE 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| 魔女的书库大扫除商城 | 完备 | 完备 | 完备 | 可计算 | CE 为每 1 个树影书签可兑换的钻石价值；三种封印钥匙已确认为不限购 |
| 古竞技商城 | 截图可见 14 个兑换档位完备 | 完备 | 完备 | 可计算 | CE 为每 1000 古竞技币可兑换的钻石价值；相同道具、数量和价格的重复卡片分别保留 |
| 巅峰竞技商城 | 截图可见 9 个兑换档位完备 | 完备 | 完备 | 可计算 | CE 为每 1000 巅峰竞技币可兑换的钻石价值；未鉴定符石的等级价值按 Lv2 评分推导 |
| 公会商城 | 截图可见 12 个兑换档位完备 | 完备 | 完备 | 可计算 | CE 为每 1000 公会币可兑换的钻石价值；已售罄的符石兑换券仍保留其总限购 1 次 |
| 跨服公会战商城 | 截图可见 18 个兑换档位完备 | 完备 | 完备 | 可计算 | CE 为每 100 跨服公会币可兑换的钻石价值；截图的 999 限购按确切总数保留 |
| 公会讨伐战商城 | 截图可见 32 个兑换档位完备 | 完备 | 完备 | 可计算 | CE 为每 1 个公会讨伐战活动代币可兑换的钻石价值；专武碎片限购 10，三种封印钥匙不限购；专武碎片以项目维护的「专属武器碎片」作通用代表，按魔水晶 x3 -> 专武碎片 x10 派生；档位标签不在用户侧展示 |
| 精品店 | 截图可见 10 个礼盒/礼袋内容完备 | 完备 | 完备 | 可计算 | 货币为免费钻石；CE 为每 1 免费钻石可兑换的道具钻石价值 |

## 待确认

1. 后续购买规划功能若需要满购统计，可由 `cost × limitTotal` 与 `reward × limitTotal` 动态计算；不限购档位不参与满购上限统计，不在当前展示需求中直接呈现。
