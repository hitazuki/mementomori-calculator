export default {
  // Common
  appTitle: '메멘토모리 데미지 계산기',
  appDesc: '메멘토모리 다차원 데미지 계산 및 시각화: 방관 스캔, 히트맵, 빌드 비교, 표 출력',
  appName: '메멘토모리',
  appSub: '데미지 계산기',

  // Navigation
  navCalc: '단일 계산',
  navSweep: '단일 변수 스캔',
  navHeatmap: 'DEF×PEN 히트맵',
  navCompare: '빌드 비교',
  navTable: '표 출력',

  formula: '계산식:',
  propPen: '비율 관통',

  // Views & Headers
  calcTitle: '🎯 단일 대상 데미지 계산기',
  calcDesc: '공식: effective_DEF = DEF × C_pen / (PEN + C_pen), 데미지 비율 = C_def / (effective_DEF + C_def). 물리 및 마법 방어 적용.',
  sweepTitle: '📈 단일 변수 스캔',
  sweepDesc: '단일 변수의 변화 범위를 지정하여 수익 곡선을 스캔하고 생성합니다 (최종 데미지, 경감률 등의 지표 전환 지원).',
  heatmapTitle: '🔥 DEF × PEN 히트맵',
  heatmapDesc: '서로 다른 방어력과 방어 관통의 교차점에서의 종합 통과율을 보여주어 최적의 관통 임계점을 찾습니다.',
  compareTitle: '⚖ 빌드 비교',
  compareDesc: '여러 스탯 빌드("고공격력 저관통" vs "저공격력 고관통")를 설정하고 최종 데미지 및 통과율을 비교합니다.',
  tableTitle: '📋 관통 데이터 표 출력',
  tableDesc: '고정된 파라미터로 다양한 방어 관통 수치의 결과 표를 생성합니다. CSV 또는 HTML 표로 복사할 수 있습니다.',

  // Form Sections
  atkParams: '⚔ 공격자 스탯',
  defParams: '🛡 방어자 스탯',
  atkPresetLabel: '공격자 레벨 프리셋 (관통 상수에 영향)',
  defPresetLabel: '방어자 레벨 프리셋 (방어 상수에 영향)',
  manualAdjust: '수동 조절',

  // Form Fields
  baseAtk: '공격력 (ATK)',
  skillCoeff: '스킬 계수',
  atkType: '공격 타입',
  typePhys: '물리 공격 (P.DEF)',
  typeMag: '마법 공격 (M.DEF)',
  pen: '방어 관통 (PEN)',
  pmPen: '물/마방 관통',
  dmgBonus: '데미지 증가',
  critMult: '크리티컬 배율',
  eleAdvantage: '속성 상성',
  cPenDefLabel: '관통 상수 (공격자 레벨에 영향 받음)',
  cDefDefLabel: '방어 상수 (방어자 레벨에 영향 받음)',
  cPenConst: 'C_pen 상수',
  cPmPenConst: 'C_pmpen 상수',
  
  targetDef: '대상 방어력 (DEF)',
  targetPhysDef: '대상 물리 방어력',
  targetMagDef: '대상 마법 방어력',
  defBonus: '방어력 보너스',
  pmDefBonus: '물리/마법 방어력 보너스',
  cDefConst: 'C_def 상수',
  cPmDefConst: 'C_pmdef 상수',

  // Stats
  finalDmg: '최종 데미지',
  overallPenRate: '종합 통과율 (데미지율)',
  defMitRate: '방어력 경감률',
  pmMitRate: '물/마방 경감률',
  rawDmg: '스킬 기본 데미지',
  totalMitRate: '종합 방어 경감률',
  effDef: '유효 방어력',
  effPmDef: '유효 물/마방',

  // Breakdown
  dmgBreakdown: '📊 데미지 세부 내역',
  addBonus: '+ 데미지 증가',
  mulDefPass: '× 방어 통과',
  mulPmPass: '× 물/마방 통과',
  mulCrit: '× 크리티컬',
  mulFaction: '× 속성 상성',

  // Quick Table
  quickTableTitle: '📐 빠른 확인: 방어 관통 × 대상 방어력',
  quickTableDesc: '현재 계수와 물/마방 관통을 고정하고, 방어 관통(DEF Break)만 스캔합니다.',
  quickTableHeadX: '방어 관통↓ / 대상 방어력→',

  // Sweep Chart
  xPen: '방어 관통 (PEN)',
  yFinalDmg: '최종 데미지',
  scanRange: '스캔 범위',
  minVal: '최소값',
  maxVal: '최대값',
  minVar: '최소 {var}',
  maxVar: '최대 {var}',
  stepSpan: '간격',
  addTargetDef: '+ 대상 방어력 곡선 추가',
  defLine: '방 {def}',
  scanNotice: '매개변수를 변경하면 자동으로 다시 계산되어 곡선이 그려집니다.',

  // Heatmap Chart
  defRange: '방어력 구간',
  defStep: '방어 간격',
  penRange: '관통 구간',
  penStep: '관통 간격',
  genHeatmap: '히트맵 생성',
  heatmapLoading: '계산 중...',
  xAxisPen: '방어 관통 (PEN)',
  yAxisDef: '대상 방어력 (DEF)',

  // Compare Panel
  addBuild: '+ 빌드 추가',
  addBench: '+ 대상 추가',
  buildNamePrefix: '빌드 ',
  benchNamePrefix: '대상 ',
  buildName: '빌드 이름',
  buildBaseAtk: '공격력',
  buildPen: '관통',
  buildPmPen: '물/마 관통',
  buildBonus: '뎀증',
  benchName: '대상 이름',
  benchDef: '방어력',
  benchPmDef: '물/마방',
  evalMetric: '평가 지표',
  metricFinalDmg: '최종 데미지',
  metricDmgRate: '통과율 (%)',
  removeTitle: '삭제',

  // Table Export
  tableCols: '표시 열',
  colPen: '방어 관통',
  colFinal: '최종 데미지',
  colDiff: '데미지 증가량',
  colRatio: '데미지 증가율',
  colRate: '통과율',
  colDr1: '방어 경감',
  colDr2: '마법 경감',
  colEff1: '유효 방어',
  colEff2: '유효 물마방',
  genTable: '데이터 생성',
  copyCSV: 'CSV 복사',
  copyTable: '표 복사',
  copied: '클립보드에 복사되었습니다!',

  // Presets & Levels
  lv: 'Lv',
  atkLevel: '공격자 레벨',
  defLevel: '방어자 레벨',

  scenarioPveEarly: 'PvE (20~22장) 5M 방어',
  scenarioPveMid: 'PvE (23~24장) 10M 방어',
  scenarioPvpMage: 'PvP (마법사 대결)',
  scenarioPvpTank: 'PvP (탱커 잡기)',
  scenarioGuildBoss: '길드 보스',
  
  scenarioDescPveEarly: '방어 5M, 물/마방 5M, 기본 관통 11950',
  scenarioDescPveMid: '방어 10M, 물/마방 10M, 높은 상수 요구',
  scenarioDescPvpMage: '낮은 방어력, 높은 관통 불필요',
  scenarioDescPvpTank: '매우 높은 방어력, 극한의 관통 필요',
  scenarioDescGuildBoss: '방어 2M, 방어 깎기 유효, 화력 집중',
}
