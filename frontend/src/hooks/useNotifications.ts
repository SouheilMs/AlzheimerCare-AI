import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notificationsApi'
import { useAuthAdapter } from './useAuthAdapter'

const key = ['notifications'] as const

export const useNotifications = () => {
  const auth = useAuthAdapter()
  return useQuery({
    queryKey: key,
    queryFn: () => notificationsApi.list(auth),
    refetchInterval: 30_000, // vérifie les nouvelles notifications toutes les 30 s
  })
}

export const useMarkNotificationRead = () => {
  const auth = useAuthAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

export const useMarkAllNotificationsRead = () => {
  const auth = useAuthAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}