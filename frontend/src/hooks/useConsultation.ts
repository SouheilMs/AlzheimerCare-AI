import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { consultationsApi, type ConsultationSummary } from '../api/consultationsApi'
import { useAuthAdapter } from './useAuthAdapter'

export const useJoinConsultation = (appointmentId: number) => {
  const auth = useAuthAdapter()
  return useMutation({
    mutationFn: (consent: boolean | undefined) => consultationsApi.join(appointmentId, consent, auth),
  })
}

export const useEndConsultation = (appointmentId: number) => {
  const auth = useAuthAdapter()
  return useMutation({ mutationFn: () => consultationsApi.end(appointmentId, auth) })
}

export const useConsultationReport = (appointmentId: number) => {
  const auth = useAuthAdapter()
  return useQuery({
    queryKey: ['consultation-report', appointmentId],
    queryFn: () => consultationsApi.report(appointmentId, auth),
    // tant que le résumé n'est pas prêt, on interroge le serveur toutes les 5 s
    refetchInterval: (query) => {
      const data = query.state.data
      const ready = data && Object.keys(data.summary ?? {}).length > 0
      return ready ? false : 5000
    },
  })
}

export const useSaveReport = (appointmentId: number) => {
  const auth = useAuthAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (summary: ConsultationSummary) => consultationsApi.saveReport(appointmentId, summary, auth),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['consultation-report', appointmentId] }),
  })
}

export const useValidateReport = (appointmentId: number) => {
  const auth = useAuthAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => consultationsApi.validateReport(appointmentId, auth),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['consultation-report', appointmentId] }),
  })
}

export const usePatientConsultations = (patientId: number) => {
  const auth = useAuthAdapter()
  return useQuery({
    queryKey: ['patient-consultations', patientId],
    queryFn: () => consultationsApi.forPatient(patientId, auth),
  })
}