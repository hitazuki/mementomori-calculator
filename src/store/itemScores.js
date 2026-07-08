import { reactive, watch } from 'vue'
import scoresRaw from '../constants/itemScores.json'

const STORAGE_KEY = 'mmt-pack-scores-v2'
const stored = localStorage.getItem(STORAGE_KEY)
let initialScores = JSON.parse(JSON.stringify(scoresRaw)) // deep copy

if (stored) {
  try {
    const parsed = JSON.parse(stored)
    for (const key in parsed) {
      if (initialScores[key]) {
        initialScores[key].score = parsed[key].score
      }
    }
  } catch(e) {
    console.error('Failed to parse stored scores', e)
  }
}

export const editableScores = reactive(initialScores)

export function resetEditableScores() {
  for (const key in scoresRaw) {
    if (editableScores[key]) {
      editableScores[key].score = scoresRaw[key].score
    }
  }
}

watch(editableScores, (v) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
}, { deep: true })
