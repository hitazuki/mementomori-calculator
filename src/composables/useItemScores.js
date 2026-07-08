import { computed, reactive } from 'vue'
import { normalizeScores } from '../engine/packCalc.js'
import { buildDerivedScoreState } from '../engine/derivedScores.js'
import { editableScores, resetEditableScores } from '../store/itemScores.js'

const LOCKED_SCORES = { '[2,1]': true }

export function useItemScores({ t, itemDisplayName, itemLocaleField }) {
  const baseScores = computed(() => normalizeScores(editableScores))
  const derivedScoreState = computed(() => buildDerivedScoreState(baseScores.value))
  const normalizedScores = computed(() => derivedScoreState.value.scores)
  const readonlyScoreRows = computed(() => derivedScoreState.value.readonlyRows)
  const editableScoreRows = computed(() => Object.entries(editableScores)
    .filter(([key, score]) => score.isBase && !isReadonlyScore(key))
    .map(([key, item]) => ({ key, item })))
  const expandedScoreDetails = reactive(new Set())

  function isLocked(key) {
    return !!LOCKED_SCORES[key]
  }

  function isReadonlyScore(key) {
    return key === '[1,1]' || key === '[13,1]'
  }

  function hasScoreDetails(row) {
    return Array.isArray(row.detailRows) && row.detailRows.length > 0
  }

  function toggleScoreDetail(row) {
    if (!hasScoreDetails(row)) return
    if (expandedScoreDetails.has(row.key)) expandedScoreDetails.delete(row.key)
    else expandedScoreDetails.add(row.key)
  }

  function isScoreDetailExpanded(row) {
    return hasScoreDetails(row) && expandedScoreDetails.has(row.key)
  }

  function formatScoreForPanel(value) {
    const numeric = Number(value) || 0
    if (Math.abs(numeric) > 0 && Math.abs(numeric) < 10) return numeric.toFixed(2)
    return Math.round(numeric).toLocaleString()
  }

  function scoreReasonText(row) {
    return row.reasonKey ? t(row.reasonKey, row.reasonParams || {}) : row.reason
  }

  function scoreDetailName(detail) {
    const field = itemLocaleField()
    if (detail.kind === 'ratio') {
      const sourceField = `source${field.charAt(0).toUpperCase()}${field.slice(1)}`
      return detail[sourceField] || detail.sourceNameZh || detail.sourceName || itemDisplayName(detail)
    }
    return itemDisplayName(detail) || `T${detail.itemType}I${detail.itemId}`
  }

  function scoreDetailLabel(detail) {
    const name = scoreDetailName(detail)
    if (detail.kind === 'ratio') return `${name} × 1/2`
    const quantity = Number(detail.quantity || 0).toLocaleString()
    const rate = `${((Number(detail.rate) || 0) * 100).toFixed(1)}%`
    return `${name} ×${quantity} · ${rate}`
  }

  function formatScoreShare(share) {
    return `${((Number(share) || 0) * 100).toFixed(1)}%`
  }

  return {
    editableScores,
    normalizedScores,
    readonlyScoreRows,
    editableScoreRows,
    isLocked,
    hasScoreDetails,
    toggleScoreDetail,
    isScoreDetailExpanded,
    formatScoreForPanel,
    scoreReasonText,
    scoreDetailName,
    scoreDetailLabel,
    formatScoreShare,
    resetEditableScores,
  }
}
