"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { FilePlus2, ClipboardList, CheckCircle2, Clock, Trash2, Mail, ArrowRight } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import StatusBadge from "@/components/shared/StatusBadge"

type Report = { id: number; plate: string; model: string; color: string; status: string; date_added: string }
type MessageItem = { id: number; is_read: boolean; message: string; plate_number: string | null; created_at: string }

export default function UserDashboard() {
  const { token, loading: sessionLoading } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    Promise.all([
      apiFetch("/api/reports/me", token).then((d) => setReports(d.reports)),
      apiFetch("/api/messages/me", token).then((d) => setMessages(d.messages || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
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

  const pending = reports.filter((r) => r.status === "pending" || r.status === "under_review").length
  const found = reports.filter((r) => r.status === "found").length
  const unreadMessages = messages.filter((m) => !m.is_read)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Your dashboard</h1>
          <p className="text-muted-foreground">Track every vehicle you've reported.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/user/messages">
            <Button variant="outline" className="gap-2 border-slate-700">
              <Mail className="h-4 w-4 text-cyan-400" />
              Messages
              {unreadMessages.length > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-white font-bold">
                  {unreadMessages.length}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/user/report/new">
            <Button className="gap-2"><FilePlus2 className="h-4 w-4" /> Report a vehicle</Button>
          </Link>
        </div>
      </div>

      {/* Unread message alert banner from Administration */}
      {unreadMessages.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-cyan-800/60 bg-gradient-to-r from-cyan-950/70 via-blue-950/60 to-slate-900/80 p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-cyan-200">
                New Message from Administration ({unreadMessages.length})
              </p>
              <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                {unreadMessages[0].plate_number ? `[${unreadMessages[0].plate_number}] ` : ""}
                {unreadMessages[0].message}
              </p>
            </div>
          </div>
          <Link href="/user/messages">
            <Button size="sm" className="gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs">
              Open Inbox <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

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
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(r.id, r.plate)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="Delete Report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
