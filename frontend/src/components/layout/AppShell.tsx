import {
  Activity,
  CalendarCheck,
  FileText,
  Gamepad2,
  LayoutDashboard,
  LineChart,
  Stethoscope,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  children: ReactNode
}

const navByRole: Record<
  UserRole,
  Array<{
    label: string
    to: string
    icon: ReactNode
  }>
> = {
  patient: [
    { label: 'Dashboard', to: '/patient/dashboard', icon: <LayoutDashboard size={16} /> },
    { label: 'My tests', to: '/patient/tests', icon: <Activity size={16} /> },
    { label: 'Cognitive games', to: '/patient/games', icon: <Gamepad2 size={16} /> },
    { label: 'My progress', to: '/patient/progress', icon: <LineChart size={16} /> },
    { label: 'Appointments', to: '/patient/appointments', icon: <CalendarCheck size={16} /> },
  ],
  doctor: [
    { label: 'Dashboard', to: '/doctor/dashboard', icon: <LayoutDashboard size={16} /> },
    { label: 'My patients', to: '/doctor/patients', icon: <Users size={16} /> },
    { label: 'Consultations', to: '/doctor/consultations', icon: <Stethoscope size={16} /> },
    { label: 'AI predictions', to: '/doctor/predictions', icon: <Activity size={16} /> },
    { label: 'Medical reports', to: '/doctor/reports', icon: <FileText size={16} /> },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
    { label: 'Users', to: '/admin/users', icon: <Users size={16} /> },
  ],
}

export const AppShell = ({ children }: AppShellProps) => {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-page">
      <Sidebar role={user.role} navItems={navByRole[user.role]} />
      <main className="px-4 pb-8 pt-20 lg:ml-72 lg:px-7 lg:pt-6">
        <Topbar name={user.fullName} onLogout={logout} />
        {children}
      </main>
    </div>
  )
}
