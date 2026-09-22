/**
 * Fetch a bounded JSON request. Callers own caching and user-facing recovery.
 * @template T
 * @param {string} url
 * @param {{ signal?: AbortSignal, timeoutMs?: number, validate?: (value: unknown) => value is T }} [options]
 * @returns {Promise<T>}
 */
export async function fetchJson(url, { signal, timeoutMs = 15000, validate } = {}) {
  const controller = new AbortController()
  const abort = () => controller.abort(signal?.reason)
  if (signal?.aborted) abort()
  else signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (validate && !validate(data)) throw new Error('Invalid data format')
    return data
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
export function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** @param {unknown} value @returns {value is Record<string, string>} */
export function isDictionary(value) {
  return isRecord(value) && Object.values(value).every(entry => typeof entry === 'string')
}
