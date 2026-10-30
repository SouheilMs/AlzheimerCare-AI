import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doctorPatientsApi } from '../api/doctorPatientsApi'
import { useAuthAdapter } from './useAuthAdapter'

export const useDoctorPatients = () => {
  const auth = useAuthAdapter()
  return useQuery({ queryKey: ['doctor', 'patients'], queryFn: () => doctorPatientsApi.list(auth) })
}

export const usePatientScans = (patientId: number) => {
  const auth = useAuthAdapter()
  return useQuery({
    queryKey: ['doctor', 'patient-scans', patientId],
    queryFn: () => doctorPatientsApi.scans(patientId, auth),
  })
}

export const useAnalyzeScan = (patientId: number) => {
  const auth = useAuthAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (scanId: number) => doctorPatientsApi.analyze(scanId, auth),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'patient-scans', patientId] })
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'patients'] })
    },
  })
}