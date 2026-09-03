"use client"
import { useEffect, useState } from "react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import StatusBadge from "@/components/shared/StatusBadge"

type Report = { id: number; plate: string; owner: string; model: string; color: string; status: string; date_added: string; review_notes: string | null }

export default function MyReportsPage() {
  const { token } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    apiFetch("/api/reports/me", token).then((d) => setReports(d.reports)).finally(() => setLoading(false))
  }, [token])

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">My reports</h1>
      <Card>
        <CardHeader><CardTitle>All submissions</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.plate}</TableCell>
                    <TableCell>{r.model} · {r.color}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(r.date_added).toLocaleDateString()}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{r.review_notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
