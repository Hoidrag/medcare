import AuthPanel from './components/auth/AuthPanel'
import WelcomePanel from './components/WelcomePanel'
import './styles/auth-page.css'

function App() {
  return (
    <main className="auth-page">
      <WelcomePanel />
      <AuthPanel />
    </main>
  )
}

export default App
