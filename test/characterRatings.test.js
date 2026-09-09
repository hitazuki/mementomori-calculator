import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { ratingSource, radarPoint, validRating, RATING_AXES, RATING_TAGS } from '../src/utils/characterRatings.js'
import { readCharacterCatalog } from '../scripts/lib/characterCatalog.mjs'
const dir = new URL('../public/data/character-ratings/', import.meta.url)
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')

test('AI review set has unique IDs, seven explained scores and preserved evidence', () => {
  const reviews = fs.readFileSync(new URL('../doc/character-ratings/reviews.txt', import.meta.url), 'utf8').trim().split(/\r?\n/).map(line => line.split('|'))
  assert.ok(reviews.length >= 134)
  assert.equal(new Set(reviews.map(row => row[0])).size, reviews.length)
  const files = fs.readdirSync(dir).filter(file => /^\d+\.json$/.test(file))
  assert.equal(files.length, reviews.length)
  for (const row of reviews) {
    const rating = read(new URL(row[0] + '.json', dir))
    assert.ok(validRating(rating, Number(row[0])))
    assert.deepEqual(rating.axes.map(axis => axis.score), row[1].split(',').map(Number))
    assert.deepEqual(rating.axes.map(axis => axis.reason), row.slice(2, 2+RATING_AXES.length))
    assert.equal(rating.conditions, row[2+RATING_AXES.length])
    assert.deepEqual(rating.tags, row[3+RATING_AXES.length].split(',').map(tag => { const [key, refs] = tag.split('@'); return { key, evidence: refs.split('+') } }))
    assert.equal(rating.scaleMax, 10)
    assert.equal(rating.verification, rating.quantitative ? 'text-review-with-reference-calculation' : 'text-review-only')
    assert.ok(rating.sources.every(source => source.title && source.text))
    assert.deepEqual(Object.keys(rating.sourceHashes), ['zh-CN', 'zh-TW', 'en', 'ja', 'ko'])
    assert.ok(Object.values(rating.sourceHashes).every(hash => /^[a-f0-9]{64}$/.test(hash)))
    assert.ok(rating.sources.some(source => source.key === 'W'))
    assert.ok(rating.sources.some(source => source.key === 'stats'))
  }
})

test('rating source tracks skill and weapon changes but excludes account Arcana', () => {
  const character = readCharacterCatalog(new URL('../public/data/character-catalog/', import.meta.url)).characters.find(c => c.id === 27)
  const changed = structuredClone(character)
  changed.collections = []
  assert.equal(digest(ratingSource(changed)), digest(ratingSource(character)))
  changed.skills[0].levels[0].text += ' changed'
  assert.notEqual(digest(ratingSource(changed)), digest(ratingSource(character)))
  const weaponChanged = structuredClone(character)
  weaponChanged.exclusivePassives.at(-1).parameters[0].value++
  assert.notEqual(digest(ratingSource(weaponChanged)), digest(ratingSource(character)))
})

test('sync audit distinguishes current, stale and pending without inventing zero ratings', () => {
  const catalog = readCharacterCatalog(new URL('../public/data/character-catalog/', import.meta.url))
  const status = read(new URL('status.json', dir))
  assert.deepEqual([...status.current, ...status.stale, ...status.pending].sort((a,b) => a-b), catalog.characters.map(c => c.id).sort((a,b) => a-b))
  for (const character of catalog.characters) {
    if (status.pending.includes(character.id)) {
      assert.equal(fs.existsSync(new URL(character.id + '.json', dir)), false)
      continue
    }
    const rating = read(new URL(character.id + '.json', dir))
    assert.equal(digest(ratingSource(character)) === rating.sourceHashes['zh-CN'], status.current.includes(character.id))
  }
})

test('invalid scores and dangling evidence cannot pass rating validation', () => {
  const rating = read(new URL('27.json', dir))
  assert.ok(validRating(rating, 27))
  assert.ok(!validRating(rating, 28))
  const invalid = structuredClone(rating)
  invalid.axes[0].score = 11
  assert.ok(!validRating(invalid, 27))
  invalid.axes[0].score = 4
  invalid.axes[0].evidence = ['missing-skill']
  assert.ok(!validRating(invalid, 27))
})

test('radar uses a fixed 0–10 scale and zero collapses to center', () => {
  assert.equal(RATING_AXES.length, 7)
  for (let i = 0; i < RATING_AXES.length; i++) {
    assert.deepEqual(radarPoint(i, 0), [160, 145])
    const [x,y] = radarPoint(i, 10)
    assert.ok(Math.abs(Math.hypot(x - 160, y - 145) - 88) < 1e-8)
    const [halfX, halfY] = radarPoint(i, 5)
    assert.ok(Math.abs(Math.hypot(halfX - 160, halfY - 145) - 44) < 1e-8)
  }
})

test('output suppression, weakness and attack reduction retain distinct layers and defensive roles', () => {
  assert.equal(RATING_TAGS.outputDown.layer, 'damage')
  assert.equal(RATING_TAGS.weakness.layer, 'weakness')
  assert.equal(RATING_TAGS.attackDown.layer, 'attack')
  for (const [id, key] of [[44, 'outputDown'], [106, 'outputDown'], [100, 'weakness'], [11, 'attackDown']]) {
    const rating = read(new URL(id + '.json', dir))
    assert.ok(rating.tags.some(tag => tag.key === key))
    assert.ok(rating.axes.find(axis => axis.key === 'protection').score > 0)
  }
  const rusalka = read(new URL('44.json', dir))
  assert.equal(rusalka.axes.find(axis => axis.key === 'support').score, 0)
  assert.equal(rusalka.axes.find(axis => axis.key === 'control').score, 0)
  for (const id of [10, 17, 68, 97, 122, 124]) {
    const rating = read(new URL(id + '.json', dir))
    assert.equal(rating.axes.find(axis => axis.key === 'control').score, 0, 'Recovery/buff inhibition is not action control: ' + id)
  }
})

test('legacy scales, unknown tags and missing tag evidence are rejected', () => {
  const rating = read(new URL('44.json', dir))
  for (const patch of [
    { schemaVersion: 1 }, { scaleMax: 5 }, { rubricVersion: 'ai-capability-v1' },
    { tags: [{ key: 'invented', evidence: ['S1'] }] },
    { tags: [{ key: 'outputDown', evidence: ['missing'] }] },
    { tags: [{ key: 'outputDown', evidence: [] }] },
  ]) assert.ok(!validRating({ ...rating, ...patch }, 44))
})
