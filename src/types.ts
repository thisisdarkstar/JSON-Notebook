export interface FileData {
  data: Record<string, unknown>[]
  fieldOrder: string[]
  visibleFields: string[]
  sortColumn: string | null
  sortDirection: 'asc' | 'desc' | null
  spreadFields: Record<string, string[]>
  colFilters: Record<string, string>
  colWidths: Record<string, number>
}

export interface NotebookState {
  files: Record<string, FileData>
  activeFile: string | null
  searchQuery: string
  theme: 'dark' | 'light'
  sidebarOpen: boolean
}

export interface NotebookActions {
  importJson: (filename: string, data: Record<string, unknown>[]) => void
  removeFile: (filename: string) => void
  setActiveFile: (filename: string | null) => void
  toggleField: (field: string) => void
  reorderFields: (fieldOrder: string[]) => void
  setSort: (column: string) => void
  setSearchQuery: (query: string) => void
  setTheme: (theme: 'dark' | 'light') => void
  toggleSidebar: () => void
  clearAll: () => void
  addSpread: (parentField: string, childKeys: string[]) => void
  removeSpread: (parentField: string, childKey: string) => void
  setColFilter: (column: string, value: string) => void
  setColWidth: (column: string, width: number) => void
}
