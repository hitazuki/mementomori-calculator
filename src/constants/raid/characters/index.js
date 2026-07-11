import florence from './florence.js'
import fenrir from './fenrir.js'
import luke from './luke.js'
import merlyn from './merlyn.js'
import mertillier from './mertillier.js'
import rustica from './rustica.js'
import artoria from './artoria.js'
import liberia from './liberia.js'
import springShizu from './springShizu.js'
import morgana from './morgana.js'
import lucille from './lucille.js'

export const RAID_TABLE_CHARACTER_IDS = Object.freeze({
  FLORENCE: 8,
  FENRIR: 7,
  LUKE: 30,
  MERLYN: 26,
  MERTILLIER: 29,
  RUSTICA: 113,
  ARTORIA: 93,
  LIBERIA: 128,
  SPRING_SHIZU: 112,
  MORGANA: 75,
  LUCILLE: 89,
})

export const RAID_TABLE_ROSTER = Object.freeze([
  RAID_TABLE_CHARACTER_IDS.FLORENCE,
  RAID_TABLE_CHARACTER_IDS.FENRIR,
  RAID_TABLE_CHARACTER_IDS.LUKE,
  RAID_TABLE_CHARACTER_IDS.MERLYN,
  RAID_TABLE_CHARACTER_IDS.MERTILLIER,
  RAID_TABLE_CHARACTER_IDS.RUSTICA,
  RAID_TABLE_CHARACTER_IDS.ARTORIA,
  RAID_TABLE_CHARACTER_IDS.LIBERIA,
  RAID_TABLE_CHARACTER_IDS.SPRING_SHIZU,
  RAID_TABLE_CHARACTER_IDS.MORGANA,
  RAID_TABLE_CHARACTER_IDS.LUCILLE,
])

const definitions = [florence, fenrir, luke, merlyn, mertillier, rustica, artoria, liberia, springShizu, morgana, lucille]
export const RAID_TABLE_CHARACTERS = Object.freeze(Object.fromEntries(definitions.map(character => [character.id, Object.freeze(character)])))
