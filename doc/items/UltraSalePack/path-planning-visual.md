# 限时组合包路径算法直观版

本文用流程图和伪代码展示购买路径计算流程。完整实现设计见 `implementation-design.md`。

## 总览流程

```mermaid
flowchart TD
  A["用户输入<br/>主预算 / 补累充比例 / 当前档位 / 各触发源范围"] --> B["计算礼包内容价值"]
  B --> C["按来源生成触发机会"]
  C --> D["生成属性塔前沿<br/>单塔独立 cursor / 全属性塔派生门槛"]
  D --> E["建立触发图和 source cursor"]
  E --> F["从当前前沿生成候选批次<br/>拆批 / 合批 / 属性塔拓扑"]
  F --> G["枚举本批动作<br/>不买 / 买价值最高前 N 个"]
  G --> H["更新档位 / 主预算 / 累充进度"]
  H --> I["时间分支<br/>下一批同日 / 下一批跨 0 点"]
  I --> J["跨日前补累充分支<br/>补 / 不补"]
  J --> K["剪枝保留代表状态"]
  K --> L{"还有可达触发节点?"}
  L -- "是" --> F
  L -- "否" --> M["输出方案<br/>价值最优 / 只买小包 / 冲最大包"]
```

## 批次编排流程

```mermaid
flowchart TD
  A["当前 source cursors"] --> B["找每个来源的当前可达节点"]
  B --> C["生成单节点拆批候选"]
  B --> D["生成同来源前缀候选<br/>不超过 2小时内最多触发"]
  B --> E["生成跨来源合批候选"]
  B --> F["生成属性塔候选<br/>同层单塔 / 下一层单塔 / 全属性塔"]
  C --> G["候选批次集合"]
  D --> G
  E --> G
  F --> G
  G --> H["按压力 / 潜在价值剪枝"]
```

未进入当前候选批次的触发节点不算已触发，不推进 cursor，可以留到后续档位变化后再触发。

## 状态转移流程

```mermaid
flowchart TD
  A["状态<br/>档位 / cursors / 主预算花费 / 补包花费 / 累充日进度"] --> B["选择候选批次"]
  B --> C["生成购买动作"]
  C --> D{"限时包花费是否超主预算?"}
  D -- "是" --> E["丢弃动作"]
  D -- "否" --> F["推进 cursor<br/>本批节点已触发"]
  F --> G{"本批是否买限时包?"}
  G -- "是" --> H["下一批升档<br/>计算实际累充赠钻"]
  G -- "否" --> I["等待超时<br/>下一批降档"]
  H --> K["生成候选状态"]
  I --> K
  K --> L["批次边界时间分支"]
  L --> L1["继续同日<br/>不生成补包候选"]
  L --> L2["准备跨 0 点重置"]
  L2 --> J{"是否接近下一累充档<br/>且浮动预算可补足?"}
  J -- "是" --> J1["跨日前补<br/>更新补包花费 / 累充进度 / 价值"]
  J -- "否" --> J2["不补直接跨日"]
  J1 --> M["重置到下一累充日"]
  J2 --> M
  L1 --> M2["保留当前累充日"]
  M --> N["Pareto / Beam 剪枝"]
  M2 --> N
```

每日累充重置只发生在两个全局批次之间。同一批内的限时包和补包都按同一个累充日计算。

属性塔使用单塔独立前沿。同一层级内的不同属性塔分批触发不强制重置；某个单塔进入下一层级，或进入全属性塔后续层级时，才会在批次边界强制重置累充日。若 `blue250` 已处理而 `red/green/yellow250` 未处理，下一批前沿同时包含 `red/green/yellow250` 和 `blue300`，只有实际触发 `blue300` 的候选需要强制重置。

## 核心伪代码

```text
function buildPlans(packs, settings):
  packsWithValue = calculatePackCE(packs)
  context = buildPlanningContext(packsWithValue, settings)

  bestPlan = searchBestValuePlan(context)
  smallPackPlan = simulatePolicy(context, "smallPack")
  maxPackPlan = simulatePolicy(context, "maxPack")

  return [
    bestPlan,
    smallPackPlan,
    maxPackPlan
  ]
```

```text
function searchBestValuePlan(context):
  states = [emptyState(context)]

  while states has unfinished trigger cursors:
    nextStates = []

    for state in states:
      batches = generateBatchCandidates(state.sourceCursors)

      for batch in batches:
        actions = generatePurchaseActions(batch, state.tierIndex)

        for action in actions:
          if action.limitedCost exceeds main budget:
            continue

          candidate = applyBatchAndPurchase(state, batch, action)

          nextStates.add(continueSameRechargeDay(candidate))

          if shouldKeepNextDayBranch(candidate):
            for branch in expandBeforeRechargeReset(candidate):
              nextStates.add(branch)

    states = prune(nextStates)

  return best ranked state
```

## 补累充流程

```mermaid
flowchart TD
  A["状态准备跨 0 点重置"] --> B["找到当前累充日最后一个已买限时包批次"]
  B --> B2["读取该批购买后的累充进度"]
  B2 --> C{"是否存在下一累充档?"}
  C -- "否" --> D["不补"]
  C -- "是" --> E{"浮动预算内能否小额补足?"}
  E -- "否" --> D
  E -- "是" --> F["生成两个候选"]
  F --> G["跨日前补<br/>选择达到下一档的最低花费组合"]
  F --> H["不补直接跨日<br/>保留浮动预算给后续累充日"]
  G --> I["更新状态<br/>补包花费 / 累充进度 / 累充价值"]
  I --> J["重置到下一累充日"]
  H --> J
  D --> J
```

补包只使用非首次常驻钻石组合包。补包不会触发限时包，也不会影响限时包升降档。继续同一累充日的分支不会生成补包候选。
