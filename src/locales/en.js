export default {
  // Common
  appTitle: "MementoMori Calculators",
  appDesc:
    "MementoMori calculators for dual-path damage, curve scans, heatmaps, build comparison, table export, pack CE, and Mysterium scoring.",
  appName: "MementoMori",
  appSub: "Calculators",

  // Navigation
  navGroupDamage: "Damage Calc",
  navCalc: "Single Target",
  navSweep: "Single Variable Curve Sweep",
  navHeatmap: "Bi-variable Heatmap",
  navCompare: "Compare",
  navTable: "Data Table",

  formula: "Formula:",
  propPen: "Proportional PEN",

  // Views & Headers
  calcTitle: "🎯 Single Target Calculator",
  pveDataEntry: "PVE Data Wiki",
  calcDesc:
    "Simulates the real dual-layer defense (DEF and P/M.DEF) independent mitigation mechanics.",
  calcFormulaBtn: "Formulas",

  // Modal Formula Details
  formulaModalTitle: "Calculation Principles & Formulas",
  formulaModalP1:
    "Damage calculation employs independent damage reduction across two defensive layers (DEF and P/M.DEF), multiplying their pass rates for the final result. Both penetration formulas share the same structure, scaling with corresponding level-based constants and penetration values.",
  formulaModalH1: "1. Notation & Parameters",
  formulaModalH2: "2. Basic Calculation",
  formulaModalH3: "3. DEF Layer Calculation",
  formulaModalH4: "4. P/M.DEF Layer Calculation",
  formulaModalH5: "5. Final Damage",
  formulaModalNote:
    "Note: DEF Down/Up (DEF Bonus %) applies directly to target base DEF before penetration is calculated. Formula architecture is derived from doc/damage/excel_formulas.txt.",

  formulaModalTargetPmDef: "Target P/M.DEF",
  formulaModalEleTrigger: "1 if triggered, else 0",
  formulaModalBdmgDesc: "Final DMG Multiplier (Includes bonus & elemental adv)",
  formulaModalRdefDesc: "DEF Pass Rate / P/M.DEF Pass Rate",
  formulaModalRtotalDesc: "Overall Pass Rate",

  sweepTitle: "📈 Single Variable Curve Sweep",
  sweepDesc:
    "Scan a single variable across a range and plot the yield curve (supports evaluating Final Damage, Penetration Rate, etc.).",
  heatmapTitle: "🔥 Bi-variable Heatmap",
  heatmapDesc:
    "Configure custom variables for X and Y axes to display visual intersections of pass rate, final damage, or damage reduction in a 2D heatmap.",
  compareTitle: "⚖ Compare Builds",
  compareDesc:
    'Configure multiple stats builds (e.g., "High ATK, Low PEN" vs "Low ATK, High PEN") and compare final damage or pass rate.',
  tableTitle: "📋 Cross-tab Data Export",
  tableDesc:
    "Configure custom variables for X and Y axes to generate multi-build comparison tables. Supports CSV export or copying directly to Excel.",

  // Form Sections
  atkParams: "⚔ Attacker Stats",
  defParams: "🛡 Defender Stats",
  defPresetLabel: "Defender Level Preset (Affects C_def/C_pmdef)",
  manualAdjust: "Manual Adjust",

  // Form Fields
  baseAtk: "Base ATK",
  skillCoeff: "Skill Multiplier",
  atkType: "Attack Type",
  typePhys: "Physical",
  typeMag: "Magical",
  pen: "DEF Break",
  pmPen: "P/M.DEF Break",
  dmgBonus: "Damage Bonus",
  critMult: "Crit Multiplier",
  eleAdvantage: "Elemental Advantage",
  cPenDefLabel: "PEN Constants (Influenced by attacker level)",
  cDefDefLabel: "DEF Constants (Influenced by defender level)",
  cPenConst: "C_pen",
  cPmPenConst: "C_pmpen",

  targetDef: "Target DEF",
  targetPhysDef: "Target P.DEF",
  targetMagDef: "Target M.DEF",
  targetPmDef: "Target P/M.DEF",
  defBonus: "DEF Bonus",
  pmDefBonus: "P.DEF/M.DEF Bonus",
  cDefConst: "C_def",
  cPmDefConst: "C_pmdef",

  // Stats
  finalDmg: "Final Damage",
  overallPenRate: "Overall Pass Rate",
  defMitRate: "DEF Mitigation Rate",
  pmMitRate: "P/M.DEF Mitigation Rate",
  rawDmg: "Raw Skill Damage",
  totalMitRate: "Total Mitigation Rate",
  effDef: "Effective DEF",
  effPmDef: "Effective P/M.DEF",

  // Breakdown
  dmgBreakdown: "📊 Damage Breakdown",
  addBonus: "+ DMG Bonus",
  mulDefPass: "× DEF Pass",
  mulPmPass: "× P/M.DEF Pass",
  mulCrit: "× Crit",

  // Quick Table
  quickTableTitle: "📐 Quick Look: PEN × Target DEF",
  quickTablePmTitle: "📐 Quick Look: P/M.PEN × Target P/M.DEF",
  quickTableDesc:
    'Fixes current multipliers and scans single route "PEN vs DEF" mitigation rates.',
  quickTableHeadX: "PEN↓ / Target DEF→",
  quickTableHeadXPm: "P/M.PEN↓ / Target P/M.DEF→",

  // Sweep Chart
  xPen: "DEF Break",
  scanRange: "Scan Range",
  maxVal: "Max",
  minVar: "Min {var}",
  maxVar: "Max {var}",
  stepSpan: "Step Span",

  // Heatmap Chart
  hmAxisConfig: "Axis Configuration",
  xAxisConfig: "X-Axis Variable",
  yAxisConfig: "Y-Axis Variable",

  // Compare Panel
  addBuild: "+ Add Build",
  addBench: "+ Add Target",
  importCurrentParams: "Import Current Params",
  buildNamePrefix: "Build ",
  benchNamePrefix: "Target ",
  buildName: "Build Name",
  benchName: "Target Name",

  // Table Export
  copyCSV: "Copy CSV",
  copied: "Copied to clipboard!",
  exportVariables: "📐 Variables",
  exportXAxis: "X Axis",
  exportYAxis: "Y Axis",
  exportXValues: "X Values",
  exportYValues: "Y Values",
  exportCommaSeparated: "(comma separated)",
  exportBuildsConfig: "⚙ Builds Configuration",
  exportResetDefault: "Reset to Default",
  exportTableTitle: "Table Title",
  defaultTableTitle: "{y} × {x} Comparison Table",

  // Presets & Levels
  atkLevel: "Attacker Level",
  defLevel: "Defender Level",

  scenarioPveEarly: "Template 1",
  scenarioPveMid: "Template 2",

  // Mysterium Panel
  navGroupMysterium: "Mysterium System",
  navMysterium: "Mysterium CE",
  mysteriumTitle: "🔮 Mysterium Cost-Efficiency",
  mysteriumDesc:
    "Evaluate the optimal limited character gacha plans for Mysterium collections using dynamic weights.",
  ui_tab_chars: "Character Gacha",
  ui_tab_colls: "Mysterium Sets",
  ui_collection: "Collection Name",
  ui_weight_title: "Scoring Weights",
  ui_weight_desc:
    "Set the score for 1 base unit of each attribute. Changes will recalculate all CE automatically.",
  ui_rank: "Rank",
  ui_characters: "Characters",
  ui_cost: "Cost",
  ui_score: "Score",
  ui_ce: "CE",
  ui_marginal_ce: "Marginal CE",
  ui_bottleneck: "Prerequisite Plan",
  ui_algo1: "Independent Sharing",
  ui_algo2: "Set Binding",
  ui_algo3: "Plan Enumeration",
  ui_algo1_desc:
    "💡 <b>Evaluate Single Characters</b>. Distributes collection scores evenly among required characters. Characters in multiple collections accrue scores. Ideal for assessing individual pull value.",
  ui_algo2_desc:
    '💡 <b>Evaluate Full Sets</b>. Treats collections as indivisible units, calculating total cost vs total score for acquiring all required characters. Ideal for "all-or-nothing" collection planning.',
  ui_algo3_desc:
    "💡 <b>Find Global Optimal Paths</b>. Enumerates all possible character combinations to calculate overlapping character bonuses across multiple collections, revealing the ultimate highest-efficiency gacha paths.",
  ui_fixed: "(Fixed)",
  ui_percent: "(Percent)",
  ui_growth: "(Growth)",
  ui_details: "Details",
  grp_base: "Base Infrastructure",
  grp_stats: "Core Stats",
  grp_core: "Combat Core",
  grp_pen: "Armor Penetration",
  grp_crit: "Critical System",
  grp_hit: "Hit & Evasion",
  grp_debuff: "Debuff System",
  grp_special: "Special Mechanics",
  appLevelCap: "Level Cap",

  scenarioDescPveEarly: "5M DEF, 5M P/M.DEF, base PEN 11950",
  scenarioDescPveMid: "10M DEF, 10M P/M.DEF, higher constant req",
  navTornado: "Tornado Chart",
  ui_custom: "(Custom)",
  ui_common: "(Common)",
  ui_max6: "(Max 6)",
  ui_compare: "Compare",
  ui_vsBuild1: "vs Build 1 (Delta)",
  ui_bar: "Bar",
  ui_radar: "Radar",
  ui_table: "Table",
  tornadoTitle: "🌪 Marginal Gain Analysis",
  tornadoDesc:
    "Compare the percentage impact of various attribute increments (or decrements) on final damage to find the most cost-effective upgrade path.",
  tabTornado: "🌪 Tornado Chart",
  tabWaterfall: "🌊 Waterfall Chart",
  upgradesToTest: "📈 Upgrades to test",
  increment: "Increment",
  baseDmgDisplay: "Current Base DMG:",
  basePassRateDisplay: "Base Pass Rate:",
  tornadoInstTitle: "💡 Tornado Chart Instructions",
  tornadoInstDesc:
    'Tornado chart is used to **horizontally compare mutually exclusive upgrade plans**. The system calculates the benefits by applying the "increments" on the left **individually** to the base stats.<br/>The top-most golden bar represents the optimal choice with the highest return rate in the current environment.',
  waterfallInstTitle: "💡 Waterfall Chart Instructions",
  waterfallInstDesc:
    "The Waterfall chart demonstrates how damage is amplified and mitigated step-by-step after **applying the left-side increments to the base stats**.<br/>Green bars represent multiplier gains, and red bars represent damage loss. You can visually identify which defense layer is consuming the most damage.",
  tooltipFinalDmg: "Final Damage:",
  tooltipIncrease: "Increase:",
  wfCatBase: "Base DMG",
  wfCatAtkBonus: "ATK Bonus Gain",
  wfCatDmgBonus: "DMG Bonus Gain",
  wfCatCrit: "Crit Amp",
  wfCatDefMit: "DEF Mitigated",
  wfCatPmDefMit: "PM.DEF Mitigated",
  wfCatFinal: "Actual Damage",
  atkBonus: "ATK Bonus",
  basePanelStats: "Base Panel Stats",
  baseCoefficients: "Other Base Stats (Expand/Collapse)",

  // Tooltips
  tooltipToggleFormula: "Click to toggle formula type",
  tooltipSwitchLight: "Switch to light theme",
  tooltipSwitchDark: "Switch to dark theme",
  tooltipEditTableTitle: "Click to edit table title",

  // Pack Calculator
  navGroupItemSystem: "Item System",
  navPackCalc: "Ultra Sale Pack Search",
  packCalcDesc: "Calculate the cost-efficiency of Ultra Sale Packs based on item scores.",
  packCalcSource: "Data from <a href='https://tamamo.dev/UltraSalePack' target='_blank' style='color:var(--gold);text-decoration:underline;'>tamamo.dev</a>, contents may be inaccurate",
  packFilterTitle: "Filter",
  packFilterCategory: "Category",
  packFilterTower: "Tower",
  packFilterPrice: "Price",
  packFilterContentsOr: "Contains Items (Any)",
  packScoreTitle: "Item Scores",
  packScoreDesc: "Set how many points you think 1 base unit of the item is worth. After modification, it will automatically recalculate the CE of all packs.",
  packResultCount: "{n} Packs Total",
  packColTrigger: "Floor/Rank",
  packColPrice: "Price",
  packColValue: "Value",
  packColItems: "Items",

  navPackCompare: "Pack Value Comparison",
  packCompareDesc: "Compare packs from different sources and contents to find the most cost-effective options.",
  packCompareColName: "Pack Prototype",
  packCompareFilterSource: "Pack Source",
  packCompareAllSources: "All Sources",
  packCompareAndOthers: "{name} (+ {count} others)",
  packCompareFullSources: "Appears in triggers",

  packBadgePermanent: "Perm",
  packBadgeWitch: "Witch",
  packBadgeUltra: "Ultra",
  packBadgeMixed: "Mixed",
  origin_witch_first_four_elements: "Witch's Gift (First-4Elem) - {stage}",
  origin_witch_first_light_dark: "Witch's Gift (First-L/D) - {stage}",
  origin_witch_rerun_four_elements: "Witch's Gift (Rerun-4Elem) - {stage}",
  origin_witch_rerun_light_dark: "Witch's Gift (Rerun-L/D) - {stage}",
  origin_tower_infinite: "Infinite Tower",
  origin_tower_blue: "Azure Tower",
  origin_tower_red: "Crimson Tower",
  origin_tower_green: "Emerald Tower",
  origin_tower_yellow: "Amber Tower",
  origin_tower_unknown: "Tower",
  origin_group_all_towers: "All Attribute Towers Reached",
  origin_group_four_elements: "4-Element Towers",
  origin_rank: "Player Rank",
  origin_quest: "Main Quest",
  origin_unknown: "Unknown",
  sourceTypeUltra: "Ultra Sale Packs",
  sourceTypePermanent: "Permanent Packs",
  sourceTypeWitch: "Witch's Gift",
  ui_all: "All",
};
