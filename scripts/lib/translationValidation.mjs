/** Validate resolved messages, including keys provided by module spreads. */
export function validateTranslations(messages) {
  const errors = []
  const locales = Object.keys(messages)
  const keys = new Set(Object.values(messages).flatMap(Object.keys))
  for (const key of keys) {
    let expected
    for (const locale of locales) {
      const value = messages[locale][key]
      if (typeof value !== 'string' || !value.trim()) {
        errors.push(`${locale}: missing or empty translation ${key}`)
        continue
      }
      const params = [...new Set([...value.matchAll(/\{\s*([\w]+)\s*\}/g)].map(match => match[1]))].sort().join(',')
      expected ??= params
      if (params !== expected) errors.push(`${locale}: placeholder mismatch ${key}: {${params}}; expected {${expected}}`)
    }
  }
  return { errors, keyCount: keys.size }
}
