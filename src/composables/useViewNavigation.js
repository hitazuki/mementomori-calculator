import { computed, onScopeDispose, ref } from 'vue'
import { readStorage, writeStorage } from '../utils/storage.js'
import { parseViewHash } from '../utils/viewRoutes.js'

export function useViewNavigation(viewIds) {
  const saved = readStorage('mmt-calc-current-view')
  const initial = parseViewHash(location.hash, viewIds)
    ?? (!location.hash && viewIds.includes(saved) ? saved : 'home')
  const view = ref(initial)
  if (!parseViewHash(location.hash, viewIds)) history.replaceState(null, '', `#${initial}`)

  function readRoute() {
    view.value = parseViewHash(location.hash, viewIds) ?? 'home'
    if (!parseViewHash(location.hash, viewIds)) history.replaceState(null, '', '#home')
    writeStorage('mmt-calc-current-view', view.value)
  }
  function navigateTo(viewId) {
    if (!viewIds.includes(viewId) || viewId === view.value) return
    location.hash = viewId
    readRoute()
  }
  window.addEventListener('hashchange', readRoute)
  onScopeDispose(() => window.removeEventListener('hashchange', readRoute))
  return { currentView: computed({ get: () => view.value, set: navigateTo }), navigateTo }
}
