// src/utils/chartTheme.js
// ECharts 自定义主题：哥特暗金

export const MORI_THEME = {
  backgroundColor: 'transparent',
  textStyle: { fontFamily: 'Inter, sans-serif', color: '#b0a080' },
  title: {
    textStyle: { color: '#c9a84c', fontFamily: 'Cinzel, serif', fontSize: 14 },
    subtextStyle: { color: '#7a6a50' },
  },
  legend: {
    textStyle: { color: '#b0a080' },
    pageTextStyle: { color: '#b0a080' },
  },
  tooltip: {
    backgroundColor: '#1a1628',
    borderColor: '#c9a84c',
    borderWidth: 1,
    textStyle: { color: '#f0e6c8', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 },
    extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.6)',
  },
  grid: {
    borderColor: 'rgba(201,168,76,0.1)',
  },
  axisLine: { lineStyle: { color: 'rgba(201,168,76,0.25)' } },
  axisTick: { lineStyle: { color: 'rgba(201,168,76,0.15)' } },
  axisLabel: {
    color: 'rgba(240,230,200,0.5)',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 11,
  },
  splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
  splitArea: { areaStyle: { color: ['rgba(255,255,255,0.01)', 'transparent'] } },
}

// 伤害热力图色阶（低→高 蓝紫金橙红）
export const HEATMAP_COLORS = [
  [0,    '#1a1040'],
  [0.15, '#2d1b6e'],
  [0.3,  '#5b2d8e'],
  [0.45, '#8b4db0'],
  [0.6,  '#c9a84c'],
  [0.75, '#e07820'],
  [0.9,  '#e74c3c'],
  [1,    '#ff2020'],
]

// 多曲线配色方案
export const LINE_COLORS = [
  '#c9a84c', // 金
  '#9b59b6', // 紫
  '#3498db', // 蓝
  '#2ecc71', // 绿
  '#e74c3c', // 红
  '#e8c96a', // 浅金
]

/**
 * 通用图表基础配置工厂
 */
export function baseChartOption(titleText, subtitleText = '') {
  return {
    backgroundColor: 'transparent',
    title: {
      text: titleText,
      subtext: subtitleText,
      textStyle: MORI_THEME.title.textStyle,
      subtextStyle: MORI_THEME.title.subtextStyle,
      top: 8, left: 16,
    },
    tooltip: MORI_THEME.tooltip,
    legend: {
      ...MORI_THEME.legend,
      top: 8, right: 16,
    },
    grid: {
      top: subtitleText ? 72 : 56,
      right: 20,
      bottom: 48,
      left: 64,
    },
  }
}
