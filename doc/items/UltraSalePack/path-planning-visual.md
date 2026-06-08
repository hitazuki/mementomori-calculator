# 限时组合包路径算法直观版

本文用流程图和伪代码展示购买路径计算流程。完整算法说明见 `path-planning-algorithm.md`。

## 总览流程

```mermaid
flowchart TD
  A["用户输入<br/>预算 / 当前档位 / 各触发源进度"] --> B["计算礼包 CE 与总价值"]
  B --> C["按触发源生成机会<br/>主线 / 等级 / 无穷塔 / 四属性塔"]
  C --> D["派生全属性塔抵达机会"]
  D --> E["每个触发源独立切批"]
  E --> F["合并同序号批次<br/>形成全局批次列表"]
  F --> G["动态规划搜索<br/>价值最优 / 次优"]
  F --> H["固定策略模拟<br/>只买小包 / 冲最大包"]
  G --> I["压缩连续不买批次"]
  H --> I
  I --> J["页面展示路径<br/>购买批次可展开看触发与内容物"]
```

## 批次生成流程

```mermaid
flowchart TD
  A["启用的触发源"] --> B["过滤触发点<br/>当前进度 < 触发点 <= 计划推到"]
  B --> C["按进度排序"]
  C --> D["按 2小时内最多触发 切成来源内批次"]
  D --> E["第 N 批与其他来源第 N 批合并"]
  E --> F["得到全局第 N 批"]
  F --> G{"是否启用四属性塔?"}
  G -- "是" --> H["计算全属性塔抵达批次"]
  H --> I["加入对应全局批次"]
  G -- "否" --> J["跳过全属性塔派生"]
  I --> K["全局批次列表"]
  J --> K
```

## 动态规划流程

```mermaid
flowchart TD
  A["初始状态<br/>档位 = 当前档位<br/>花费 = 0<br/>价值 = 0"] --> B["读取下一全局批次"]
  B --> C["按当前档位取批内可买礼包"]
  C --> D["生成动作<br/>全不买 / 买价值最高前 1 个 / 前 2 个 / ..."]
  D --> E["枚举旧状态 × 动作"]
  E --> F{"是否超预算?"}
  F -- "是" --> G["丢弃候选状态"]
  F -- "否" --> H["更新花费 / 价值 / 路径"]
  H --> I{"本批是否购买?"}
  I -- "是" --> J["下一批升 1 档"]
  I -- "否" --> K["下一批降 1 档"]
  J --> L["加入下一轮状态"]
  K --> L
  L --> M["Pareto 剪枝<br/>去掉更贵且价值不高的状态"]
  M --> N{"还有批次?"}
  N -- "是" --> B
  N -- "否" --> O["按价值 / 购买数 / 花费排序"]
  O --> P["输出价值最优与次优方案"]
```

## 核心伪代码

```text
function buildPlans(packs, settings):
  packsWithValue = calculatePackCE(packs)
  context = buildPlanningContext(packsWithValue, settings)

  bestPlans = dynamicProgramming(context, topK = 2)
  smallPackPlan = simulatePolicy(context, "smallPack")
  maxPackPlan = simulatePolicy(context, "maxPack")

  return [
    bestPlans[0],
    bestPlans[1],
    smallPackPlan,
    maxPackPlan
  ]
```

```text
function buildPlanningContext(packs, settings):
  priceTiers = sortedUniquePackPrices(packs)
  lanes = enabledTriggerSources(settings)

  laneBatches = []
  for lane in lanes:
    opportunities = filterPacksByLaneAndProgress(packs, lane)
    opportunities = sortByTriggerProgress(opportunities)
    laneBatches.append(splitByBatchSize(opportunities, lane.batchSize))

  allTowerEntries = deriveAllTowerOpportunities(packs, lanes)

  globalBatches = []
  for batchIndex from 0 to maxBatchCount:
    batch = mergeSameIndexBatches(laneBatches, batchIndex)
    batch.add(allTowerEntries at batchIndex)
    globalBatches.append(sortBatch(batch))

  return { priceTiers, globalBatches, budget, startTierIndex }
```

```text
function dynamicProgramming(context, topK):
  states = {
    key(context.startTierIndex, 0): [emptyState]
  }

  for batch in context.globalBatches:
    nextStates = {}

    for state in all states:
      tierPrice = context.priceTiers[state.tierIndex]
      actions = buildActions(batch, tierPrice)

      for action in actions:
        newSpent = state.spent + action.cost
        if newSpent > context.budget:
          continue

        if action.bought:
          nextTierIndex = state.tierIndex + 1
        else:
          nextTierIndex = state.tierIndex - 1

        nextTierIndex = clampToValidTier(nextTierIndex)

        candidate = {
          tierIndex: nextTierIndex,
          spent: newSpent,
          value: state.value + action.value,
          purchases: state.purchases + count(action.purchases),
          steps: state.steps + summarize(action, batch)
        }

        insertCandidate(nextStates, candidate, topK)

    states = pruneByParetoAndLimit(nextStates)

  return takeTopK(sortPlans(all states), topK)
```

## 单批动作示意

假设某个全局批次中，当前档位可买 3 个礼包：

| 触发 | 价值 | 价格 |
| --- | ---: | ---: |
| 主线 10-28 | 1500 | 160 |
| 无穷塔 180 | 1200 | 160 |
| 蓝塔 80 | 900 | 160 |

先按价值排序后，动作只枚举前缀：

| 动作 | 购买内容 | 是否升档 |
| --- | --- | --- |
| 全不买 | 无 | 否，下一批降档 |
| 买 1 个 | 主线 10-28 | 是，下一批升档 |
| 买 2 个 | 主线 10-28 + 无穷塔 180 | 是，下一批升档 |
| 买 3 个 | 主线 10-28 + 无穷塔 180 + 蓝塔 80 | 是，下一批升档 |

不会枚举“只买无穷塔 180”这类子集，因为同档礼包价格相同，买 1 个时选最高价值礼包一定不差。

## 状态剪枝示意

同一档位下，若有以下候选状态：

| 状态 | 已花费 | 已价值 |
| --- | ---: | ---: |
| A | 160 | 1000 |
| B | 650 | 900 |
| C | 810 | 1800 |

B 会被剪掉，因为它比 A 花费更多，但价值更低。

保留 A 和 C，因为 C 虽然更贵，但价值也更高，后续仍可能成为最优路径的一部分。

## 路径展示压缩

算法内部仍保留每个批次的完整 step。页面展示时再压缩连续不买：

```text
原始路径:
第 1 批 买
第 2 批 不买
第 3 批 不买
第 4 批 不买
第 5 批 买

展示路径:
第 1 批 买
第 2-4 批 连续不买 ×3
第 5 批 买
```

购买批次不会压缩，因为需要展开查看每个礼包的触发点、价格、CE、价值和内容物。
