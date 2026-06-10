# 超值限时组合包购买规划实现设计

本文档记录为满足当前需求的目标实现设计。若现有代码与本文档不一致，以本文档作为后续重构和实现依据。

对应需求见 `requirements.md`，游戏内稳定规则见 `game-rules.md`。

## 设计目标

规划器的核心问题不是“把触发点切成固定批次后选买哪些包”，而是同时搜索：

- 哪些触发机会放入同一个 2 小时卡包批次。
- 哪些触发机会主动拆到后续批次。
- 每个批次买或不买，进而影响升降档。
- 哪些批次共用同一个累充日进度，哪些批次跨 0 点重置。
- 每个累充日跨日重置前是否需要自动补累充。

主目标为：

```text
在限时包花费 <= 主预算的约束下，最大化购买路径的总评分价值。
补累充由阈值判定自动确定，不计入预算约束，仅在结果中展示。
```

排序偏好为：

1. 总评分价值更高。
2. 总价值接近时，批次压力更低。
3. 仍接近时，限时包触发机会消耗更少。
4. 仍接近时，限时包花费更少。

性价比不作为主优化目标，只作为展示和辅助比较指标。

## 输入归一化

### 预算

页面输入的预算是限时组合包主预算：

```text
mainBudgetYen
```

补累充不计入主预算约束，由阈值判定独立确定。阈值 `topUpThreshold` 默认为 `0.10`（10%），用户可调，设为 `0` 即关闭补包。

### 礼包档位

从限时包数据中提取可用价格档位并升序排列：

```text
160, 650, 1000, 1500, 3000, 6000, 11800
```

状态保存 `tierIndex`，而不是直接保存价格。买入批次后下一批升 1 档，不买批次后下一批降 1 档，结果 clamp 到最低档和最高档。

### 触发机会

每个触发点整理成 `opportunity`：

```js
{
  id,
  sourceId,
  sourceType,      // quest / rank / tower
  tower,
  trigger,
  sortValue,
  displayTrigger,
  packsByPrice
}
```

同一个触发点可能存在多个价格档位的礼包。执行某个批次时，只按当前 `tierIndex` 取对应价格档位的礼包。

主线进度使用 `mainQuestProgress.js` 解析，其他来源使用数字层数或等级。

每个来源只保留：

```text
当前进度 < 触发点 <= 计划推到
```

范围内的触发机会。

## 触发图

### 来源序列

主线、等级、无穷塔等普通来源建模为有序序列：

```text
source[i] -> source[i + 1]
```

同一来源必须按顺序推进。一个批次最多从同一来源取 `batchSize` 个连续触发机会，但可以少取，甚至只取 1 个。

### 属性塔拓扑

蓝塔、红塔、翠塔、黄塔先各自生成单塔触发序列。四个单塔各自维护独立 cursor，某个单塔节点进入批次后只推进该塔自己的前沿，不会消耗同层其他塔的触发机会。

全属性塔抵达事件由四塔共同派生：

```text
allTower(floor) requires blue >= floor, red >= floor, green >= floor, yellow >= floor
```

属性塔事件不再合并成单条线性 cursor，而是使用“单塔独立前沿 + 全属性塔派生门槛”。当前数据下拓扑层级形如：

```text
全属性塔抵达 225
单属性塔 250（蓝/红/翠/黄可同批）
全属性塔抵达 275
单属性塔 300（蓝/红/翠/黄可同批）
...
```

实现不按“蓝塔第 N 批、红塔第 N 批”合并，而是按拓扑可达性判断一个节点是否能进入当前全局批次。

一个节点可以进入当前批次，需要满足：

- 同来源前置节点已经处理，或也在当前批次内按顺序处理。
- 同来源本批数量不超过 `batchSize`。
- 全属性塔抵达节点的四塔前沿已经能到达该层。
- 全属性塔抵达节点满足四塔前沿派生门槛。

同层单塔节点可以合批，也可以拆成多个批次。拆批时，已经处理的单塔可以进入自己的下一层级，而同层未处理的其他单塔仍保留在前沿。

例如 `blue250` 已处理、`red250/green250/yellow250` 未处理时，下一批候选前沿包含：

```text
red250
green250
yellow250
blue300
```

