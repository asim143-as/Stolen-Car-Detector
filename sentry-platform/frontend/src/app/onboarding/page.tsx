"use client"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ShieldCheck, UserRound, Building2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function OnboardingContent() {
  const router = useRouter()
  const params = useSearchParams()
  const portal = params.get("portal") || "user"
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-submit if portal is known — no need for the user to click
  useEffect(() => {
    const role = portal === "administration" ? "administration" : "user"
    choose(role)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portal])

  async function choose(role: "user" | "administration") {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error("No logged-in user found. Try logging in again.")

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email, role })
      if (profileError) throw profileError

      if (role === "administration") {
        router.push("/administration/dashboard")
      } else {
        router.push("/user/dashboard")
      }
    } catch (err: any) {
      setLoading(false)
      setError(err.message || "Something went wrong.")
      console.error("Onboarding error:", err)
    }
  }

  const isAdministration = portal === "administration"

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-heading text-2xl font-bold">Setting up your account…</h1>
        <p className="mt-1 text-muted-foreground">
          {isAdministration
            ? "Registering you as Administration staff."
            : "Registering you as a vehicle reporter."}
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <strong>Error:</strong> {error}
            <div className="mt-3">
              <Button onClick={() => choose(isAdministration ? "administration" : "user")} disabled={loading}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {!error && (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
