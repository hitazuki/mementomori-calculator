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
import frack from './frack.js'
import guinevere from './guinevere.js'
import liebes from './liebes.js'
import mifri from './mifri.js'
import popri from './popri.js'
import cattleyya from './cattleyya.js'
import merlan from './merlan.js'

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
  FRACK: 122,
  GUINEVERE: 148,
  LIEBES: 102,
  MIFRI: 126,
  POPRI: 115,
  CATTLEYYA: 90,
  MERLAN: 135,
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
  RAID_TABLE_CHARACTER_IDS.FRACK,
  RAID_TABLE_CHARACTER_IDS.GUINEVERE,
  RAID_TABLE_CHARACTER_IDS.LIEBES,
  RAID_TABLE_CHARACTER_IDS.MIFRI,
  RAID_TABLE_CHARACTER_IDS.POPRI,
  RAID_TABLE_CHARACTER_IDS.CATTLEYYA,
  RAID_TABLE_CHARACTER_IDS.MERLAN,
])

const definitions = [florence, fenrir, luke, merlyn, mertillier, rustica, artoria, liberia, springShizu, morgana, lucille, frack, guinevere, liebes, mifri, popri, cattleyya, merlan]
export const RAID_TABLE_CHARACTERS = Object.freeze(Object.fromEntries(definitions.map(character => [character.id, Object.freeze(character)])))
