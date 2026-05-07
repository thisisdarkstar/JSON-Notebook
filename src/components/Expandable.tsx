import { useState, useRef, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function Expandable({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        const modal = document.querySelector('.modal-overlay')
        if (!modal || !modal.contains(e.target as Node)) {
          setOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  if (!open) {
    return (
      <div className="expandable" ref={ref}>
        <div className="expandable-header" onClick={() => setOpen(true)}>
          <ChevronRight size={12} />
          <span>{label}</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="expandable" ref={ref}>
        <div className="expandable-header expandable-header-open" onClick={() => setOpen(false)}>
          <ChevronRight size={12} style={{ transform: 'rotate(90deg)', transition: 'transform 150ms ease' }} />
          <span>{label}</span>
        </div>
      </div>
      {createPortal(
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-label">{label}</span>
              <button className="modal-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <pre className="modal-body">{children}</pre>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
