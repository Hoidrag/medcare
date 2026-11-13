import { useEffect, useState } from 'react'
import AuthPanel from './components/auth/AuthPanel'
import DashboardPage from './components/dashboard/DashboardPage'
import WelcomePanel from './components/WelcomePanel'
import { useAuth } from './hooks/useAuth'
import type { AuthCredentials, AuthMode } from './types/auth'
import './styles/auth-page.css'

function App() {
  const { user, isLoading, error, authenticate, logout, updateUser } = useAuth()
  const [isDashboard, setIsDashboard] = useState(
    () => window.location.pathname === '/dashboard',
  )

  useEffect(() => {
    function syncRoute() {
      if (isLoading) {
        setIsDashboard(window.location.pathname === '/dashboard')
        return
      }

      const requestedDashboard = window.location.pathname === '/dashboard'

      if (requestedDashboard && !user) {
        window.history.replaceState({}, '', '/')
        setIsDashboard(false)
        return
      }

      if (!requestedDashboard && user) {
        window.history.replaceState({}, '', '/dashboard')
        setIsDashboard(true)
        return
      }

      setIsDashboard(requestedDashboard)
    }

    window.addEventListener('popstate', syncRoute)
    syncRoute()
    return () => window.removeEventListener('popstate', syncRoute)
  }, [isLoading, user])

  function navigate(path: string) {
    window.history.pushState({}, '', path)
    setIsDashboard(path === '/dashboard')
  }

  async function handleAuthenticate(mode: AuthMode, credentials: AuthCredentials) {
    const authenticatedUser = await authenticate(mode, credentials)
    navigate('/dashboard')
    return authenticatedUser
  }

  if (isLoading) {
    return (
      <main className="auth-page auth-loading" aria-live="polite">
        <p>Se verifică sesiunea…</p>
      </main>
    )
  }

  if (isDashboard && user) {
    return (
      <DashboardPage
        user={user}
        onUserUpdated={updateUser}
        onLogout={async () => {
          await logout()
          navigate('/')
        }}
      />
    )
  }

  return (
    <main className="auth-page">
      <WelcomePanel />
      <AuthPanel
        startupNotice={error ?? undefined}
        onAuthenticate={handleAuthenticate}
      />
    </main>
  )
}

export default App
