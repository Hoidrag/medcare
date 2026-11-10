import type { FormEvent } from 'react'
import type { AuthMode } from '../../types/auth'

type AuthFormProps = {
  mode: AuthMode
  showPassword: boolean
  notice: string
  onTogglePassword: () => void
  onForgotPassword: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function AuthForm({
  mode,
  showPassword,
  notice,
  onTogglePassword,
  onForgotPassword,
  onSubmit,
}: AuthFormProps) {
  const isRegistering = mode === 'register'

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {isRegistering && (
        <label className="field">
          <span>Nume complet</span>
          <input type="text" name="name" placeholder="Ex. Andreea Popescu" autoComplete="name" required />
        </label>
      )}
      <label className="field">
        <span>Adresă de e-mail</span>
        <span className="input-wrap">
          <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4" width="15" height="12" rx="2" /><path d="m3.5 5 6.5 5 6.5-5" /></svg>
          <input type="email" name="email" placeholder="nume@exemplu.ro" autoComplete="email" required />
        </span>
      </label>
      <label className="field">
        <span>Parolă</span>
        <span className="input-wrap">
          <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3.5" y="8" width="13" height="9" rx="2" /><path d="M6.5 8V5.5a3.5 3.5 0 0 1 7 0V8" /></svg>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Cel puțin 8 caractere"
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            minLength={8}
            required
          />
          <button className="password-toggle" type="button" onClick={onTogglePassword} aria-label={showPassword ? 'Ascunde parola' : 'Afișează parola'}>
            {showPassword ? 'Ascunde' : 'Arată'}
          </button>
        </span>
      </label>

      {isRegistering ? (
        <label className="check-row terms-row">
          <input type="checkbox" required />
          <span>Am citit și sunt de acord cu <a href="#termeni" onClick={(event) => event.preventDefault()}>Termenii și condițiile</a> și <a href="#confidentialitate" onClick={(event) => event.preventDefault()}>Politica de confidențialitate</a>.</span>
        </label>
      ) : (
        <div className="form-options">
          <label className="check-row"><input type="checkbox" /><span>Ține-mă minte</span></label>
          <button className="text-button" type="button" onClick={onForgotPassword}>Ai uitat parola?</button>
        </div>
      )}

      <button className="submit-button" type="submit">
        {isRegistering ? 'Creează contul' : 'Autentificare'}
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M10 5l5 5-5 5" /></svg>
      </button>
      {notice && <p className="form-notice" role="status">{notice}</p>}
    </form>
  )
}
