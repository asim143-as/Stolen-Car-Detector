"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, ShieldCheck, LogOut, RefreshCw, Car, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PendingApprovalPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    async function checkApproval() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = "/login"
        return
      }

      setUserEmail(user.email || "")

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      if (profile?.role === "admin") {
        window.location.href = "/admin-portal/dashboard"
        return
      } else if (profile?.role === "user") {
        window.location.href = "/user/dashboard"
        return
      }

      // Check administration staff status
      const { data: staff } = await supabase
        .from("administration_staff")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!staff) {
        await supabase.from("administration_staff").insert({ user_id: user.id, status: "pending" })
      } else if (staff.status === "approved") {
        window.location.href = "/administration/dashboard"
        return
      }

      setLoading(false)
    }

    checkApproval()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  async function handleSwitchToReporter() {
    setSwitching(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("profiles").update({ role: "user" }).eq("id", user.id)
        window.location.href = "/user/dashboard"
      }
    } catch (e) {
      console.error(e)
      setSwitching(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-2xl text-center space-y-6">
        {/* Animated Status Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/10">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>

        <div>
          <div className="inline-block rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 mb-2">
            Awaiting Admin Review
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            Administration Access Pending
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Your account <strong className="text-slate-800 dark:text-slate-200">{userEmail}</strong> has registered for the Police & Administration Portal.
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            For security, an Administrator must verify and approve your staff clearance from the Admin Portal before CCTV surveillance tools can be accessed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Refresh button */}
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full rounded-xl py-2.5 text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Approval Status
          </Button>

          {/* Switch to Reporter button */}
          <Button
            onClick={handleSwitchToReporter}
            disabled={switching}
            className="w-full rounded-xl py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <Car className="h-4 w-4" /> {switching ? "Switching..." : "Continue as Vehicle Reporter"}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>

          {/* Logout / Switch account button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full rounded-xl py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" /> Log out / Sign in with different account
          </Button>
        </div>

        <div className="pt-2">
          <Link href="/welcome" className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            ← Return to Welcome Page
          </Link>
        </div>
      </div>
    </div>
  )
}
