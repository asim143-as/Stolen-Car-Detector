"use client"
import { useEffect, useState } from "react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import StatusBadge from "@/components/shared/StatusBadge"

type Report = { id: number; plate: string; status: string; reviewed_by: string | null; reviewed_at: string | null; review_notes: string | null }

export default function AuditLogPage() {
  const { token } = useSession()
  const [rows, setRows] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    apiFetch("/api/reports", token).then((d) => setRows(d.reports.filter((r: Report) => r.reviewed_at))).finally(() => setLoading(false))
  }, [token])

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Audit log</h1>
      <p className="text-muted-foreground">Every status decision Administration has made, with who and when.</p>
      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">No reviewed reports yet.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Plate</TableHead><TableHead>Status</TableHead><TableHead>Reviewed at</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.plate}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : "—"}</TableCell>
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
