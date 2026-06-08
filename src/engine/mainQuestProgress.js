// Source: compressed from local Master QuestMB.json.
// QuestMB stores a continuous main quest Id and a display Memo such as "13-28".
// This table keeps the calculator independent from the full Master file while
// preserving the same chapter-stage to quest-progress conversion.
const MAIN_QUEST_STAGE_RULES = [
  { from: 1, to: 1, stages: 12 },
  { from: 2, to: 2, stages: 20 },
  { from: 3, to: 3, stages: 24 },
  { from: 4, to: 26, stages: 28 },
  { from: 27, to: 34, stages: 40 },
  { from: 35, to: 56, stages: 60 },
]

const MAIN_QUEST_CHAPTER_STARTS = new Map()
let nextQuestId = 1
for (const rule of MAIN_QUEST_STAGE_RULES) {
  for (let chapter = rule.from; chapter <= rule.to; chapter += 1) {
    MAIN_QUEST_CHAPTER_STARTS.set(chapter, {
      firstQuestId: nextQuestId,
      stages: rule.stages,
    })
    nextQuestId += rule.stages
  }
}

function parsePositiveInt(value) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : null
}

export function parseMainQuestProgress(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  const text = String(value || '').trim()
  if (!text) return 0

  const questId = parsePositiveInt(text)
  if (questId !== null) return questId

  const match = text.match(/^(\d+)-(\d+)$/)
  if (!match) return 0

  const chapter = Number(match[1])
  const stage = Number(match[2])
  const chapterRule = MAIN_QUEST_CHAPTER_STARTS.get(chapter)
  if (!chapterRule || stage < 1 || stage > chapterRule.stages) {
    return chapter * 1000 + stage
  }

  return chapterRule.firstQuestId + stage - 1
}

export function mainQuestStageCount(chapter) {
  return MAIN_QUEST_CHAPTER_STARTS.get(Number(chapter))?.stages || null
}

export function mainQuestProgressRules() {
  return MAIN_QUEST_STAGE_RULES.map(rule => ({ ...rule }))
}
