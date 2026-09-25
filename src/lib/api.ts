import { Api } from "@/lib/client"

const AUTH_BASE = import.meta.env.VITE_AUTH_URL ?? ""
const API_BASE = import.meta.env.VITE_API_URL ?? ""

// backend API client uses API_BASE
const api = new Api({
  baseURL: API_BASE,
  securityWorker: (token: any) => {
    if (!token) return {}
    return { headers: { Authorization: `Bearer ${token}` } }
  },
})

export function configureBearer(token: string | null) {
  api.setSecurityData(token)
}

export async function initAuthFromPropelauthSession() {
  if (!AUTH_BASE) return null
  try {
    // Try /session first (Propelauth typically exposes session info)
    const sessionRes = await fetch(`${AUTH_BASE.replace(/\/$/, "")}/session`, {
      credentials: "include",
    })
    if (sessionRes.ok) {
      const json = await sessionRes.json()
      // common field names: access_token, token
      const token = json?.access_token || json?.token || null
      if (token) {
        configureBearer(token)
        return token
      }
    }

    // Fallback to /me which may include token or indicate cookie session
    const meRes = await fetch(`${AUTH_BASE.replace(/\/$/, "")}/me`, {
      credentials: "include",
    })
    if (meRes.ok) {
      const json = await meRes.json()
      const token = json?.access_token || json?.token || null
      if (token) {
        configureBearer(token)
        return token
      }
      // no token returned; rely on cookie-based session
      // ensure axios includes credentials by default
      api.instance.defaults.withCredentials = true
      return null
    }
  } catch (e) {
    // ignore and continue
  }
  return null
}

export default api
