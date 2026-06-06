export default {
  // Common
  appTitle: "메멘토모리 각종 계산기",
  appDesc:
    "메멘토모리 다차원 데미지 계산 및 시각화: 방관 스캔, 히트맵, 빌드 비교, 표 출력",
  appName: "메멘토모리",
  appSub: "각종 계산기",

  // Navigation
  navCalc: "단일 계산",
  navSweep: "단일 변수 곡선 스캔",
  navHeatmap: "이변수 히트맵",
  navCompare: "빌드 비교",
  navTable: "표 출력",

  formula: "계산식:",
  propPen: "비율 관통",

  // Views & Headers
  calcTitle: "🎯 단일 대상 데미지 계산기",
  calcDesc:
  pveDataEntry: "PVE 데이터 위키",
    "실제 이중 방어 (방어력 및 물리/마법 방어) 독립 감소 메커니즘을 시뮬레이션합니다.",
  calcFormulaBtn: "계산식 설명",

  // Modal Formula Details
  formulaModalTitle: "상세 계산 원리 및 공식",
  formulaModalP1:
    "데미지 계산은 두 개의 방어 경로(방어력 DEF 및 물리/마법 방어력 PM.DEF)에서 독립적으로 경감률을 계산하고 최종적으로 통과율을 곱하는 방식을 사용합니다. 각 관통 공식의 구조는 동일하며 해당 레벨 상수와 관통 수치의 영향을 받습니다.",
  formulaModalH1: "1. 기호 설명 (매개변수 정의)",
  formulaModalH2: "2. 기본 계산",
  formulaModalH3: "3. 방어 경로 계산",
  formulaModalH4: "4. 물/마방 경로 계산",
  formulaModalH5: "5. 최종 데미지",
  formulaModalNote:
    "참고: 방어력 감소/증가(방어력 보너스%)는 관통이 계산되기 전에 대상의 기본 방어력에 직접 적용됩니다. 공식 구조는 doc/damage/excel_formulas.txt 의 이론적 분석에서 파생되었습니다.",

  formulaModalTargetPmDef: "대상 물/마방",
  formulaModalEleTrigger: "발동 시 1, 아닐 시 0",
  formulaModalBdmgDesc: "최종 데미지 증가 계수 (뎀증 및 속성 포함)",
  formulaModalRdefDesc: "방어 경로 통과율 / 물/마방 경로 통과율",
  formulaModalRtotalDesc: "종합 데미지 통과율",

  sweepTitle: "📈 단일 변수 곡선 스캔",
  sweepDesc:
    "단일 변수의 변화 범위를 지정하여 수익 곡선을 스캔하고 생성합니다 (최종 데미지, 경감률 등의 지표 전환 지원).",
  heatmapTitle: "🔥 이변수 히트맵",
  heatmapDesc:
    "X축과 Y축의 변수를 자유롭게 지정하여 다양한 스탯 교차점에서의 통과율, 최종 데미지 또는 경감률을 2D 히트맵으로 시각화합니다.",
  compareTitle: "⚖ 빌드 비교",
  compareDesc:
    '여러 스탯 빌드("고공격력 저관통" vs "저공격력 고관통")를 설정하고 최종 데미지 및 통과율을 비교합니다.',
  tableTitle: "📋 크로스탭 데이터 표 출력",
  tableDesc:
    "X축과 Y축의 변수와 범위를 자유롭게 지정하여 빌드 비교 표를 생성합니다. CSV 출력 또는 Excel 직접 붙여넣기를 지원합니다.",

  // Form Sections
  atkParams: "⚔ 공격자 스탯",
  defParams: "🛡 방어자 스탯",
  defPresetLabel: "방어자 레벨 프리셋 (방어 상수에 영향)",
  manualAdjust: "수동 조절",

  // Form Fields
  baseAtk: "공격력 (ATK)",
  skillCoeff: "스킬 계수",
  atkType: "공격 타입",
  typePhys: "물리 공격",
  typeMag: "마법 공격",
  pen: "방어 관통",
  pmPen: "물/마방 관통",
  dmgBonus: "데미지 증가",
  critMult: "크리티컬 배율",
  eleAdvantage: "속성 상성",
  cPenDefLabel: "관통 상수 (공격자 레벨에 영향 받음)",
  cDefDefLabel: "방어 상수 (방어자 레벨에 영향 받음)",
  cPenConst: "C_pen 상수",
  cPmPenConst: "C_pmpen 상수",

  targetDef: "대상 방어력",
  targetPhysDef: "대상 물리 방어력",
  targetMagDef: "대상 마법 방어력",
  targetPmDef: "대상 물리/마법 방어력",
  defBonus: "방어력 보너스",
  pmDefBonus: "물리/마법 방어력 보너스",
  cDefConst: "C_def 상수",
  cPmDefConst: "C_pmdef 상수",

  // Stats
  finalDmg: "최종 데미지",
  overallPenRate: "종합 통과율 (데미지율)",
  defMitRate: "방어력 경감률",
  pmMitRate: "물/마방 경감률",
  rawDmg: "스킬 기본 데미지",
  totalMitRate: "종합 방어 경감률",
  effDef: "유효 방어력",
  effPmDef: "유효 물/마방",

  // Breakdown
  dmgBreakdown: "📊 데미지 세부 내역",
  addBonus: "+ 데미지 증가",
  mulDefPass: "× 방어 통과",
  mulPmPass: "× 물/마방 통과",
  mulCrit: "× 크리티컬",

  // Quick Table
  quickTableTitle: "📐 빠른 확인: 방어 관통 × 대상 방어력",
  quickTablePmTitle: "📐 빠른 확인: 물/마방 관통 × 대상 물/마방",
  quickTableDesc:
    '현재 계수와 다른 경로의 관통을 고정하고 단일 경로의 "관통 vs 대상 방어" 경감률만 스캔합니다.',
  quickTableHeadX: "방어 관통↓ / 대상 방어력→",
  quickTableHeadXPm: "물/마방 관통↓ / 대상 물/마방→",

  // Sweep Chart
  xPen: "방어 관통",
  scanRange: "스캔 범위",
  maxVal: "최대값",
  minVar: "최소 {var}",
  maxVar: "최대 {var}",
  stepSpan: "간격",

  // Heatmap Chart
  hmAxisConfig: "축 설정",
  xAxisConfig: "X축 변수",
  yAxisConfig: "Y축 변수",

  // Compare Panel
  addBuild: "+ 빌드 추가",
  addBench: "+ 대상 추가",
  buildNamePrefix: "빌드 ",
  benchNamePrefix: "대상 ",
  buildName: "빌드 이름",
  benchName: "대상 이름",

  // Table Export
  copyCSV: "CSV 복사",
  copied: "클립보드에 복사되었습니다!",
  exportVariables: "📐 변수 설정",
  exportXAxis: "X축",
  exportYAxis: "Y축",
  exportXValues: "X축 값",
  exportYValues: "Y축 값",
  exportCommaSeparated: "(쉼표로 구분)",
  exportBuildsConfig: "⚙ 빌드 설정",
  exportResetDefault: "기본값으로 초기화",
  exportTableTitle: "표 제목",
  defaultTableTitle: "{y} × {x} 대비 표",

  // Presets & Levels
  atkLevel: "공격자 레벨",
  defLevel: "방어자 레벨",

  scenarioPveEarly: "템플릿 1",
  scenarioPveMid: "템플릿 2",

  // Mysterium Panel
  navGroupMysterium: "미스테리움 시스템",
  navMysterium: "미스테리움 가성비",
  navGroupDamage: "데미지 계산",
  mysteriumTitle: "🔮 미스테리움 가성비 분석",
  mysteriumDesc:
    "다양한 알고리즘과 동적 가중치를 기반으로 미스테리움을 해방하기 위한 한정 캐릭터 뽑기 최적해를 평가합니다.",
  ui_tab_chars: "캐릭터 뽑기 추천",
  ui_tab_colls: "미스테리움 세트 순위",
  ui_collection: "미스테리움 이름",
  ui_weight_title: "점수 가중치 설정",
  ui_weight_desc:
    "각 속성의 기본 단위 1당 점수를 설정합니다. 변경 시 모든 플랜의 가성비가 자동으로 다시 계산됩니다.",
  ui_rank: "순위",
  ui_characters: "캐릭터",
  ui_cost: "비용",
  ui_score: "점수",
  ui_ce: "가성비(CE)",
  ui_marginal_ce: "한계 CE",
  ui_bottleneck: "선행 플랜",
  ui_algo1: "독립 분배법",
  ui_algo2: "세트 결합법",
  ui_algo3: "구성 열거법",
  ui_algo1_desc:
    "💡 <b>단일 캐릭터 가치 평가</b>. 미스테리움 세트의 총 점수를 필요 캐릭터에게 균등하게 분배합니다. 여러 세트에 속한 캐릭터는 점수가 누적됩니다. 개별 캐릭터 뽑기 가치를 판단하는 데 적합합니다.",
  ui_algo2_desc:
    '💡 <b>전체 세트 가성비 평가</b>. 미스테리움 세트를 분할할 수 없는 전체로 간주하여 필요 캐릭터를 모두 모으는 총 비용과 총 점수를 계산합니다. "모 아니면 도"식의 세트 계획에 적합합니다.',
  ui_algo3_desc:
    "💡 <b>전체 최적해 탐색</b>. 가능한 모든 캐릭터 조합을 열거하고 여러 세트 간의 캐릭터 중복 보너스를 계산하여 가장 가성비가 높은 전체 뽑기 경로를 도출합니다.",
  ui_fixed: "(고정)",
  ui_percent: "(퍼센트)",
  ui_growth: "(성장)",
  ui_details: "상세",
  grp_base: "기초 인프라",
  grp_stats: "기본 스탯",
  grp_core: "핵심 공방",
  grp_pen: "방어구 관통",
  grp_crit: "치명타 시스템",
  grp_hit: "명중 및 회피",
  grp_debuff: "디버프 상태",
  grp_special: "특수 메커니즘",
  appLevelCap: "레벨 상한",

  scenarioDescPveEarly: "방어 5M, 물마방 5M, 기본 관통 11950",
  scenarioDescPveMid: "방어 10M, 물/마방 10M, 높은 상수 요구",
  navTornado: "한계 이익 분석",
  ui_custom: "(커스텀)",
  ui_common: "(공통)",
  ui_max6: "(최대 6개)",
  ui_compare: "비교",
  ui_vsBuild1: "빌드 1과 비교 (차이)",
  ui_bar: "막대 그래프",
  ui_radar: "레이더 차트",
  ui_table: "데이터 표",
  tornadoTitle: "🌪 한계 이익 분석 (토네이도 차트)",
  tornadoDesc:
    "다양한 속성 증감분이 최종 데미지에 미치는 영향을 퍼센트로 비교하여 가장 효율적인 업그레이드 경로를 찾습니다.",
  tabTornado: "🌪 토네이도 차트",
  tabWaterfall: "🌊 워터폴 차트",
  upgradesToTest: "📈 속성 증분 분석",
  increment: "증분",
  baseDmgDisplay: "현재 기준 데미지:",
  basePassRateDisplay: "기준 통과율:",
  tornadoInstTitle: "💡 토네이도 차트 설명",
  tornadoInstDesc:
    '토네이도 차트는 **배타적인 업그레이드 옵션들을 비교**하는 데 사용됩니다. 시스템은 왼쪽의 "증분"을 기본 스탯에 **개별적으로** 적용하여 이익을 계산합니다.<br/>가장 상단에 금색으로 강조된 막대는 현재 환경에서 가장 높은 수익률(증가율)을 가진 최적의 선택을 나타냅니다.',
  waterfallInstTitle: "💡 워터폴 차트 설명",
  waterfallInstDesc:
    "워터폴 차트는 **기본 스탯에 왼쪽의 증분을 적용**한 후 데미지가 어떻게 단계적으로 증감하는지를 보여줍니다.<br/>초록색 막대는 승수 이익을 나타내고 빨간색 막대는 데미지 손실을 나타냅니다. 빨간색 막대의 높이를 통해 어떤 방어층이 데미지를 가장 많이 흡수하는지 직관적으로 판단할 수 있습니다.",
  tooltipFinalDmg: "최종 데미지:",
  tooltipIncrease: "상승폭:",
  wfCatBase: "기본 이론 데미지",
  wfCatAtkBonus: "공격력 보너스",
  wfCatDmgBonus: "데미지 보너스",
  wfCatCrit: "크리티컬 증폭",
  wfCatDefMit: "방어력 손실",
  wfCatPmDefMit: "물/마방 손실",
  wfCatFinal: "최종 데미지",
  atkBonus: "공격력 보너스",
  basePanelStats: "기본 패널 매개변수",
  baseCoefficients: "기타 기본 매개변수 (접기/펼치기)",

  // Tooltips
  tooltipToggleFormula: "클릭하여 공식 유형 전환",
  tooltipSwitchLight: "라이트 테마로 전환",
  tooltipSwitchDark: "다크 테마로 전환",
  tooltipEditTableTitle: "클릭하여 표 제목 수정",

  navGroupItemSystem: "아이템 시스템",
  navPackCalc: "울트라 세일 팩 검색",
  packCalcDesc: "아이템 점수에 기반하여 울트라 세일 팩의 가성비를 계산합니다.",
  packCalcSource: "데이터 출처: <a href='https://tamamo.dev/UltraSalePack' target='_blank' style='color:var(--gold);text-decoration:underline;'>tamamo.dev</a>, 내용물 오류 가능성 있음",
  packFilterTitle: "필터",
  packFilterCategory: "카테고리",
  packFilterTower: "탑 종류",
  packFilterPrice: "가격",
  packFilterContentsOr: "아이템 포함 (아무거나)",
  packScoreTitle: "아이템 점수",
  packScoreDesc: "1개의 기준 아이템 가치가 몇 점인지 설정합니다. 수정 후 모든 패키지의 가성비가 자동으로 재계산됩니다.",
  packResultCount: "{n}개의 패키지",
  packBadgeWitch: "마녀",
  packBadgeUltra: "한정",
  packBadgeMixed: "혼합",
  packColTrigger: "층/랭크",
  packColPrice: "가격",
  packColValue: "가치",
  packColItems: "내용물",

  origin_witch_first_four_elements: "마녀의 선물 (첫회-4속성) - {stage}",
  origin_witch_first_light_dark: "마녀의 선물 (첫회-천명) - {stage}",
  origin_witch_rerun_four_elements: "마녀의 선물 (복각-4속성) - {stage}",
  origin_witch_rerun_light_dark: "마녀의 선물 (복각-천명) - {stage}",
  origin_tower_infinite: "무궁의 탑",
  origin_tower_blue: "남의 탑",
  origin_tower_red: "홍의 탑",
  origin_tower_green: "취의 탑",
  origin_tower_yellow: "황의 탑",
  origin_tower_unknown: "탑",
  origin_group_all_towers: "모든 속성 탑 도달",
  origin_group_four_elements: "4속성의 탑",
  origin_rank: "플레이어 랭크",
  origin_quest: "메인 퀘스트",
  origin_unknown: "알 수 없음",
  sourceTypeUltra: "울트라 세일 팩",
  sourceTypeWitch: "마녀의 선물",
  ui_all: "전체",

  packCompareDesc: "다양한 획득처와 내용물의 패키지를 비교하여 최고의 가성비 구매 방안을 찾습니다.",
  packCompareColName: "패키지 유형",
  packCompareFilterSource: "패키지 획득처",
  packCompareAllSources: "모든 획득처",
  packCompareAndOthers: "{name} 외 {count} 곳",
  packCompareFullSources: "다음 조건에서 등장",
  navPackCompare: "패키지 모아보기 및 가성비 비교",
};
