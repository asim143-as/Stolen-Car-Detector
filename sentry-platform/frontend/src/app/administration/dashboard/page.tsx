"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardList, Clock, CheckCircle2, Video } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import StatusBadge from "@/components/shared/StatusBadge"

type Report = { id: number; plate: string; owner: string; model: string; status: string }

export default function AdministrationDashboard() {
  const { token } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    apiFetch("/api/reports", token).then((d) => setReports(d.reports)).finally(() => setLoading(false))
  }, [token])

  const pending = reports.filter((r) => r.status === "pending").length
  const underReview = reports.filter((r) => r.status === "under_review").length
  const found = reports.filter((r) => r.status === "found").length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Administration dashboard</h1>
          <p className="text-muted-foreground">Review footage and resolve reports.</p>
        </div>
        <Link href="/administration/detect"><Button variant="crimson" className="gap-2"><Video className="h-4 w-4" /> Start live detection</Button></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm text-muted-foreground">Awaiting review</CardTitle><Clock className="h-4 w-4 text-amber" /></CardHeader><CardContent><p className="text-3xl font-bold">{pending}</p></CardContent></Card>
        <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm text-muted-foreground">Under review</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-3xl font-bold">{underReview}</p></CardContent></Card>
        <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm text-muted-foreground">Found (all time)</CardTitle><CheckCircle2 className="h-4 w-4 text-emerald-500" /></CardHeader><CardContent><p className="text-3xl font-bold">{found}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Needs review</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : reports.filter(r => r.status === "pending").slice(0, 6).map((r) => (
            <Link key={r.id} href={`/administration/reports/${r.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent">
              <div><p className="font-medium">{r.plate}</p><p className="text-sm text-muted-foreground">{r.model} · reported by {r.owner}</p></div>
              <StatusBadge status={r.status} />
            </Link>
          ))}
          {!loading && reports.filter(r => r.status === "pending").length === 0 && <p className="text-sm text-muted-foreground">Nothing pending review.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
