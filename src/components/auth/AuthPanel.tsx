import { useState, type FormEvent } from 'react'
import type { AuthMode, AuthProvider } from '../../types/auth'
import BrandLogo from '../BrandLogo'
import AuthForm from './AuthForm'
import SocialAuthButtons from './SocialAuthButtons'

export default function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const isRegistering = mode === 'register'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(
      isRegistering
        ? 'Contul tău este pregătit pentru configurare. Autentificarea va fi activată într-o etapă viitoare.'
        : 'Interfața este pregătită. Conectarea va fi activată într-o etapă viitoare.',
    )
  }

  function handleProviderSelect(provider: AuthProvider) {
    setNotice(`Conectarea cu ${provider} va fi disponibilă într-o etapă viitoare.`)
  }

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode)
    setNotice('')
  }

  return (
    <section className="form-panel" aria-label={isRegistering ? 'Creare cont' : 'Autentificare'}>
      <div className="mobile-brand"><BrandLogo /></div>
      <div className="auth-card">
        <div className="auth-heading">
          <span className="auth-kicker">{isRegistering ? 'BINE AI VENIT ÎN COMUNITATE' : 'CONTUL TĂU MEDICAL'}</span>
          <h2>{isRegistering ? 'Creează-ți contul' : 'Bine ai revenit'}</h2>
          <p>{isRegistering ? 'Completează datele pentru a începe.' : 'Conectează-te pentru a continua.'}</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Tipul autentificării">
          <button
            type="button"
            role="tab"
            aria-selected={!isRegistering}
            className={!isRegistering ? 'active' : ''}
            onClick={() => handleModeChange('login')}
          >
            Autentificare
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isRegistering}
            className={isRegistering ? 'active' : ''}
            onClick={() => handleModeChange('register')}
          >
            Creează cont
          </button>
        </div>

        <AuthForm
          mode={mode}
          showPassword={showPassword}
          notice={notice}
          onTogglePassword={() => setShowPassword((isVisible) => !isVisible)}
          onForgotPassword={() => setNotice('Recuperarea parolei va fi disponibilă într-o etapă viitoare.')}
          onSubmit={handleSubmit}
        />

        <div className="separator"><span /> <span>sau continuă cu</span> <span /></div>
        <SocialAuthButtons onSelectProvider={handleProviderSelect} />
        <p className="privacy-note">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v7h-9z" /></svg>
          Datele tale sunt protejate și păstrate în siguranță.
        </p>
      </div>
      <footer className="form-footer"><span>© 2025 MedCare</span><a href="#ajutor" onClick={(event) => event.preventDefault()}>Ai nevoie de ajutor?</a></footer>
    </section>
  )
}
