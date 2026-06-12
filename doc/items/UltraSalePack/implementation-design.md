# 超值限时组合包购买规划实现设计

本文档记录基于“预期性价比驱动”与“机会成本模型”的目标实现设计。若现有代码与本文档不一致，以本文档作为后续重构和实现依据。

对应需求见 `requirements.md`，游戏内稳定规则见 `game-rules.md`。

## 1. 设计目标

规划器的核心问题已经从“固定预算下的背包价值最大化”转变为“**跨期资源调度下的决策价值最大化**”。
算法需要同时搜索：

- 哪些触发机会放入同一个 2 小时卡包批次。
- 哪些触发机会主动拆到后续批次，或直接**保留不触发**。
- 每个批次买或不买，进而影响升降档。
- 哪些批次共用同一个累充日进度，哪些批次跨 0 点重置。
- 每个累充日跨日重置前是否需要自动补累充（基于价值盈余判定）。

主目标为：

```text
在不受固定预算约束的前提下，基于玩家给定的“预期性价比”和“机会偏好”，最大化候选路径的 决策价值 (Decision Value)。
```

排序偏好为：
1. 决策价值 (Decision Value) 最高。
2. 决策价值接近时，金钱净收益 (Money Surplus) 更高。
3. 接近时，批次执行压力 (Execution Cost) 更低。
4. 接近时，限时包花费更少。

## 2. 核心数学模型与明确公式

重构后的算法由一套价值评估公式驱动。为统一量纲，所有价值（Value）、成本（Cost）、盈余（Surplus）均以 **CE（综合价值分）** 为基本单位。

### 2.1 基础价值转化
```text
PaidDiamonds = CostYen / 2
```
日元花费与付费钻石基数固定为 2:1。

### 2.2 金钱净收益 (Money Surplus)
表示当前路径在满足玩家预期要求后，额外赚取的“超额利润”。
```text
moneySurplus = TotalValue - (TotalCostYen / 2) * expectedRatio
```
*   `TotalValue`：路径总价值，包含限时包固有 CE、实际每日累充赠钻转化为免费钻的 CE、补累充包自带内容 CE。
*   `TotalCostYen`：路径总花费，包含限时包花费与补累充花费。
*   **判断标准**：当 `moneySurplus >= 0` 时，表示这笔投资在金钱效率上达标。

### 2.3 决策价值 (Decision Value)
主排序和目标函数。不仅考虑当前的钱花得值不值，还考虑未来的机会损耗与执行负担。
```text
decisionValue = moneySurplus 
              + (remainingStateValue * preferenceDiscount) 
              - (executionCost * executionWeight) 
```

**参数释义：**
*   `remainingStateValue` (剩余状态估值)：启发式函数（Heuristic）估算的，在“计算前瞻范围”内，当前未消耗的触发机会在未来能产生的最大 `moneySurplus`。如果保留了机会，这个值就会很高；如果消耗了核心机会，这个值就会降低。
*   `preferenceDiscount` (机会偏好折现率)：取决于用户的“机会偏好”。详见参数表。
*   `executionCost` (执行成本)：路径中的复杂操作数量。例如：单批次触发的礼包数量、跨来源合批的复杂度。当玩家选择非同批跨日（把触发点分散到不同天）时，单批次的触发压力大幅降低，`executionCost` 会显著减少。

## 3. 可调整参数及其改动影响

算法的行为可以通过以下参数在配置层进行微调，这也是调优规划器的核心杠杆：

| 参数名称 | 建议默认值 | 物理含义 | 改动产生的影响 |
| :--- | :--- | :--- | :--- |
| `preferenceLevel` (购买偏好档位) | 玩家输入(保守/均衡/激进) | 玩家对金钱投资回报的门槛与对未发生收益的信任程度 | **激进**：内部映射低 `expectedRatio` 盈亏线和低 `preferenceDiscount`。算法倾向于通过升档买更多包，愿意接受低档包铺路。<br>**保守**：内部映射高 `expectedRatio` 和高 `preferenceDiscount`。算法变得极其挑剔，绝大多数路径的 `moneySurplus` 变为负数，输出大量“机会保留/空方案”。 |
| `executionWeight` (执行惩罚权重) | 50 CE / 次 | 每增加一点操作复杂度的价值惩罚（等效约 50 免费钻价值） | **调高**：极力避免同一批次触发大量礼包，算法会更倾向于把触发点拆到不同天（跨日），以降低单批次压力。<br>**调低**：肆无忌惮地跨来源大合批，可能导致玩家实际操作时容易手忙脚乱超时。 |

