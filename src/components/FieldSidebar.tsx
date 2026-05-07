import { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, X } from 'lucide-react'
import { useStore } from '../store'

function SortableField({ field, stats }: { field: string; stats: { unique: number; empty: number } | undefined }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field })
  const visibleFields = useStore((s) =>
    s.activeFile && s.files[s.activeFile]
      ? s.files[s.activeFile].visibleFields
      : [],
  )
  const spreadFields = useStore((s) =>
    s.activeFile && s.files[s.activeFile]
      ? s.files[s.activeFile].spreadFields
      : {},
  )
  const toggleField = useStore((s) => s.toggleField)
  const removeSpread = useStore((s) => s.removeSpread)
  const isVisible = visibleFields.includes(field)
  const spreads = spreadFields[field] ?? []

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div>
      <div ref={setNodeRef} style={style} className="field-item">
        <button
          className="drag-handle"
          {...attributes}
          {...listeners}
          style={{ opacity: 1, cursor: 'grab' }}
        >
          <GripVertical size={14} />
        </button>
        <input
          type="checkbox"
          checked={isVisible}
          onChange={() => toggleField(field)}
        />
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            opacity: isVisible ? 1 : 0.5,
          }}
          title={field}
        >
          {field}
        </span>
        {stats !== undefined && (
          <span className="field-stats" title={`${stats.unique} unique, ${stats.empty} empty`}>
            {stats.unique}u/{stats.empty}e
          </span>
        )}
        {isVisible ? <Eye size={12} color="var(--text-muted)" /> : <EyeOff size={12} color="var(--text-muted)" />}
      </div>
      {spreads.map((child) => (
        <div key={child} className="field-item field-item-spread">
          <div className="spread-indent" />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              opacity: isVisible ? 1 : 0.4,
            }}
            title={`${field}.${child}`}
          >
            {child}
          </span>
          <button
            className="spread-remove"
            onClick={() => removeSpread(field, child)}
            title={`Remove ${child} column`}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function FieldSidebar() {
  const activeFile = useStore((s) => s.activeFile)
  const files = useStore((s) => s.files)
  const reorderFields = useStore((s) => s.reorderFields)
  const data = activeFile && files[activeFile] ? files[activeFile].data : []
  const fieldOrder = activeFile && files[activeFile] ? files[activeFile].fieldOrder : []

  const stats = useMemo(() => {
    const result: Record<string, { unique: number; empty: number }> = {}
    for (const field of fieldOrder) {
      const seen = new Set<string>()
      let empty = 0
      for (const row of data) {
        const val = row[field]
        if (val == null || val === '' || (Array.isArray(val) && val.length === 0)) {
          empty++
        } else {
          seen.add(typeof val === 'object' ? JSON.stringify(val) : String(val))
        }
      }
      result[field] = { unique: seen.size, empty }
    }
    return result
  }, [data, fieldOrder])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = fieldOrder.indexOf(active.id as string)
      const newIndex = fieldOrder.indexOf(over.id as string)
      reorderFields(arrayMove(fieldOrder, oldIndex, newIndex))
    }
  }

  if (!activeFile) return null

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Fields</h3>
      </div>
      <div className="sidebar-list">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={fieldOrder} strategy={verticalListSortingStrategy}>
            {fieldOrder.map((field) => (
              <SortableField key={field} field={field} stats={stats[field]} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
