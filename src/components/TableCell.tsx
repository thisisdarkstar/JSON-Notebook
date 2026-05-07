import Expandable from './Expandable'
import SpreadButton from './SpreadButton'
import { addToast } from './Toast'
import { isUrl } from '../utils/jsonParser'

function countLabel(value: unknown): string {
  if (Array.isArray(value)) return `[${value.length}]`
  return '{…}'
}

function getNestedKeys(value: unknown): string[] {
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
    return Object.keys(value[0])
  }
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value)
  }
  return []
}

function copyValue(value: unknown) {
  const text = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
  navigator.clipboard.writeText(text)
  addToast('Copied to clipboard')
}

export default function TableCell({
  value,
  field,
}: {
  value: unknown
  field: string
}) {
  if (value == null) {
    return <span className="cell-null">—</span>
  }

  if (typeof value === 'string') {
    if (isUrl(value)) {
      const short = value.replace(/^https?:\/\//, '').replace(/\/$/, '')
      return <a href={value} target="_blank" rel="noopener noreferrer" className="cell-link">{short}</a>
    }
    return (
      <span className="cell-string" onClick={() => copyValue(value)} title="Click to copy" style={{ cursor: 'pointer' }}>
        {value}
      </span>
    )
  }

  if (typeof value === 'number') {
    return (
      <span className="cell-number" onClick={() => copyValue(value)} title="Click to copy" style={{ cursor: 'pointer' }}>
        {value.toLocaleString()}
      </span>
    )
  }

  if (typeof value === 'boolean') {
    return <span className={value ? 'cell-bool-true' : 'cell-bool-false'}>{value ? 'true' : 'false'}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="cell-empty">[]</span>
    }
    if (typeof value[0] === 'string') {
      return (
        <div className="cell-tags">
          {value.map((v, i) => (
            <span key={i} className="cell-tag" onClick={() => copyValue(v)} title="Click to copy" style={{ cursor: 'pointer' }}>
              {isUrl(String(v)) ? (
                <a href={String(v)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  {String(v).replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              ) : (
                String(v)
              )}
            </span>
          ))}
        </div>
      )
    }
    if (typeof value[0] === 'object' && value[0] !== null) {
      const keys = getNestedKeys(value)
      return (
        <div className="cell-spreadable">
          <div className="cell-nested">
            <div className="cell-nested-keys">
              {keys.map((k) => (
                <span key={k} className="cell-key-tag">{k}</span>
              ))}
            </div>
            <div className="cell-nested-actions">
              <Expandable label={countLabel(value)}>
                <pre>{JSON.stringify(value, null, 2)}</pre>
              </Expandable>
            </div>
          </div>
          <SpreadButton field={field} value={value} />
        </div>
      )
    }
    return (
      <div className="cell-tags">
        {value.map((v, i) => (
          <span key={i} className="cell-tag" onClick={() => copyValue(v)} title="Click to copy" style={{ cursor: 'pointer' }}>
            {String(v)}
          </span>
        ))}
      </div>
    )
  }

  if (typeof value === 'object') {
    const keys = getNestedKeys(value)
    return (
      <div className="cell-spreadable">
        <div className="cell-nested">
          <div className="cell-nested-keys">
            {keys.map((k) => (
              <span key={k} className="cell-key-tag">{k}</span>
            ))}
          </div>
          <div className="cell-nested-actions">
            <Expandable label={countLabel(value)}>
              <pre>{JSON.stringify(value, null, 2)}</pre>
            </Expandable>
          </div>
        </div>
        <SpreadButton field={field} value={value} />
      </div>
    )
  }

  return <span onClick={() => copyValue(value)} title="Click to copy" style={{ cursor: 'pointer' }}>{String(value)}</span>
}
