// Thin client for the Python backend (FastAPI) -- the service that does
// the actual heavy lifting: YOLO video detection and the Gemini
// assistant. Everything else (reports, profiles, roles) is Supabase
// directly. Mirrors how MediSight's frontend calls its ml-service.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function apiFetch(path: string, token: string | undefined, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'bypass-tunnel-reminder': 'true',
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed (${res.status})`)
  }
  return res.json()
}
