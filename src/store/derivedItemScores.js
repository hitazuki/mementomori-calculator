import { computed } from 'vue'
import { editableScores } from './itemScores.js'
import { normalizeScores } from '../engine/packCalc.js'
import { buildDerivedScoreState } from '../engine/derivedScores.js'

// All pages share one lazy computation; display expansion stays local to each page.
export const baseScores = computed(() => normalizeScores(editableScores))
export const derivedScoreState = computed(() => buildDerivedScoreState(baseScores.value))
export const normalizedScores = computed(() => derivedScoreState.value.scores)
