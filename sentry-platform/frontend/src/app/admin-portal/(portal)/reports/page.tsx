"use client"
import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import StatusBadge from "@/components/shared/StatusBadge"

type Report = { id: number; plate: string; owner: string; model: string; color: string; status: string; date_added: string }

export default function AdminReportsPage() {
  const { token } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    if (!token) return
    apiFetch("/api/reports", token).then((d) => setReports(d.reports)).finally(() => setLoading(false))
  }
  useEffect(load, [token])

  async function remove(id: number) {
    if (!token) return
    if (!confirm("Delete this report permanently?")) return
    await apiFetch(`/api/reports/${id}`, token, { method: "DELETE" })
    load()
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">All reports</h1>
      <Card>
        <CardHeader><CardTitle>{reports.length} report{reports.length !== 1 && "s"}</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Plate</TableHead><TableHead>Vehicle</TableHead><TableHead>Reporter</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.plate}</TableCell>
                    <TableCell>{r.model} · {r.color}</TableCell>
                    <TableCell className="text-muted-foreground">{r.owner}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
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
