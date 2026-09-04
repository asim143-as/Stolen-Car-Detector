"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  FilePlus2, ClipboardList, CheckCircle2, Clock, Trash2, Mail, ArrowRight,
  ShieldCheck, Car, Eye, Sparkles, AlertCircle
} from "lucide-react"
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
      apiFetch("/api/reports/me", token).then((d) => setReports(d.reports || [])).catch(() => setReports([])),
      apiFetch("/api/messages/me", token).then((d) => setMessages(d.messages || [])).catch(() => setMessages([])),
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

  const total = reports.length
  const pending = reports.filter((r) => r.status === "pending" || r.status === "under_review").length
  const found = reports.filter((r) => r.status === "found").length
  const unreadMessages = messages.filter((m) => !m.is_read)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. HERO COMMAND CENTRE CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-slate-800">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute right-40 -bottom-20 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/60 px-3.5 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md mb-4">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Citizen Vehicle Recovery Workspace</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Vehicle Recovery Command
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            Track real-time CCTV detections for your reported vehicles, receive direct investigation messages from police administration, and manage case statuses.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3.5">
            <Link href="/user/report/new">
              <Button className="rounded-xl px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:brightness-110 text-white font-semibold shadow-lg shadow-blue-500/25 border-0 text-xs sm:text-sm">
                <FilePlus2 className="h-4 w-4 mr-1.5" /> Report a Stolen Vehicle
              </Button>
            </Link>
            <Link href="/user/messages">
              <Button variant="outline" className="rounded-xl px-5 py-2.5 border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm">
                <Mail className="h-4 w-4 mr-1.5 text-cyan-400" /> Messages ({unreadMessages.length})
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Unread message alert banner from Administration */}
      {unreadMessages.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-cyan-800/60 bg-gradient-to-r from-cyan-950/80 via-blue-950/60 to-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 shadow-xs">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-xs sm:text-sm text-cyan-200">
                New Message from Administration ({unreadMessages.length} unread)
              </p>
              <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                {unreadMessages[0].plate_number ? `[${unreadMessages[0].plate_number}] ` : ""}
                {unreadMessages[0].message}
              </p>
            </div>
          </div>
          <Link href="/user/messages">
            <Button size="sm" className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2">
              Open Inbox <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* 2. STAT CARDS ROW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Reported Vehicles</p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">{loading ? "..." : total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Car className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Under Active Investigation</p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">{loading ? "..." : pending}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Recovered & Found</p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">{loading ? "..." : found}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. RECENT REPORTS LIST */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-600" /> Your Stolen Vehicle Cases
          </CardTitle>
          <Link href="/user/report/new" className="text-xs font-semibold text-blue-600 hover:underline">
            + New Report
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading || sessionLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading cases...</div>
          ) : reports.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aap ki taraf se abhi tak koi stolen car report darj nahi hui hai.{" "}
              <Link href="/user/report/new" className="font-semibold text-blue-600 hover:underline">
                Pehli report darj karein
              </Link>
              .
            </div>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 font-mono font-bold text-xs text-blue-600">
                    {r.plate.slice(0, 4)}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm text-slate-900 dark:text-white">{r.plate}</p>
                    <p className="text-xs text-slate-400">
                      {r.model} ({r.color}) · Reported on {new Date(r.date_added).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(r.id, r.plate)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                    title="Delete report"
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
