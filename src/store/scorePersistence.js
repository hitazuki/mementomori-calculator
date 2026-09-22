import { isRecord } from '../utils/fetchJson.js'

export const SCORE_STORAGE_KEY = 'mmt-pack-scores-v3'
export const LEGACY_SCORE_STORAGE_KEY = 'mmt-pack-scores-v2'

/** @typedef {Record<string, {score: number}>} ScoreDefaults */

/**
 * Only numeric, nonnegative overrides for known items cross the storage boundary.
 * Names, batch sizes and other master data always come from the bundled catalog.
 * @param {string | null} raw
 * @param {ScoreDefaults} defaults
 * @param {boolean} [legacy]
 * @returns {Record<string, number>}
 */
export function decodeScoreOverrides(raw, defaults, legacy = false) {
  try {
    const parsed = JSON.parse(raw ?? 'null')
    if (!isRecord(parsed)) return {}
    const values = legacy ? parsed : parsed.version === 3 ? parsed.overrides : null
    if (!isRecord(values)) return {}
    return Object.fromEntries(Object.entries(values).flatMap(([key, value]) => {
      const score = legacy && isRecord(value) ? value.score : value
      return Object.hasOwn(defaults, key) && typeof score === 'number' && Number.isFinite(score) && score >= 0
        ? [[key, score]] : []
    }))
  } catch { return {} }
}

/** @param {ScoreDefaults} scores @param {ScoreDefaults} defaults */
export function encodeScoreOverrides(scores, defaults) {
  const overrides = Object.fromEntries(Object.entries(scores)
    .filter(([key, value]) => Object.hasOwn(defaults, key) && Number.isFinite(value.score) && value.score >= 0 && value.score !== defaults[key].score)
    .map(([key, value]) => [key, value.score]))
  return JSON.stringify({ version: 3, overrides })
}
