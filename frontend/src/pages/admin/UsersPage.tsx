import { useState } from 'react'
import { ApiError } from '../../api/client'
import { AppShell } from '../../components/layout/AppShell'
import { Button, Card, EmptyState, Skeleton, WidgetError } from '../../components/ui'
import { useAdminUserMutations, useAdminUsers } from '../../hooks/useAdminUsers'
import type { AssignableRole } from '../../types'

const fieldMessages = (error: unknown, field: string): string[] => {
  if (!(error instanceof ApiError)) return []

  const fieldErrors = (error as unknown as { fieldErrors?: Record<string, string[]> }).fieldErrors
  return fieldErrors?.[field] ?? []
}

export const AdminUsersPage = () => {
  const { data: users = [], isLoading, isError, error, refetch } = useAdminUsers()
  const { create, toggleEnabled, changeRole } = useAdminUserMutations()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AssignableRole>('patient')

  const handleCreate = () => {
    const trimmed = email.trim()
    if (!trimmed) return
    create.mutate({ email: trimmed, role }, { onSuccess: () => setEmail('') })
  }

  const actionError = toggleEnabled.error ?? changeRole.error
  const emailErrors = fieldMessages(create.error, 'email')
  const roleErrors = fieldMessages(create.error, 'role')
  const createGenericError =
    create.error && emailErrors.length === 0 && roleErrors.length === 0 ? create.error.message : null

  return (
    <AppShell>
      <Card title="Admin - Users">
        <div className="mb-4 flex flex-wrap gap-2">
          <div>
            <input
              className="rounded border px-3 py-2"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={emailErrors.length > 0}
            />
            {emailErrors.map((message) => (
              <p key={message} className="mt-1 text-xs text-brand-rose">
                {message}
              </p>
            ))}
          </div>
          <div>
            <select
              className="rounded border px-3 py-2"
              value={role}
              onChange={(event) => setRole(event.target.value as AssignableRole)}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
            {roleErrors.map((message) => (
              <p key={message} className="mt-1 text-xs text-brand-rose">
                {message}
              </p>
            ))}
          </div>
          <Button onClick={handleCreate} disabled={create.isPending || !email.trim()}>
            {create.isPending ? 'Creating…' : 'Create user'}
          </Button>
        </div>
        {createGenericError && <p className="mb-3 text-sm text-brand-rose">{createGenericError}</p>}
        {actionError && <p className="mb-3 text-sm text-brand-rose">{actionError.message}</p>}

        {isLoading && <Skeleton className="h-32 w-full" />}
        {isError && <WidgetError message={error.message} onRetry={() => void refetch()} />}
        {!isLoading && !isError && users.length === 0 && (
          <EmptyState title="No users" description="Created users will appear here." />
        )}

        <div className="space-y-2">
          {users.map((user) => {
            const isAdminUser = user.roles.includes('admin')
            const mappedRole: AssignableRole = user.roles.includes('doctor') ? 'doctor' : 'patient'
            return (
              <div key={user.keycloak_id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-xs text-text-muted">{user.roles.join(', ')}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    disabled={toggleEnabled.isPending}
                    onClick={() => toggleEnabled.mutate({ keycloakId: user.keycloak_id, enabled: !user.enabled })}
                  >
                    {user.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={changeRole.isPending || isAdminUser}
                    title={isAdminUser ? 'Admin roles cannot be changed here' : undefined}
                    onClick={() =>
                      changeRole.mutate({
                        keycloakId: user.keycloak_id,
                        role: mappedRole === 'doctor' ? 'patient' : 'doctor',
                      })
                    }
                  >
                    Toggle role
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </AppShell>
  )
}