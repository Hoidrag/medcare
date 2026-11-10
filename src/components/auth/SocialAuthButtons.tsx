import type { AuthProvider } from '../../types/auth'

type SocialAuthButtonsProps = {
  onSelectProvider: (provider: AuthProvider) => void
}

const providers: AuthProvider[] = ['Google', 'Facebook', 'GitHub']

function ProviderIcon({ provider }: { provider: AuthProvider }) {
  if (provider === 'Google') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path fill="#4285F4" d="M18.4 10.2c0-.6-.1-1.2-.2-1.8H10v3.4h4.7a4 4 0 0 1-1.8 2.6v2.2h2.9c1.7-1.5 2.6-3.8 2.6-6.4Z" />
        <path fill="#34A853" d="M10 18.7c2.4 0 4.4-.8 5.8-2.2l-2.9-2.2c-.8.5-1.7.9-2.9.9-2.3 0-4.2-1.6-4.9-3.7H2.1v2.3a8.8 8.8 0 0 0 7.9 4.9Z" />
        <path fill="#FBBC05" d="M5.1 11.5a5.3 5.3 0 0 1 0-3V6.2H2.1a8.8 8.8 0 0 0 0 7.6l3-2.3Z" />
        <path fill="#EA4335" d="M10 4.8c1.3 0 2.4.4 3.3 1.3l2.5-2.5A8.3 8.3 0 0 0 10 1.3a8.8 8.8 0 0 0-7.9 4.9l3 2.3c.7-2.1 2.6-3.7 4.9-3.7Z" />
      </svg>
    )
  }

  if (provider === 'Facebook') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path fill="#1877F2" d="M18 10a8 8 0 1 0-9.25 7.9v-5.58H6.72V10h2.03V8.23c0-2 1.19-3.1 3.01-3.1.87 0 1.78.16 1.78.16v1.96h-1c-.99 0-1.3.61-1.3 1.24V10h2.2l-.35 2.32h-1.85v5.58A8 8 0 0 0 18 10Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path fill="currentColor" d="M10 .8a9.2 9.2 0 0 0-2.91 17.93c.46.09.63-.2.63-.45v-1.6c-2.57.56-3.11-1.09-3.11-1.09-.42-1.07-1.03-1.36-1.03-1.36-.84-.57.07-.56.07-.56.93.07 1.42.95 1.42.95.83 1.42 2.18 1.01 2.71.77.08-.6.33-1.01.59-1.24-2.05-.23-4.21-1.03-4.21-4.57 0-1.01.36-1.84.95-2.49-.1-.23-.41-1.18.09-2.46 0 0 .77-.25 2.53.95a8.8 8.8 0 0 1 4.61 0c1.76-1.2 2.52-.95 2.52-.95.5 1.28.19 2.23.1 2.46.59.65.94 1.48.94 2.49 0 3.55-2.17 4.34-4.23 4.57.34.29.63.85.63 1.72v2.41c0 .25.17.55.64.45A9.2 9.2 0 0 0 10 .8Z" />
    </svg>
  )
}

export default function SocialAuthButtons({ onSelectProvider }: SocialAuthButtonsProps) {
  return (
    <div className="social-buttons">
      {providers.map((provider) => (
        <button type="button" key={provider} onClick={() => onSelectProvider(provider)}>
          <ProviderIcon provider={provider} />
          <span>{provider}</span>
        </button>
      ))}
    </div>
  )
}
