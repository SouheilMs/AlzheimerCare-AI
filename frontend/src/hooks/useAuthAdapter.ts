import { useMemo } from 'react'
import type { AuthTokenAdapter } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

export const useAuthAdapter = (): AuthTokenAdapter => {
  const { getAccessToken, refreshAccessToken } = useAuth()
  return useMemo(() => ({ getAccessToken, refreshAccessToken }), [getAccessToken, refreshAccessToken])
}