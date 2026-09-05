"use client"
import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ShieldCheck, AtSign, Lock, Eye, EyeOff, Shield, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const initialPortal = params.get("portal") === "administration" ? "administration" : "user"

  const [activePortal, setActivePortal] = useState<"user" | "administration">(initialPortal)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
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
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle()

        let role = profile?.role

        // Block Admin accounts from public login page
        if (role === "admin") {
          await supabase.auth.signOut()
          setLoading(false)
          return setError("Admin accounts cannot sign in from here. Please use the dedicated Admin Portal.")
        }

        if (!role) {
          await supabase.from("profiles").upsert({ id: data.user.id, email: data.user.email, role: activePortal })
          role = activePortal
        }

        if (role === "administration" || activePortal === "administration") {
          const { data: staff } = await supabase
            .from("administration_staff")
            .select("status")
            .eq("user_id", data.user.id)
            .maybeSingle()

          if (!staff) {
            await supabase.from("administration_staff").insert({ user_id: data.user.id, status: "pending" })
            window.location.href = "/pending-approval"
            return
          } else if (staff.status !== "approved") {
            window.location.href = "/pending-approval"
            return
          }

          window.location.href = "/administration/dashboard"
          return
        } else {
          window.location.href = "/user/dashboard"
          return
        }
      }
    } catch {
      // Fallback redirect
    }

    window.location.href = activePortal === "administration" ? "/administration/dashboard" : "/user/dashboard"
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?portal=${activePortal}` },
    })
  }

  async function handleFacebookLogin() {
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
        {/* Subtle decorative background circles */}
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
            AI-Powered Vehicle Recovery, <br />
            Delivered with Precision.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-blue-100/90 lg:text-base">
            Automated license plate recognition, real-time video surveillance, and intelligent alert dispatch — all in one secure workspace built for modern security teams and citizens.
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

      {/* RIGHT COLUMN: Clean White Modern Workspace Sign-in */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 lg:p-16 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-[440px]">
          {/* Mobile-only branding header */}
          <div className="mb-6 lg:hidden">
            <Link href="/welcome" className="inline-flex items-center gap-2 font-heading text-base font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="h-5 w-5 text-blue-600" /> Stolen Car Detection System
            </Link>
          </div>

          {/* Welcome Badge */}
          <div className="mb-3">
            <span className="inline-block rounded-full border border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/40 px-3 py-1 text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
              Welcome Back
            </span>
          </div>

          {/* Title and description */}
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign in to your workspace
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Securely access your vehicle tracking portal and resume your surveillance investigations in one place.
          </p>

          {/* Portal Switcher Tabs (Matches Patient Portal / Doctor Portal from MediSight) */}
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

          {/* Error message */}
          {params.get("error") && (
            <p className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              {params.get("error")}
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              {error}
            </p>
          )}

          {/* Login Form */}
          <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
            {/* Email Field with @ Icon */}
            <div>
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email or Phone
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

            {/* Password Field with Lock & Eye Toggle */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
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

            {/* Remember Me & Secure Session */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember me</span>
              </label>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Secure session</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:brightness-110 shadow-lg shadow-blue-500/25 transition-all border-0"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* OR CONTINUE WITH Divider */}
          <div className="my-6 flex items-center gap-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span>Or continue with</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* SOCIAL BUTTONS: Google & Facebook (Replacing Apple) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Google Button with Official Multi-color Logo */}
            <button
              type="button"
              onClick={handleGoogleLogin}
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

            {/* Facebook Button with Official Blue Logo (Replaced Apple) */}
            <button
              type="button"
              onClick={handleFacebookLogin}
              className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>

          {/* Sign up footer link */}
          <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
            <span>Don't have an account? </span>
            <Link
              href={`/signup?portal=${activePortal}`}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
