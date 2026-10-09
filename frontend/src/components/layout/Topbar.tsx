import { Bell, Search } from 'lucide-react'
import { Avatar, Button } from '../ui'

interface TopbarProps {
  name: string
  onLogout: () => void
}

export const Topbar = ({ name, onLogout }: TopbarProps) => (
  <header className="sticky top-0 z-10 mb-6 flex items-center justify-between gap-3 rounded-lg border bg-surface px-4 py-3 shadow-soft">
    <label
      htmlFor="dashboard-search"
      className="flex max-w-md flex-1 items-center gap-2 rounded-md border bg-page px-3 py-2"
    >
      <Search size={16} className="text-text-soft" aria-hidden="true" />
      <span className="sr-only">Search dashboard</span>
      <input
        id="dashboard-search"
        type="search"
        placeholder="Rechercher..."
        className="w-full border-none bg-transparent text-sm text-text outline-none placeholder:text-text-soft"
      />
    </label>

    <div className="flex items-center gap-2">
      <Button variant="ghost" aria-label="Notifications">
        <Bell size={16} aria-hidden="true" />
      </Button>
      <div className="flex items-center gap-2 rounded-md bg-page px-2 py-1.5">
        <Avatar name={name} />
        <span className="hidden text-sm font-medium text-text sm:block">{name}</span>
      </div>
      <Button variant="secondary" onClick={onLogout}>
        Déconnexion
      </Button>
    </div>
  </header>
)
