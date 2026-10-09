import { Link } from 'react-router-dom'

export const SessionExpiredPage = () => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page p-6 text-center">
    <h1 className="text-2xl font-semibold text-text">Session expired</h1>
    <p className="text-sm text-text-muted">Your session ended. Please sign in again.</p>
    <Link to="/login" className="text-brand-blue underline">
      Go to login
    </Link>
  </main>
)
