import { Link } from 'react-router-dom'

export const ForbiddenPage = () => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page p-6 text-center">
    <h1 className="text-2xl font-semibold text-text">403 - Access denied</h1>
    <p className="text-sm text-text-muted">You do not have permission to access this page.</p>
    <Link to="/" className="text-brand-blue underline">
      Back to dashboard
    </Link>
  </main>
)
