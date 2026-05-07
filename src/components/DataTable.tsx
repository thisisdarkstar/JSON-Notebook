import { useRef, useMemo, useState, useEffect } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Download, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useStore } from '../store'
import { filterRecords } from '../utils/search'
import { exportJson } from '../utils/export'
import { resolveSpreadValue } from '../utils/spread'
import TableCell from './TableCell'
import SearchBar from './SearchBar'
import ColumnFilter from './ColumnFilter'

const ROW_HEIGHT = 38
const MIN_COL_WIDTH = 60
const PADDING = 24

interface ColumnDef {
  id: string
  label: string
  getValue: (row: Record<string, unknown>) => unknown
  spreadParent?: string
}

function buildColumns(
  visibleFields: string[],
  spreadFields: Record<string, string[]>,
): ColumnDef[] {
  const columns: ColumnDef[] = []
  for (const field of visibleFields) {
    columns.push({
      id: field,
      label: field,
      getValue: (row) => row[field],
    })
    const spreads = spreadFields[field]
    if (spreads) {
      for (const childKey of spreads) {
        columns.push({
          id: `${field}.${childKey}`,
          label: `${field}.\u00AD${childKey}`,
          getValue: (row) => resolveSpreadValue(row[field], childKey),
          spreadParent: field,
        })
      }
    }
  }
  return columns
}

function estimateColWidths(columns: ColumnDef[], data: Record<string, unknown>[], containerWidth: number) {
  const count = Math.min(data.length, 80)
  const rawWidths = columns.map((col) => {
    let maxLen = col.label.length
    for (let i = 0; i < count; i++) {
      const val = col.getValue(data[i])
      if (val == null) continue
      const str = Array.isArray(val) ? val.map(String).join(', ') : String(val)
      if (str.length > maxLen) maxLen = str.length
    }
    return Math.max(MIN_COL_WIDTH, Math.min(320, maxLen * 7.2))
  })
  const total = rawWidths.reduce((a, b) => a + b, 0) + PADDING
  if (total <= containerWidth) return rawWidths
  const ratio = (containerWidth - PADDING) / rawWidths.reduce((a, b) => a + b, 0)
  return rawWidths.map((w) => Math.max(MIN_COL_WIDTH, Math.round(w * ratio)))
}

