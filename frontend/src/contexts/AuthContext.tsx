import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { keycloak } from '../auth/keycloak'
import type { AuthUser, UserRole } from '../types'

export type AuthError = 'init-failed' | 'no-role' | null

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  sessionExpired: boolean
  authError: AuthError
  login: () => Promise<void>
  logout: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  getAccessToken: () => string | null
  refreshAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

let initPromise: Promise<boolean> | null = null
const initKeycloak = () => {
  initPromise ??= keycloak.init({
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    checkLoginIframe: false,
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  })
  return initPromise
}

const resolveRole = (tokenRoles: unknown): UserRole | null => {
  if (!Array.isArray(tokenRoles)) {
    return null
  }
  if (tokenRoles.includes('admin')) {
    return 'admin'
  }
  if (tokenRoles.includes('doctor')) {
    return 'doctor'
  }
  if (tokenRoles.includes('patient')) {
    return 'patient'
  }
  return null
}

const mapUserFromToken = (): AuthUser | null => {
  const token = keycloak.tokenParsed
  if (!token?.sub) {
    return null
  }
  const role = resolveRole((token as { realm_access?: { roles?: string[] } }).realm_access?.roles)
  if (!role) {
    return null
  }

  const firstName = (token.given_name as string | undefined) ?? ''
  const lastName = (token.family_name as string | undefined) ?? ''
  return {
    id: token.sub,
    keycloakId: token.sub,
    email: (token.email as string | undefined) ?? '',
    fullName: `${firstName} ${lastName}`.trim() || ((token.preferred_username as string | undefined) ?? 'User'),
    role,
  }
}

export const AuthProvider = ({
  children,
  initialUser = null,
  disableKeycloak = false,
}: {
  children: ReactNode
  initialUser?: AuthUser | null
  disableKeycloak?: boolean
}) => {
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const [initialized, setInitialized] = useState(Boolean(initialUser) || disableKeycloak)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [authError, setAuthError] = useState<AuthError>(null)

  const login = useCallback(async () => {
    if (disableKeycloak) {
      return
    }
  
    await keycloak.login({ redirectUri: `${window.location.origin}/` })
  }, [disableKeycloak])

  const logout = useCallback(async () => {
    setUser(null)
    if (disableKeycloak) {
      return
    }
    await keycloak.logout({ redirectUri: `${window.location.origin}/login` })
  }, [disableKeycloak])

  const refreshAccessToken = useCallback(async () => {
    if (disableKeycloak) {
      return null
    }
    try {
      await keycloak.updateToken(30)
      return keycloak.token ?? null
    } catch {
      setSessionExpired(true)
      setUser(null)
      await keycloak.logout({ redirectUri: `${window.location.origin}/session-expired` })
      return null
    }
  }, [disableKeycloak])

  useEffect(() => {
    if (disableKeycloak || initialUser) {
      return
    }

    let mounted = true
    keycloak.onTokenExpired = () => {
      void refreshAccessToken()
    }

    void initKeycloak()
      .then((authenticated) => {
        if (!mounted || !authenticated) {
          return
        }
        const mapped = mapUserFromToken()
        setUser(mapped)
        if (!mapped) {
          setAuthError('no-role')
        }
      })
      .catch(() => {
        if (mounted) {
          setAuthError('init-failed')
        }
      })
      .finally(() => {
        if (mounted) {
          setInitialized(true)
        }
      })

    return () => {
      mounted = false
    }
  }, [disableKeycloak, initialUser, refreshAccessToken])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      sessionExpired,
      authError,
      login,
      logout,
      hasRole: (role) => user?.role === role,
      getAccessToken: () => (disableKeycloak ? null : keycloak.token ?? null),
      refreshAccessToken,
    }),
    [authError, disableKeycloak, login, logout, refreshAccessToken, sessionExpired, user],
  )

  if (!initialized) {
    return null
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}