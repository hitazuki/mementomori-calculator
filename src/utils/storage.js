/** Storage can be unavailable in privacy modes; preferences must not block startup. */
/** @param {string} key @returns {string | null} */
export function readStorage(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

/** @param {string} key @param {string} value @returns {boolean} */
export function writeStorage(key, value) {
  try { localStorage.setItem(key, value); return true } catch { return false }
}

/** @param {string} key */
export function removeStorage(key) {
  try { localStorage.removeItem(key) } catch { /* Preferences remain usable in memory. */ }
}