其中 `blue300` 是否需要在批次结算前强制跨日重置，不由拓扑层级本身决定，而由当前累充日内是否已经推进过蓝塔决定。若当前累充日已经推进过蓝塔，则 `blue300` 执行前必须重置；若当前累充日只推进过其他属性塔，则不强制重置。

全属性塔抵达节点的可达性按四塔前沿判断：该层必须大于每个单塔已经处理到的层级，且不超过该单塔下一次会触发单塔限时包的层级；若该单塔后续没有单塔限时包，则不超过该塔规划终点。

属性塔强制重置与拓扑层级没有直接关系。状态保存当前累充日内已经推进过的单属性塔集合 `currentDayAttributeTowers`；候选批次保存本批会推进的单属性塔集合 `batch.attributeTowers`。若两者有交集，则该批次执行前必须跨日重置；若没有交集，则不同属性塔可以继续共用同一累充日。

全属性塔抵达节点本身不推进蓝塔、红塔、翠塔或黄塔的单塔 cursor，因此不计入 `batch.attributeTowers`。若未来要求全属性塔抵达也参与强制重置，需要单独定义它的推进集合。

## 抽象时间模型

规划器不模拟真实日期、星期和开始时间，但状态需要表示会影响价值的时间边界。

状态中保存：

```js
{
  rechargeDayIndex,
  dailyPaidDiamonds,
  currentDayAttributeTowers,
  sameDayBatchCount
}
```

- `rechargeDayIndex` 只是抽象日编号，不对应真实日期。
- `dailyPaidDiamonds` 是当前累充日内已经累计的付费钻。
- `currentDayAttributeTowers` 是当前累充日内已经推进过的单属性塔集合，用于判断同一单塔再次推进前是否必须跨日。
- `sameDayBatchCount` 用于限制或剪枝同一累充日内连续批次数。

每个批次结束后，下一批有两类时间转移：

1. 继续同一累充日：保留 `dailyPaidDiamonds` 和 `currentDayAttributeTowers`。
2. 跨 0 点重置：`rechargeDayIndex + 1`，`dailyPaidDiamonds = 0`，`currentDayAttributeTowers = []`。

跨日转移是候选路径的一部分。剪枝可以限制跨日位置数量，但不能退化为固定同日连续购买或固定每批跨日。

每日累充重置只发生在批次边界。同一个全局批次内的限时包购买和补累充购买都按同一个累充日计算，不枚举批内跨 0 点的购买顺序。

属性塔是额外的强制换日来源：当下一批会再次推进当前累充日内已经推进过的同一个单属性塔时，应先在上一批之后评估跨日前补累充，再重置 `dailyPaidDiamonds` 和 `currentDayAttributeTowers`，然后结算该批。该重置仍发生在批次边界。

如果下一批推进的是当前累充日内尚未推进过的其他属性塔，则不触发该强制重置。全属性塔抵达节点本身不触发该强制重置。

### 批次等待

不买批次代表等待当前批限时包 2 小时超时，下一批降档。买入批次也会进入下一批，但不需要额外等待超时。

设计中不建立真实小时轴，只保留抽象等待成本：

```js
{
  timeoutWaits,
  sameDayBatchCount
}
```

该成本用于：

- 控制同一累充日内能连续共用进度的批次数。
- 在价值接近时偏向操作压力更低、等待更合理的方案。
- 为后续引入更精确时间窗口留接口。

## 批次编排搜索

旧模型是“每个来源先切批，再按同序号合并”。新模型改为“从当前可达前沿生成候选批次”。

### 前沿状态

状态保存每个来源已经处理到的位置：

```js
sourceCursors = {
  quest: 3,
  rank: 1,
  tower_infinite: 4,
  tower_blue: 2,
  tower_red: 2,
  tower_green: 1,
  tower_yellow: 2,
  allTower: 1
}
```

候选批次只能从各来源 cursor 之后的可达节点生成。某个节点被放入独立批次后，会推进对应 cursor，从而改变后续可生成和可合批的节点。

未进入当前 `batchCandidate` 的触发节点不视为已触发，不推进 cursor，也不会消耗限时包触发机会。它可以保留到后续批次，在档位升高后再触发并购买。

### 候选批次

候选批次生成器输出多个 `batchCandidate`：

```js
{
  opportunities,
  sourceTakeCounts,
  pressure,
  cursorDelta,
  topologyKey
}
```

候选批次需要覆盖以下类型：

