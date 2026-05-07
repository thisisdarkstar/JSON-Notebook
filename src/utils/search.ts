function matchesQuery(value: unknown, query: string): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.toLowerCase().includes(query)
  if (typeof value === 'number') return value.toString().includes(query)
  if (Array.isArray(value))
    return value.some((item) => matchesQuery(item, query))
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((v) =>
      matchesQuery(v, query),
    )
  }
  return false
}

export function filterRecords(
  data: Record<string, unknown>[],
  fields: string[],
  query: string,
): Record<string, unknown>[] {
  if (!query.trim()) return data
  const q = query.toLowerCase()
  return data.filter((row) =>
    fields.some((field) => matchesQuery(row[field], q)),
  )
}
