import axios, { isAxiosError } from "axios"

const TOKEN_KEY = "campanhahub_token"
export const UNAUTHORIZED_EVENT = "auth:unauthorized"

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error)) {
      const path = error.config?.url ?? ""
      const isAuthForm = path.includes("/auth/login") || path.includes("/auth/register")
      if (error.response?.status === 401 && !isAuthForm) {
        clearToken()
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
      }
      const detail = error.response?.data?.detail
      if (error.response?.status === 429) {
        const retryAfter = Number(error.response.headers["retry-after"])
        const pause = Number.isFinite(retryAfter) && retryAfter > 0
          ? `Espere ${retryAfter === 1 ? "1 segundo" : `${retryAfter} segundos`} e tente de novo.`
          : "Espere alguns segundos e tente de novo."
        const message = typeof detail === "string" ? detail : `Muitas requisições em sequência. ${pause}`
        return Promise.reject(new Error(message))
      }
      return Promise.reject(new Error(typeof detail === "string" ? detail : "Não foi possível concluir a operação."))
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Não foi possível concluir a operação."
}
