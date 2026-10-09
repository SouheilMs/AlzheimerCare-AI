import { screen } from '@testing-library/react'
import App from '../App'
import { mockUsers } from '../mocks/auth'
import { renderWithProviders } from './testUtils'

describe('Dashboard pages', () => {
  it('renders patient dashboard main sections', async () => {
    renderWithProviders(<App />, '/patient/dashboard', mockUsers.patient)

    expect(await screen.findByTestId('patient-chart')).toBeInTheDocument()
    expect(screen.getByTestId('patient-games')).toBeInTheDocument()
    expect(screen.getByTestId('patient-appointments')).toBeInTheDocument()
    expect(screen.getByTestId('patient-notifications')).toBeInTheDocument()
  })

  it('renders doctor dashboard main sections', async () => {
    renderWithProviders(<App />, '/doctor/dashboard', mockUsers.doctor)

    expect(await screen.findByTestId('doctor-stats')).toBeInTheDocument()
    expect(screen.getByTestId('doctor-patients')).toBeInTheDocument()
    expect(screen.getByTestId('doctor-alerts')).toBeInTheDocument()
    expect(screen.getByTestId('doctor-consultations')).toBeInTheDocument()
    expect(screen.getByTestId('doctor-reports')).toBeInTheDocument()
    expect(screen.getByTestId('doctor-prediction')).toBeInTheDocument()
  })
})
