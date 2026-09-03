"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, UserRound, Building2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// First-login step: pick "I'm reporting a stolen vehicle" (role=user,
// active immediately) or "I'm Administration staff" (role=administration,
// pending Admin approval -- mirrors MediSight's doctor-approval flow).
export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function choose(role: "user" | "administration") {
    setLoading(role)
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
        const { error: staffError } = await supabase
          .from("administration_staff")
          .upsert({ user_id: user.id, status: "pending" })
        if (staffError) throw staffError
        router.push("/pending-approval")
      } else {
        router.push("/user/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Check the browser console for details.")
      console.error("Onboarding error:", err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 font-heading text-2xl font-bold">One quick thing</h1>
          <p className="mt-1 text-muted-foreground">How will you be using Sentry?</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="cursor-pointer transition-shadow hover:shadow-glow" onClick={() => choose("user")}>
            <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
              <UserRound className="h-8 w-8 text-primary" />
              <p className="font-heading font-semibold">I'm reporting a vehicle</p>
              <p className="text-sm text-muted-foreground">Submit a stolen car report and track its status.</p>
              <Button className="mt-2 w-full" disabled={!!loading}>{loading === "user" ? "Setting up..." : "Continue"}</Button>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-shadow hover:shadow-glow-crimson" onClick={() => choose("administration")}>
            <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
              <Building2 className="h-8 w-8 text-crimson" />
              <p className="font-heading font-semibold">I'm Administration staff</p>
              <p className="text-sm text-muted-foreground">Review footage and resolve reports. Requires admin approval.</p>
              <Button variant="crimson" className="mt-2 w-full" disabled={!!loading}>{loading === "administration" ? "Setting up..." : "Continue"}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
