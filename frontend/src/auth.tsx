import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { clearToken, getToken, setToken, UNAUTHORIZED_EVENT } from "@/lib/api"
import { authApi } from "@/lib/services"
import type { LoginValues, RegisterValues } from "@/lib/schemas"
import type { User } from "@/types"

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (values: LoginValues) => Promise<void>
  register: (values: RegisterValues) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function handleUnauthorized() {
      clearToken()
      setUser(null)
      queryClient.clear()
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [queryClient])

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(values) {
        const data = await authApi.login(values)
        setToken(data.access_token)
        setUser(data.user)
      },
      async register(values) {
        const data = await authApi.register(values)
        setToken(data.access_token)
        setUser(data.user)
      },
      logout() {
        clearToken()
        setUser(null)
        queryClient.clear()
      },
    }),
    [user, loading, queryClient],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return ctx
}
