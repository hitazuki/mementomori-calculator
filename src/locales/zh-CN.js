export default {
  // Common
  appTitle: "MementoMori 各种计算器",
  appDesc:
    "MementoMori 多维伤害计算与可视化分析：穿透扫描、热力图、多方案对比、拉表导出",
  appName: "MementoMori",
  appSub: "各种计算器",

  // Navigation
  navCalc: "单体计算",
  navSweep: "单变量收益扫描",
  navHeatmap: "双变量热力图",
  navCompare: "方案对比",
  navTable: "拉表导出",

  formula: "公式:",
  propPen: "比例穿透",

  // Views & Headers
  calcTitle: "🎯 单体伤害计算器",
  calcDesc: "模拟真实的双路防御（防御力与物魔防）独立计算减伤机制。",
  calcFormulaBtn: "计算公式说明",

  // Modal Formula Details
  formulaModalTitle: "详细计算原理与公式",
  formulaModalP1:
    "游戏的伤害计算采用双路防御（防御力DEF与物魔防御PM.DEF）独立计算减伤，最终相乘的方式。各路破防公式的结构一致，均受对应定数（受等级影响）和贯通值的影响。",
  formulaModalH1: "1. 符号说明 (参数定义)",
  formulaModalH2: "2. 基础计算",
  formulaModalH3: "3. 防御路计算",
  formulaModalH4: "4. 物魔路计算",
  formulaModalH5: "5. 最终伤害",
  formulaModalNote:
    "注：降防/加防（防御加成%）会直接作用于目标的面板防御力，在此基础上再进行贯通计算。公式结构来源于 doc/damage/excel_formulas.txt 中的理论拆解。",
  formulaModalTargetPmDef: "目标物魔防御力",
  formulaModalEleTrigger: "触发时为1，否则为0",
  formulaModalBdmgDesc: "最终增伤系数 (包含增伤与克制)",
  formulaModalRdefDesc: "防御路伤害通过率 / 物魔路伤害通过率",
  formulaModalRtotalDesc: "综合伤害通过率",

  sweepTitle: "📈 单变量收益扫描",
  sweepDesc:
    "指定单一变量的变化范围，扫描并生成相应的收益曲线（支持切换不同的评估指标，如最终伤害、减伤率等）。",
  heatmapTitle: "🔥 双变量热力图",
  heatmapDesc:
    "展示不同防御力与不同防御贯通交会点的综合减伤率(综合防御通过率)，更直观地找到最优破防阈值。",
  compareTitle: "⚖ 多方案对比",
  compareDesc:
    "配置多个不同的属性方案（如「高攻低穿」vs「低攻高穿」），横向对比最终伤害与通过率。",
  tableTitle: "📋 贯通收益拉表导出",
  tableDesc:
    "设定固定参数，生成不同贯通值的详细收益表格。支持复制为CSV或直接复制表格粘贴到Excel。",

  // Form Sections
  atkParams: "⚔ 攻击方参数",
  defParams: "🛡 防守方参数",
  defPresetLabel: "防守方等级预设 (影响防御定数)",
  manualAdjust: "手动调整系数",

  // Form Fields
  baseAtk: "面板攻击力",
  skillCoeff: "技能倍率",
  atkType: "攻击类型",
  typePhys: "物理攻击",
  typeMag: "魔法攻击",
  pen: "防御贯通",
  pmPen: "物魔防御贯通",
  dmgBonus: "增伤加成",
  critMult: "爆击倍率",
  eleAdvantage: "属性克制",
  cPenDefLabel: "贯通定数 (受攻击方等级影响，可手动微调)",
  cDefDefLabel: "防御定数 (受防守方等级影响，可手动微调)",
  cPenConst: "C_pen 定数",
  cPmPenConst: "C_pmpen 定数",

  targetDef: "目标防御力",
  targetPhysDef: "目标物理防御力",
  targetMagDef: "目标魔法防御力",
  targetPmDef: "目标物魔防御力",
  defBonus: "防御加成",
  pmDefBonus: "物魔防御加成",
  cDefConst: "C_def 定数",
  cPmDefConst: "C_pmdef 定数",

  // Stats
  finalDmg: "最终伤害",
  overallPenRate: "综合穿透率 (伤害通过率)",
  defMitRate: "防御路减伤率",
  pmMitRate: "物魔路减伤率",
  rawDmg: "技能原始伤害",
  totalMitRate: "综合防御减伤率",
  effDef: "有效防御",
  effPmDef: "有效物魔防御",

  // Breakdown
  dmgBreakdown: "📊 伤害拆解",
  addBonus: "+ 增伤",
  mulDefPass: "× 防御通过",
  mulPmPass: "× 物魔防御通过",
  mulCrit: "× 爆击",

  // Quick Table
  quickTableTitle: "📐 快查：防御贯通 × 目标防御力",
  quickTablePmTitle: "📐 快查：物魔贯通 × 目标物魔防",
  quickTableDesc:
    "固定当前系数和另一路贯通，仅扫描单路“贯通 vs 目标防御” 的减伤率。",
  quickTableHeadX: "防御贯通↓ / 目标防御力→",
  quickTableHeadXPm: "物魔贯通↓ / 目标物魔防→",

  // Sweep Chart
  xPen: "防御贯通",
  scanRange: "扫描范围",
  maxVal: "最大值",
  minVar: "最小 {var}",
  maxVar: "最大 {var}",
  stepSpan: "步长",

  // Heatmap Chart
  hmAxisConfig: "坐标轴配置",
  xAxisConfig: "X轴变量",
  yAxisConfig: "Y轴变量",
  hmFixedParams: "固定参数 (全局常量)",

  // Compare Panel
  addBuild: "+ 添加方案",
  addBench: "+ 添加档位",
  buildNamePrefix: "方案 ",
  benchNamePrefix: "防御 ",
  buildName: "方案名称",
  benchName: "基准名称",

  // Table Export
  copyCSV: "复制 CSV",
  copied: "已复制到剪贴板！",
  exportVariables: "📐 变量设置",
  exportXAxis: "X 轴",
  exportYAxis: "Y 轴",
  exportXValues: "X 轴取值",
  exportYValues: "Y 轴取值",
  exportCommaSeparated: "(逗号分隔)",
  exportBuildsConfig: "⚙ 方案配置",
  exportResetDefault: "恢复默认",

  // Presets & Levels
  atkLevel: "攻击方等级",
  defLevel: "防守方等级",

  scenarioPveEarly: "模板1",
  scenarioPveMid: "模板2",
  scenarioGuildBoss: "公会战 Boss",

  navGroupMysterium: "📂 秘仪系统",
  navMysterium: "✨ 秘仪性价比",
  navGroupDamage: "📂 伤害计算",
  mysteriumTitle: "🔮 秘仪性价比分析",
  mysteriumDesc:
    "基于不同的算法与动态权重，评估抽取限定角色以点亮秘仪组合的最优解。",
  ui_tab_chars: "角色抽取推荐",
  ui_tab_colls: "秘仪套装排行",
  ui_collection: "秘仪组合",
  ui_weight_title: "评分权重设置",
  ui_weight_desc:
    "设置您认为1个基准单位的属性价值多少分。修改后将自动重新计算所有方案的性价比。",
  ui_rank: "排名",
  ui_characters: "方案角色",
  ui_cost: "成本",
  ui_score: "总价值",
  ui_ce: "性价比",
  ui_marginal_ce: "边际CE",
  ui_bottleneck: "前置方案",
  ui_algo1: "独立分摊法",
  ui_algo2: "成套绑定法",
  ui_algo3: "方案枚举法 (推荐)",
  ui_algo1_desc:
    "💡 <b>评估单体角色价值</b>。将秘仪套装的总得分平均分摊给所需的所有角色。如果一个角色属于多个套装，其得分会累加。适合决定“单独抽取某个角色”的性价比。",
  ui_algo2_desc:
    "💡 <b>评估完整套装性价比</b>。将秘仪套装视为一个不可分割的整体，直接计算凑齐该套装内所有需求角色的总成本与总收益。适合“不抽则已，一抽抽一套”的规划。",
  ui_algo3_desc:
    "💡 <b>寻找全局最优解</b>。穷举所有可能的角色抽取组合，智能计算多套秘仪之间的角色重叠红利，为您推导出性价比最高的整体抽取路线。",
  ui_marginal_ce: "边际性价比",
  ui_fixed: "(固定)",
  ui_percent: "(百分比)",
  ui_growth: "(成长)",
  ui_details: "详情",
  grp_base: "基础基建",
  grp_stats: "四大基础属性",
  grp_core: "核心攻防",
  grp_pen: "破甲穿透",
  grp_crit: "暴击体系",
  grp_hit: "命中与闪避",
  grp_debuff: "异常状态",
  grp_special: "特殊机制",
  appLevelCap: "等级上限",

  scenarioDescPveEarly: "防御5M，物魔防5M，基础穿透11950",
  scenarioDescPveMid: "防御10M，物魔防10M，较高定数要求",
  scenarioDescPvpMage: "防御低，物魔防低，无需高穿透",
  scenarioDescPvpTank: "防御超高，极限穿透需求",
  scenarioDescGuildBoss: "防御2M，吃破甲，伤害最大化",
  // Misc
  ui_custom: "(自定义)",
  ui_common: "(通用)",
  ui_max6: "(最多6个)",
  ui_compare: "对比",
  ui_vsBuild1: "与方案1对比 (差值)",
  ui_bar: "柱状图",
  ui_radar: "雷达图",
  ui_table: "数据表",
  navTornado: "边际收益分析",
  tornadoTitle: "🌪 边际收益分析",
  tornadoDesc:
    "横向对比各项属性增量（或减量）对最终伤害产生的百分比影响，寻找性价比最高的升级方案。",
  tabTornado: "🌪 龙卷风图",
  tabWaterfall: "🌊 瀑布图",
  baseState: "⚙ 基础面板",
  upgradesToTest: "📈 属性增量分析",
  increment: "增量",
  baseDmgDisplay: "当前基准伤害:",
  basePassRateDisplay: "基准通过率:",
  tornadoInstTitle: "💡 龙卷风图说明",
  tornadoInstDesc:
    "龙卷风图用于**横向对比互斥的升级方案**。系统会分别将左侧各项“增量”**单独**叠加到基础面板上计算收益。<br/>排在最上方且高亮为金黄色的柱子，代表在当前环境下面板收益率（提升百分比）最高的最优解。",
  waterfallInstTitle: "💡 瀑布图说明",
  waterfallInstDesc:
    "瀑布图展示了在**基础面板叠加左侧增量**后，伤害是如何一步步被放大的。<br/>绿色柱代表乘区收益，红色柱代表伤害丢失。通过红色柱的高度，您可以直观判断哪一条防御路吃掉了最多的伤害。",
  tooltipFinalDmg: "最终伤害:",
  tooltipIncrease: "提升幅度:",
  wfCatBase: "基础理论伤害",
  wfCatAtkBonus: "攻击力加成",
  wfCatDmgBonus: "增伤加成",
  wfCatCrit: "暴击倍率放大",
  wfCatDefMit: "目标防御折损",
  wfCatPmDefMit: "物魔防折损",
  wfCatFinal: "最终落地伤害",
  atkBonus: "攻击加成",
  basePanelStats: "基础面板参数",
  baseCoefficients: "其他基础面板参数 (展开/折叠)",
};
