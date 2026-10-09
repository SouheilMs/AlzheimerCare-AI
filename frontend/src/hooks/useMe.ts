import { useQuery } from '@tanstack/react-query'
import { authApi } from '../api/authApi'
import { useAuthAdapter } from './useAuthAdapter'

export const useMe = () => {
  const auth = useAuthAdapter()
  return useQuery({ queryKey: ['auth', 'me'], queryFn: () => authApi.me(auth) })
}