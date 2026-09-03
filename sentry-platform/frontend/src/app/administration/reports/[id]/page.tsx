"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Video, ArrowLeft } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import StatusBadge from "@/components/shared/StatusBadge"

type Report = { id: number; plate: string; owner: string; model: string; color: string; status: string; date_added: string; review_notes: string | null }

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token } = useSession()
  const [report, setReport] = useState<Report | null>(null)
  const [status, setStatus] = useState("pending")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) return
    apiFetch("/api/reports", token).then((d) => {
      const r = d.reports.find((x: Report) => String(x.id) === id)
      setReport(r ?? null)
      if (r) { setStatus(r.status); setNotes(r.review_notes || "") }
    })
  }, [token, id])

  async function save() {
    if (!token || !report) return
    setSaving(true)
    try {
      await apiFetch(`/api/reports/${report.id}/status`, token, { method: "PATCH", body: JSON.stringify({ status, notes }) })
      router.push("/administration/reports")
    } finally {
      setSaving(false)
    }
  }

  if (!report) return <p className="text-sm text-muted-foreground">Loading...</p>

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/administration/reports" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to queue</Link>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{report.plate}</CardTitle>
          <StatusBadge status={report.status} />
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Vehicle:</strong> {report.model} · {report.color}</p>
          <p><strong className="text-foreground">Reported by:</strong> {report.owner}</p>
          <p><strong className="text-foreground">Submitted:</strong> {new Date(report.date_added).toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Review footage</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">Run detection on CCTV/dashcam footage to check for this plate.</p>
          <Link href="/administration/detect"><Button variant="outline" className="gap-2"><Video className="h-4 w-4" /> Go to Live Detect</Button></Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Update status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="found">Found</SelectItem>
                <SelectItem value="not_found">Not Found</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes (visible to the reporter)</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" placeholder="e.g. Matched on Elm St camera, 8/20 11:40pm" />
          </div>
          <Button onClick={save} disabled={saving} variant="crimson" className="w-full">{saving ? "Saving..." : "Save status"}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
