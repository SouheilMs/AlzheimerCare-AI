import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminUsersPage } from './pages/admin/UsersPage'
import { DoctorDashboard } from './pages/doctor/Dashboard'
import { ForbiddenPage } from './pages/ForbiddenPage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SessionExpiredPage } from './pages/SessionExpiredPage'
import { PatientDashboard } from './pages/patient/Dashboard'
import { ProtectedRoute, RoleLandingRedirect } from './routes/RouteGuards'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/session-expired" element={<SessionExpiredPage />} />
      <Route path="/" element={<RoleLandingRedirect />} />

      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/tests"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PlaceholderPage title="My tests" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/games"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PlaceholderPage title="Cognitive games" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/progress"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PlaceholderPage title="My progress" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PlaceholderPage title="Appointments" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/patients"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <PlaceholderPage title="My patients" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/consultations"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <PlaceholderPage title="Consultations" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/predictions"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <PlaceholderPage title="AI predictions" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/reports"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <PlaceholderPage title="Medical reports" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PlaceholderPage title="Admin dashboard" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
