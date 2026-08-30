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
