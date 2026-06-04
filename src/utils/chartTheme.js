// src/utils/chartTheme.js
// ECharts 自定义主题：哥特暗金

export const getMoriTheme = (isDark) => ({
  backgroundColor: 'transparent',
  textStyle: { fontFamily: 'Inter, sans-serif', color: isDark ? 'rgba(240, 230, 200, 0.62)' : 'rgba(61, 53, 50, 0.7)' },
  title: {
    textStyle: { color: isDark ? '#d4ba70' : '#9e791b', fontFamily: 'Cinzel, serif', fontSize: 14 },
    subtextStyle: { color: isDark ? 'rgba(240, 230, 200, 0.35)' : 'rgba(61, 53, 50, 0.45)' },
  },
  legend: {
    textStyle: { color: isDark ? 'rgba(240, 230, 200, 0.62)' : 'rgba(61, 53, 50, 0.7)' },
    pageTextStyle: { color: isDark ? 'rgba(240, 230, 200, 0.62)' : 'rgba(61, 53, 50, 0.7)' },
  },
  tooltip: {
    backgroundColor: isDark ? 'rgba(19, 16, 31, 0.85)' : '#e9e6df',
    borderColor: isDark ? 'rgba(212, 186, 112, 0.25)' : 'rgba(184, 156, 85, 0.3)',
    borderWidth: 1,
    textStyle: { color: isDark ? '#f0e6c8' : '#3d3532', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 },
    extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.6)',
  },
  grid: {
    borderColor: isDark ? 'rgba(212, 186, 112, 0.25)' : 'rgba(184, 156, 85, 0.3)',
  },
  axisLine: { lineStyle: { color: isDark ? 'rgba(212, 186, 112, 0.25)' : 'rgba(184, 156, 85, 0.3)' } },
  axisTick: { lineStyle: { color: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)' } },
  axisLabel: {
    color: isDark ? 'rgba(240, 230, 200, 0.6)' : 'rgba(61, 53, 50, 0.6)',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 11,
  },
  splitLine: { lineStyle: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', type: 'dashed' } },
  splitArea: { areaStyle: { color: [isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', 'transparent'] } },
})

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
export function baseChartOption(titleText, subtitleText = '', isDark = true) {
  const theme = getMoriTheme(isDark)
  return {
    backgroundColor: 'transparent',
    title: {
      text: titleText,
      subtext: subtitleText,
      textStyle: theme.title.textStyle,
      subtextStyle: theme.title.subtextStyle,
      top: 8, left: 16,
    },
    tooltip: theme.tooltip,
    legend: {
      ...theme.legend,
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
