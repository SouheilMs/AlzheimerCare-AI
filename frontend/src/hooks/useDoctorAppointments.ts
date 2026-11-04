import { useQuery } from '@tanstack/react-query'
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
