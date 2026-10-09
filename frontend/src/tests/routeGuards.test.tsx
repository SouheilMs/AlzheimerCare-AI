import { screen } from '@testing-library/react'
import App from '../App'
import { mockUsers } from '../mocks/auth'
import { renderWithProviders } from './testUtils'

describe('Role-based route guards', () => {
  it('redirects each role to its dashboard from root', async () => {
    renderWithProviders(<App />, '/', mockUsers.doctor)
    expect(await screen.findByText(/bonjour dr. benali/i)).toBeInTheDocument()
  })

  it('redirects patient away from doctor route', async () => {
    renderWithProviders(<App />, '/doctor/dashboard', mockUsers.patient)

    expect(await screen.findByText(/403 - access denied/i)).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login', async () => {
    renderWithProviders(<App />, '/patient/dashboard')

    expect(await screen.findByText(/connexion alzheimercare ai/i)).toBeInTheDocument()
  })
})
