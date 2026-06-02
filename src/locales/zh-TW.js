export default {
  // Common
  appTitle: 'MementoMori 傷害計算機',
  appDesc: 'MementoMori 多維傷害計算與視覺化分析：穿透掃描、熱力圖、多方案對比、拉表匯出',
  appName: 'MementoMori',
  appSub: '傷害計算機',

  // Navigation
  navCalc: '單體計算',
  navSweep: '穿透掃描',
  navHeatmap: 'DEF×PEN熱力圖',
  navCompare: '方案對比',
  navTable: '拉表匯出',

  formula: '公式:',
  propPen: '比例穿透',

  // Views & Headers
  calcTitle: '🎯 單體傷害計算機',
  calcDesc: '基於真實公式：effective_DEF = DEF × C_pen / (PEN + C_pen)，傷害率 = C_def / (effective_DEF + C_def)。物理魔法雙路相乘。',
  sweepTitle: '📈 穿透收益掃描',
  sweepDesc: '掃描指定防守方狀態下的「貫通 vs 傷害」曲線。可橫向對比不同防禦目標。',
  heatmapTitle: '🔥 DEF × PEN 熱力圖',
  heatmapDesc: '展示不同防禦力與不同防禦貫通交會點的綜合減傷率(綜合防禦通過率)，更直觀地找到最佳破防閾值。',
  compareTitle: '⚖ 多方案對比',
  compareDesc: '配置多個不同的屬性方案（如「高攻低穿」vs「低攻高穿」），橫向對比最終傷害與通過率。',
  tableTitle: '📋 貫通收益拉表匯出',
  tableDesc: '設定固定參數，生成不同貫通值的詳細收益表格。支援複製為CSV或直接複製表格貼上到Excel。',

  // Form Sections
  atkParams: '⚔ 攻擊方參數',
  defParams: '🛡 防守方參數',
  atkPresetLabel: '攻擊方等級預設 (影響貫通定數)',
  defPresetLabel: '防守方等級預設 (影響防禦定數)',
  manualAdjust: '手動調整係數',

  // Form Fields
  baseAtk: '面板攻擊力',
  skillCoeff: '技能倍率',
  atkType: '攻擊類型',
  typePhys: '物理攻擊 (P.DEF)',
  typeMag: '魔法攻擊 (M.DEF)',
  pen: '防禦貫通',
  pmPen: '物魔防禦貫通',
  dmgBonus: '增傷加成',
  critMult: '爆擊倍率',
  eleAdvantage: '屬性剋制',
  cPenDefLabel: '貫通定數 (受攻擊方等級影響，可手動微調)',
  cDefDefLabel: '防禦定數 (受防守方等級影響，可手動微調)',
  cPenConst: 'C_pen 定數',
  cPmPenConst: 'C_pmpen 定數',
  
  targetDef: '目標防禦力 (DEF)',
  targetPhysDef: '目標物理防禦力',
  targetMagDef: '目標魔法防禦力',
  defBonus: '防禦加成',
  pmDefBonus: '物魔防禦加成',
  cDefConst: 'C_def 定數',
  cPmDefConst: 'C_pmdef 定數',

  // Stats
  finalDmg: '最終傷害',
  overallPenRate: '綜合穿透率 (傷害通過率)',
  defMitRate: '防禦路減傷率',
  pmMitRate: '物魔路減傷率',
  rawDmg: '技能原始傷害',
  totalMitRate: '綜合防禦減傷率',
  effDef: '有效防禦 (防禦路)',
  effPmDef: '有效物魔防禦 (物魔路)',

  // Breakdown
  dmgBreakdown: '📊 傷害拆解',
  addBonus: '+ 增傷',
  mulDefPass: '× 防禦通過',
  mulPmPass: '× 物魔防禦通過',
  mulCrit: '× 爆擊',
  mulFaction: '× 屬性剋制',

  // Quick Table
  quickTableTitle: '📐 快查：防禦貫通 × 目標防禦力',
  quickTableDesc: '固定當前係數和物魔路貫通，僅掃描防禦貫通(DEF Break)',
  quickTableHeadX: '防禦貫通↓/目標防禦→',

  // Sweep Chart
  xPen: '防禦貫通 (PEN)',
  yFinalDmg: '最終傷害',
  scanRange: '掃描範圍',
  minVal: '最小值',
  maxVal: '最大值',
  minVar: '最小 {var}',
  maxVar: '最大 {var}',
  stepSpan: '步長',
  addTargetDef: '+ 添加目標防禦曲線',
  defLine: '防 {def}',
  scanNotice: '更改參數後會自動重新計算並繪製曲線。',

  // Heatmap Chart
  defRange: '防禦力區間',
  defStep: '防禦步長',
  penRange: '貫通區間',
  penStep: '貫通步長',
  genHeatmap: '生成熱力圖',
  heatmapLoading: '計算中...',
  xAxisPen: '防禦貫通 (PEN)',
  yAxisDef: '目標防禦 (DEF)',

  // Compare Panel
  addBuild: '+ 添加方案',
  addBench: '+ 添加檔位',
  buildNamePrefix: '方案 ',
  benchNamePrefix: '防禦 ',
  buildName: '方案名稱',
  buildBaseAtk: '攻擊力',
  buildPen: '貫通',
  buildPmPen: '物魔貫通',
  buildBonus: '增傷',
  benchName: '基準名稱',
  benchDef: '防禦力',
  benchPmDef: '物魔防',
  evalMetric: '評估指標',
  metricFinalDmg: '最終傷害 (數值)',
  metricDmgRate: '綜合通過率 (%)',
  removeTitle: '移除',

  // Table Export
  tableCols: '表格列',
  colPen: '防禦貫通',
  colFinal: '最終傷害',
  colDiff: '傷害提升(絕對值)',
  colRatio: '傷害提升(%)',
  colRate: '通過率',
  colDr1: '防路減傷',
  colDr2: '魔路減傷',
  colEff1: '有效防',
  colEff2: '有效物魔防',
  genTable: '生成數據表',
  copyCSV: '複製 CSV',
  copyTable: '複製 HTML 表格',
  copied: '已複製到剪貼簿！',

  // Presets & Levels
  lv: 'Lv',
  atkLevel: '攻擊方等級',
  defLevel: '防守方等級',

  scenarioPveEarly: 'PvE (20~22章) 5M防',
  scenarioPveMid: 'PvE (23~24章) 10M防',
  scenarioPvpMage: 'PvP (法師對決)',
  scenarioPvpTank: 'PvP (打大肉)',
  scenarioGuildBoss: '公會戰 Boss',
  
  scenarioDescPveEarly: '防禦5M，物魔防5M，基礎穿透11950',
  scenarioDescPveMid: '防禦10M，物魔防10M，較高定數要求',
  scenarioDescPvpMage: '防禦低，物魔防低，無需高穿透',
  scenarioDescPvpTank: '防禦超高，極限穿透需求',
  scenarioDescGuildBoss: '防禦2M，吃破甲，傷害最大化',
}
