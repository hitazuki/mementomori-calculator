import { reactive, watch } from 'vue'
import scoresRaw from '../constants/itemScores.json'
import { readStorage, writeStorage, removeStorage } from '../utils/storage.js'
import { SCORE_STORAGE_KEY, LEGACY_SCORE_STORAGE_KEY, decodeScoreOverrides, encodeScoreOverrides } from './scorePersistence.js'

const stored = readStorage(SCORE_STORAGE_KEY)
const overrides = decodeScoreOverrides(stored ?? readStorage(LEGACY_SCORE_STORAGE_KEY), scoresRaw, stored === null)
export const editableScores = reactive(Object.fromEntries(Object.entries(scoresRaw).map(([key, item]) => [
  key, { ...item, score: overrides[key] ?? item.score },
])))

export function resetEditableScores() {
  for (const [key, item] of Object.entries(scoresRaw)) editableScores[key].score = item.score
}

function persistScores() {
  if (writeStorage(SCORE_STORAGE_KEY, encodeScoreOverrides(editableScores, scoresRaw))) removeStorage(LEGACY_SCORE_STORAGE_KEY)
}
persistScores()
watch(editableScores, persistScores, { deep: true })
