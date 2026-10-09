import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { patientsApi } from '../api/patientsApi'
import type { PatientClinicalUpdatePayload } from '../types'
import { useAuthAdapter } from './useAuthAdapter'

export const usePatientProfile = (id: number | null) => {
  const auth = useAuthAdapter()
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => patientsApi.get(id as number, auth),
    enabled: id !== null,
  })
}

export const useUpdatePatientClinical = (id: number) => {
  const auth = useAuthAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PatientClinicalUpdatePayload) => patientsApi.updateClinical(id, payload, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients', id] }),
  })
}