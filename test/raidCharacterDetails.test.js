import test from 'node:test'
import assert from 'node:assert/strict'
import { RAID_TABLE_CHARACTER_IDS, RAID_TABLE_CHARACTERS } from '../src/constants/raidTableCharacters.js'
import { loadRaidCharacterMbTexts } from '../src/constants/raid/characterMbTexts.js'
import { raidTranslations } from '../src/locales/raid.js'
import { buildRaidCharacterDetail } from '../src/utils/raidCharacterDetails.js'
import { raidDetailValueText } from '../src/utils/raidDetailValueText.js'

const valueTextContext = locale => ({
  t: (key, args = {}) => {
    assert.ok(raidTranslations[locale][key], `missing ${locale}:${key}`)
    return raidTranslations[locale][key].replace(/\{(\w+)\}/g, (_, name) => args[name] ?? '')
  },
  conditionText: condition => `${condition.type} ${condition.round ?? ''}`,
  counterText: key => key,
  elementText: element => String(element ?? ''),
})

test('Eidene details retain zero, per-stack growth, cap and the unmodeled element difference', () => {
  const detail = buildRaidCharacterDetail(RAID_TABLE_CHARACTERS[92])
  const blooms = detail.passiveItems.filter(item => item.type === 'status')
  assert.deepEqual(blooms.map(item => item.modifiers[0].rate), [
    { min: 0, max: 0.75, dynamic: true }, { min: 0, max: 0.75, dynamic: true },
  ])
  assert.equal(raidDetailValueText(blooms[0].modifiers[0].valueSpec, valueTextContext('zh-CN'), 100, '%'), '0% + 5% × vigorousBloom（上限75%）')
  assert.match(raidTranslations['zh-CN'][blooms[0].definition.detailKey], /伤害反弹每层\+1%/)
  assert.match(raidTranslations['zh-CN'][blooms[1].definition.detailKey], /伤害反弹每层\+2%/)
  assert.equal(detail.passiveItems[0].definition.max, 15)
})

test('every included resolver has a localized rule description, including normal attacks and symbolic effects', () => {
  let count = 0
  for (const character of Object.values(RAID_TABLE_CHARACTERS)) {
    const detail = buildRaidCharacterDetail(character)
    assert.ok(detail.normal)
    const skills = [...detail.skills, detail.normal]
    const values = skills.flatMap(skill => skill.damageSteps.flatMap(step => [step.definition.percent, step.definition.hits]))
    for (const effect of [...detail.passiveItems, ...skills.flatMap(skill => skill.effectItems)]) {
      values.push(...effect.modifiers.map(modifier => modifier.valueSpec))
      values.push(...(effect.definition?.symbolicModifiers ?? []).map(modifier => modifier.coefficient))
    }
    for (const value of values.filter(value => value && typeof value === 'object')) {
      count++
      for (const locale of Object.keys(raidTranslations)) {
        const text = raidDetailValueText(value, valueTextContext(locale))
        assert.ok(!text.includes(raidTranslations[locale].raidCharacterDynamicValue), `${character.id}: ${JSON.stringify(value)}`)
        assert.ok(!/undefined|NaN|\{\w+\}/.test(text), text)
      }
    }
  }
  assert.ok(count > 50)
})

test('conditional, threshold and skill-history rules preserve branch meaning and zero hits', () => {
  const florence = buildRaidCharacterDetail(RAID_TABLE_CHARACTERS[8])
  const step = florence.skills[0].damageSteps[0]
  assert.match(raidDetailValueText(step.definition.hits, valueTextContext('zh-CN')), /10；否则：6/)
  const rustica = buildRaidCharacterDetail(RAID_TABLE_CHARACTERS[113])
  assert.equal(raidDetailValueText(rustica.skills[1].damageSteps[0].definition.hits, valueTextContext('zh-CN')), '4 + 1 × S2此前发动次数（上限6）')
  const sivi = buildRaidCharacterDetail(RAID_TABLE_CHARACTERS[52])
  assert.match(raidDetailValueText(sivi.skills[0].effectItems[0].modifiers[0].valueSpec, valueTextContext('zh-CN'), 100, '%'), /0: 30%; 1: 54%; 2: 72%; 3: 84%; ≥4: 90%/)
})

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
