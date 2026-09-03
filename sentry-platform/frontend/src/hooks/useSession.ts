"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"

// Client-side hook for pages that call the FastAPI backend directly --
// gives you the current Supabase session (and its access token, which
// goes in the Authorization: Bearer header on every backend call).
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, loading, token: session?.access_token }
}
