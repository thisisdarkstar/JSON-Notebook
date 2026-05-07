export function getNestedKeys(value: unknown): string[] {
  if (Array.isArray(value)) {
    const keySet = new Set<string>()
    for (const item of value) {
      if (item && typeof item === 'object') {
        for (const k of Object.keys(item as object)) {
          keySet.add(k)
        }
      }
    }
    return Array.from(keySet)
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
  }
  return []
}

export function resolveSpreadValue(
  value: unknown,
  childKey: string,
): unknown {
  if (Array.isArray(value)) {
    const results: unknown[] = []
    for (const item of value) {
      if (item && typeof item === 'object' && childKey in (item as object)) {
        results.push((item as Record<string, unknown>)[childKey])
      }
    }
    if (results.length === 0) return null
    if (results.length === 1) return results[0]
    return results
  }
  if (value && typeof value === 'object' && childKey in value) {
    return (value as Record<string, unknown>)[childKey]
  }
  return null
}
