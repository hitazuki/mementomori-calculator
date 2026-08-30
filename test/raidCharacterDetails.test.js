import test from 'node:test'
import assert from 'node:assert/strict'
import { RAID_TABLE_CHARACTER_IDS, RAID_TABLE_CHARACTERS } from '../src/constants/raidTableCharacters.js'
import { loadRaidCharacterMbTexts } from '../src/constants/raid/characterMbTexts.js'
import { raidTranslations } from '../src/locales/raid.js'
import { buildRaidCharacterDetail } from '../src/utils/raidCharacterDetails.js'

test('raid character detail collects modeled skills, effects, and ignored mechanics', () => {
  const detail = buildRaidCharacterDetail(RAID_TABLE_CHARACTERS[RAID_TABLE_CHARACTER_IDS.FLORENCE])

  assert.equal(detail.id, RAID_TABLE_CHARACTER_IDS.FLORENCE)
  assert.equal(detail.skills.length, 2)
  assert.deepEqual(detail.skills[0].damageSteps[0].hits, { min: 6, max: 10, dynamic: true })
  assert.deepEqual(detail.skills[0].effectNameKeys, ['raidDebuffFlorenceCriticalResistDown'])
  assert.deepEqual(detail.skills[0].effectItems[0].bossRates, [])
  assert.deepEqual(detail.skills[1].ignoredKeys, ['raidIgnoredKillFollowup'])
  assert.deepEqual(detail.passiveNameKeys, ['raidBuffFlorenceAttack', 'raidBuffFlorenceDamage'])
  assert.deepEqual(detail.passiveItems.map(item => item.modifiers[0].rate.min), [0.3, 0.3])
})

test('raid character detail preserves support skills without damage steps', () => {
  const detail = buildRaidCharacterDetail(RAID_TABLE_CHARACTERS[RAID_TABLE_CHARACTER_IDS.MERLYN])
  const skill = detail.skills[0]

  assert.equal(skill.damageType, 'support')
  assert.deepEqual(skill.damageSteps, [])
  assert.deepEqual(skill.effectNameKeys, [
    'raidBuffMerlynAttack',
    'raidIgnoredDebuffCleanse',
    'raidBuffMerlynCriticalDamage',
  ])
  assert.deepEqual(skill.effectItems[0].modifiers[0].rate, { min: 0.4, max: 0.4, dynamic: false })
})

test('raid character details preserve targets, timing, and conditions for every included character', () => {
  const supportedTargets = new Set([
    'adjacent', 'all', 'allOther', 'boss', 'event', 'eventSource', 'highestBuffCount', 'highestBuffCountOther',
    'highestSpeedOther', 'internal', 'lowestSpeedOther', 'lowestSpeedOthers', 'self', 'selfAndLowestSpeedOthers',
    'selfAndTopAttackOther', 'topAttack', 'topAttackOther',
  ])
  const supportedTriggers = new Set([
    'actionEnd', 'actionStart', 'afterCriticalHit', 'afterDamage', 'afterDamageStep', 'afterHit', 'battleStart',
    'beforeDamage', 'event', 'permanent', 'roundStart',
  ])
  const supportedConditions = new Set([
    'actorHasStatus', 'actorRemovableBuffCountAtLeast', 'anyRemovableBuffCountAtLeast', 'bossElementIs',
    'bossStacksAtLeast', 'bossStatusCountAtLeast', 'configuredActivationRoundReached', 'counterAtLeast',
    'counterAtMost', 'counterBeforeActionAtLeast', 'eventSourceHasStatus', 'eventSourceIsOwner',
    'eventTargetsIncludeOwner', 'guaranteedCritical', 'otherLineupElementCountAtLeast', 'probabilityEnabled',
    'roundAtLeast', 'roundAtMost', 'skillUsesAtLeast', 'skillUsesAtMost', 'targetElementIn',
    'targetElementNot', 'targetElementNotIn', 'targetHasStatus', 'targetLacksStatus',
    'targetRemovableDebuffCountAtMost',
  ])

  assert.equal(Object.keys(RAID_TABLE_CHARACTERS).length, 47)
  for (const character of Object.values(RAID_TABLE_CHARACTERS)) {
    const detail = buildRaidCharacterDetail(character)
    const effects = [...detail.passiveItems, ...detail.skills.flatMap(skill => skill.effectItems)]
    for (const effect of effects) {
      assert.ok(supportedTargets.has(effect.target), `unsupported detail target ${effect.target} on ${character.id}:${effect.nameKey}`)
      assert.ok(supportedTriggers.has(effect.trigger), `unsupported detail trigger ${effect.trigger} on ${character.id}:${effect.nameKey}`)
      for (const condition of [...effect.conditions, ...effect.targetConditions]) {
        assert.ok(supportedConditions.has(condition.type), `unsupported detail condition ${condition.type} on ${character.id}:${effect.nameKey}`)
      }
    }
  }
})

