"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { FilePlus2, ClipboardList, CheckCircle2, Clock } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import StatusBadge from "@/components/shared/StatusBadge"

type Report = { id: number; plate: string; model: string; color: string; status: string; date_added: string }

export default function UserDashboard() {
  const { token, loading: sessionLoading } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    apiFetch("/api/reports/me", token)
      .then((d) => setReports(d.reports))
      .finally(() => setLoading(false))
  }, [token])

  const pending = reports.filter((r) => r.status === "pending" || r.status === "under_review").length
  const found = reports.filter((r) => r.status === "found").length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Your dashboard</h1>
          <p className="text-muted-foreground">Track every vehicle you've reported.</p>
        </div>
        <Link href="/user/report/new"><Button className="gap-2"><FilePlus2 className="h-4 w-4" /> Report a vehicle</Button></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm text-muted-foreground">Total reports</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-3xl font-bold">{reports.length}</p></CardContent></Card>
        <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm text-muted-foreground">In progress</CardTitle><Clock className="h-4 w-4 text-amber" /></CardHeader><CardContent><p className="text-3xl font-bold">{pending}</p></CardContent></Card>
        <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm text-muted-foreground">Found</CardTitle><CheckCircle2 className="h-4 w-4 text-emerald-500" /></CardHeader><CardContent><p className="text-3xl font-bold">{found}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent reports</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading || sessionLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports yet. <Link href="/user/report/new" className="text-primary">Report your first vehicle</Link>.</p>
          ) : (
            reports.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">{r.plate}</p>
                  <p className="text-sm text-muted-foreground">{r.model} · {r.color}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
