import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { filterCharacters } from '../src/utils/characterCatalog.js'
import { NAV_GROUPS, findModuleByView } from '../src/constants/navigation.js'

const characters = [
  { id: 3, name: 'B', title: 'Winter', element: 1, speed: 3000 },
  { id: 2, name: 'A', title: '', element: 3, speed: 3500 },
  { id: 1, name: 'C', title: '', element: 1, speed: 3000 },
]
test('catalog combines element and case-insensitive search without mutating source', () => {
  assert.deepEqual(filterCharacters(characters, { element: 1, search: ' WINTER ' }).map(c => c.id), [3])
  assert.deepEqual(filterCharacters(characters, { element: 3, search: 'Winter' }), [])
  assert.deepEqual(filterCharacters(characters, { search: '2' }).map(c => c.id), [2])
  assert.deepEqual(filterCharacters(characters, { sort: 'speed' }).map(c => c.id), [2, 1, 3])
  assert.deepEqual(characters.map(c => c.id), [3, 2, 1])
})
test('catalog has its own navigation group, outside raid analysis', () => {
  assert.equal(NAV_GROUPS[0].id, 'characters')
  assert.equal(findModuleByView('characters').labelKey, 'catalogTitle')
})

test('Actions-generated catalog has matching complete records in every language', () => {
  let expected
  for (const locale of ['zh-CN', 'zh-TW', 'en', 'ja', 'ko']) {
    const data = JSON.parse(fs.readFileSync(new URL(`../public/data/character-catalog/${locale}.json`, import.meta.url)))
    assert.equal(data.schemaVersion, 1)
    assert.ok(data.characters.length > 100)
    const ids = data.characters.map(character => character.id)
    assert.equal(new Set(ids).size, ids.length)
    const signature = data.characters.map(character => [character.id, character.exclusiveEffects.map(effect => effect.level), character.skills.map(skill => [skill.id, skill.slot, skill.levels.map(level => [level.type, level.level])])])
    if (expected) assert.deepEqual(signature, expected)
    expected = signature
    assert.deepEqual(data.characters.find(character => character.id === 123).exclusiveEffects.map(effect => effect.level), [1, 2, 3])
    for (const character of data.characters) {
      assert.ok(character.name && [1, 2, 3, 4, 5, 6].includes(character.element))
      assert.ok([1, 2, 4].includes(character.job) && character.speed > 0)
      assert.ok(character.skills.length)
      assert.ok(character.exclusiveEffects.every(effect => effect.text && [1, 2, 3].includes(effect.level)))
      assert.equal(new Set(character.exclusiveEffects.map(effect => effect.level)).size, character.exclusiveEffects.length)
      for (const skill of character.skills) {
        assert.ok(skill.name && skill.levels.length)
        assert.ok(skill.levels.every(level => level.text && level.level > 0))
      }
    }
  }
})
