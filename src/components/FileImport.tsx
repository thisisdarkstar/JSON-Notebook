import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, ClipboardPaste, FileJson, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { extractArrayData } from '../utils/jsonParser'
import { addToast } from './Toast'

export default function FileImport() {
  const importJson = useStore((s) => s.importJson)
  const files = useStore((s) => s.files)
  const activeFile = useStore((s) => s.activeFile)
  const setActiveFile = useStore((s) => s.setActiveFile)
  const removeFile = useStore((s) => s.removeFile)
  const [dragging, setDragging] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleJson = useCallback(
    (parsed: unknown, sourceName?: string) => {
      const data = extractArrayData(parsed)
      if (data.length === 0) {
        alert('No array data found in JSON')
        return
      }
      const name = sourceName || `pasted-${Date.now()}.json`
      importJson(name, data)
      addToast(`Imported ${data.length} records`)
    },
    [importJson],
  )

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string)
          handleJson(parsed, file.name)
        } catch {
          alert('Invalid JSON file')
        }
      }
      reader.readAsText(file)
    },
    [handleJson],
  )

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (document.activeElement === textareaRef.current) return
      const text = e.clipboardData?.getData('text/plain')
      if (!text) return
      const trimmed = text.trim()
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return
      try {
        const parsed = JSON.parse(trimmed)
        handleJson(parsed)
        addToast('Imported from clipboard')
      } catch {
        // not valid JSON, ignore
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleJson])

  useEffect(() => {
    if (pasteOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [pasteOpen])

  const handlePasteImport = () => {
    const trimmed = pasteText.trim()
    if (!trimmed) return
    try {
      const parsed = JSON.parse(trimmed)
      handleJson(parsed)
      setPasteText('')
      setPasteOpen(false)
    } catch {
      alert('Invalid JSON')
    }
  }

  const requestRemove = (name: string) => {
    setConfirmRemove(name)
  }

  const confirmRemoveFile = () => {
    if (confirmRemove) {
      removeFile(confirmRemove)
      addToast(`Removed ${confirmRemove}`)
      setConfirmRemove(null)
    }
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      if (inputRef.current) inputRef.current.value = ''
    },
    [handleFile],
  )

  const fileNames = Object.keys(files)

  if (fileNames.length === 0) {
    return (
      <>
        <div className="import-zone">
          <div className="import-zone-inner">
            <h2>Import JSON Data</h2>
            <p className="import-hint">Choose how to load your data</p>
            <div className="import-options">
              <div
                className={`import-option import-drop ${dragging ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <FileJson size={28} />
                <span className="import-option-label">Drag & Drop</span>
                <span className="import-option-desc">Drop a JSON file here</span>
              </div>
              <div className="import-option import-option-upload" onClick={() => inputRef.current?.click()}>
                <Upload size={28} />
                <span className="import-option-label">Upload File</span>
                <span className="import-option-desc">Browse your computer</span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".json"
                  className="import-hidden"
                  onChange={onInputChange}
                />
              </div>
              <div className="import-option" onClick={() => setPasteOpen(true)}>
                <ClipboardPaste size={28} />
                <span className="import-option-label">Paste JSON</span>
                <span className="import-option-desc">Paste from clipboard</span>
              </div>
            </div>
            <p className="import-hint import-hint-bottom">Supports arrays or objects with array values</p>
          </div>
        </div>
        {pasteOpen && (
          <div className="paste-modal-overlay" onClick={() => setPasteOpen(false)}>
            <div className="paste-modal" onClick={(e) => e.stopPropagation()}>
              <div className="paste-modal-header">
                <h3>Paste JSON</h3>
                <button className="paste-modal-close" onClick={() => setPasteOpen(false)}>×</button>
              </div>
              <textarea
                ref={textareaRef}
                className="paste-modal-textarea"
                placeholder='Paste your JSON here...'
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === 'Enter') handlePasteImport()
                }}
              />
              <div className="paste-modal-actions">
                <button className="btn-sm" onClick={() => { setPasteOpen(false); setPasteText('') }}>Cancel</button>
                <button className="btn-sm accent" onClick={handlePasteImport}>Import (Ctrl+Enter)</button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="file-tabs">
        {fileNames.map((name) => (
          <div
            key={name}
            className={`file-tab ${name === activeFile ? 'active' : ''}`}
            onClick={() => setActiveFile(name)}
          >
            <span>{name}</span>
            <span className="tab-badge">{files[name].data.length}</span>
            <button
              className="file-tab-close"
              onClick={(e) => {
                e.stopPropagation()
                requestRemove(name)
              }}
              title={`Remove ${name}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button
          className="file-tab-import"
          onClick={() => inputRef.current?.click()}
          title="Upload file"
        >
          <Upload size={14} />
        </button>
        <button
          className="file-tab-import"
          onClick={() => setPasteOpen(true)}
          title="Paste JSON"
        >
          <ClipboardPaste size={14} />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          className="import-hidden"
          onChange={onInputChange}
        />
      </div>
      {pasteOpen && (
        <div className="paste-modal-overlay" onClick={() => setPasteOpen(false)}>
          <div className="paste-modal" onClick={(e) => e.stopPropagation()}>
            <div className="paste-modal-header">
              <h3>Paste JSON</h3>
              <button className="paste-modal-close" onClick={() => setPasteOpen(false)}>×</button>
            </div>
            <textarea
              ref={textareaRef}
              className="paste-modal-textarea"
              placeholder='Paste your JSON here...'
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === 'Enter') handlePasteImport()
              }}
            />
            <div className="paste-modal-actions">
              <button className="btn-sm" onClick={() => { setPasteOpen(false); setPasteText('') }}>Cancel</button>
              <button className="btn-sm accent" onClick={handlePasteImport}>Import (Ctrl+Enter)</button>
            </div>
          </div>
        </div>
      )}
      {confirmRemove && (
        <div className="confirm-overlay" onClick={() => setConfirmRemove(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-header">
              <h3>Remove file</h3>
            </div>
            <p className="confirm-message">
              Remove <strong>{confirmRemove}</strong>? This will also clear all filters, sorts, and column settings.
            </p>
            <div className="confirm-actions">
              <button className="btn-sm" onClick={() => setConfirmRemove(null)}>Cancel</button>
              <button className="btn-sm danger" onClick={confirmRemoveFile}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
