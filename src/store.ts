import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NotebookState, NotebookActions } from './types'

type Store = NotebookState & NotebookActions

function extractFields(data: Record<string, unknown>[]): string[] {
  const fieldSet = new Set<string>()
  for (const row of data) {
    for (const key of Object.keys(row)) {
      fieldSet.add(key)
    }
  }
  return Array.from(fieldSet)
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      files: {},
      activeFile: null,
      searchQuery: '',
      theme: 'dark',
      sidebarOpen: true,

      importJson: (filename: string, data: Record<string, unknown>[]) => {
        const fields = extractFields(data)
        set((state) => ({
          files: {
            ...state.files,
            [filename]: {
              data,
              fieldOrder: fields,
              visibleFields: fields,
              sortColumn: null,
              sortDirection: null,
              spreadFields: {},
              colFilters: {},
              colWidths: {},
            },
          },
          activeFile: filename,
        }))
      },

      removeFile: (filename: string) => {
        set((state) => {
          const { [filename]: _, ...rest } = state.files
          const keys = Object.keys(rest)
          return {
            files: rest,
            activeFile: keys.length > 0 ? keys[0] : null,
          }
        })
      },

      setActiveFile: (filename: string | null) => {
        set({ activeFile: filename, searchQuery: '' })
      },

      toggleField: (field: string) => {
        set((state) => {
          if (!state.activeFile || !state.files[state.activeFile]) return state
          const file = state.files[state.activeFile]
          const visibleFields = file.visibleFields.includes(field)
            ? file.visibleFields.filter((f) => f !== field)
            : [...file.visibleFields, field]
          return {
            files: {
              ...state.files,
              [state.activeFile]: { ...file, visibleFields },
            },
          }
        })
      },

      reorderFields: (fieldOrder: string[]) => {
        set((state) => {
          if (!state.activeFile || !state.files[state.activeFile]) return state
          const file = state.files[state.activeFile]
          return {
            files: {
              ...state.files,
              [state.activeFile]: { ...file, fieldOrder },
            },
          }
        })
      },

      setSort: (column: string) => {
        set((state) => {
          if (!state.activeFile || !state.files[state.activeFile]) return state
          const file = state.files[state.activeFile]
          let sortDirection: 'asc' | 'desc' | null
          if (file.sortColumn !== column) {
            sortDirection = 'asc'
          } else if (file.sortDirection === 'asc') {
            sortDirection = 'desc'
          } else {
            sortDirection = null
          }
          return {
            files: {
              ...state.files,
              [state.activeFile]: {
                ...file,
                sortColumn: sortDirection ? column : null,
                sortDirection,
              },
            },
          }
        })
      },

      setSearchQuery: (query: string) => set({ searchQuery: query }),

      setTheme: (theme: 'dark' | 'light') => set({ theme }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      clearAll: () => {
        set({
          files: {},
          activeFile: null,
          searchQuery: '',
        })
      },

      addSpread: (parentField: string, childKeys: string[]) => {
        set((state) => {
          if (!state.activeFile || !state.files[state.activeFile]) return state
          const file = state.files[state.activeFile]
          const existing = file.spreadFields[parentField] ?? []
          const merged = [...new Set([...existing, ...childKeys])]
          return {
            files: {
              ...state.files,
              [state.activeFile]: {
                ...file,
                spreadFields: { ...file.spreadFields, [parentField]: merged },
              },
            },
          }
        })
      },

      removeSpread: (parentField: string, childKey: string) => {
        set((state) => {
          if (!state.activeFile || !state.files[state.activeFile]) return state
          const file = state.files[state.activeFile]
          const existing = file.spreadFields[parentField] ?? []
          const remaining = existing.filter((k) => k !== childKey)
          const newSpread = { ...file.spreadFields }
          if (remaining.length === 0) {
            delete newSpread[parentField]
          } else {
            newSpread[parentField] = remaining
          }
          return {
            files: {
              ...state.files,
              [state.activeFile]: { ...file, spreadFields: newSpread },
            },
          }
        })
      },

      setColFilter: (column: string, value: string) => {
        set((state) => {
          if (!state.activeFile || !state.files[state.activeFile]) return state
          const file = state.files[state.activeFile]
          return {
            files: {
              ...state.files,
              [state.activeFile]: {
                ...file,
                colFilters: { ...file.colFilters, [column]: value },
              },
            },
          }
        })
      },

      setColWidth: (column: string, width: number) => {
        set((state) => {
          if (!state.activeFile || !state.files[state.activeFile]) return state
          const file = state.files[state.activeFile]
          return {
            files: {
              ...state.files,
              [state.activeFile]: {
                ...file,
                colWidths: { ...file.colWidths, [column]: width },
              },
            },
          }
        })
      },
    }),
    {
      name: 'json-notebook-storage',
      version: 3,
      migrate: (persistedState: unknown) => {
        const state = persistedState as Record<string, unknown>
        const files = state.files as Record<string, Record<string, unknown>> | undefined
        if (files) {
          for (const key of Object.keys(files)) {
            if (!files[key].spreadFields) {
              files[key].spreadFields = {}
            }
            if (!files[key].colFilters) {
              files[key].colFilters = {}
            }
            if (!files[key].colWidths) {
              files[key].colWidths = {}
            }
          }
        }
        return state
      },
    },
  ),
)
