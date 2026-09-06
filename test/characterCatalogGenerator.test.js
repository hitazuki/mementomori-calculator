import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import test from 'node:test'
import assert from 'node:assert/strict'

test('catalog preserves all weapon tiers independently of hidden or repeated skill associations', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-exclusive-'))
  try {
    const write = (name, value) => fs.writeFileSync(path.join(temp, name + 'MB.json'), JSON.stringify(value))
    write('Character', [{ Id: 123, NameKey: 'name', ActiveSkillIds: [1], PassiveSkillIds: [2] }])
    write('ActiveSkill', [{ Id: 1, NameKey: 'skill', ActiveSkillInfos: [
      { EquipmentRarityFlags: 0, OrderNumber: 1, DescriptionKey: 'base', CharacterLevel: 1 },
      { EquipmentRarityFlags: 128, DescriptionKey: 'base' },
      { EquipmentRarityFlags: 512, DescriptionKey: 'base' },
    ] }])
    write('PassiveSkill', [{ Id: 2, NameKey: '*', PassiveSkillInfos: [{ EquipmentRarityFlags: 256, DescriptionKey: '*' }] }])
    write('EquipmentExclusiveEffect', [{ Id: 7, CharacterId: 123 }])
    write('Equipment', [{ ExclusiveEffectId: 7, EquipmentExclusiveSkillDescriptionId: 9 }])
    write('EquipmentExclusiveSkillDescription', [{ Id: 9, Description1Key: 'e1', Description2Key: 'e2', Description3Key: 'e3' }])
    for (const locale of ['ZhCn', 'ZhTw', 'EnUs', 'JaJp', 'KoKr']) {
      write('TextResource' + locale, ['name', 'skill', 'base', 'e1', 'e2', 'e3'].map(key => ({ StringKey: key, Text: key })))
    }
    execFileSync(process.execPath, ['scripts/generate_character_catalog.mjs', temp, path.join(temp, 'out')])
    const character = JSON.parse(fs.readFileSync(path.join(temp, 'out/zh-CN.json'))).characters[0]
    assert.deepEqual(character.exclusiveEffects, [1, 2, 3].map(level => ({ level, text: 'e' + level })))
    assert.equal(character.skills.length, 1)
    assert.deepEqual(character.skills[0].levels.map(level => level.type), ['level'])
    write('TextResourceZhCn', [{ StringKey: 'name', Text: 'name' }])
    assert.throws(() => execFileSync(process.execPath, ['scripts/generate_character_catalog.mjs', temp, path.join(temp, 'out')], { stdio: 'pipe' }), /Missing zh-CN exclusive description/)
  } finally {
    fs.rmSync(temp, { recursive: true, force: true })
  }
})
