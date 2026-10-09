import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboardApi'
import { useAuthAdapter } from './useAuthAdapter'

export const usePatientDashboard = () => {
  const auth = useAuthAdapter()
  return useQuery({
    queryKey: ['dashboard', 'patient'],
    queryFn: () => dashboardApi.getPatientDashboard(auth),
  })
}