- 单节点批次：最低压力，用于主动拆批。
- 单来源前缀批次：同一来源连续取 1 到 `batchSize` 个节点。
- 跨来源合批：把多个来源的当前可达节点合入同一批。
- 属性塔同层合批：蓝/红/翠/黄同层可合批。
- 全属性塔抵达与其他可达节点合批。

为了控制规模，不枚举所有子集。候选批次按以下方式剪枝：

- 每个来源最多保留前 `batchSize` 个前缀。
- 跨来源合批只组合当前前沿附近节点。
- 对同一 `cursorDelta` 保留低压力和高潜在价值的代表候选。
- 对过大的批次限制最大同批触发总数。

剪枝不能删除全部拆批候选，也不能只保留最大合批候选。

### 批次压力

批次压力用于次级排序和候选剪枝：

```text
pressure = 同批触发节点数 + 跨来源数量权重 + 属性塔同步权重
```

价值相同或接近时，优先压力更低的批次编排。

## 购买动作

对每个候选批次，根据当前档位取可买限时包：

```js
offers = opportunities
  .map(opportunity => opportunity.packsByPrice.get(currentTierPrice))
  .filter(Boolean)
```

动作包括：

- 本批全不买。
- 买当前档位礼包中的前 1 个。
- 买当前档位礼包中的前 2 个。
- 直到买完本批当前档位可买礼包。

同一档位下价格相同，买 N 个时只保留价值最高的前 N 个，不枚举所有子集。

动作结果：

```js
{
  bought,
  limitedCostYen,
  paidDiamonds,
  intrinsicValue,
  purchases
}
```

若 `limitedSpentYen + limitedCostYen > mainBudgetYen`，动作不可行。

买入动作下一批升档，不买动作下一批降档。

## 每日累充估值

礼包查询页仍可展示单包 `PaidDiamonds * 1.2` 的估算充值价值；购买规划页不使用该估算。

规划页按路径状态计算实际边际赠钻：

```text
rechargeBonus =
  TotalBonusFreeDiamonds(dailyPaidDiamonds + actionPaidDiamonds)
  - TotalBonusFreeDiamonds(dailyPaidDiamonds)
```

限时包动作价值：

```text
actionValue =
  intrinsicValue
  + rechargeBonus * freeDiamondScore
```

本批限时包购买后更新：

```text
dailyPaidDiamonds += actionPaidDiamonds
```

之后保留当前累充日进度。若下一批继续同日，不在此处生成补累充候选；若后续状态选择跨日重置，则在重置前评估自动补累充。

## 自动补累充

补包在跨日重置前执行一次确定性判定，不产生路径分叉。用户可通过将 `topUpThreshold` 设为 `0` 关闭补包。

### 阈值判定

```text
gap = nextTier.paid - dailyPaidDiamonds
if gap <= dailyPaidDiamonds × topUpThreshold:
    购买常驻钻石组合包，使累计付费钻 >= 下一档
else:
    不补，直接跨日
```

其中 `topUpThreshold` 为用户可调的补累充阈值（页面默认 `10%`）。判定是确定性的——同一状态在相同条件下总是得到相同结果，因此 beam search 不需要为补包分叉。

### 补包规则

- 只在跨日重置前结算；继续同日的批次不触发补包判定。
- 只使用非首次常驻钻石组合包（`permanentPacks.json`）。
- 补包附着在跨日前最后一个已购买限时包的批次上，不单独生成展示行。
- 补包只瞄准下一档每日累充，达到即停。
- 补包采用能达到目标的最低花费组合；同花费优先价值更高、包数更少。
- 补包不触发限时包，不影响限时包升降档。
- 补包花费不计入主预算约束，仅在结果中展示总开销。

### 补包搜索

搜索窗口为 `[minCost, minCost + minPackPrice]`，其中 `minCost = (nextTier.paid - dailyPaidDiamonds) × 2`。窗口只覆盖”刚好达到下一档”的组合，不穷举远超下一档的组合。

补包价值直接累入 `state.value`，参与 beam 排序。由于不再有独立预算池，`state` 不追踪 `topUpSpentYen`。

### 不补情况

- 本批限时包购买后无下一档每日累充。
- 缺口不满足阈值条件（`gap > dailyPaidDiamonds × topUpThreshold`）。
- 没有可用的非首次常驻钻石组合包组合。
- 搜索窗口内无合法组合。

