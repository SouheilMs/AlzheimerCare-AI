import { useCallback, useEffect, useState } from 'react'
import { adminUsersApi, type AdminUserItem } from '../../api/adminUsersApi'
import { AppShell } from '../../components/layout/AppShell'
import { Badge, Button, Card, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthAdapter } from '../../hooks/useAuthAdapter'

type ManagedRole = 'patient' | 'doctor'

const roleOf = (user: AdminUserItem): ManagedRole | 'admin' =>
  user.roles.includes('admin') ? 'admin' : user.roles.includes('doctor') ? 'doctor' : 'patient'

export const AdminUsersPage = () => {
  const adapter = useAuthAdapter()
  const { user: me } = useAuth()

  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<ManagedRole>('patient')

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await adminUsersApi.list(adapter))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }, [adapter])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action()
      setNotice(success)
      setError(null)
      await loadUsers()
    } catch (e) {
      setNotice(null)
      setError(e instanceof Error ? e.message : 'Request failed')
    }
  }

  const handleCreate = () => {
    if (!email) return
    void run(async () => {
      await adminUsersApi.create({ email, role, temporary_password: password || undefined }, adapter)
      setEmail('')
      setPassword('')
    }, 'User created')
  }

  const handleReset = (u: AdminUserItem) => {
    const value = window.prompt('Temporary password (min 12 characters). Leave empty to send a reset email.') ?? null
    if (value === null) return
    void run(() => adminUsersApi.resetPassword(u.keycloak_id, value || undefined, adapter), 'Password reset')
  }

  const handleDelete = (u: AdminUserItem) => {
    if (!window.confirm(`Delete ${u.email}? They will no longer be able to sign in.`)) return
    void run(() => adminUsersApi.remove(u.keycloak_id, adapter), 'User deleted')
  }

  return (
    <AppShell>
      <Card title="Admin - Users">
        {error && <WidgetError message={error} onRetry={() => void loadUsers()} />}
        {notice && <p className="mb-3 text-sm text-brand-teal" role="status">{notice}</p>}

        <div className="mb-4 flex flex-wrap gap-2">
          <input className="rounded border px-3 py-2" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <input className="rounded border px-3 py-2" type="password" placeholder="Temporary password (12+ chars)"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <select className="rounded border px-3 py-2" value={role}
            onChange={(e) => setRole(e.target.value as ManagedRole)}>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
          <Button onClick={handleCreate}>Create user</Button>
        </div>

        {loading && <Skeleton className="h-24 w-full" />}
        {!loading && users.length === 0 && !error && (
          <EmptyState title="Aucun utilisateur" description="Créez un premier compte ci-dessus." />
        )}

        <div className="space-y-2">
          {users.map((u) => {
            const current = roleOf(u)
            const isSelf = u.email === me?.email
            return (
              <div key={u.keycloak_id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3">
                <div>
                  <p className="font-medium">{u.email}</p>
                  <div className="mt-1 flex gap-2">
                    <Badge tone="blue">{current}</Badge>
                    <Badge tone={u.enabled ? 'teal' : 'rose'}>{u.enabled ? 'active' : 'disabled'}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded border px-2 py-1 text-sm"
                    value={current === 'admin' ? '' : current}
                    disabled={isSelf || current === 'admin'}
                    onChange={(e) =>
                      void run(() => adminUsersApi.changeRole(u.keycloak_id, e.target.value as ManagedRole, adapter), 'Role updated')
                    }
                  >
                    {current === 'admin' && <option value="">admin</option>}
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                  <Button variant="secondary" disabled={isSelf}
                    onClick={() => void run(() => adminUsersApi.toggleEnabled(u.keycloak_id, !u.enabled, adapter), 'Status updated')}>
                    {u.enabled ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="ghost" onClick={() => handleReset(u)}>Reset password</Button>
                  <Button variant="ghost" disabled={isSelf} onClick={() => handleDelete(u)}>Delete</Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </AppShell>
  )
}