export default function DataTable() {
  const activeFile = useStore((s) => s.activeFile)
  const files = useStore((s) => s.files)
  const setSort = useStore((s) => s.setSort)
  const searchQuery = useStore((s) => s.searchQuery)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const setColWidth = useStore((s) => s.setColWidth)
  const colFilters = useStore((s) =>
    s.activeFile && s.files[s.activeFile]
      ? s.files[s.activeFile].colFilters
      : {},
  )
  const savedWidths = useStore((s) =>
    s.activeFile && s.files[s.activeFile]
      ? s.files[s.activeFile].colWidths
      : {},
  )

  if (!activeFile || !files[activeFile]) return null

  const { data, visibleFields, sortColumn, sortDirection } = files[activeFile]
  const spreadFields = files[activeFile].spreadFields ?? {}

  const columns = useMemo(
    () => buildColumns(visibleFields, spreadFields),
    [visibleFields, spreadFields],
  )

  const sorted = useMemo(() => {
    let result = filterRecords(data, visibleFields, searchQuery)

    const activeColFilters = Object.entries(colFilters)
    if (activeColFilters.length > 0) {
      const filterMap = new Map(activeColFilters)
      result = result.filter((row) => {
        for (const [colId, filterVal] of filterMap) {
          if (!filterVal) continue
          const col = columns.find((c) => c.id === colId)
          if (!col) continue
          const cell = col.getValue(row)
          if (cell == null) return filterVal === ''
          const str = Array.isArray(cell)
            ? cell.map(String).join(', ')
            : String(cell)
          if (!str.toLowerCase().includes(filterVal.toLowerCase())) return false
        }
        return true
      })
    }

    if (!sortColumn || !sortDirection) return result
    const modifier = sortDirection === 'asc' ? 1 : -1
    return [...result].sort((a, b) => {
      const col = columns.find((c) => c.id === sortColumn)
      if (!col) return 0
      const aVal = col.getValue(a)
      const bVal = col.getValue(b)
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1 * modifier
      if (bVal == null) return -1 * modifier
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * modifier
      }
      const aStr = Array.isArray(aVal)
        ? aVal.map(String).join(', ')
        : typeof aVal === 'object'
          ? JSON.stringify(aVal)
          : String(aVal)
      const bStr = Array.isArray(bVal)
        ? bVal.map(String).join(', ')
        : typeof bVal === 'object'
          ? JSON.stringify(bVal)
          : String(bVal)
      return aStr.localeCompare(bStr) * modifier
    })
  }, [data, visibleFields, searchQuery, sortColumn, sortDirection, columns, colFilters])

  function handleExport() {
    const exportData = sorted.map((row) => {
      const obj: Record<string, unknown> = {}
      for (const col of columns) {
        obj[col.id] = col.getValue(row)
      }
      return obj
    })
    exportJson(exportData, `${(activeFile as string).replace(/\.json$/, '')}_export.json`)
  }

  const parentRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(800)
  const resizeRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    const el = parentRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const autoWidths = useMemo(
    () => estimateColWidths(columns, sorted, containerWidth),
    [columns, sorted, containerWidth],
  )

  const colWidths = useMemo(() =>
    columns.map((col, i) => savedWidths[col.id] ?? autoWidths[i]),
  [columns, autoWidths, savedWidths])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const r = resizeRef.current
      if (!r) return
      const delta = e.clientX - r.startX
      const newWidth = Math.max(MIN_COL_WIDTH, r.startWidth + delta)
      setColWidth(r.colId, newWidth)
    }
    function onUp() {
      resizeRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [setColWidth])

  function onResizeDown(colId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const idx = columns.findIndex((c) => c.id === colId)
    if (idx < 0) return
    resizeRef.current = {
      colId,
      startX: e.clientX,
      startWidth: colWidths[idx],
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  const totalWidth = colWidths.reduce((a, b) => a + b, 0)

  return (
    <>
      <div className="actions-bar">
        <button className="icon-btn" onClick={toggleSidebar} title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}>
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
        <span className="record-count">
          {sorted.length} / {data.length} records
        </span>
        <button className="btn-sm accent" onClick={handleExport}>
          <Download size={12} /> Export
        </button>
      </div>
      <SearchBar />
      <div className="table-container" ref={parentRef}>
        <div className="virtual-header" style={{ width: totalWidth }}>
          {columns.map((col, ci) => (
            <div
              key={col.id}
              className={`virtual-th ${sortColumn === col.id ? 'sorted' : ''} ${col.spreadParent ? 'virtual-th-spread' : ''} ${colFilters[col.id] ? 'virtual-th-filtered' : ''}`}
              style={{ width: colWidths[ci] }}
              onClick={() => setSort(col.id)}
            >
              <span className="virtual-th-label" title={col.id}>{col.label}</span>
              <ColumnFilter columnId={col.id} data={data} getValue={col.getValue} />
              {sortColumn === col.id ? (
                sortDirection === 'asc' ? (
                  <ArrowUp size={10} className="sort-icon" />
                ) : (
                  <ArrowDown size={10} className="sort-icon" />
                )
              ) : (
                <ArrowUpDown size={10} className="sort-icon" />
              )}
              <div
                className="resize-handle"
                onMouseDown={(e) => onResizeDown(col.id, e)}
              />
            </div>
          ))}
        </div>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: totalWidth,
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = sorted[virtualRow.index]
            return (
              <div
                key={virtualRow.index}
                className="virtual-row"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: totalWidth,
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map((col, ci) => (
                  <div key={col.id} className="virtual-cell" style={{ width: colWidths[ci] }}>
                    <TableCell value={col.getValue(row)} field={col.id} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
        {sorted.length === 0 && (
          <div className="empty-state">
            {(searchQuery || Object.values(colFilters).some(Boolean)) ? (
              <>
                <p>No records match your search or filters</p>
                <span className="empty-hint">Try clearing the search or adjusting column filters</span>
              </>
            ) : (
              <>
                <p>This file has {data.length} records but all fields are hidden</p>
                <span className="empty-hint">Enable fields in the sidebar to view data</span>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