## 动态规划状态

核心搜索使用受控动态规划或 beam search。状态表示处理完若干批次后的路径前沿：

```js
{
  // 下一批开始时的限时包档位下标。
  // 买入批次后 +1，不买批次后 -1，并限制在有效档位范围内。
  tierIndex,

  // 每个触发源已经处理到的位置。
  // 它决定下一轮可以生成哪些触发节点，也让“拆批会影响后续节点生成”可被状态表达。
  sourceCursors,

  // 已用于购买限时组合包的日元花费，受主预算限制。
  limitedSpentYen,

  // 当前路径累计评分价值。
  // 包含限时包内容价值、实际每日累充赠钻价值、自动补包内容与累充价值。
  value,

  // 已购买的限时包数量。用于展示和次级排序。
  purchases,

  // 已消耗的限时包触发机会数量。
  // 不买但已触发超时的礼包也计入，因为这些机会已经不可再用于后续路径。
  triggerCount,

  // 批次操作压力累计值。同批触发越多、跨来源同步越多，压力越高。
  pressure,

  // 抽象累充日编号，不对应真实日期。
  // 只用于区分哪些批次共享同一个每日累充进度。
  rechargeDayIndex,

  // 当前抽象累充日内已累计的付费钻。
  // 影响后续限时包和补包的边际累充赠钻。
  dailyPaidDiamonds,

  // 当前抽象累充日内连续处理的批次数。
  // 用于对同日连续批次和跨日候选做剪枝。
  sameDayBatchCount,

  // 因不买批次导致的 2 小时超时等待次数。
  // 可用于时间剪枝和展示路径代价。
  timeoutWaits,

  // 页面展示用路径明细。只保留进入候选集合的状态需要的完整明细。
  steps,

  // 增量维护的路径签名，用于去重。
  signature
}
```

其中：

- `tierIndex`、`sourceCursors`、`dailyPaidDiamonds` 是最关键的状态维度，分别控制后续档位、后续触发节点、后续累充价值。
- `triggerCount` 和 `pressure` 不直接决定可行性，但决定价值接近时的方案偏好。
- `steps` 体积较大，应只在剪枝后仍保留的候选状态中维护；内部可用轻量摘要或父指针优化。

状态 key 不能只用 `tierIndex | spent`，至少需要包含：

```text
tierIndex
sourceCursors
limitedSpentYen
dailyPaidDiamonds bucket
```

`dailyPaidDiamonds` 可按累充档位区间或实际付费钻做 bucket。若只按档位区间剪枝，需要保留区间内更接近下一档且价值更高的代表状态。

## 状态转移

状态转移负责把“当前路径前沿”推进到“处理完下一批后的路径前沿”。每次转移同时处理四类变化：

- 触发节点被安排到某个批次，推进 `sourceCursors`。
- 本批买或不买，改变 `tierIndex`。
- 本批购买产生花费、礼包内容价值和实际累充赠钻。
- 本批后可能继续同日，或在跨日前评估自动补累充后重置到下一累充日。

单轮转移流程：

```text
state
  -> generateBatchCandidates(state.sourceCursors)
  -> for each batchCandidate
     -> generatePurchaseActions(batchCandidate, state.tierIndex)
     -> apply limited pack purchase / no purchase
     -> apply tier up/down
     -> apply actual recharge value
     -> continue same-day directly
     -> before next-day reset, branch auto top-up / no top-up
     -> insert candidate state
  -> prune states
```

不买动作仍会推进本批触发节点，因为这些包被触发后等待超时消失。若不希望触发某节点，应在批次编排阶段不把它放入当前批次。

### 转移伪代码

