# 规划器重构提取与备忘 (Refactor Reference)

*本文档是从 `implementation-design.md` 中单独提取的**重构增量部分**，仅供开发期间临时参考和对比。*

---

## 1. 核心数学模型与明确公式

重构后的算法由一套价值评估公式驱动。为统一量纲，所有价值（Value）、成本（Cost）、盈余（Surplus）均以 **CE（综合价值分）** 为基本单位。

### 1.1 基础价值转化
```text
PaidDiamonds = CostYen / 2
```
日元花费与付费钻石基数固定为 2:1。

### 1.2 金钱净收益 (Money Surplus)
表示当前路径在满足玩家预期要求后，额外赚取的“超额利润”。
```text
moneySurplus = TotalValue - (TotalCostYen / 2) * expectedRatio
```
*   `TotalValue`：路径总价值，包含限时包固有 CE，以及根据**分段线性包络线 $E(x)$** 计算出的虚拟累充期权价值。
*   `TotalCostYen`：路径总花费，**仅**包含限时包花费（补常驻包彻底解耦为展示层后处理，不计入主路径花费）。
*   **判断标准**：当 `moneySurplus >= 0` 时，表示这笔投资在金钱效率上达标。

### 1.3 决策价值 (Decision Value)
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

## 2. 可调整参数及其改动影响

算法的行为可以通过以下参数在配置层进行微调，这也是调优规划器的核心杠杆：

| 参数名称 | 建议默认值 | 物理含义 | 改动产生的影响 |
| :--- | :--- | :--- | :--- |
| `expectedRatio` (预期性价比倍率) | 玩家输入(如3.0) | 玩家对金钱投资回报的门槛 | **调高**：算法变得极其挑剔，绝大多数路径的 `moneySurplus` 变为负数，输出大量“机会保留/空方案”。<br>**调低**：算法倾向于买更多包，愿意接受低档包铺路。 |
| `preferenceDiscount` (机会偏好折现率) | 积极: 0.8<br>均衡: 0.9<br>珍惜: 1.0 | 对未来未发生收益的信任程度与时间贴现 | **调高(趋近1.0)**：未来收益权重高，算法更倾向于把机会留给未来（珍惜机会）。<br>**调低(趋近0)**：未来收益权重低，算法只看眼前的 `moneySurplus`，有达标包就触发（积极使用）。 |
| `executionWeight` (执行惩罚权重) | 50 CE / 次 | 每增加一点操作复杂度的价值惩罚（等效约 50 免费钻价值） | **调高**：极力避免同一批次触发大量礼包，算法会更倾向于把触发点拆到不同天（跨日），以降低单批次压力。<br>**调低**：肆无忌惮地跨来源大合批，可能导致玩家实际操作时容易手忙脚乱超时。 |
| `optionalSafeLimit` (可选安全上限) | 玩家输入(日元) | 愿意接受的最高单次规划总花费 | **调高/关闭**：放出最优数学解。<br>**调低**：在状态树生成时直接剪枝超额路径，可能导致无法达到最高收益。 |

> **关于默认值量级的严格计算与合理性评估（基于真实数据推演）：**
> 根据现有限时包真实数据，通常大包的真实 CE 值在 **3.0 ~ 6.5** 之间。
> 一个 ¥11800 的礼包（5900付费钻），在 `CE=4.0` 且 `expectedRatio=3.0` 时，带来的 `moneySurplus` = 5900 × (4.0 - 3.0) = **+5900 CE**。
> 而一个 ¥160 的小礼包（80付费钻），在同等条件下的 `moneySurplus` 仅有 **+80 CE**。
> 
> 在这种量纲下：
> *   **`executionWeight = 50` 极其精妙且合理**。50 CE 等价于 50 免费钻。如果为了硬凑一个 ¥160 的小包（盈余80）而去增加操作复杂度，扣除 50 惩罚后几乎无利可图。这完美地阻止了算法“为了捡芝麻而增加操作难度”，同时对动辄数千盈余的大包几乎没有影响。
> *   **废弃 `riskWeight` 的原因**：如玩家反馈，非同批跨日实际上是**降低**了触发压力。跨日的利弊已由 `moneySurplus`（吃几轮每日累充奖励）和 `executionCost`（分摊到不同天压力更低）天然调节，不应再加额外人工惩罚。

