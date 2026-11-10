import { useEffect, useState } from 'react'
import AuthPanel from './components/auth/AuthPanel'
import DashboardPage from './components/dashboard/DashboardPage'
import WelcomePanel from './components/WelcomePanel'
import { endSession, getCurrentUser, type AuthUser } from './services/auth'
import './styles/auth-page.css'
import './styles/dashboard.css'

function App() {
  const [isDashboard, setIsDashboard] = useState(
    () => window.location.pathname === '/dashboard',
  )
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [startupNotice, setStartupNotice] = useState('')

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser)
          setIsAuthReady(true)

          if (!currentUser && window.location.pathname === '/dashboard') {
            window.history.replaceState({}, '', '/')
            setIsDashboard(false)
          } else if (currentUser && window.location.pathname !== '/dashboard') {
            window.history.replaceState({}, '', '/dashboard')
            setIsDashboard(true)
          }
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setStartupNotice(error instanceof Error
            ? error.message
            : 'Serviciul de autentificare nu este disponibil momentan.')
          setIsAuthReady(true)

          if (window.location.pathname === '/dashboard') {
            window.history.replaceState({}, '', '/')
            setIsDashboard(false)
          }
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    function syncRoute() {
      if (!isAuthReady) {
        setIsDashboard(window.location.pathname === '/dashboard')
        return
      }

      if (window.location.pathname === '/dashboard' && !user) {
        window.history.replaceState({}, '', '/')
        setIsDashboard(false)
        return
      }

      if (window.location.pathname !== '/dashboard' && user) {
        window.history.replaceState({}, '', '/dashboard')
        setIsDashboard(true)
        return
      }

      setIsDashboard(window.location.pathname === '/dashboard')
    }

    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [isAuthReady, user])

  function navigate(path: string) {
    if (path === '/dashboard' && !user) {
      window.history.replaceState({}, '', '/')
      setIsDashboard(false)
      return
    }

    window.history.pushState({}, '', path)
    setIsDashboard(path === '/dashboard')
  }

  if (!isAuthReady) {
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
        onLogout={async () => {
          await endSession()
          setUser(null)
          navigate('/')
        }}
      />
    )
  }

  return (
    <main className="auth-page">
      <WelcomePanel />
      <AuthPanel
        startupNotice={startupNotice}
        onAuthenticated={(authenticatedUser) => {
          setUser(authenticatedUser)
          setStartupNotice('')
          window.history.pushState({}, '', '/dashboard')
          setIsDashboard(true)
        }}
      />
    </main>
  )
}

export default App
