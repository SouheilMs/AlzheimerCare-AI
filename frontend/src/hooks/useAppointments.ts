import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '../api/appointmentsApi'
import { useAuthAdapter } from './useAuthAdapter'

const slotsKey = ['appointments', 'suggested-slots'] as const

export const useSuggestedSlots = (enabled = true) => {
  const auth = useAuthAdapter()
  return useQuery({
    queryKey: slotsKey,
    queryFn: () => appointmentsApi.suggestedSlots(auth),
    enabled,
  })
}

export const useBookAppointment = () => {
  const auth = useAuthAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { doctor_id: number; starts_at: string }) => appointmentsApi.book(payload, auth),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'patient'] })
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: slotsKey })
    },
  })
}