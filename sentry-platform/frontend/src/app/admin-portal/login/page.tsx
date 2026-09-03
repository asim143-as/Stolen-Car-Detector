"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function AdminPortalLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function verifyAdminAndRedirect(supabase: ReturnType<typeof createClient>, userId: string) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single()
    if (profile?.role !== "admin") {
      await supabase.auth.signOut()
      throw new Error("This account does not have Admin access.")
    }
    router.push("/admin-portal/dashboard")
    router.refresh()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setLoading(false); return setError(error.message) }

    try {
      await verifyAdminAndRedirect(supabase, data.user.id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    // Redirects through /auth/callback like the normal login -- once
    // back, the (portal) layout's own server-side admin check is what
    // actually gates access; this button just starts the OAuth flow.
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=/admin-portal/dashboard` },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Lock className="mx-auto mb-2 h-8 w-8 text-primary" />
          <CardTitle className="flex items-center justify-center gap-2"><ShieldCheck className="h-5 w-5" /> Admin Portal</CardTitle>
          <CardDescription>Restricted access -- Admin role only.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} type="button">
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  )
}