## 3. 剪枝策略与公式 (Beam Search & Pareto Pruning)

为防止状态空间爆炸，采用按维度的 Beam Search 与带容忍度的 Pareto 剪枝。

**1. 分桶策略 (Bucketing)**
使用以下离散维度计算哈希键分桶：
```text
BucketKey = hash(tierIndex, sourceCursors, currentDayAttributeTowers)
```

**2. 桶内 Pareto 优势判定公式**
摒弃旧版的“花费越低越好”逻辑。在相同 Bucket 内，如果状态 A 对状态 B 构成“绝对优势”，则淘汰 B。判定公式为：
```text
A 淘汰 B 的条件 = 
  (A.decisionValue >= B.decisionValue - decisionTolerance)
  AND (A.totalSpentYen <= B.totalSpentYen)
  AND (A.triggerCount <= B.triggerCount)
```
*   `decisionTolerance` (价值容忍度参数，建议值：`500`)：基于真实数据中单包盈余（约数千 CE）与操作/风险惩罚（50~500 CE）的比例，容忍度设为 500 CE（等效 500 钻物资价值）最为合适。这意味着，即使 A 的决策价值比 B 略低一点（在 500 CE 以内），但只要 A 花的钱和消耗的机会都不比 B 多，A 依然视为更优并淘汰 B。这不仅过滤了计算底噪，还保留了那些“虽然收益少了一点点，但便宜很多”的高性价比平替方案。

**3. 截断限制 (Beam Width)**
*   `bucketSizeLimit` (单桶容量参数，建议值：`15`)：每个 Bucket 最多保留 15 个代表状态。
*   `globalStateLimit` (全局状态上限，建议值：`2000`)：每层转移结束后，全局最多保留 2000 个状态，防 OOM。

## 3. 动态规划状态 (DP State) 重构

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
  totalSpentYen,              // 仅包含限时包的总花费（用于检查 optionalSafeLimit）。
  totalValue,                 // 路径已获得的虚拟总综合 CE（基于包络线计算）。
  moneySurplus,               // 当前路径的金钱净收益 (核心指标 1)。
  decisionValue,              // 当前路径的决策价值 (核心指标 2，包含 heuristics)。
  
  // --- 成本与偏好追踪 ---
  executionCost,              // 累计操作成本惩罚基数。
  triggerCount,               // 已消耗触发机会。
  purchases,                  // 购买包数。
  
  // --- 溯源 ---
  steps,                      // 路径明细。
  signature                   // 去重签名。
}
```

## 4. 方案输出架构重构

替换掉旧版的定死策略（最大包/只买小包），在 DP 搜索结束后，对留存的合法路径集合打标签分类输出：

1.  **推荐方案 (Recommended)**：按 `decisionValue` 排序的 Top 1 方案。
2.  **保守方案 (Conservative)**：过滤掉所有包含主动降档不买、或购买低于 expectedRatio 单包作为升档铺路的路径，在剩余中选 `decisionValue` 最高的。
3.  **升档铺路方案 (Paving)**：提取路径中明确包含“用亏损包换取下一批升档”动作，且整条路径 `moneySurplus >= 0` 的方案。
4.  **降档等待方案 (Waiting)**：提取路径中包含“同批触发全不买以换取强制降档”动作，且最终 `moneySurplus >= 0` 的方案。
5.  **机会保留方案 (Retention)**：如果所有搜索结果的 `moneySurplus < 0`，算法停止，输出空方案，并在 UI 侧重点渲染“已保留的触发点”与保留建议。
