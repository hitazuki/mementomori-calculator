export const RATING_AXES = ['single', 'area', 'survival', 'protection', 'support', 'control']
export const RATING_VERSION = 'ai-capability-v1'

// Deliberately excludes account-wide Arcana and image metadata.
export function ratingSource(character) {
  return {
    id: character.id, name: character.name, title: character.title,
    element: character.element, job: character.job, rarity: character.rarity, speed: character.speed,
    skills: character.skills, exclusiveEffects: character.exclusiveEffects,
    exclusivePassive: character.exclusivePassives?.at(-1) ?? null,
  }
}
export function validRating(rating, id) {
  return rating?.schemaVersion === 1 && rating.id === id && rating.rubricVersion === RATING_VERSION
    && rating.assessmentType === 'ai-editorial' && rating.axes?.length === RATING_AXES.length
    && rating.axes.every((axis, index) => axis.key === RATING_AXES[index]
      && Number.isInteger(axis.score) && axis.score >= 0 && axis.score <= 5
      && typeof axis.reason === 'string' && axis.reason.length > 0
      && Array.isArray(axis.evidence) && axis.evidence.every(key => rating.sources?.some(source => source.key === key)))
    && typeof rating.conditions === 'string' && rating.conditions.length > 0
    && rating.sources?.length > 0 && rating.sourceHashes && rating.assessedAt
}
export function radarPoint(index, score, radius = 88) {
  const angle = -Math.PI / 2 + index * Math.PI / 3
  return [160 + Math.cos(angle) * radius * score / 5, 145 + Math.sin(angle) * radius * score / 5]
}
