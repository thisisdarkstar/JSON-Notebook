import { Search } from 'lucide-react'
import { useStore } from '../store'

export default function SearchBar() {
  const query = useStore((s) => s.searchQuery)
  const setQuery = useStore((s) => s.setSearchQuery)

  return (
    <div className="search-bar">
      <div className="search-wrapper">
        <Search className="search-icon" size={14} />
        <input
          type="text"
          placeholder="Search records... (⌘K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
    </div>
  )
}
