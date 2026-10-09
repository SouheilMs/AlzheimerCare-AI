import { ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { UserRole } from '../../types'
import { Button } from '../ui'
import { cn } from '../ui/cn'

interface NavItem {
  label: string
  to: string
  icon: ReactNode
}

interface SidebarProps {
  role: UserRole
  navItems: NavItem[]
}

export const Sidebar = ({ role, navItems }: SidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <Button
        variant="secondary"
        className="fixed left-4 top-4 z-30 lg:hidden"
        onClick={() => setMobileOpen((current) => !current)}
        aria-label="Toggle navigation menu"
      >
        {mobileOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
      </Button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-20 w-72 border-r bg-sidebar px-5 py-6 shadow-soft transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-8 flex items-center gap-2 text-brand-blue">
          <div className="rounded-md bg-brand-blue p-2 text-white">
            <ChevronRight size={16} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">AlzheimerCare AI</p>
            <p className="text-xs text-text-muted">
              {role === 'patient' ? 'Espace patient' : role === 'doctor' ? 'Espace médecin' : 'Espace admin'}
            </p>
          </div>
        </div>

        <nav aria-label="Primary navigation" className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'focus-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-text-muted',
                  isActive && 'bg-brand-blue-soft text-brand-blue',
                )
              }
              onClick={() => setMobileOpen(false)}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-10 bg-text/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
