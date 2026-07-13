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
import tama from './tama.js'
import mowano from './mowano.js'
import carol from './carol.js'
import asahi from './asahi.js'
import milla from './milla.js'
import eidene from './eidene.js'
import pola from './pola.js'
import yildiz from './yildiz.js'
import winterStella from './winterStella.js'
import { RAID_JOB_FLAGS } from '../shared.js'

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
  TAMA: 81,
  MOWANO: 100,
  CAROL: 40,
  ASAHI: 78,
  MILLA: 80,
  EIDENE: 92,
  POLA: 114,
  YILDIZ: 124,
  WINTER_STELLA: 132,
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
  RAID_TABLE_CHARACTER_IDS.TAMA,
  RAID_TABLE_CHARACTER_IDS.MOWANO,
  RAID_TABLE_CHARACTER_IDS.CAROL,
  RAID_TABLE_CHARACTER_IDS.ASAHI,
  RAID_TABLE_CHARACTER_IDS.MILLA,
  RAID_TABLE_CHARACTER_IDS.EIDENE,
  RAID_TABLE_CHARACTER_IDS.POLA,
  RAID_TABLE_CHARACTER_IDS.YILDIZ,
  RAID_TABLE_CHARACTER_IDS.WINTER_STELLA,
])

export const RAID_TABLE_CHARACTER_JOB_FLAGS = Object.freeze({
  8: RAID_JOB_FLAGS.WARRIOR,
  7: RAID_JOB_FLAGS.MAGE,
  30: RAID_JOB_FLAGS.WARRIOR,
  26: RAID_JOB_FLAGS.MAGE,
  29: RAID_JOB_FLAGS.MAGE,
  113: RAID_JOB_FLAGS.WARRIOR,
  93: RAID_JOB_FLAGS.WARRIOR,
  128: RAID_JOB_FLAGS.SNIPER,
  112: RAID_JOB_FLAGS.WARRIOR,
  75: RAID_JOB_FLAGS.MAGE,
  89: RAID_JOB_FLAGS.WARRIOR,
  122: RAID_JOB_FLAGS.SNIPER,
  148: RAID_JOB_FLAGS.SNIPER,
  102: RAID_JOB_FLAGS.WARRIOR,
  126: RAID_JOB_FLAGS.MAGE,
  115: RAID_JOB_FLAGS.SNIPER,
  90: RAID_JOB_FLAGS.WARRIOR,
  135: RAID_JOB_FLAGS.MAGE,
  81: RAID_JOB_FLAGS.SNIPER,
  100: RAID_JOB_FLAGS.SNIPER,
  40: RAID_JOB_FLAGS.MAGE,
  78: RAID_JOB_FLAGS.SNIPER,
  80: RAID_JOB_FLAGS.MAGE,
  92: RAID_JOB_FLAGS.MAGE,
  114: RAID_JOB_FLAGS.SNIPER,
  124: RAID_JOB_FLAGS.WARRIOR,
  132: RAID_JOB_FLAGS.MAGE,
})

const definitions = [florence, fenrir, luke, merlyn, mertillier, rustica, artoria, liberia, springShizu, morgana, lucille, frack, guinevere, liebes, mifri, popri, cattleyya, merlan, tama, mowano, carol, asahi, milla, eidene, pola, yildiz, winterStella]
export const RAID_TABLE_CHARACTERS = Object.freeze(Object.fromEntries(definitions.map(character => [character.id, Object.freeze({
  ...character,
  jobFlags: RAID_TABLE_CHARACTER_JOB_FLAGS[character.id],
})])))
