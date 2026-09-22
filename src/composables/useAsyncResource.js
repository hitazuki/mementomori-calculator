import { onScopeDispose, ref, shallowRef } from 'vue'

/**
 * Each retry supersedes the previous request, including loaders that ignore abort.
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} loader
 * @param {T} initialValue
 */
export function useAsyncResource(loader, initialValue) {
  const data = shallowRef(initialValue)
  const loading = ref(false)
  /** @type {import('vue').ShallowRef<unknown>} */
  const error = shallowRef(null)
  let version = 0
  /** @type {AbortController | undefined} */
  let controller

  async function load() {
    const current = ++version
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    error.value = null
    try {
      const value = await loader(controller.signal)
      if (current === version) data.value = value
    } catch (cause) {
      if (current === version) error.value = cause
    } finally {
      if (current === version) loading.value = false
    }
  }

  onScopeDispose(() => { version++; controller?.abort() })
  return { data, loading, error, load }
}
