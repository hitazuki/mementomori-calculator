export const RATING_AXES = ['single', 'area', 'survival', 'protection', 'support', 'control']
export const RATING_VERSION = 'ai-capability-v4'
export const RATING_MAX = 10
// Editorial mechanism labels, independent of the raid engine's effect types.
export const RATING_TAGS = {
  basic: { group: 'utility', label: '基础直接攻击' },
  attack: { group: 'buff', label: '攻击提升', layer: 'attack' },
  critical: { group: 'buff', label: '暴击／暴伤提升' },
  penetration: { group: 'buff', label: '贯通提升' },
  accuracy: { group: 'buff', label: '命中提升' },
  speed: { group: 'buff', label: '速度提升' },
  damageUp: { group: 'buff', label: '输出伤害提升', layer: 'damage' },
  defense: { group: 'buff', label: '防御提升' },
  health: { group: 'buff', label: '生命提升' },
  resistance: { group: 'buff', label: '抗暴／弱化抗性' },
  immunity: { group: 'buff', label: '弱化／控制免疫' },
  dodge: { group: 'buff', label: '闪避提升' },
  shield: { group: 'buff', label: '护盾' },
  barrier: { group: 'buff', label: '多重屏障' },
  reduction: { group: 'buff', label: '承受伤害降低', layer: 'damage' },
  block: { group: 'buff', label: '阻绝／伤害截断' },
  stealth: { group: 'buff', label: '隐身／透明' },
  invincible: { group: 'buff', label: '伤害免疫／不死' },
  buffGuard: { group: 'buff', label: '增益效果护罩' },
  attackDown: { group: 'debuff', label: '攻击力下降', layer: 'attack' },
  weakness: { group: 'debuff', label: '脱力', layer: 'weakness' },
  outputDown: { group: 'debuff', label: '输出伤害下降', layer: 'damage' },
  defenseDown: { group: 'debuff', label: '防御／物魔防御下降' },
  vulnerability: { group: 'debuff', label: '承受伤害上升', layer: 'damage' },
  critDown: { group: 'debuff', label: '暴击／暴伤降低' },
  resistanceDown: { group: 'debuff', label: '抗暴／闪避降低' },
  accuracyDown: { group: 'debuff', label: '命中／弱化命中降低' },
  penetrationDown: { group: 'debuff', label: '贯通降低' },
  stun: { group: 'debuff', label: '晕厥' },
  silence: { group: 'debuff', label: '沉默' },
  sleep: { group: 'debuff', label: '沉睡' },
  slow: { group: 'debuff', label: '速度下降' },
  delay: { group: 'debuff', label: '迟缓（冷却恢复减慢）' },
  bind: { group: 'debuff', label: '禁锢' },
  antiHeal: { group: 'debuff', label: '不治／回复抑制' },
  buffImmune: { group: 'debuff', label: '增益效果免疫' },
  dot: { group: 'debuff', label: '持续伤害' },
  heal: { group: 'recovery', label: '治疗／再生' },
  drain: { group: 'recovery', label: '吸血／伤害回复' },
  revive: { group: 'recovery', label: '复活／致命回复' },
  cleanse: { group: 'utility', label: '净化／缩短弱化' },
  dispel: { group: 'utility', label: '驱散／缩短增益' },
  steal: { group: 'utility', label: '夺取／吸收增益属性' },
  copy: { group: 'utility', label: '复制效果' },
  cooldown: { group: 'utility', label: '冷却缩短／重置' },
  taunt: { group: 'utility', label: '挑衅／代承伤' },
  resonance: { group: 'utility', label: '共鸣' },
  reflect: { group: 'utility', label: '反伤' },
  direct: { group: 'utility', label: '直接伤害' },
}

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
  return rating?.schemaVersion === 2 && rating.id === id && rating.rubricVersion === RATING_VERSION && rating.scaleMax === RATING_MAX
    && rating.assessmentType === 'ai-editorial' && rating.axes?.length === RATING_AXES.length
    && rating.axes.every((axis, index) => axis.key === RATING_AXES[index]
      && Number.isInteger(axis.score) && axis.score >= 0 && axis.score <= RATING_MAX
      && typeof axis.reason === 'string' && axis.reason.length > 0
      && Array.isArray(axis.evidence) && axis.evidence.every(key => rating.sources?.some(source => source.key === key)))
    && Array.isArray(rating.tags) && rating.tags.length > 0
    && new Set(rating.tags.map(tag => tag.key)).size === rating.tags.length
    && rating.tags.every(tag => Object.hasOwn(RATING_TAGS, tag.key) && Array.isArray(tag.evidence) && tag.evidence.length > 0
      && tag.evidence.every(key => rating.sources?.some(source => source.key === key)))
    && typeof rating.conditions === 'string' && rating.conditions.length > 0
    && rating.sources?.length > 0 && rating.sourceHashes && rating.assessedAt
}
export function radarPoint(index, score, radius = 88) {
  const angle = -Math.PI / 2 + index * Math.PI / 3
  return [160 + Math.cos(angle) * radius * score / RATING_MAX, 145 + Math.sin(angle) * radius * score / RATING_MAX]
}
