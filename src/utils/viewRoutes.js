/** @param {string} hash @param {string[]} viewIds @returns {string | null} */
export function parseViewHash(hash, viewIds) {
  const match = /^#([A-Za-z][A-Za-z0-9]*)(?:\/([1-9]\d*))?$/.exec(hash)
  if (!match || !viewIds.includes(match[1])) return null
  if (match[2] && match[1] !== 'characters') return null
  return match[1]
}
