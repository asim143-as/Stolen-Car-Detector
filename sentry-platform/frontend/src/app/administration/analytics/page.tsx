"use client"
import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsPage() {
  const { token } = useSession()
  const [data, setData] = useState<{ status: string; count: number }[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!token) return
    apiFetch("/api/reports", token).then((d) => {
      const counts: Record<string, number> = { pending: 0, under_review: 0, found: 0, not_found: 0 }
      d.reports.forEach((r: any) => { counts[r.status] = (counts[r.status] || 0) + 1 })
      setData(Object.entries(counts).map(([status, count]) => ({ status, count })))
      setTotal(d.reports.length)
    })
  }, [token])

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Analytics</h1>
      <Card>
        <CardHeader><CardTitle>Reports by status ({total} total)</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="status" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
