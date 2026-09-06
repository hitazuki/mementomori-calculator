import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { RATING_AXES, RATING_VERSION, ratingSource, validRating } from '../src/utils/characterRatings.js'

const root = path.resolve(import.meta.dirname, '..')
const output = path.join(root, 'public/data/character-ratings')
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const locales = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko']
const catalogs = Object.fromEntries(locales.map(locale => [locale, readJson(path.join(root, 'public/data/character-catalog', locale + '.json')).characters]))
const reviews = fs.readFileSync(path.join(root, 'doc/character-ratings/reviews.txt'), 'utf8').trim().split(/\r?\n/)
const explicitlyReviewed = new Set((process.argv.find(arg => arg.startsWith('--reviewed=')) ?? '').split('=')[1]?.split(',').map(Number) ?? [])
const digest = source => createHash('sha256').update(JSON.stringify(source)).digest('hex')
const seen = new Set()
const records = reviews.map(line => {
  const parts = line.split('|')
  if (parts.length !== 9) throw new Error('Expected ID, six scores, six reasons and conditions: ' + line.slice(0, 30))
  const [rawId, rawScores, ...notes] = parts
  const id = Number(rawId)
  if (seen.has(id)) throw new Error('Duplicate review: ' + id)
  seen.add(id)
  const character = catalogs['zh-CN'].find(character => character.id === id)
  if (!character) throw new Error('Unknown character: ' + id)
  const scores = rawScores.split(',').map(Number)
  if (scores.length !== 6) throw new Error('Expected six scores: ' + id)
  const source = ratingSource(character)
  const sources = [
    ...character.skills.map(skill => ({ key: skill.slot, title: skill.slot + ' · ' + skill.name, text: skill.levels.map(level => 'Lv' + level.level + ': ' + level.text).join('\n'), cooldown: skill.cooldown })),
    { key: 'W', title: '专武技能效果', text: character.exclusiveEffects.map(effect => 'Lv' + effect.level + ': ' + effect.text).join('\n') || '当前 MB 无专武技能效果。' },
    { key: 'stats', title: '基础资料与最高阶段专武属性', text: '基础速度 ' + character.speed + '\n' + (source.exclusivePassive ? source.exclusivePassive.rarity + ' ' + source.exclusivePassive.name + '\n' + source.exclusivePassive.parameters.map(p => p.name + ' +' + p.value + (p.percent ? '%' : '')).join('\n') : '当前 MB 无专武被动属性。') },
  ]
  const sourceHashes = Object.fromEntries(locales.map(locale => {
    const record = catalogs[locale].find(character => character.id === id)
    if (!record) throw new Error('Missing locale character: ' + locale + '/' + id)
    return [locale, digest(ratingSource(record))]
  }))
  const record = {
    schemaVersion: 1, id, rubricVersion: RATING_VERSION, assessmentType: 'ai-editorial',
    author: 'GPT-6 / Codex', assessedAt: '2026-09-06', rationaleLocale: 'zh-CN',
    verification: 'text-review-only', sourceHashes,
    axes: RATING_AXES.map((key, index) => ({
      key, score: scores[index], reason: notes[index],
      evidence: [...new Set([...(notes[index].match(/\b(?:S\d|P\d|W)\b/g) ?? sources.map(source => source.key)), 'stats'])],
    })),
    conditions: notes[6], sources,
  }
  if (!validRating(record, id)) throw new Error('Invalid rating or evidence reference: ' + id)
  const file = path.join(output, id + '.json')
  if (fs.existsSync(file)) {
    const previous = readJson(file)
    if (JSON.stringify(previous.sourceHashes) !== JSON.stringify(sourceHashes) && !explicitlyReviewed.has(id)) {
      throw new Error('Source changed; review the character before using --reviewed=' + id)
    }
    if (explicitlyReviewed.has(id)) record.assessedAt = new Date().toISOString().slice(0, 10)
    else record.assessedAt = previous.assessedAt
  }
  return record
})
for (const character of catalogs['zh-CN']) {
  if (!seen.has(character.id)) throw new Error('Missing AI review: ' + character.id)
}
// Validate everything before writing any files. This packs authored AI reviews; it does not infer scores.
fs.mkdirSync(output, { recursive: true })
for (const record of records) fs.writeFileSync(path.join(output, record.id + '.json'), JSON.stringify(record) + '\n')
console.log('Packed ' + records.length + ' AI reviews, ' + records.length * 6 + ' axis explanations.')