> **关于默认值量级的严格计算与合理性评估（基于真实数据推演）：**
> 根据现有限时包真实数据，通常大包的真实 CE 值在 **3.0 ~ 6.5** 之间。
> 一个 ¥11800 的礼包（5900付费钻），在 `CE=4.0` 且 `expectedRatio=3.0` 时，带来的 `moneySurplus` = 5900 × (4.0 - 3.0) = **+5900 CE**。
> 而一个 ¥160 的小礼包（80付费钻），在同等条件下的 `moneySurplus` 仅有 **+80 CE**。
> 
> 在这种量纲下：
> *   **`executionWeight = 50` 极其精妙且合理**。50 CE 等价于 50 免费钻。如果为了硬凑一个 ¥160 的小包（盈余80）而去增加操作复杂度，扣除 50 惩罚后几乎无利可图。这完美地阻止了算法“为了捡芝麻而增加操作难度”，同时对动辄数千盈余的大包几乎没有影响。
> *   **废弃 `riskWeight` 的原因**：如玩家反馈，非同批跨日实际上是**降低**了触发压力。跨日的利弊已由 `moneySurplus`（吃几轮每日累充奖励）和 `executionCost`（分摊到不同天压力更低）天然调节，不应再加额外人工惩罚。

## 4. 输入归一化

### 4.1 输入归一化
页面输入的不再是散乱的性价比和预算上限，而是统一的购买偏好档位（如：保守、均衡、激进）：
```text
preferenceLevel
```
内部算法将根据该宏观档位映射出精确的盈亏线 `expectedRatio` 和摩擦力成本，用于后续规划与状态剪枝。

### 4.2 礼包档位
从限时包数据中提取可用价格档位并升序排列：
```text
160, 650, 1000, 1500, 3000, 6000, 11800
```
状态保存 `tierIndex`，买入批次后下一批升 1 档，不买批次后下一批降 1 档，结果 clamp 到最低档和最高档。

### 4.3 触发机会
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

## 5. 触发图拓扑

### 5.1 来源序列
主线、等级、无穷塔等普通来源建模为有序序列：
```text
source[i] -> source[i + 1]
```
同一来源必须按顺序推进。一个批次最多从同一来源取 `batchSize` 个连续触发机会，但可以少取，甚至只取 1 个。

### 5.2 属性塔拓扑
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
一个节点可以进入当前批次，需要满足：
- 同来源前置节点已经处理，或也在当前批次内按顺序处理。
- 同来源本批数量不超过 `batchSize`。
- 全属性塔抵达节点的四塔前沿已经能到达该层。
- 全属性塔抵达节点满足四塔前沿派生门槛。

同层单塔节点可以合批，也可以拆成多个批次。拆批时，已经处理的单塔可以进入自己的下一层级，而同层未处理的其他单塔仍保留在前沿。

## 6. 抽象时间模型

规划器不模拟真实日期、星期和开始时间，但状态需要表示会影响价值的时间边界。状态中保存：
```js
{
  rechargeDayIndex,
  dailyPaidDiamonds,
  currentDayAttributeTowers,
  sameDayBatchCount
}
```
每个批次结束后，下一批有两类时间转移：
1. 继续同一累充日：保留 `dailyPaidDiamonds` 和 `currentDayAttributeTowers`。
2. 跨 0 点重置：`rechargeDayIndex + 1`，`dailyPaidDiamonds = 0`，`currentDayAttributeTowers = []`。

跨日转移是候选路径的一部分。剪枝可以限制跨日位置数量，但不能退化为固定同日连续购买或固定每批跨日。每日累充重置只发生在批次边界。
**大额累充强制跨日（算法剪枝优化）**：由于单日硬冲超过 12000 的边际性价比显著下降，当当前累计付费钻 `dailyPaidDiamonds >= 12000` 时，算法强制在执行下一批次前跨日重置。这属于一种剪枝优化，用于引导规划器自然偏向多日重复凑 12000 并防止状态空间在低性价比分支上无意义展开。
**属性塔强制换日**：当下一批会再次推进当前累充日内已经推进过的同一个单属性塔时，应先在上一批之后评估跨日前补累充，再重置 `dailyPaidDiamonds` 和 `currentDayAttributeTowers`，然后结算该批。

