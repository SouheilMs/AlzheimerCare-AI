import type { AuthUser } from '../types'

export const mockUsers: Record<'patient' | 'doctor' | 'admin', AuthUser> = {
  patient: {
    id: 'u-patient-1',
    keycloakId: 'kc-patient-1',
    fullName: 'Ahmed Rahmani',
    role: 'patient',
    email: 'ahmed@example.com',
  },
  doctor: {
    id: 'u-doctor-1',
    keycloakId: 'kc-doctor-1',
    fullName: 'Dr. Benali',
    role: 'doctor',
    email: 'dr.benali@example.com',
  },
  admin: {
    id: 'u-admin-1',
    keycloakId: 'kc-admin-1',
    fullName: 'Admin User',
    role: 'admin',
    email: 'admin@example.com',
  },
}
