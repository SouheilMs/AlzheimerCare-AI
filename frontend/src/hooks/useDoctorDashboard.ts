import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboardApi'
import { useAuthAdapter } from './useAuthAdapter'

export const useDoctorDashboard = () => {
  const auth = useAuthAdapter()
  useQuery({
    queryKey: ['dashboard', 'doctor'],
    queryFn: () => dashboardApi.getDoctorDashboard(auth),
  })
}
