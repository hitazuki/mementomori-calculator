export default {
  // Common
  appTitle: 'MementoMori Damage Calculator',
  appDesc: 'MementoMori Multidimensional Damage Calc & Visuals: PEN Scan, Heatmap, Compare, Export',
  appName: 'MementoMori',
  appSub: 'Calculator',

  // Navigation
  navCalc: 'Calculator',
  navSweep: 'PEN Scan',
  navHeatmap: 'DEF×PEN Heatmap',
  navCompare: 'Compare Builds',
  navTable: 'Export Table',

  formula: 'Formula:',
  propPen: 'Proportional PEN',

  // Views & Headers
  calcTitle: '🎯 Single Target Calculator',
  calcDesc: 'Formula: effective_DEF = DEF × C_pen / (PEN + C_pen), Dmg Rate = C_def / (effective_DEF + C_def). P.DEF & M.DEF multiplied.',
  sweepTitle: '📈 PEN Yield Scan',
  sweepDesc: 'Scan "PEN vs Damage" curve on a specific target. Compare multiple targets horizontally.',
  heatmapTitle: '🔥 DEF × PEN Heatmap',
  heatmapDesc: 'Shows damage mitigation rate (dmg passing rate) across different DEF and PEN combinations to find the optimal break threshold.',
  compareTitle: '⚖ Compare Builds',
  compareDesc: 'Configure multiple stats builds (e.g., "High ATK, Low PEN" vs "Low ATK, High PEN") and compare final damage or pass rate.',
  tableTitle: '📋 Export Data Table',
  tableDesc: 'Generate a detailed yield table for different PEN values with fixed parameters. Copy as CSV or HTML table.',

  // Form Sections
  atkParams: '⚔ Attacker Stats',
  defParams: '🛡 Defender Stats',
  atkPresetLabel: 'Attacker Level Preset (Affects C_pen/C_pmpen)',
  defPresetLabel: 'Defender Level Preset (Affects C_def/C_pmdef)',
  manualAdjust: 'Manual Adjust',

  // Form Fields
  baseAtk: 'Base ATK',
  skillCoeff: 'Skill Multiplier',
  atkType: 'Attack Type',
  typePhys: 'Physical (P.DEF)',
  typeMag: 'Magical (M.DEF)',
  pen: 'DEF Break (PEN)',
  pmPen: 'P/M.DEF Break',
  dmgBonus: 'Damage Bonus',
  critMult: 'Crit Multiplier',
  eleAdvantage: 'Elemental Advantage',
  cPenDefLabel: 'PEN Constants (Influenced by attacker level)',
  cDefDefLabel: 'DEF Constants (Influenced by defender level)',
  cPenConst: 'C_pen Const',
  cPmPenConst: 'C_pmpen Const',
  
  targetDef: 'Target DEF',
  targetPhysDef: 'Target P.DEF',
  targetMagDef: 'Target M.DEF',
  defBonus: 'DEF Bonus',
  pmDefBonus: 'P.DEF/M.DEF Bonus',
  cDefConst: 'C_def Const',
  cPmDefConst: 'C_pmdef Const',

  // Stats
  finalDmg: 'Final Damage',
  overallPenRate: 'Overall Pass Rate',
  defMitRate: 'DEF Mitigation Rate',
  pmMitRate: 'P/M.DEF Mitigation Rate',
  rawDmg: 'Raw Skill Damage',
  totalMitRate: 'Total Mitigation Rate',
  effDef: 'Effective DEF',
  effPmDef: 'Effective P/M.DEF',

  // Breakdown
  dmgBreakdown: '📊 Damage Breakdown',
  addBonus: '+ DMG Bonus',
  mulDefPass: '× DEF Pass',
  mulPmPass: '× P/M.DEF Pass',
  mulCrit: '× Crit',
  mulFaction: '× Faction Bonus',

  // Quick Table
  quickTableTitle: '📐 Quick Look: PEN × Target DEF',
  quickTableDesc: 'Fix current multiplier and P/M PEN, scan only DEF Break (PEN).',
  quickTableHeadX: 'PEN ↓ / Target DEF →',

  // Sweep Chart
  xPen: 'DEF Break (PEN)',
  yFinalDmg: 'Final DMG',
  scanRange: 'Scan Range',
  minVal: 'Min',
  maxVal: 'Max',
  minVar: 'Min {var}',
  maxVar: 'Max {var}',
  stepSpan: 'Step Span',
  addTargetDef: '+ Add Target DEF Line',
  defLine: '{def} DEF',
  scanNotice: 'Curves will be recalculated and drawn automatically upon parameter changes.',

  // Heatmap Chart
  defRange: 'DEF Range',
  defStep: 'DEF Step',
  penRange: 'PEN Range',
  penStep: 'PEN Step',
  genHeatmap: 'Generate Heatmap',
  heatmapLoading: 'Calculating...',
  xAxisPen: 'DEF Break (PEN)',
  yAxisDef: 'Target DEF',

  // Compare Panel
  addBuild: '+ Add Build',
  addBench: '+ Add Target',
  buildNamePrefix: 'Build ',
  benchNamePrefix: 'Target ',
  buildName: 'Build Name',
  buildBaseAtk: 'ATK',
  buildPen: 'PEN',
  buildPmPen: 'P/M PEN',
  buildBonus: 'Bonus',
  benchName: 'Target Name',
  benchDef: 'DEF',
  benchPmDef: 'P/M DEF',
  evalMetric: 'Eval Metric',
  metricFinalDmg: 'Final Damage (Value)',
  metricDmgRate: 'Pass Rate (%)',
  removeTitle: 'Remove',

  // Table Export
  tableCols: 'Table Columns',
  colPen: 'PEN',
  colFinal: 'Final Damage',
  colDiff: 'Dmg Up (Abs)',
  colRatio: 'Dmg Up (%)',
  colRate: 'Pass Rate',
  colDr1: 'DEF DR',
  colDr2: 'P/M DR',
  colEff1: 'Eff DEF',
  colEff2: 'Eff P/M DEF',
  genTable: 'Generate Table',
  copyCSV: 'Copy CSV',
  copyTable: 'Copy HTML Table',
  copied: 'Copied to clipboard!',

  // Presets & Levels
  lv: 'Lv',
  atkLevel: 'Attacker Level',
  defLevel: 'Defender Level',

  scenarioPveEarly: 'PvE (Ch20~22) 5M DEF',
  scenarioPveMid: 'PvE (Ch23~24) 10M DEF',
  scenarioPvpMage: 'PvP (Mage Duel)',
  scenarioPvpTank: 'PvP (Tank Buster)',
  scenarioGuildBoss: 'Guild Boss',
  
  scenarioDescPveEarly: '5M DEF, 5M P/M.DEF, base PEN 11950',
  scenarioDescPveMid: '10M DEF, 10M P/M.DEF, higher constant req',
  scenarioDescPvpMage: 'Low DEF, Low P/M.DEF, high PEN not needed',
  scenarioDescPvpTank: 'Super high DEF, max PEN required',
  scenarioDescGuildBoss: '2M DEF, DEF debuffed, max dmg focus',
}
