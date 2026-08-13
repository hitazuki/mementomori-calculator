import test from 'node:test'
import assert from 'node:assert/strict'

import { RAID_TABLE_CHARACTER_IDS, RAID_TABLE_CHARACTERS } from '../src/constants/raidTableCharacters.js'
import { simulateRaidTable } from '../src/engine/raidTableCalc.js'
import { buildRaidExportModel, canCopyPng, copyPngBlob, raidExportFilename } from '../src/utils/raidExport.js'

const { FLORENCE, LUKE } = RAID_TABLE_CHARACTER_IDS

function model(result, lineup, attackPriority, generatedAt = new Date('2026-08-13T17:45:00+08:00')) {
  return buildRaidExportModel({
    result, lineup, attackPriority, characters: RAID_TABLE_CHARACTERS,
    bossName: '索尼娅', bossStats: 'Lv240 · DEF 200,000', generatedAt, locale: 'zh-CN',
    characterName: id => `character-${id}`, skillName: key => key, iconUrl: id => `/images/${id}.png`,
    turnLabel: turn => `第${turn}回合`,
    formatPercent: value => `${value}% ATK`,
    formatSymbolic: totals => Object.keys(totals).length ? JSON.stringify(totals) : '—',
    formatConversionTotals: totals => Object.values(totals).map(term => `${term.value}% ${term.stat}`),
    bossStatusText: status => status.id,
    elementBonusLines: ['element bonus'], scenarioLines: ['critical enabled'], warningLines: ['normalized'],
    labels: { title: 'Raid export', generatedAt: 'Generated' },
  })
}

test('raid export model preserves lineup, attack priority, panels, rounds, manual order, statuses, and totals', () => {
  const lineup = [FLORENCE, LUKE]
  const attackPriority = [LUKE, FLORENCE]
  const result = simulateRaidTable({
    lineup, attackPriority, turns: 10,
    actionOrderOverrides: { 2: [LUKE, FLORENCE] },
    speeds: { [FLORENCE]: 3200, [LUKE]: 3100 },
    levels: { [FLORENCE]: 500, [LUKE]: 480 },
    criticalDamageBonuses: { [FLORENCE]: 1.1, [LUKE]: 1.25 },
    defensePenetrations: { [FLORENCE]: 11950, [LUKE]: 12000 },
    pmDefensePenetrations: { [FLORENCE]: 72700, [LUKE]: 65700 },
  })
  const output = model(result, lineup, attackPriority)

  assert.deepEqual(output.lineup.map(item => item.id), lineup)
  assert.deepEqual(output.attackPriority.map(item => item.id), attackPriority)
  assert.equal(output.rows[1].panel.level, 480)
  assert.equal(output.rows[1].panel.criticalDamage, 125)
  assert.equal(output.rows[0].actions.length, 10)
  assert.equal(output.rounds[1].orderSource, 'manual')
  assert.deepEqual(output.rounds[1].order.map(item => item.id), [LUKE, FLORENCE])
  assert.ok(output.rounds.some(round => round.bossStatuses.length > 0))
  assert.equal(output.totals.attack, `${result.teamAtkPercent}% ATK`)
  assert.deepEqual(output.elementBonusLines, ['element bonus'])
  assert.deepEqual(output.scenarioLines, ['critical enabled'])
})

test('raid export filenames sanitize boss names and use a stable local timestamp', () => {
  const date = new Date(2026, 7, 13, 17, 45)
  assert.equal(raidExportFilename('光士 / Luke:*?', date), 'mmt-raid-光士-Luke-20260813-1745.png')
})

test('PNG clipboard capability and writes are isolated from preview blob lifetime', async () => {
  const writes = []
  class FakeClipboardItem { constructor(data) { this.data = data } }
  const clipboard = { write: async items => { writes.push(items) } }
  const blob = new Blob(['png'], { type: 'image/png' })

  assert.equal(canCopyPng({ secureContext: true, clipboard, ClipboardItemClass: FakeClipboardItem }), true)
  assert.equal(canCopyPng({ secureContext: false, clipboard, ClipboardItemClass: FakeClipboardItem }), false)
  await copyPngBlob(blob, { secureContext: true, clipboard, ClipboardItemClass: FakeClipboardItem })
  assert.equal(writes.length, 1)
  assert.equal(writes[0][0].data['image/png'], blob)
  await assert.rejects(copyPngBlob(blob, { secureContext: false, clipboard, ClipboardItemClass: FakeClipboardItem }), /unavailable/)
})