test('raid character damage summaries distinguish damage groups from actual hit counts', () => {
  let skillCount = 0
  let damageGroupCount = 0

  for (const character of Object.values(RAID_TABLE_CHARACTERS)) {
    const detail = buildRaidCharacterDetail(character)
    skillCount += detail.skills.length
    for (const skill of detail.skills) {
      damageGroupCount += skill.damageSteps.length
      for (const step of skill.damageSteps) {
        assert.ok(Number.isFinite(step.hits.min))
        assert.ok(Number.isFinite(step.hits.max))
        assert.ok(step.hits.min <= step.hits.max)
      }
    }
  }

  assert.equal(skillCount, 94)
  assert.equal(damageGroupCount, 97)
  assert.equal(raidTranslations['zh-CN'].raidCharacterDamageStep, '伤害组 {n}')
  assert.equal(raidTranslations['zh-CN'].raidCharacterDamageFormula, '{hits}段 · 每段{percent} {stat}')
  assert.equal(raidTranslations.en.raidCharacterDamageStep, 'Damage Group {n}')
})

test('Luke critical resistance entries identify their different recipients and durations', () => {
  const detail = buildRaidCharacterDetail(RAID_TABLE_CHARACTERS[RAID_TABLE_CHARACTER_IDS.LUKE])
  const criticalResist = detail.passiveItems.filter(item => item.nameKey === 'raidBuffLukeCriticalResist')

  assert.deepEqual(criticalResist.map(item => ({ target: item.target, targetCount: item.targetCount, duration: item.duration, trigger: item.trigger })), [
    { target: 'self', targetCount: null, duration: 4, trigger: 'battleStart' },
    { target: 'adjacent', targetCount: 1, duration: 3, trigger: 'battleStart' },
  ])
})

test('raid character detail data exposes localized active, passive, and exclusive MB text', async () => {
  const zhCn = await loadRaidCharacterMbTexts('zh-CN')
  const en = await loadRaidCharacterMbTexts('en')
  const ja = await loadRaidCharacterMbTexts('ja')
  const detail = zhCn[RAID_TABLE_CHARACTER_IDS.CORDIE]

  assert.deepEqual(detail.map(skill => [skill.slot, skill.source, skill.id]), [
    ['S1', 'ActiveSkillMB', 27001],
    ['S2', 'ActiveSkillMB', 27002],
    ['P1', 'PassiveSkillMB', 27003],
    ['P2', 'PassiveSkillMB', 27004],
  ])
  assert.equal(detail[0].name, '致命快感')
  assert.equal(en[RAID_TABLE_CHARACTER_IDS.CORDIE][0].name, 'The Quick & The Dead')
  assert.equal(ja[RAID_TABLE_CHARACTER_IDS.CORDIE][0].name, 'クイック&デッド')
  assert.equal(detail[0].levels[3].text, '强化致命快感，发动攻击前使技能目标额外减少80%防御力，效果持续1回合。')
  assert.deepEqual(detail[0].levels.slice(3).map(level => [level.type, level.level]), [
    ['exclusive', 1], ['exclusive', 2], ['exclusive', 3],
  ])
})
