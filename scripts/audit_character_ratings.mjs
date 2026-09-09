import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { ratingSource, validRating, RATING_VERSION, RATING_MAX } from '../src/utils/characterRatings.js'
import { readCharacterCatalog } from './lib/characterCatalog.mjs'
const root = path.resolve(import.meta.dirname, '..')
const dir = path.join(root, 'public/data/character-ratings')
const catalog = readCharacterCatalog(path.join(root, 'public/data/character-catalog'))
const status = { schemaVersion: 1, current: [], stale: [], pending: [] }
const characters = []
for (const character of catalog.characters) {
  const file = path.join(dir, character.id + '.json')
  if (!fs.existsSync(file)) { status.pending.push(character.id); characters.push({ id: character.id, status: 'pending', scores: null }); continue }
  const rating = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!validRating(rating, character.id)) throw new Error('Invalid rating: ' + character.id)
  const hash = createHash('sha256').update(JSON.stringify(ratingSource(character))).digest('hex')
  const state = hash === rating.sourceHashes['zh-CN'] ? 'current' : 'stale'
  status[state].push(character.id)
  characters.push({ id: character.id, status: state, scores: Object.fromEntries(rating.axes.map(axis => [axis.key, axis.score])) })
}
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify(status) + '\n')
fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ schemaVersion: 1, rubricVersion: RATING_VERSION, scaleMax: RATING_MAX, characters }) + '\n')
console.log('AI ratings: ' + status.current.length + ' current, ' + status.stale.length + ' need review, ' + status.pending.length + ' pending.')
if (status.stale.length || status.pending.length) console.warn('AI ratings require review: ' + JSON.stringify({ stale: status.stale, pending: status.pending }))
