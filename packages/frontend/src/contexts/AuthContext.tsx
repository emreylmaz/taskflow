import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api, setAuthToken, clearAuthToken, onUnauthorized } from '../lib/api'

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Token'ı refresh et
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.post<{ accessToken: string; user: User }>('/auth/refresh')
      setAuthToken(response.accessToken)
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      })
      return true
    } catch {
      clearAuthToken()
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
      return false
    }
  }, [])

  // 401 hatalarında logout yap
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      clearAuthToken()
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    })
    return unsubscribe
  }, [])

  // İlk yüklemede token kontrolü
  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  const login = async (email: string, password: string) => {
    const response = await api.post<{ accessToken: string; user: User }>('/auth/login', {
      email,
      password,
    })
    setAuthToken(response.accessToken)
    setState({
      user: response.user,
      isAuthenticated: true,
      isLoading: false,
    })
  }

  const register = async (name: string, email: string, password: string) => {
    await api.post('/auth/register', { name, email, password })
    // Register sonrası otomatik login
    await login(email, password)
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Logout hata verse de local state'i temizle
    }
    clearAuthToken()
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
