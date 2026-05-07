import { useEffect } from 'react'
import { useStore } from './store'
import FileImport from './components/FileImport'
import FieldSidebar from './components/FieldSidebar'
import DataTable from './components/DataTable'
import ThemeToggle from './components/ThemeToggle'
import ToastProvider from './components/Toast'
import './styles/components.css'

export default function App() {
  const theme = useStore((s) => s.theme)
  const activeFile = useStore((s) => s.activeFile)
  const files = useStore((s) => s.files)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const setSearchQuery = useStore((s) => s.setSearchQuery)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('.search-bar input')?.focus()
      }
      if (e.key === 'Escape') {
        const input = document.querySelector<HTMLInputElement>('.search-bar input')
        if (document.activeElement === input && input?.value) {
          setSearchQuery('')
          input.blur()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setSearchQuery])

  return (
    <ToastProvider>
      <div className="app-layout">
        <div className="app-header">
          <h1>JSON Notebook</h1>
          <ThemeToggle />
        </div>
        <FileImport />
        {activeFile && files[activeFile] && (
          <div className="app-body">
            <div className="app-content">
              <DataTable />
            </div>
            {sidebarOpen && <FieldSidebar />}
          </div>
        )}
      </div>
    </ToastProvider>
  )
}
