import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi, type BookPayload } from '../api/appointmentsApi'
import { useAuthAdapter } from './useAuthAdapter'

const slotsKey = ['appointments', 'suggested-slots'] as const

export const useSuggestedSlots = (options: { doctorId?: number; limit?: number; enabled?: boolean } = {}) => {
  const auth = useAuthAdapter()
  const { doctorId, limit = 80, enabled = true } = options
  return useQuery({
    queryKey: [...slotsKey, doctorId ?? 'auto', limit],
    queryFn: () => appointmentsApi.suggestedSlots(auth, { doctorId, limit }),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export const useMyAppointments = () => {
  const auth = useAuthAdapter()
  return useQuery({
    queryKey: ['appointments', 'mine'],
    queryFn: () => appointmentsApi.list(auth),
  })
}

export const useBookAppointment = () => {
  const auth = useAuthAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BookPayload) => appointmentsApi.book(payload, auth),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'patient'] })
      void queryClient.invalidateQueries({ queryKey: ['appointments', 'mine'] })
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: slotsKey })
    },
  })
}
