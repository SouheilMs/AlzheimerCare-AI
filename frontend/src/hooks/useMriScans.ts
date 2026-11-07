import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mriApi } from '../api/mriApi'
import { useAuthAdapter } from './useAuthAdapter'

const mriKey = ['patient', 'mri-scans'] as const
const doctorsKey = ['patient', 'doctors'] as const
const myDoctorsKey = ['patient', 'my-doctors'] as const

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

export const useDoctorDirectory = () => {
  const auth = useAuthAdapter()
  return useQuery({ queryKey: doctorsKey, queryFn: () => mriApi.doctors(auth) })
}

export const useMyDoctors = () => {
  const auth = useAuthAdapter()
  return useQuery({ queryKey: myDoctorsKey, queryFn: () => mriApi.myDoctors(auth) })
}

export const useChooseDoctor = () => {
  const auth = useAuthAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (doctorId: number) => mriApi.chooseDoctor(doctorId, auth),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myDoctorsKey }),
  })
}