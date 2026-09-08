import { RATING_AXES, RATING_MAX, RATING_VERSION } from './characterRatings.js'

export function ratingIndex(data) {
  if (data?.schemaVersion !== 1 || data.rubricVersion !== RATING_VERSION || data.scaleMax !== RATING_MAX || !Array.isArray(data.characters)) throw new Error('Invalid rating index')
  const result = {}
  for (const entry of data.characters) {
    if (!Number.isInteger(entry.id) || Object.hasOwn(result, entry.id) || !['current', 'stale', 'pending'].includes(entry.status)) throw new Error('Invalid rating entry')
    if (entry.status !== 'pending' && !RATING_AXES.every(key => Number.isInteger(entry.scores?.[key]) && entry.scores[key] >= 0 && entry.scores[key] <= RATING_MAX)) throw new Error('Invalid indexed score')
    result[entry.id] = entry.status === 'pending' ? { ...entry, scores: null } : entry
  }
  return result
}

export function filterCharacters(characters, { element = 0, search = '', sort = 'id', ratingAxis = 'burst', ratings = {} } = {}) {
  const query = search.trim().toLocaleLowerCase()
  return characters.filter(character => (!element || character.element === element)
    && `${character.id} ${character.name} ${character.title}`.toLocaleLowerCase().includes(query))
    .sort((a, b) => {
      if (sort === 'speed') return (b.speed ?? 0) - (a.speed ?? 0) || a.id - b.id
      if (sort === 'rating' && RATING_AXES.includes(ratingAxis)) {
        // Missing evaluations sort after genuine zero scores; ties are stable by ID.
        return (ratings[b.id]?.scores?.[ratingAxis] ?? -1) - (ratings[a.id]?.scores?.[ratingAxis] ?? -1) || a.id - b.id
      }
      return a.id - b.id
    })
}
