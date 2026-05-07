import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Filter, FilterX } from 'lucide-react'
import { useStore } from '../store'

export default function ColumnFilter({
  columnId,
  data,
  getValue,
}: {
  columnId: string
  data: Record<string, unknown>[]
  getValue: (row: Record<string, unknown>) => unknown
}) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const colFilter = useStore((s) =>
    s.activeFile && s.files[s.activeFile]
      ? s.files[s.activeFile].colFilters[columnId] ?? ''
      : '',
  )
  const setColFilter = useStore((s) => s.setColFilter)

  const uniqueValues = useMemo(() => {
    const set = new Set<string>()
    const count = Math.min(data.length, 500)
    for (let i = 0; i < count; i++) {
      const val = getValue(data[i])
      if (val == null) {
        set.add('(empty)')
      } else {
        set.add(String(val).slice(0, 80))
      }
    }
    return Array.from(set).sort().slice(0, 100)
  }, [data, getValue])

  const hasFilter = colFilter.length > 0

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 240),
    })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    setInput(colFilter)
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        const menu = document.getElementById('col-filter-' + columnId)
        if (!menu || !menu.contains(e.target as Node)) {
          setOpen(false)
        }
      }
    }
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [open, columnId, colFilter, updatePosition])

  function apply() {
    setColFilter(columnId, input)
    setOpen(false)
  }

  function clear() {
    setInput('')
    setColFilter(columnId, '')
    setOpen(false)
  }

  const filteredUniques = input
    ? uniqueValues.filter((v) => v.toLowerCase().includes(input.toLowerCase()))
    : uniqueValues

  return (
    <>
      <button
        ref={btnRef}
        className={`col-filter-btn ${hasFilter ? 'col-filter-active' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        title={hasFilter ? `Filter: "${colFilter}" (click to edit)` : 'Filter this column'}
      >
        {hasFilter ? <FilterX size={12} /> : <Filter size={12} />}
      </button>
      {open &&
        createPortal(
          <div id={'col-filter-' + columnId} className="col-filter-menu" style={{ top: pos.top, left: pos.left }} onClick={(e) => e.stopPropagation()}>
            <div className="col-filter-input-row">
              <input
                className="col-filter-input"
                placeholder="Type to filter..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') apply()
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              <button className="col-filter-apply" onClick={(e) => { e.stopPropagation(); apply() }}>Apply</button>
            </div>
            <div className="col-filter-values">
              {filteredUniques.slice(0, 30).map((v) => (
                <div
                  key={v}
                  className="col-filter-value-item"
                  onClick={(e) => {
                    e.stopPropagation()
                    setInput(v === '(empty)' ? '' : v)
                    setColFilter(columnId, v === '(empty)' ? '' : v)
                    setOpen(false)
                  }}
                >
                  {v}
                </div>
              ))}
              {filteredUniques.length > 30 && (
                <div className="col-filter-more">+{filteredUniques.length - 30} more</div>
              )}
            </div>
            {hasFilter && (
              <div className="col-filter-clear" onClick={(e) => { e.stopPropagation(); clear() }}>
                Clear filter
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
