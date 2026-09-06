import test from 'node:test'
import assert from 'node:assert/strict'
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