## 7. 批次编排搜索

“从当前可达前沿生成候选批次”。状态保存每个来源已经处理到的位置 `sourceCursors`。候选批次只能从各来源 cursor 之后的可达节点生成。

未进入当前 `batchCandidate` 的触发节点不视为已触发，不推进 cursor，也不会消耗限时包触发机会。它可以保留到后续批次，在档位升高后再触发并购买。

候选批次 `batchCandidate` 生成器输出：
- 单节点批次：最低压力，用于主动拆批。
- 单来源前缀批次：同一来源连续取 1 到 `batchSize` 个节点。
- 跨来源合批：把多个来源的当前可达节点合入同一批。
- 属性塔同层合批：蓝/红/翠/黄同层可合批。
- 全属性塔抵达与其他可达节点合批。

批次压力用于次级排序和候选剪枝：
```text
pressure = 同批触发节点数 + 跨来源数量权重 + 属性塔同步权重
```

## 8. 购买动作与每日累充估值

对每个候选批次，根据当前档位取可买限时包。动作包括全买、买部分、全不买。同档位买 N 个时只保留价值最高的前 N 个。

### 8.1 累充收益的分段线性包络线 (Lipschitz Envelope)

真实的每日累充奖励是一个存在断崖的阶梯函数 $S(x)$。如果 DP 引擎直接读取 $S(x)$，会在面临差一点满档（如 11800 钻）的状态时，因为看不到背后的巨额大奖而产生“短视剪枝”。

为了解决这一问题，规划器在启动 DP 前，会执行一次轻量级的 $O(M)$ 一维预处理，利用常驻包 1.2 CE 的兜底价值，从最大钻数向 0 倒推，生成一条**连续的分段线性包络线 $E(x)$**：

```text
折损斜率 slope = expectedRatio - 1.2
// 从右向左倒推生成包络线
E[x] = max(S[x], E[x + 1] - slope)
```

这条包络线完美“熨平”了阶梯悬崖。在 DP 核心搜索流转时，引擎对“常驻包”、“凑单”一无所知，仅仅执行 $O(1)$ 的查表操作：
```text
rechargeBonus = E(dailyPaidDiamonds + actionPaidDiamonds) - E(dailyPaidDiamonds)
actionValue = intrinsicValue + rechargeBonus * freeDiamondScore
```
这使得 11800 钻自带了极高的虚拟期权价值，DP 绝不会将其剪枝。同时，由于早期阶梯赠钻极多（天然形成的斜率远高于预设的折损斜率），DP 依然能像拥有大局观一样选择跨日拆批。

### 8.2 UI 展示的真实结算

当 DP 选出最优路线后，**UI 层恢复使用真实的阶梯函数 $S(x)$** 结算账本，计算出真实的 `moneySurplus`。此时真实的 $S(11800)$ 并未拿到大奖，UI 后处理模块探测到极高的额外利润，自动触发补包建议。

## 9. 自动补累充的判定与支配剪枝 (Top-up Dominance Pruning)

补累充逻辑发生在跨日前结算边界，仍属于 DP 状态流转的一部分，不能解耦成 UI 后处理的强制展示动作。与限时包购买不同，常驻钻石组合包不会触发限时包，也不会影响限时包升降档；跨日后 `dailyPaidDiamonds` 与 `currentDayAttributeTowers` 都会重置。因此在“买补包后跨日”和“不补包直接跨日”之间，如果后续搜索状态完全一致，只需要保留 CE 目标函数下更优的一支。

工作流如下：
1. **纯净搜索**：DP 引擎主要使用限时包流转，依靠包络线 $E(x)$ 评估每日累充收益。
2. **跨日补包判定**：当一个批次需要跨日（或同日无后续动作）时，检查当前 `dailyPaidDiamonds` 距离下一档 `nextTier` 的差额 `gap`。
3. **阈值与盈余双重检查**：
   * 检查 `gap <= dailyPaidDiamonds` 或类似的安全边界（视配置而定），避免为了几百钻强补几千钻大包。
   * 使用启发式贪心组合挑选可达到目标累充档的常驻包候选，计算真实盈余：`topUpSurplus = 补包新增累充赠钻CE + 补包内容CE - (补包花费 / 2) * expectedRatio`。
   * 如果 `topUpSurplus >= 0`，且买补包后跨日的 `realScore/searchPriority` 不低于不补包直接跨日，则保留“买补包后跨日”状态。
   * 如果 `topUpSurplus < 0`，或补包分支低于不补包分支，则直接保留“不补包直接跨日”状态。

