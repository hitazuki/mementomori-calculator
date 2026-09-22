/**
 * Separate request ordering from Vue so it can be tested without a browser.
 * @template T
 * @param {{load: (language: string) => Promise<T>, apply: (language: string, messages: T) => void, reportError: (error: unknown) => void}} options
 */
export function createLanguageLoader({ load, apply, reportError }) {
  let version = 0
  return async (/** @type {string} */ language) => {
    const current = ++version
    try {
      const messages = await load(language)
      if (current === version) apply(language, messages)
      return current === version
    } catch (error) {
      if (current === version) reportError(error)
      return false
    }
  }
}
