import type { AuthMode } from '../types/auth'

export type AuthUser = {
  id: string
  name: string
  email: string
}

type AuthResponse = {
  user: AuthUser
}

type ApiErrorResponse = {
  message?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function readResponse<T>(response: Response): Promise<T> {
  let payload: unknown

  try {
    payload = await response.json()
  } catch {
    throw new Error('Răspunsul serviciului de autentificare nu este valid. Verifică dacă serverul API rulează.')
  }

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.message === 'string'
      ? payload.message
      : 'Solicitarea nu a putut fi procesată.'
    throw new Error(message)
  }

  if (!isRecord(payload)) {
    throw new Error('Răspunsul serviciului de autentificare nu are formatul așteptat.')
  }

  return payload as T
}

export async function submitCredentials(
  mode: AuthMode,
  credentials: { name?: string; email: string; password: string },
): Promise<AuthUser> {
  const response = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(credentials),
  })

  const payload = await readResponse<AuthResponse>(response)
  return payload.user
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/me', { credentials: 'same-origin' })

  if (response.status === 401) {
    return null
  }

  const payload = await readResponse<AuthResponse>(response)
  return payload.user
}

export async function endSession(): Promise<void> {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    await readResponse<ApiErrorResponse>(response)
  }
}
