export const NO_EXPIRY_BATCH_KEY = 'no-expiry'

export function isSerialCodeActive(item, now = Date.now()) {
  if (!item.enabled) return false
  if (item.validFrom && now < Date.parse(item.validFrom)) return false
  if (item.expiresAt && now > Date.parse(item.expiresAt)) return false
  return true
}

export function groupSerialCodesByExpiry(codes, now = Date.now()) {
  const batches = new Map()

  for (const item of codes.filter(code => isSerialCodeActive(code, now))) {
    const key = item.expiresAt || NO_EXPIRY_BATCH_KEY
    if (!batches.has(key)) {
      batches.set(key, {
        key,
        expiresAt: item.expiresAt,
        codes: [],
      })
    }
    batches.get(key).codes.push(item)
  }

  return [...batches.values()].sort((left, right) => {
    if (!left.expiresAt && !right.expiresAt) return 0
    if (!left.expiresAt) return 1
    if (!right.expiresAt) return -1
    return Date.parse(left.expiresAt) - Date.parse(right.expiresAt)
  })
}
