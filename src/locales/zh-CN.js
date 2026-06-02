export default {
  // Common
  appTitle: 'MementoMori 伤害计算器',
  appDesc: 'MementoMori 多维伤害计算与可视化分析：穿透扫描、热力图、多方案对比、拉表导出',
  appName: 'MementoMori',
  appSub: '伤害计算器',

  // Navigation
  navCalc: '单体计算',
  navSweep: '穿透扫描',
  navHeatmap: 'DEF×PEN热力图',
  navCompare: '方案对比',
  navTable: '拉表导出',

  formula: '公式:',
  propPen: '比例穿透',

  // Views & Headers
  calcTitle: '🎯 单体伤害计算器',
  calcDesc: '基于真实公式：effective_DEF = DEF × C_pen / (PEN + C_pen)，伤害率 = C_def / (effective_DEF + C_def)。物理魔法双路相乘。',
  sweepTitle: '📈 穿透收益扫描',
  sweepDesc: '扫描指定防守方状态下的「贯通 vs 伤害」曲线。可横向对比不同防御目标。',
  heatmapTitle: '🔥 DEF × PEN 热力图',
  heatmapDesc: '展示不同防御力与不同防御贯通交会点的综合减伤率(综合防御通过率)，更直观地找到最优破防阈值。',
  compareTitle: '⚖ 多方案对比',
  compareDesc: '配置多个不同的属性方案（如「高攻低穿」vs「低攻高穿」），横向对比最终伤害与通过率。',
  tableTitle: '📋 贯通收益拉表导出',
  tableDesc: '设定固定参数，生成不同贯通值的详细收益表格。支持复制为CSV或直接复制表格粘贴到Excel。',

  // Form Sections
  atkParams: '⚔ 攻击方参数',
  defParams: '🛡 防守方参数',
  atkPresetLabel: '攻击方等级预设 (影响贯通定数)',
  defPresetLabel: '防守方等级预设 (影响防御定数)',
  manualAdjust: '手动调整系数',

  // Form Fields
  baseAtk: '面板攻击力',
  skillCoeff: '技能倍率',
  atkType: '攻击类型',
  typePhys: '物理攻击 (P.DEF)',
  typeMag: '魔法攻击 (M.DEF)',
  pen: '防御贯通',
  pmPen: '物魔防御贯通',
  dmgBonus: '增伤加成',
  critMult: '爆击倍率',
  factionBonus: '阵营克制',
  cPenDefLabel: '贯通定数 (受攻击方等级影响，可手动微调)',
  cDefDefLabel: '防御定数 (受防守方等级影响，可手动微调)',
  cPenConst: 'C_pen 定数',
  cPmPenConst: 'C_pmpen 定数',
  
  targetDef: '目标防御力 (DEF)',
  targetPhysDef: '目标物理防御力',
  targetMagDef: '目标魔法防御力',
  defBonus: '防御加成',
  pmDefBonus: '物魔防御加成',
  cDefConst: 'C_def 定数',
  cPmDefConst: 'C_pmdef 定数',

  // Stats
  finalDmg: '最终伤害',
  overallPenRate: '综合穿透率 (伤害通过率)',
  defMitRate: '防御路减伤率',
  pmMitRate: '物魔路减伤率',
  rawDmg: '技能原始伤害',
  totalMitRate: '综合防御减伤率',
  effDef: '有效防御 (防御路)',
  effPmDef: '有效物魔防御 (物魔路)',

  // Breakdown
  dmgBreakdown: '📊 伤害拆解',
  addBonus: '+ 增伤',
  mulDefPass: '× 防御通过',
  mulPmPass: '× 物魔防御通过',
  mulCrit: '× 爆击',
  mulFaction: '× 阵营克制',

  // Quick Table
  quickTableTitle: '📐 快查：防御贯通 × 目标防御力',
  quickTableDesc: '固定当前系数和物魔路贯通，仅扫描防御贯通(DEF Break)',
  quickTableHeadX: '防御贯通↓/目标防御→',

  // Sweep Chart
  xPen: '防御贯通 (PEN)',
  yFinalDmg: '最终伤害',
  scanRange: '扫描范围',
  minVal: '最小值',
  maxVal: '最大值',
  minVar: '最小 {var}',
  maxVar: '最大 {var}',
  stepSpan: '步长',
  addTargetDef: '+ 添加目标防御曲线',
  defLine: '防 {def}',
  scanNotice: '更改参数后会自动重新计算并绘制曲线。',

  // Heatmap Chart
  defRange: '防御力区间',
  defStep: '防御步长',
  penRange: '贯通区间',
  penStep: '贯通步长',
  genHeatmap: '生成热力图',
  heatmapLoading: '计算中...',
  xAxisPen: '防御贯通 (PEN)',
  yAxisDef: '目标防御 (DEF)',

  // Compare Panel
  addBuild: '+ 添加方案',
  addBench: '+ 添加档位',
  buildNamePrefix: '方案 ',
  benchNamePrefix: '防御 ',
  buildName: '方案名称',
  buildBaseAtk: '攻击力',
  buildPen: '贯通',
  buildPmPen: '物魔贯通',
  buildBonus: '增伤',
  benchName: '基准名称',
  benchDef: '防御力',
  benchPmDef: '物魔防',
  evalMetric: '评估指标',
  metricFinalDmg: '最终伤害 (数值)',
  metricDmgRate: '综合通过率 (%)',
  removeTitle: '移除',

  // Table Export
  tableCols: '表格列',
  colPen: '防御贯通',
  colFinal: '最终伤害',
  colDiff: '伤害提升(绝对值)',
  colRatio: '伤害提升(%)',
  colRate: '通过率',
  colDr1: '防路减伤',
  colDr2: '魔路减伤',
  colEff1: '有效防',
  colEff2: '有效物魔防',
  genTable: '生成数据表',
  copyCSV: '复制 CSV',
  copyTable: '复制 HTML 表格',
  copied: '已复制到剪贴板！',

  // Presets & Levels
  lv: 'Lv',
  atkLevel: '攻击方等级',
  defLevel: '防守方等级',

  scenarioPveEarly: 'PvE (20~22章) 5M防',
  scenarioPveMid: 'PvE (23~24章) 10M防',
  scenarioPvpMage: 'PvP (法师对决)',
  scenarioPvpTank: 'PvP (打大肉)',
  scenarioGuildBoss: '公会战 Boss',
  
  scenarioDescPveEarly: '防御5M，物魔防5M，基础穿透11950',
  scenarioDescPveMid: '防御10M，物魔防10M，较高定数要求',
  scenarioDescPvpMage: '防御低，物魔防低，无需高穿透',
  scenarioDescPvpTank: '防御超高，极限穿透需求',
  scenarioDescGuildBoss: '防御2M，吃破甲，伤害最大化',
}
