"use client"
import { useEffect, useState } from "react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import StatusBadge from "@/components/shared/StatusBadge"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type Report = { id: number; plate: string; owner: string; model: string; color: string; status: string; date_added: string; review_notes: string | null }

export default function MyReportsPage() {
  const { token } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    apiFetch("/api/reports/me", token).then((d) => setReports(d.reports)).finally(() => setLoading(false))
  }, [token])

  async function handleDelete(reportId: number, plate: string) {
    if (!token) return
    const confirmed = window.confirm(`Kya aap waqai report '${plate}' ko delete karna chahte hain?`)
    if (!confirmed) return
    try {
      await apiFetch(`/api/reports/${reportId}`, token, { method: "DELETE" })
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    } catch (err: any) {
      alert(err.message || "Report delete nahi ho saki.")
    }
  }

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
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(r.id, r.plate)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Delete Report"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