```js
function expandState(state, context) {
  const batchCandidates = generateBatchCandidates(state.sourceCursors, context)
  const nextStates = []

  for (const batch of batchCandidates) {
    const actions = generatePurchaseActions(batch, state.tierIndex, context.priceTiers)

    for (const action of actions) {
      // 1. 先检查限时包主预算。
      // 补累充预算独立处理，不能用主预算余额替代。
      if (state.limitedSpentYen + action.limitedCostYen > context.mainBudgetYen) {
        continue
      }

      // 2. 推进触发源 cursor。
      // 无论买不买，只要节点进入本批，就代表礼包已经触发并在本批结算。
      const sourceCursors = applyCursorDelta(state.sourceCursors, batch.cursorDelta)

      // 3. 计算限时包购买后的档位。
      const tierIndex = clampTier(
        action.bought ? state.tierIndex + 1 : state.tierIndex - 1,
        context.priceTiers,
      )

      // 4. 计算限时包带来的实际累充价值。
      // 这里用当前路径的 dailyPaidDiamonds，而不是单包 1.2 倍估算。
      const limitedRechargeBonus = marginalFreeDiamonds(
        state.dailyPaidDiamonds,
        action.paidDiamonds,
      )
      const limitedRechargeValue = limitedRechargeBonus * context.freeDiamondScore

      let candidate = {
        ...state,
        tierIndex,
        sourceCursors,
        currentDayAttributeTowers: mergeAttributeTowerSets(
          state.currentDayAttributeTowers,
          batch.attributeTowers,
        ),
        limitedSpentYen: state.limitedSpentYen + action.limitedCostYen,
        value: state.value + action.intrinsicValue + limitedRechargeValue,
        purchases: state.purchases + action.purchases.length,
        triggerCount: state.triggerCount + batch.opportunities.length,
        pressure: state.pressure + batch.pressure,
        dailyPaidDiamonds: state.dailyPaidDiamonds + action.paidDiamonds,
        timeoutWaits: state.timeoutWaits + (action.bought ? 0 : 1),
        steps: appendStep(state.steps, batch, action),
        signature: appendSignature(state.signature, batch, action),
      }

      // 5. 时间分支只在批次结算后发生：
      // 下一批继续同一累充日，或下一批开始前跨 0 点重置。
      nextStates.push(continueSameRechargeDay(candidate))

      // 6. 跨日重置前执行确定性补包判定，无分叉。
      if (candidate.purchases > 0) {
        const toppedUp = tryApplyTopUp(candidate, context)
        nextStates.push(resetToNextRechargeDay(toppedUp))
      }
    }
  }

  return pruneStates(nextStates, context)
}
```

### 关键注意点

- 属性塔强制换日由 `currentDayAttributeTowers` 与 `batch.attributeTowers` 的交集决定；`resetToNextRechargeDay()` 必须清空 `currentDayAttributeTowers`，`continueSameRechargeDay()` 必须保留它。
- `generateBatchCandidates()` 不能只生成最大合批，也不能只生成单节点拆批；两类候选都要保留代表状态。
- `applyCursorDelta()` 是批次编排的核心。分批后 cursor 推进不同，后续可达节点也会不同。
- 不买动作不是“跳过计算”，而是“触发后等待超时”，因此会推进 cursor、增加等待，并导致下一批降档。
- 没有进入当前批次的节点才是真正“保留到以后”；进入当前批次但不买的节点已经触发超时，不能等升档后再买。
- `tryApplyTopUp()` 是自动补累充的唯一入口；继续同日分支不调用补包逻辑。
- `tryApplyTopUp()` 不应枚举所有常驻包组合；它只处理接近下一累充阈值的小额补包。
- `continueSameRechargeDay()` 应增加 `sameDayBatchCount`，保留 `rechargeDayIndex` 和 `dailyPaidDiamonds`。
- `resetToNextRechargeDay()` 只重置 `dailyPaidDiamonds` 和同日计数，不重置预算、档位或 source cursor。

## 剪枝策略

剪枝要同时控制复杂度和保留关键需求候选。

### Pareto 剪枝

在相同或相近的关键状态维度下，若某状态：

- 限时包花费更高或相同。
- 价值不更高。
- source cursor 不更靠后。
- 档位不更有利。

则可丢弃。

### Beam 限制

按以下维度分桶后保留前 N 个：

```text
tierIndex
sourceCursorHash
currentDayAttributeTowers
rechargeTierBucket
limitedSpentBucket
```

排序使用（引入效率逆差惩罚）：

```text
(value - historicalWastePenalty - currentDayInefficiencyPenalty) desc
pressure asc
triggerCount asc
limitedSpentYen asc
```

