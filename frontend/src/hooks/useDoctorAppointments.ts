import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doctorAppointmentsApi, type AppointmentScope } from '../api/doctorAppointmentsApi'
import { useAuthAdapter } from './useAuthAdapter'

export const useDoctorAppointments = (scope: AppointmentScope) => {
  const auth = useAuthAdapter()
  return useQuery({
    queryKey: ['doctor', 'appointments', scope],
    queryFn: () => doctorAppointmentsApi.list(scope, auth),
    refetchInterval: 30_000, // un nouveau rendez-vous pris par un patient apparaît tout seul
  })
}

export const useCancelDoctorAppointment = () => {
  const auth = useAuthAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => doctorAppointmentsApi.cancel(id, auth),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'doctor'] })
    },
  })
}
