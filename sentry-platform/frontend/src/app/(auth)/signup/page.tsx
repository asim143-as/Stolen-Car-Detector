"use client"
import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ShieldCheck, User, AtSign, Lock, Eye, EyeOff, Shield, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SignupForm() {
  const searchParams = useSearchParams()
  const initialPortal = searchParams.get("portal") === "administration" ? "administration" : "user"

  const [activePortal, setActivePortal] = useState<"user" | "administration">(initialPortal)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
        data: { full_name: fullName, portal: activePortal },
        emailRedirectTo: `${location.origin}/auth/callback?portal=${activePortal}`,
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
      options: { redirectTo: `${location.origin}/auth/callback?portal=${activePortal}` },
    })
  }

  async function handleFacebookSignup() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: `${location.origin}/auth/callback?portal=${activePortal}` },
    })
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* LEFT COLUMN: Modern Blue-Indigo AI Branding Showcase (Matches MediSight Style) */}
      <div className="relative hidden w-full lg:flex lg:w-1/2 flex-col justify-between p-12 lg:p-16 bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#4F46E5] text-white overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-900/40 blur-3xl" />

        {/* Top Logo Badge */}
        <div className="relative z-10">
          <Link
            href="/welcome"
            className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur-md transition-colors hover:bg-white/25 text-white"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-extrabold text-blue-600 shadow-sm">
              SCD
            </span>
            <span>Stolen Car Detection System</span>
          </Link>
        </div>

        {/* Center Headline & Features */}
        <div className="relative z-10 my-auto max-w-lg">
          <h1 className="font-heading text-3xl font-extrabold leading-tight tracking-tight lg:text-4xl text-white">
            Join the Next-Gen <br />
            Vehicle Security Network.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-blue-100/90 lg:text-base">
            Create an account to report stolen vehicles with instant tracking, or join law enforcement administration to monitor real-time AI detections.
          </p>

          <div className="mt-8 space-y-3.5 text-sm text-blue-100">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
              <span>Real-time deep learning plate recognition (YOLO + ANPR)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
              <span>Night & low-light adaptive CCTV enhancement</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
              <span>Instant owner recovery alerts & status tracking</span>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-blue-200/80">
          <Shield className="h-4 w-4 text-cyan-300" />
          <span>Enterprise-grade vehicle surveillance & forensic audit protection</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean White Modern Workspace Sign-up */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 lg:p-16 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-[440px]">
          {/* Mobile-only branding header */}
          <div className="mb-6 lg:hidden">
            <Link href="/welcome" className="inline-flex items-center gap-2 font-heading text-base font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="h-5 w-5 text-blue-600" /> Stolen Car Detection System
            </Link>
          </div>

          {done ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-lg">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Check your email</h2>
              <p className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                We sent a confirmation link to <strong className="text-slate-800 dark:text-slate-200">{email}</strong>. Click the link in your inbox, then come back and log in.
              </p>
              <Link href={`/login?portal=${activePortal}`}>
                <Button className="mt-6 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Badge */}
              <div className="mb-3">
                <span className="inline-block rounded-full border border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/40 px-3 py-1 text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                  Create Account
                </span>
              </div>

              {/* Title and description */}
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Get started with your portal
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {activePortal === "administration"
                  ? "Register as Administration staff to access surveillance footage and reports."
                  : "Register as a vehicle reporter to lodge theft reports and receive instant sightings."}
              </p>

              {/* Portal Switcher Tabs */}
              <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-200/80 dark:bg-slate-900 p-1">
                <button
                  type="button"
                  onClick={() => setActivePortal("user")}
                  className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                    activePortal === "user"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  User Portal
                </button>
                <button
                  type="button"
                  onClick={() => setActivePortal("administration")}
                  className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                    activePortal === "administration"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Administration Portal
                </button>
              </div>

              {error && (
                <p className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                  {error}
                </p>
              )}

              {/* Signup Form */}
              <form onSubmit={handleSignup} className="mt-6 space-y-4">
                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name
                  </Label>
                  <div className="relative mt-1.5">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="fullName"
                      required
                      placeholder="Muhammad Tahir"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="rounded-xl pl-10 bg-blue-50/40 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <div className="relative mt-1.5">
                    <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl pl-10 bg-blue-50/40 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl pl-10 pr-10 bg-blue-50/40 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:brightness-110 shadow-lg shadow-blue-500/25 transition-all border-0"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              {/* OR CONTINUE WITH Divider */}
              <div className="my-6 flex items-center gap-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span>Or continue with</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* SOCIAL BUTTONS: Google & Facebook */}
              <div className="grid grid-cols-2 gap-3">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                {/* Facebook Button */}
                <button
                  type="button"
                  onClick={handleFacebookSignup}
                  className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>

              {/* Login footer link */}
              <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
                <span>Already have an account? </span>
                <Link
                  href={`/login?portal=${activePortal}`}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
