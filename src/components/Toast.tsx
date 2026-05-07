import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'

interface Toast {
  id: number
  message: string
}

let nextId = 0
type ToastUpdater = (prev: Toast[]) => Toast[]
let globalSetToasts: ((updater: ToastUpdater) => void) | null = null

export function addToast(message: string) {
  if (globalSetToasts) {
    const id = nextId++
    globalSetToasts((prev) => [...prev, { id, message }])
    setTimeout(() => {
      globalSetToasts!((prev) => prev.filter((t) => t.id !== id))
    }, 1800)
  }
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    globalSetToasts = setToasts
    return () => { globalSetToasts = null }
  }, [])

  return (
    <>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <Check size={12} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  )
}
