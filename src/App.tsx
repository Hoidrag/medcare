import { useEffect, useState } from 'react'
import AuthPanel from './components/auth/AuthPanel'
import DashboardPage from './components/dashboard/DashboardPage'
import WelcomePanel from './components/WelcomePanel'
import './styles/auth-page.css'
import './styles/dashboard.css'

function App() {
  const [isDashboard, setIsDashboard] = useState(
    () => window.location.pathname === '/dashboard',
  )

  useEffect(() => {
    function syncRoute() {
      setIsDashboard(window.location.pathname === '/dashboard')
    }

    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  function navigate(path: string) {
    window.history.pushState({}, '', path)
    setIsDashboard(path === '/dashboard')
  }

  if (isDashboard) {
    return <DashboardPage onNavigate={navigate} />
  }

  return (
    <main className="auth-page">
      <WelcomePanel />
      <AuthPanel onOpenDashboard={() => navigate('/dashboard')} />
    </main>
  )
}

export default App
