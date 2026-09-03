"use client"
import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SignupForm() {
  const searchParams = useSearchParams()
  const portal = searchParams.get("portal") || "user"
  const isAdministration = portal === "administration"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, portal },
        emailRedirectTo: `${location.origin}/auth/callback?portal=${portal}`,
      },
    })
    setLoading(false)
    if (error) return setError(error.message)
    setDone(true)
  }

  async function handleGoogleSignup() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?portal=${portal}` },
    })
  }

  if (done) {
    return (
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We sent a confirmation link to <strong>{email}</strong>. Click it, then come back and log in.
        </p>
        <Link href={`/login?portal=${portal}`}><Button className="mt-6 w-full">Back to log in</Button></Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">
        {isAdministration ? "Administration Registration" : "Report a Stolen Vehicle"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAdministration
          ? "Create an account to join as Administration staff."
          : "Create an account to submit and track your stolen vehicle report."}
      </p>

      <Button variant="outline" className="mt-6 w-full" onClick={handleGoogleSignup} type="button">
        Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
      </form>

      <p className="mt-6 text-center text-sm">
        Already have an account? <Link href={`/login?portal=${portal}`} className="font-medium text-primary">Log in</Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  )
}

