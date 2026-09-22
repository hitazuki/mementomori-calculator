import test from 'node:test'
import assert from 'node:assert/strict'
import { parseViewHash } from '../src/utils/viewRoutes.js'
import { VIEW_DEFINITIONS, NAV_MODULES } from '../src/constants/navigation.js'

const ids = Object.keys(VIEW_DEFINITIONS)
test('all navigation targets have a registered view and valid shareable route', () => {
  for (const item of NAV_MODULES) {
    for (const id of item.matchViews) {
      assert.ok(VIEW_DEFINITIONS[id])
      assert.equal(parseViewHash(`#${id}`, ids), id)
    }
  }
  assert.equal(parseViewHash('#characters/42', ids), 'characters')
  for (const hash of ['#charactersOops', '#characters/0', '#characters/1/2', '#home/42', '#missing', '']) {
    assert.equal(parseViewHash(hash, ids), null)
  }
})