### 9.1 为什么可以折叠为单分支

跨日结算后，补包与不补包分支的后续结构状态一致：

```text
tierIndex 相同
sourceCursors 相同
dailyPaidDiamonds = 0
currentDayAttributeTowers = []
```

两者差异只体现在已结算账本：`totalSpentYen`、`topUpCostYen`、`totalValue`、`moneySurplus`、`realScore` 和展示明细。由于后续可达机会、限时包档位和累充起点完全相同，低于基准 CE 的补包不会在未来产生额外期权收益；保留它只会增加状态数。因此当前实现允许在跨日前执行一次支配剪枝，将“补包”和“不补包”折叠为单个更优状态。

如果未来引入以下能力，需要重新评估是否必须恢复平行分支：
- 常驻包购买会影响后续限时包触发、限时包档位或额外活动条件。
- 补包可以发生在同一累充日中间，而不是仅发生在跨日前结算边界。
- 用户需要手动确认多个补包候选，并让非最优 CE 组合进入后续规划比较。

### 9.2 启发式贪心组合取舍

设计目标中的严格组合规则是“采用能达到目标累充档的最低花费组合；若花费相同，优先内容价值更高、包数更少”。考虑到常驻钻石组合包档位少、价格与付费钻基本单调，当前实现暂时使用启发式贪心组合，以减少每次跨日前的组合搜索成本：

- 优先选择不超过缺口的较大包。
- 若无法精确覆盖，再选择最小的超额包。
- 对已使用过的档位允许重复购买，以模拟可重复购买的常驻包。

该取舍符合当前业务数据规模与 CE 驱动目标，但属于性能优化下的启发式实现，而不是数学上完整的最小成本组合 DP。若未来常驻包种类增加、出现非单调价格/钻石关系，或补包结果对推荐路径高度敏感，应替换为小规模背包/最短路枚举，并补充单元测试覆盖。

## 10. 动态规划状态 (DP State)

DP 状态移除对 `limitedSpentYen` 的绝对容量依赖，变更为以 `Decision Value` 追踪为核心的状态。

```js
{
  // --- 转移核心维度 ---
  tierIndex,                  // 下一批的限时包档位。
  sourceCursors,              // 触发源推进前沿。决定未来哪些节点可达。
  rechargeDayIndex,           // 抽象累充日。
  dailyPaidDiamonds,          // 今日累计付费钻，决定边际赠钻。
  currentDayAttributeTowers,  // 今日推塔集合，决定强制跨日。
  
  // --- 价值与花费追踪 ---
  totalSpentYen,              // 包含限时包与补累充的总花费。
  totalValue,                 // 路径已获得的总综合 CE。
  moneySurplus,               // 当前路径的金钱净收益 (核心指标 1)。
  decisionValue,              // 当前路径的决策价值 (核心指标 2，包含 heuristics)。
  
  // --- 成本与偏好追踪 ---
  executionCost,              // 累计操作成本惩罚基数。
  triggerCount,               // 已消耗触发机会。
  purchases,                  // 购买包数。
  timeoutWaits,               // 降档等待次数。
  
  // --- 溯源 ---
  steps,                      // 路径明细。
  signature                   // 去重签名。
}
```

## 11. 状态转移与剪枝策略

单轮转移流程：
```text
state
  -> generateBatchCandidates(state.sourceCursors)
  -> for each batchCandidate
     -> generatePurchaseActions(batchCandidate, state.tierIndex)
     -> apply tier up/down & calc action values
     -> update moneySurplus & decisionValue
     -> continue same-day directly
     -> before next-day reset, branch auto top-up (if topUpSurplus >= 0) / no top-up
     -> insert candidate state
  -> pruneStates
```

### 11.1 剪枝策略与公式 (3-Layer Pruning)

为防止状态空间爆炸，采用按维度的分桶（Bucketing）和三层过滤剪枝体系：

