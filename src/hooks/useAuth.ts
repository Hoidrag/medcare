import { useCallback, useEffect, useState } from 'react'
import { endSession, getCurrentUser, submitCredentials, type AuthUser } from '../services/auth'
import type { AuthCredentials, AuthMode } from '../types/auth'

type AuthState = {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  authenticate: (mode: AuthMode, credentials: AuthCredentials) => Promise<AuthUser>
  logout: () => Promise<void>
  updateUser: (user: AuthUser) => void
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser)
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(getErrorMessage(
            requestError,
            'Serviciul de autentificare nu este disponibil momentan.',
          ))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const authenticate = useCallback(async (mode: AuthMode, credentials: AuthCredentials) => {
    setError(null)
    const authenticatedUser = await submitCredentials(mode, credentials)
    setUser(authenticatedUser)
    return authenticatedUser
  }, [])

  const logout = useCallback(async () => {
    await endSession()
    setUser(null)
  }, [])

  const updateUser = useCallback((updatedUser: AuthUser) => {
    setUser(updatedUser)
  }, [])

  return { user, isLoading, error, authenticate, logout, updateUser }
}
