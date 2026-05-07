export function extractArrayData(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]

  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
        return val as Record<string, unknown>[]
      }
    }
    return [obj]
  }

  return []
}

export function getAllFields(data: Record<string, unknown>[]): string[] {
  const fields = new Set<string>()
  for (const row of data) {
    for (const key of Object.keys(row)) {
      fields.add(key)
    }
  }
  return Array.from(fields)
}

export function isUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
