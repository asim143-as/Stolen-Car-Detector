"use client"
import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      return setError(error.message)
    }

    try {
      if (data?.user) {
        const portal = params.get("portal")
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle()

        let role = profile?.role
        if (!role && portal) {
          const assigned = portal === "administration" ? "administration" : "user"
          await supabase.from("profiles").upsert({ id: data.user.id, email: data.user.email, role: assigned })
          role = assigned
        }

        if (role === "administration" || portal === "administration") {
          window.location.href = "/administration/dashboard"
          return
        } else if (role === "admin") {
          window.location.href = "/admin-portal/dashboard"
          return
        } else {
          window.location.href = "/user/dashboard"
          return
        }
      }
    } catch {
      // Fallback
    }

    const fallbackPortal = params.get("portal")
    window.location.href = fallbackPortal === "administration" ? "/administration/dashboard" : "/user/dashboard"
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    const portal = params.get("portal") || "user"
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?portal=${portal}` },
    })
  }

  const portal = params.get("portal")
  const isAdministration = portal === "administration"

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">
        {isAdministration ? "Administration Login" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAdministration
          ? "Log in to access the Administration portal."
          : "Log in to track your stolen vehicle report."}
      </p>

      {params.get("error") && (
        <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{params.get("error")}</p>
      )}

      <Button variant="outline" className="mt-6 w-full" onClick={handleGoogleLogin} type="button">
        Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Logging in..." : "Log in"}</Button>
      </form>

      <div className="mt-6 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">Forgot password?</Link>
        <Link href={`/signup?portal=${portal || "user"}`} className="font-medium text-primary">Sign up</Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