**效率逆差惩罚（Efficiency Deficit Penalty）核心逻辑：**
- 真实游戏累充档位中，0~12,000钻的边际转化率为完美的 1.2。超过 12,000 后，转化率暴跌至 0.7 并在后续稳定于 0.9。
- 算法彻底摒弃固定阈值的业务死判断，采用数学公式：`效率逆差 = (当日花费 × 1.2) - 当日真实可领取的累充钻石`。
- **动态排查**：在 `comparePlan` 中，动态扣除此逆差分（并乘以系数1.5倍加大惩罚力度），强迫算法摒弃所有超越 12,000 钻的合批操作。
- **历史烙印**：在 `resetToNextRechargeDay`（跨日）时，当天的逆差惩罚会被永久累加至状态的 `historicalWastePenalty` 字段，终生携带，彻底封杀劣质分支试图通过跨日重置来洗白当天空耗的漏洞（例如卡在 9000 钻重置）。

### 时间剪枝

跨日候选需要保留，但数量要受控：

- 保留连续同日购买候选。
- 保留在高价值累充阈值后跨日的候选。
- 保留在长等待或连续不买后跨日的候选。
- 删除价值明显低、只是重复换日位置的候选。

### 批次候选剪枝

候选批次至少保留：

- 每个来源的单节点拆批候选。
- 当前可达节点的低压力合批候选。
- 当前可达节点的高价值合批候选。
- 属性塔拓扑的合法代表候选。

不能只保留最大合批，也不能只保留最小拆批。

## 多方案生成

### 价值最优

价值最优来自主搜索结果中排序第一的路径：

```text
总价值高 -> 批次压力低 -> 触发机会消耗少 -> 限时包花费少
```

不再单独展示“次优方案”。

### 只买小包

策略模拟使用同一触发图和批次约束，但购买策略固定：

- 只在最低档购买。
- 升档后通过不买批次等待超时降回最低档。
- 等待降档时优先低压力拆批以减少机会损耗；在最低档购买时支持合批购买。
- 自动补累充仍然生效。

### 冲最大包

策略目标是节省限时包触发机会，把有限触发机会尽量用于高档礼包：

- 未到目标高档前，优先买入用于升档。
- 到高档后，优先购买高档礼包。
- 若当前购买会消耗有限触发机会并削弱后续高档购买能力，可以选择不买等待降档。
- 自动补累充仍然生效。

冲最大包不是简单“永远买当前最高价包”，而是在预算、触发机会和升降档之间做策略模拟。

## 展示模型

每个 `step` 对应一个全局批次：

```js
{
  index,
  rechargeDayIndex,
  tierPrice,
  nextTierPrice,
  opportunities,
  purchases,
  skipped,
  limitedCostYen,
  topUps,
  rechargeBonus,
  pressure,
  waitType
}
```

购买批次不合并，保留可展开明细：

- 触发点。
- 价格档位。
- 礼包内容物。
- CE / 价值。
- 本批实际累充赠钻。
- 本批采用的补累充常驻包。

连续不购买批次可压缩展示：

```text
第 2-4 批，连续不买 ×3
```

页面汇总展示：

- 限时包花费。
- 补累充花费。
- 总花费。
- 累充日数量或跨日次数。
- 触发机会消耗数。
- 批次压力。

## 复杂度

设：

- `F` 为当前前沿可达触发节点数。
- `C` 为每轮候选批次数。
- `A` 为每个批次的购买动作数。
- `S` 为剪枝后保留状态数。
- `B` 为最终批次数。

主体近似：

```text
O(B * S * C * A)
```

与旧模型相比，复杂度主要增加在 `C`，即批次编排候选数量。

主要控制点：

- 限制候选批次数量。
- 使用 source cursor hash 分桶。
- 对每日累充状态做 bucket。
- 对补包组合强剪枝。
- 不展示次优方案，减少最终路径去重压力。

## 已知取舍

- 不模拟真实日期和星期，只使用抽象时间状态。
- 当前不使用跨 4 点属性塔额外推塔能力。
- 批内买多个限时包仍只枚举价值排序前缀，不枚举所有子集。
- 搜索是受控近似，不是无限状态完整穷举。
- 补包组合允许剪枝，结果以“接近阈值的小额补累充”场景为优先。

## 后续实现建议

建议按阶段落地：

1. 先把数据层从固定批次数组改为触发图和 source cursor。
2. 实现候选批次生成器，并用测试覆盖拆批、合批、拓扑约束。
3. 扩展 DP 状态，加入 source cursor、补累充预算、累充日状态。
4. 固化自动补累充，并移除可关闭开关。
5. 移除次优方案展示，调整最大包策略。
6. 最后优化剪枝和性能，必要时迁移到 Web Worker。
