import test from 'node:test'
import assert from 'node:assert/strict'
import { RAID_TABLE_CHARACTER_IDS, RAID_TABLE_CHARACTERS } from '../src/constants/raidTableCharacters.js'
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
  assert.equal(detail.mbTexts[0].source, 'ActiveSkillMB')
  assert.equal(detail.mbTexts[0].slot, 'S1')
  assert.match(detail.mbTexts[0].memo, /Lv1/)
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

test('raid character detail exposes every available active and passive MB memo verbatim', () => {
  const detail = buildRaidCharacterDetail(RAID_TABLE_CHARACTERS[RAID_TABLE_CHARACTER_IDS.CORDIE])

  assert.deepEqual(detail.mbTexts.map(skill => [skill.slot, skill.source, skill.id]), [
    ['S1', 'ActiveSkillMB', 27001],
    ['S2', 'ActiveSkillMB', 27002],
    ['P1', 'PassiveSkillMB', 27003],
    ['P2', 'PassiveSkillMB', 27004],
  ])
  assert.equal(detail.mbTexts[0].memo, 'コルディSR: /Lv1　早撃ちの演目は得意中の得意。ランダムな敵に4回攻撃力×420%の物理攻撃を行う。　/Lv2 さらにこのスキルで敵を戦闘不能にした場合、1ターンの間自身の攻撃力が50％増加する。　/Lv3 物理攻撃のダメージが攻撃力×570%になる。　/専用1 クイック&デッドを強化する。さらに物理攻撃前に2ターンの間対象の防御力を80％減少させる。　/専用2 クイック&デッドを強化する。『防御力減少』と『攻撃力増加』のターン数がそれぞれ3ターンになる。　/専用3 クイック&デッドを強化する。物理攻撃の回数が5回になる。')
})
