import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { ratingSource, validRating } from '../src/utils/characterRatings.js'
const root = path.resolve(import.meta.dirname, '..')
const dir = path.join(root, 'public/data/character-ratings')
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'public/data/character-catalog/zh-CN.json'), 'utf8'))
const status = { schemaVersion: 1, current: [], stale: [], pending: [] }
for (const character of catalog.characters) {
  const file = path.join(dir, character.id + '.json')
  if (!fs.existsSync(file)) { status.pending.push(character.id); continue }
  const rating = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!validRating(rating, character.id)) throw new Error('Invalid rating: ' + character.id)
  const hash = createHash('sha256').update(JSON.stringify(ratingSource(character))).digest('hex')
  status[hash === rating.sourceHashes['zh-CN'] ? 'current' : 'stale'].push(character.id)
}
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify(status) + '\n')
console.log('AI ratings: ' + status.current.length + ' current, ' + status.stale.length + ' need review, ' + status.pending.length + ' pending.')
if (status.stale.length || status.pending.length) console.warn('AI ratings require review: ' + JSON.stringify({ stale: status.stale, pending: status.pending }))
