import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminUsersApi } from '../api/adminUsersApi'
import type { AdminCreateUserPayload, AssignableRole } from '../types'
import { useAuthAdapter } from './useAuthAdapter'

const usersKey = ['admin', 'users'] as const

export const useAdminUsers = () => {
  const auth = useAuthAdapter()
  return useQuery({ queryKey: usersKey, queryFn: () => adminUsersApi.list(auth) })
}

export const useAdminUserMutations = () => {
  const auth = useAuthAdapter()
  const queryClient = useQueryClient()
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: usersKey })

  const create = useMutation({
    mutationFn: (payload: AdminCreateUserPayload) => adminUsersApi.create(payload, auth),
    onSuccess,
  })
  const toggleEnabled = useMutation({
    mutationFn: (vars: { keycloakId: string; enabled: boolean }) =>
      adminUsersApi.toggleEnabled(vars.keycloakId, vars.enabled, auth),
    onSuccess,
  })
  const changeRole = useMutation({
    mutationFn: (vars: { keycloakId: string; role: AssignableRole }) =>
      adminUsersApi.changeRole(vars.keycloakId, vars.role, auth),
    onSuccess,
  })

  return { create, toggleEnabled, changeRole }
}