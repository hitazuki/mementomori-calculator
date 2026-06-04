export default {
  // Common
  appTitle: "MementoMori 各種計算機",
  appDesc:
    "MementoMori 多維傷害計算與視覺化分析：穿透掃描、熱力圖、多方案對比、拉表匯出",
  appName: "MementoMori",
  appSub: "各種計算機",

  // Navigation
  navCalc: "單體計算",
  navSweep: "單變量收益掃描",
  navHeatmap: "雙變數熱力圖",
  navCompare: "方案對比",
  navTable: "拉表匯出",

  formula: "公式:",
  propPen: "比例穿透",

  // Views & Headers
  calcTitle: "🎯 單體傷害計算器",
  calcDesc: "模擬真實的雙路防禦（防禦力與物魔防）獨立計算減傷機制。",
  calcFormulaBtn: "計算公式說明",

  // Modal Formula Details
  formulaModalTitle: "詳細計算原理與公式",
  formulaModalP1:
    "遊戲的傷害計算採用雙路防禦（防禦力DEF與物魔防禦PM.DEF）獨立計算減傷，最終相乘的方式。各路破防公式的結構一致，均受對應定數（受等級影響）和貫通值的影響。",
  formulaModalH1: "1. 符號說明 (參數定義)",
  formulaModalH2: "2. 基礎計算",
  formulaModalH3: "3. 防禦路計算",
  formulaModalH4: "4. 物魔路計算",
  formulaModalH5: "5. 最終傷害",
  formulaModalNote:
    "註：降防/加防（防禦加成%）會直接作用於目標的面板防禦力，在此基礎上再進行貫通計算。公式結構來源於 doc/damage/excel_formulas.txt 中的理論拆解。",
  formulaModalTargetPmDef: "目標物魔防禦力",
  formulaModalEleTrigger: "觸發時為1，否則為0",
  formulaModalBdmgDesc: "最終增傷係數 (包含增傷與剋制)",
  formulaModalRdefDesc: "防禦路傷害通過率 / 物魔路傷害通過率",
  formulaModalRtotalDesc: "綜合傷害通過率",

  sweepTitle: "📈 單變數收益掃描",
  sweepDesc:
    "指定單一變量的變化範圍，掃描並生成相應的收益曲線（支持切換不同的評估指標，如最終傷害、減傷率等）。",
  heatmapTitle: "🔥 雙變數熱力圖",
  heatmapDesc:
    "展示不同防禦力與不同防禦貫通交會點的綜合減傷率(綜合防禦通過率)，更直觀地找到最佳破防閾值。",
  compareTitle: "⚖ 多方案對比",
  compareDesc:
    "配置多個不同的屬性方案（如「高攻低穿」vs「低攻高穿」），橫向對比最終傷害與通過率。",
  tableTitle: "📋 貫通收益拉表匯出",
  tableDesc:
    "設定固定參數，生成不同貫通值的詳細收益表格。支援複製為CSV或直接複製表格貼上到Excel。",

  // Form Sections
  atkParams: "⚔ 攻擊方參數",
  defParams: "🛡 防守方參數",
  defPresetLabel: "防守方等級預設 (影響防禦定數)",
  manualAdjust: "手動調整係數",

  // Form Fields
  baseAtk: "面板攻擊力",
  skillCoeff: "技能倍率",
  atkType: "攻擊類型",
  typePhys: "物理攻擊",
  typeMag: "魔法攻擊",
  pen: "防禦貫通",
  pmPen: "物魔防禦貫通",
  dmgBonus: "增傷加成",
  critMult: "爆擊倍率",
  eleAdvantage: "屬性剋制",
  cPenDefLabel: "貫通定數 (受攻擊方等級影響，可手動微調)",
  cDefDefLabel: "防禦定數 (受防守方等級影響，可手動微調)",
  cPenConst: "C_pen 定數",
  cPmPenConst: "C_pmpen 定數",

  targetDef: "目標防禦力",
  targetPhysDef: "目標物理防禦力",
  targetMagDef: "目標魔法防禦力",
  targetPmDef: "目標物魔防禦力",
  defBonus: "防禦加成",
  pmDefBonus: "物魔防禦加成",
  cDefConst: "C_def 定數",
  cPmDefConst: "C_pmdef 定數",

  // Stats
  finalDmg: "最終傷害",
  overallPenRate: "綜合穿透率 (傷害通過率)",
  defMitRate: "防禦路減傷率",
  pmMitRate: "物魔路減傷率",
  rawDmg: "技能原始傷害",
  totalMitRate: "綜合防禦減傷率",
  effDef: "有效防禦",
  effPmDef: "有效物魔防禦",

  // Breakdown
  dmgBreakdown: "📊 傷害拆解",
  addBonus: "+ 增傷",
  mulDefPass: "× 防禦通過",
  mulPmPass: "× 物魔防禦通過",
  mulCrit: "× 爆擊",

  // Quick Table
  quickTableTitle: "📐 快查：防禦貫通 × 目標防禦力",
  quickTablePmTitle: "📐 快查：物魔貫通 × 目標物魔防",
  quickTableDesc:
    "固定當前係數和另一路貫通，僅掃描單路“貫通 vs 目標防禦”的減傷率。",
  quickTableHeadX: "防禦貫通↓ / 目標防禦力→",
  quickTableHeadXPm: "物魔貫通↓ / 目標物魔防→",

  // Sweep Chart
  xPen: "防禦貫通",
  scanRange: "掃描範圍",
  maxVal: "最大值",
  minVar: "最小 {var}",
  maxVar: "最大 {var}",
  stepSpan: "步長",

  // Heatmap Chart
  hmAxisConfig: "座標軸設定",
  xAxisConfig: "X軸變數",
  yAxisConfig: "Y軸變數",
  hmFixedParams: "固定參數 (全域常數)",

  // Compare Panel
  addBuild: "+ 添加方案",
  addBench: "+ 添加檔位",
  buildNamePrefix: "方案 ",
  benchNamePrefix: "防禦 ",
  buildName: "方案名稱",
  benchName: "基準名稱",

  // Table Export
  copyCSV: "複製 CSV",
  copied: "已複製到剪貼簿！",
  exportVariables: "📐 變數設定",
  exportXAxis: "X 軸",
  exportYAxis: "Y 軸",
  exportXValues: "X 軸取值",
  exportYValues: "Y 軸取值",
  exportCommaSeparated: "(逗號分隔)",
  exportBuildsConfig: "⚙ 方案設定",
  exportResetDefault: "恢復預設",

  // Presets & Levels
  atkLevel: "攻擊方等級",
  defLevel: "防守方等級",

  scenarioPveEarly: "模板1",
  scenarioPveMid: "模板2",
  scenarioGuildBoss: "公會戰 Boss",

  // Mysterium Panel
  navGroupMysterium: "📂 秘儀系統",
  navMysterium: "✨ 秘儀性價比",
  navGroupDamage: "📂 傷害計算",
  mysteriumTitle: "🔮 秘儀性價比分析",
  mysteriumDesc:
    "基於不同的算法與動態權重，評估抽取限定角色以點亮秘儀組合的最優解。",
  ui_tab_chars: "角色抽取推薦",
  ui_tab_colls: "秘儀套裝排行",
  ui_collection: "秘儀組合",
  ui_weight_title: "評分權重設置",
  ui_weight_desc:
    "設置您認為1個基準單位的屬性價值多少分。修改後將自動重新計算所有方案的性價比。",
  ui_rank: "排名",
  ui_characters: "方案角色",
  ui_cost: "成本",
  ui_score: "總價值",
  ui_ce: "性價比",
  ui_marginal_ce: "邊際CE",
  ui_bottleneck: "前置方案",
  ui_algo1: "獨立分攤法",
  ui_algo2: "成套綁定法",
  ui_algo3: "方案枚舉法 (推薦)",
  ui_algo1_desc:
    "💡 <b>評估單體角色價值</b>。將秘儀套裝的總得分平均分攤給所需的所有角色。如果一個角色屬於多個套裝，其得分會累加。適合決定「單獨抽取某個角色」的性價比。",
  ui_algo2_desc:
    "💡 <b>評估完整套裝性價比</b>。將秘儀套裝視為一個不可分割的整體，直接計算湊齊該套裝內所有需求角色的總成本與總收益。適合「不抽則已，一抽抽一套」的規劃。",
  ui_algo3_desc:
    "💡 <b>尋找全局最優解</b>。窮舉所有可能的角色抽取組合，智能計算多套秘儀之間的角色重疊紅利，為您推導出性價比最高的整體抽取路線。",
  ui_marginal_ce: "邊際性價比",
  ui_fixed: "(固定)",
  ui_percent: "(百分比)",
  ui_growth: "(成長)",
  ui_details: "詳情",
  grp_base: "基礎基建",
  grp_stats: "四大基礎屬性",
  grp_core: "核心攻防",
  grp_pen: "破甲穿透",
  grp_crit: "暴擊體系",
  grp_hit: "命中與閃避",
  grp_debuff: "異常狀態",
  grp_special: "特殊機制",
  appLevelCap: "等級上限",

  scenarioDescPveEarly: "防禦5M，物魔防5M，基礎穿透11950",
  scenarioDescPveMid: "防禦10M，物魔防10M，較高定數要求",
  scenarioDescPvpMage: "防禦低，物魔防低，無需高穿透",
  scenarioDescPvpTank: "防禦超高，極限穿透需求",
  scenarioDescGuildBoss: "防禦2M，吃破甲，傷害最大化",
  navTornado: "邊際收益分析",
  tornadoTitle: "🌪 邊際收益分析",
  tornadoDesc:
    "橫向對比各項屬性增量（或減量）對最終傷害產生的百分比影響，尋找性價比最高的升級方案。",
  tabTornado: "🌪 龍捲風圖",
  tabWaterfall: "🌊 瀑布圖",
  baseState: "⚙ 基礎面板",
  upgradesToTest: "📈 屬性增量分析",
  increment: "增量",
  baseDmgDisplay: "當前基準傷害:",
  basePassRateDisplay: "基準通過率:",
  tornadoInstTitle: "💡 龍捲風圖說明",
  tornadoInstDesc:
    "龍捲風圖用於**橫向對比互斥的升級方案**。系統會分別將左側各項「增量」**單獨**疊加到基礎面板上計算收益。<br/>排在最上方且高亮為金黃色的柱子，代表在當前環境下面板收益率（提升百分比）最高的最優解。",
  waterfallInstTitle: "💡 瀑布圖說明",
  waterfallInstDesc:
    "瀑布圖展示了在**基礎面板疊加左側增量**後，傷害是如何一步步被放大的。<br/>綠色柱代表乘區收益，紅色柱代表傷害丟失。透過紅色柱的高度，您可以直觀判斷哪一條防禦路吃掉了最多的傷害。",
  tooltipFinalDmg: "最終傷害:",
  tooltipIncrease: "提升幅度:",
  wfCatBase: "基礎理論傷害",
  wfCatAtkBonus: "攻擊力加成",
  wfCatDmgBonus: "增傷加成",
  wfCatCrit: "爆擊倍率放大",
  wfCatDefMit: "目標防禦折損",
  wfCatPmDefMit: "物魔防折損",
  wfCatFinal: "最終落地傷害",
  atkBonus: "攻擊力加成",
  basePanelStats: "基礎面板參數",
  baseCoefficients: "其他基礎面板參數 (展開/折疊)",
};
