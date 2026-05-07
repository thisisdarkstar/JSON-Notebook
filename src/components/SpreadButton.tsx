import { useState, useRef, useEffect, useCallback } from 'react'
import { Columns } from 'lucide-react'
import { createPortal } from 'react-dom'
import { getNestedKeys } from '../utils/spread'
import { useStore } from '../store'

export default function SpreadButton({
  field,
  value,
}: {
  field: string
  value: unknown
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const activeFile = useStore((s) => s.activeFile)
  const files = useStore((s) => s.files)
  const addSpread = useStore((s) => s.addSpread)
  const removeSpread = useStore((s) => s.removeSpread)
  const existingSpreads =
    activeFile && files[activeFile]
      ? files[activeFile].spreadFields[field] ?? []
      : []

  const nestedKeys = getNestedKeys(value)

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    const observer = new ResizeObserver(updatePosition)
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        const menu = document.getElementById('spread-menu-' + field)
        if (!menu || !menu.contains(e.target as Node)) {
          setOpen(false)
        }
      }
    }
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('resize', updatePosition)
    observer.observe(document.body)
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      window.removeEventListener('resize', updatePosition)
      observer.disconnect()
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [open, field, updatePosition])

  if (nestedKeys.length === 0) return null

  return (
    <>
      <button
        ref={btnRef}
        className="spread-btn"
        onClick={() => {
          setOpen(!open)
          if (!open) setTimeout(updatePosition, 0)
        }}
        title="Spread nested fields"
      >
        <Columns size={12} />
      </button>
      {open &&
        createPortal(
          <div
            id={'spread-menu-' + field}
            className="spread-menu"
            style={{
              top: pos.top,
              left: pos.left,
            }}
          >
            <div className="spread-menu-title">
              <Columns size={12} />
              <span>Spread {field}</span>
            </div>
            <div className="spread-menu-list">
              {nestedKeys.map((key) => {
                const checked = existingSpreads.includes(key)
                return (
                  <label key={key} className="spread-menu-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          removeSpread(field, key)
                        } else {
                          addSpread(field, [key])
                        }
                      }}
                    />
                    <span>{key}</span>
                  </label>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
