import { useState } from 'react'
import { Keyboard } from 'lucide-react'

const shortcuts = [
  { keys: ['⌘K', 'Ctrl+K'], action: 'Focus search bar' },
  { keys: ['Escape'], action: 'Clear search / Close modals' },
  { keys: ['⌘V', 'Ctrl+V'], action: 'Auto-import JSON from clipboard' },
  { keys: ['⌘Enter', 'Ctrl+Enter'], action: 'Import pasted JSON' },
]

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="icon-btn" onClick={() => setOpen(true)} title="Keyboard shortcuts">
        <Keyboard size={16} />
      </button>
      {open && (
        <div className="shortcuts-overlay" onClick={() => setOpen(false)}>
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-header">
              <h3>Keyboard Shortcuts</h3>
              <button className="shortcuts-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="shortcuts-list">
              {shortcuts.map((s) => (
                <div key={s.keys[0]} className="shortcut-row">
                  <div className="shortcut-keys">
                    {s.keys.map((k) => (
                      <kbd key={k}>{k}</kbd>
                    ))}
                  </div>
                  <span className="shortcut-action">{s.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
