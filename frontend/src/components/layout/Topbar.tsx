import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NotificationItem } from '../../api/notificationsApi'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../../hooks/useNotifications'
import { formatRelative } from '../../lib/format'
import { Avatar, Button } from '../ui'

interface TopbarProps {
  name: string
  onLogout: () => void
}

export const Topbar = ({ name, onLogout }: TopbarProps) => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const unread = data?.unread_count ?? 0
  const items = data?.results ?? []

  const openItem = (n: NotificationItem) => {
    if (!n.read_at) markRead.mutate(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
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
        <div className="relative">
          <Button
            variant="ghost"
            aria-label={`Notifications${unread ? ` (${unread} non lues)` : ''}`}
            onClick={() => setOpen((v) => !v)}
          >
            <Bell size={16} aria-hidden="true" />
          </Button>
          {unread > 0 && (
            <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-rose px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}

          {open && (
            <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border bg-surface shadow-soft">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <p className="text-sm font-semibold text-text">Notifications</p>
                {unread > 0 && (
                  <button
                    type="button"
                    className="text-xs text-brand-blue"
                    onClick={() => markAll.mutate()}
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <p className="p-4 text-sm text-text-muted">Aucune notification.</p>
              ) : (
                <ul className="max-h-80 overflow-y-auto">
                  {items.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openItem(n)}
                        className={`w-full border-b px-3 py-2 text-left text-sm ${
                          n.read_at ? 'bg-surface' : 'bg-brand-blue-soft'
                        }`}
                      >
                        <p className="text-text">{n.message}</p>
                        <p className="mt-0.5 text-xs text-text-soft">{formatRelative(n.created_at)}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

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
}