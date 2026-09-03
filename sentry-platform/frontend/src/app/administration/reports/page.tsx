"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StatusBadge from "@/components/shared/StatusBadge"

type Report = { id: number; plate: string; owner: string; model: string; color: string; status: string; date_added: string }

export default function ReportsQueuePage() {
  const { token } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    const qs = filter === "all" ? "" : `?status=${filter}`
    apiFetch(`/api/reports${qs}`, token).then((d) => setReports(d.reports)).finally(() => setLoading(false))
  }, [token, filter])

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Reports queue</h1>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="found">Found</TabsTrigger>
          <TabsTrigger value="not_found">Not Found</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader><CardTitle>{reports.length} report{reports.length !== 1 && "s"}</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Plate</TableHead><TableHead>Vehicle</TableHead><TableHead>Reporter</TableHead><TableHead>Submitted</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer">
                    <TableCell className="font-medium"><Link href={`/administration/reports/${r.id}`}>{r.plate}</Link></TableCell>
                    <TableCell>{r.model} · {r.color}</TableCell>
                    <TableCell className="text-muted-foreground">{r.owner}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(r.date_added).toLocaleDateString()}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
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