**1. 分桶策略 (Bucketing)**
使用以下离散维度计算哈希键分桶，保证桶内状态的后续转移环境高度一致：
```text
BucketKey = hash(tierIndex, sourceCursors, currentDayAttributeTowers, rechargeBucket)
```
其中 `rechargeBucket` 包含三个子维度：
*   `rewardTierIndex`：当前日累充奖励的最高达成档位。
*   `nextGapBand`：距离下一档的差额分段（精确划分为：0, 1~80, 81~325, 326~500, 501~750, 751~1500, 1501~3000, 3001~5900, 5900+）。
*   `potentialBand`：剩余包络线潜力 $E(x)$ 的分段（每 500 CE 一档），用于保证不会错误淘汰具有高潜力的低充值状态。

**2. 三层过滤体系**
*   **Layer 1: 严格支配淘汰 (Strictly Dominates)**
    在同一个 Bucket 中，如果状态 A 花费不大于 B、`realScore` 不低于 B、压力不超过 B、且属性塔限制包含于 B，则 A 绝对优于 B，直接将 B 淘汰。
*   **Layer 2: 近似劣解淘汰 (Approximately Dominates)**
    在上述严格支配之外，若 A 相比 B 花费稍多，但 `realScore` 的增加足以弥补这种差异，且其他条件近似，则淘汰 B，避免细碎的次优路径膨胀。
*   **Layer 3: 带配额保护的全局 Beam 截断**
    经过桶内自剪枝后，按照全局候选的 `comparePlan`（首要 `searchPriority` 其次 `realScore`）排序，并实施硬截断：
    *   `minBucketSurvivors` (配额底线)：截断前，为每个 Bucket 保留最优秀的若干个代表，免受全局暴力的截断。
    *   `globalStateLimit` (全局状态上限)：全局最多保留数千状态，避免内存溢出。

### 11.2 启发函数估值 (Heuristic Evaluator)
为了计算 `remainingStateValue`，可以在每步状态转移时，对当前 `sourceCursors` 到 `计算前瞻范围` 之间的未触发节点进行一维线性扫描估值（假设在最优状态下触发能产生的理论最大 Surplus），作为启发式数值加给 `decisionValue`。

## 12. 方案输出架构

替换掉旧版的定死策略（最大包/只买小包），在 DP 搜索结束后，对留存的合法路径集合打标签分类输出：

1.  **推荐方案 (Recommended)**：按 `realScore` 排序的 Top 1 方案。
2.  **保守方案 (Conservative)**：过滤掉所有包含主动降档不买、或购买低于 expectedRatio 单包作为升档铺路的路径，在剩余中选 `realScore` 最高的。
3.  **升档铺路方案 (Paving)**：提取路径中明确包含“用亏损包换取下一批升档”动作，且整条路径 `moneySurplus >= 0` 的方案。
4.  **降档等待方案 (Waiting)**：提取路径中包含“同批触发全不买以换取强制降档”动作，且最终 `moneySurplus >= 0` 的方案。
5.  **机会保留方案 (Retention)**：如果所有搜索结果的 `moneySurplus < 0`，算法停止，输出空方案，并在 UI 侧重点渲染“已保留的触发点”与保留建议。

## 13. 展示模型

每个 `step` 对应一个全局批次，保留可展开明细：
- 触发点、价格档位、礼包内容物、CE、本批实际累充赠钻、补累充常驻包。
连续不购买批次可压缩展示。

页面汇总展示：限时包花费、补累充花费、总花费、跨日次数、触发机会消耗数、批次压力。

## 14. 复杂度

设 `F` 为当前前沿可达节点数，`C` 为每轮候选批次数，`A` 为购买动作数，`S` 为剪枝后保留状态数，`B` 为批次数。近似复杂度：`O(B * S * C * A)`。

控制点：
- 限制候选批次数量。
- 使用 source cursor hash 和 tierIndex 分桶。
- 使用 `decisionValue` 强剪枝。

## 15. 已知取舍与后续实现建议

- 不模拟真实日期，只使用抽象时间状态。
- 当前不使用跨 4 点属性塔额外推塔能力。
- 补包采用贪心判定而非穷举搜索。
- `remainingStateValue` 启发函数由于性能限制，可能只能做简化估算，而非完整的向下深搜。

建议按阶段落地：
1. 更新 DP 状态结构，将核心转移指标切换为 `moneySurplus`。
2. 开发 `remainingStateValue` 的一维极简估值函数。
3. 调整 `generateBatchCandidates` 不再直接过滤预算。
4. 根据打标策略，实装分类多方案输出器。
