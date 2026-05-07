# JSON Notebook

A modern, snappy JSON Web Notebook for inspecting, filtering, and exploring JSON data - like a spreadsheet for JSON files.

## Features

### Import
- **Drag & Drop** - drop a JSON file directly onto the page
- **Upload File** - browse and select from your computer
- **Paste JSON** - paste JSON via the modal dialog or `Ctrl+V` anywhere
- Supports top-level arrays or objects containing array values

### Table View
- **Virtualized rendering** - handles 10k+ rows smoothly (only ~30 rows in DOM)
- **Column sorting** - click any header to cycle asc/desc/none
- **Column filtering** - per-column text search with unique value picker
- **Column resizing** - drag handles on column edges
- **Column spread** - expand nested objects/arrays into separate columns
- **Smart cell rendering** - URLs as links, numbers formatted, booleans colored, arrays as tags, nested objects as key-tags with `[n]` badge
- **Click to copy** - click any cell value to copy to clipboard with toast notification
- **Expandable modal** - view full JSON for any cell in a popup

### File Management
- **Multiple file tabs** - load and switch between multiple JSON files
- **Row count badges** - each tab shows its record count
- **Remove with confirmation** - trash icon on each tab with a confirmation dialog
- **All state persists** - filters, sorts, column widths, spreads, and visibility survive page reloads

### Field Sidebar
- **Toggle visibility** - show/hide individual columns
- **Drag reorder** - rearrange columns via drag-and-drop
- **Column stats** - unique count and empty count shown per field (`123u/45e`)
- **Spread sub-items** - nested keys shown indented with remove buttons

### Search & Export
- **Full-text search** - searches across all visible fields simultaneously
- **Export filtered view** - download the currently filtered/sorted data as JSON

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Focus search bar |
| `Escape` | Clear search |
| `Ctrl+Enter` | Import pasted JSON (in paste modal) |
| `Ctrl+V` | Auto-detect and import JSON from clipboard |

### Theme
- **Dark / Light mode** - toggle with smooth transitions
- **Fully responsive** - adapts to mobile, tablet, and desktop

## Tech Stack

- **React 19** + **Vite** + **TypeScript**
- **Zustand** - state management with `localStorage` persistence and migrations
- **@dnd-kit** - drag-and-drop for column reordering
- **@tanstack/react-virtual** - virtualized table rendering
- **Lucide React** - icon library
- **Vanilla CSS** - custom variables for theming

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── App.tsx                  # Root layout, keyboard shortcuts, toast provider
├── store.ts                 # Zustand store with persistence & migrations
├── types.ts                 # TypeScript interfaces
├── main.tsx                 # Entry point
├── components/
│   ├── DataTable.tsx        # Virtualized table with sort, filter, resize
│   ├── TableCell.tsx        # Smart cell rendering (copy, URLs, tags, nested)
│   ├── ColumnFilter.tsx     # Per-column filter dropdown (portal-based)
│   ├── SpreadButton.tsx     # Spread nested data into columns (portal-based)
│   ├── Expandable.tsx       # Modal overlay for full JSON view
│   ├── FieldSidebar.tsx     # Field toggle, drag reorder, stats
│   ├── FileImport.tsx       # Drag/drop, upload, paste, tabs, remove confirm
│   ├── SearchBar.tsx        # Full-text search input
│   ├── ThemeToggle.tsx      # Dark/light theme switch
│   └── Toast.tsx            # Toast notification system
├── utils/
│   ├── spread.ts            # resolveSpreadValue, getNestedKeys
│   ├── search.ts            # filterRecords full-text search
│   ├── jsonParser.ts        # extractArrayData, isUrl
│   └── export.ts            # exportJson download helper
└── styles/
    ├── global.css           # CSS variables for dark/light themes
    └── components.css       # All component styles + responsive breakpoints
```

## License

MIT
