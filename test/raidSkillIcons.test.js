import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { RAID_SKILL_ICONS } from '../src/constants/raid/skillIcons.js'
import { RAID_TABLE_ROSTER } from '../src/constants/raid/characters/index.js'
import { loadRaidCharacterMbTexts } from '../src/constants/raid/characterMbTexts.js'
import { isValidPng } from '../scripts/sync_assets.js'

test('all raid skill slots share verified local icons across all five languages', async () => {
  assert.equal(Object.keys(RAID_SKILL_ICONS).length, RAID_TABLE_ROSTER.length)
  const checked = new Set()
  for (const locale of ['zh-CN', 'zh-TW', 'en', 'ja', 'ko']) {
    const characters = await loadRaidCharacterMbTexts(locale)
    for (const id of RAID_TABLE_ROSTER) {
      assert.deepEqual(Object.keys(RAID_SKILL_ICONS[id]), characters[id].map(skill => skill.slot))
      for (const skill of characters[id]) {
        const iconId = RAID_SKILL_ICONS[id][skill.slot]
        if (skill.id === 30005) {
          assert.equal(iconId, null, 'weapon passive without an asset must retain its slot label')
          continue
        }
        assert.equal(iconId, skill.id, `${locale}:${id}:${skill.slot}`)
        if (checked.has(iconId)) continue
        const bytes = fs.readFileSync(new URL(`../public/images/skills/${iconId}.png`, import.meta.url))
        assert.ok(isValidPng(bytes), `invalid icon ${iconId}`)
        assert.equal(bytes.readUInt32BE(16), 100)
        assert.equal(bytes.readUInt32BE(20), 100)
        checked.add(iconId)
      }
    }
  }
  assert.equal(checked.size, 188)
})
