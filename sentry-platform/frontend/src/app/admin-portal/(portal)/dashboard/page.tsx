"use client"
import { useEffect, useState } from "react"
import { Users, ClipboardList, ShieldCheck, Clock } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminDashboard() {
  const { token } = useSession()
  const [userCount, setUserCount] = useState(0)
  const [pendingStaff, setPendingStaff] = useState(0)
  const [reportCounts, setReportCounts] = useState({ total: 0, pending: 0, found: 0 })

  useEffect(() => {
    fetch("/api/admin/users").then((r) => r.json()).then((d) => {
      setUserCount(d.users?.length || 0)
      setPendingStaff((d.users || []).filter((u: any) => u.role === "administration" && u.staff_status !== "approved").length)
    })
  }, [])

  useEffect(() => {
    if (!token) return
    apiFetch("/api/reports", token).then((d) => {
      setReportCounts({
        total: d.reports.length,
        pending: d.reports.filter((r: any) => r.status === "pending").length,
        found: d.reports.filter((r: any) => r.status === "found").length,
      })
    })
  }, [token])

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Admin overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm text-muted-foreground">Total users</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-3xl font-bold">{userCount}</p></CardContent></Card>
        <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm text-muted-foreground">Pending approvals</CardTitle><Clock className="h-4 w-4 text-amber" /></CardHeader><CardContent><p className="text-3xl font-bold">{pendingStaff}</p></CardContent></Card>
        <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm text-muted-foreground">Total reports</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-3xl font-bold">{reportCounts.total}</p></CardContent></Card>
        <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm text-muted-foreground">Found</CardTitle><ShieldCheck className="h-4 w-4 text-emerald-500" /></CardHeader><CardContent><p className="text-3xl font-bold">{reportCounts.found}</p></CardContent></Card>
      </div>
    </div>
  )
}
