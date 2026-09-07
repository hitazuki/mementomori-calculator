import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { RATING_AXES, RATING_VERSION, RATING_MAX, ratingSource, validRating } from '../src/utils/characterRatings.js'
import { compareSurvival, SURVIVAL_SCENARIOS } from '../src/utils/characterSurvival.js'

const root = path.resolve(import.meta.dirname, '..')
const output = path.join(root, 'public/data/character-ratings')
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const locales = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko']
const catalogs = Object.fromEntries(locales.map(locale => [locale, readJson(path.join(root, 'public/data/character-catalog', locale + '.json')).characters]))
const reviews = fs.readFileSync(path.join(root, 'doc/character-ratings/reviews.txt'), 'utf8').trim().split(/\r?\n/)
const explicitlyReviewed = new Set((process.argv.find(arg => arg.startsWith('--reviewed=')) ?? '').split('=')[1]?.split(',').map(Number) ?? [])
const digest = source => createHash('sha256').update(JSON.stringify(source)).digest('hex')
const seen = new Set()
const assessmentFile = readJson(path.join(root, 'doc/character-ratings/v5/review.json'))
const assessments = new Map(assessmentFile.records.map(record => [record.id, record]))
const profiles = {}
for (const kind of ['survival']) {
  const data = readJson(path.join(root, 'doc/character-ratings', kind + '-profiles.json'))
  profiles[kind] = new Map()
  for (const profile of data.profiles) {
    if (profiles[kind].has(profile.id) || !catalogs['zh-CN'].some(c => c.id === profile.id)) throw new Error('Invalid reference profile ID: ' + profile.id)
    profiles[kind].set(profile.id, { ...profile, version: data.version, reviewedAt: data.reviewedAt })
  }
}
const records = reviews.map(line => {
  const parts = line.split('|')
  if (parts.length !== 10) throw new Error('Expected ID, six scores, six reasons, conditions and authored tags: ' + line.slice(0, 30))
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
    schemaVersion: 2, id, rubricVersion: RATING_VERSION, scaleMax: RATING_MAX, assessmentType: 'ai-editorial',
    author: 'GPT-6 / Codex', assessedAt: '2026-09-07', rationaleLocale: 'zh-CN',
    verification: 'text-review-only', sourceHashes,
    axes: RATING_AXES.map((key, index) => ({
      key, score: scores[index], reason: notes[index],
      evidence: [...new Set([...(notes[index].match(/\b(?:S\d|P\d|W)\b/g) ?? sources.map(source => source.key)), 'stats'])],
    })),
    conditions: notes[6], sources,
    tags: notes[7].split(',').map(tag => {
      const [key, refs] = tag.split('@')
      return { key, evidence: refs?.split('+') ?? [] }
    }),
  }
  const assessment = assessments.get(id)
  if (!assessment || assessment.sourceHash !== digest(source) || assessment.rubricVersion !== RATING_VERSION ||
      assessment.axes.some((axis, index) => axis.score !== scores[index] || axis.reason !== notes[index])) throw new Error('Full v5 assessment needs review: ' + id)
  record.assessment = {
    axes: assessment.axes.map(({oldScore,...axis})=>axis),
    growth: assessment.output.growth, lifecycle: assessment.output.lifecycle,
    shortTermProtection: assessment.survival.shortTermProtection,
    effectiveSustain: assessment.survival.effectiveSustain,
  }
  const quantitative = { finalOutput: assessment.output }
  for (const kind of ['survival']) {
    const profile = profiles[kind].get(id)
    if (!profile) continue
    for (const state of profile.states) {
      if (!state.label || !state.evidence.length || state.evidence.some(key => !sources.some(source => source.key === key))) throw new Error('Invalid reference evidence: ' + id)
    }
    if (kind === 'survival' && profile.score !== scores[2]) throw new Error('Survival score disagrees with authored review: ' + id)
    quantitative[kind] = {
      version: profile.version, reviewedAt: profile.reviewedAt, note: profile.note,
      assumptions: SURVIVAL_SCENARIOS,
      states: compareSurvival(profile.states),
    }
  }
  if (Object.keys(quantitative).length) {
    record.quantitative = quantitative
    record.verification = 'text-review-with-reference-calculation'
  }
  if (!validRating(record, id)) throw new Error('Invalid rating or evidence reference: ' + id)
  const file = path.join(output, id + '.json')
  if (fs.existsSync(file)) {
    const previous = readJson(file)
    if (JSON.stringify(previous.sourceHashes) !== JSON.stringify(sourceHashes) && !explicitlyReviewed.has(id)) {
      throw new Error('Source changed; review the character before using --reviewed=' + id)
    }
    if (explicitlyReviewed.has(id)) record.assessedAt = new Date().toISOString().slice(0, 10)
    else if (previous.rubricVersion === RATING_VERSION) record.assessedAt = previous.assessedAt
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
