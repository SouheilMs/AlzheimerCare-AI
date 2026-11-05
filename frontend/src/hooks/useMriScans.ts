import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mriApi } from '../api/mriApi'
import { useAuthAdapter } from './useAuthAdapter'

const mriKey = ['patient', 'mri-scans'] as const

export const useMriScans = () => {
  const auth = useAuthAdapter()
  return useQuery({ queryKey: mriKey, queryFn: () => mriApi.list(auth) })
}

export const useUploadMri = () => {
  const auth = useAuthAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => mriApi.upload(file, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mriKey }),
  })
}