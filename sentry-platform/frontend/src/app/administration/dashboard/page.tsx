"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ClipboardList, Clock, CheckCircle2, Video, ArrowRight, ShieldAlert,
  Car, Eye, Activity, Bell, FileText, AlertTriangle, Sparkles
} from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import StatusBadge from "@/components/shared/StatusBadge"

type Report = { id: number; plate: string; owner: string; model: string; color: string; status: string; date_added: string }

export default function AdministrationDashboard() {
  const { token } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    apiFetch("/api/reports", token)
      .then((d) => setReports(d.reports || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [token])

  const totalReports = reports.length
  const pending = reports.filter((r) => r.status === "pending").length
  const underReview = reports.filter((r) => r.status === "under_review").length
  const found = reports.filter((r) => r.status === "found").length
  const critical = reports.filter((r) => r.status === "pending").length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. HERO COMMAND CENTRE CARD (Matches MediSight Hospital Command Centre) */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-slate-800">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute right-40 -bottom-20 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl" />

        <div className="relative z-10 max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/60 px-3.5 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md mb-4">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>SCDS AI — Intelligence Surveillance Platform</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Surveillance Command Centre
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            Real-time monitoring of automated license plate recognition, live CCTV surveillance footage, and critical stolen vehicle alerts across the regional security grid.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3.5">
            <Link href="/administration/detect">
              <Button className="rounded-xl px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:brightness-110 text-white font-semibold shadow-lg shadow-blue-500/25 border-0 text-xs sm:text-sm">
                Start Live Detection <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/administration/reports">
              <Button variant="outline" className="rounded-xl px-5 py-2.5 border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm">
                View All Reports
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. STAT CARDS ROW (5 Cards with colored icons matching MediSight) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total Reports */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                <Car className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">{loading ? "..." : totalReports}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total Reports</p>
          </CardContent>
        </Card>

        {/* Found Vehicles */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">{loading ? "..." : found}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Recovered Cars</p>
          </CardContent>
        </Card>

        {/* Under Review */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">{loading ? "..." : underReview}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Under Review</p>
          </CardContent>
        </Card>

        {/* Unread Alerts */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">{loading ? "..." : pending}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Pending Review</p>
          </CardContent>
        </Card>

        {/* Critical Alerts */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs col-span-2 sm:col-span-1">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">{loading ? "..." : critical}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Critical Cases</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. LOWER SECTION: Quick Actions & Needs Review / Live Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Column */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" /> Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Link
              href="/administration/detect"
              className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Video className="h-4 w-4 text-blue-600" /> Video Footage Analysis
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <Link
              href="/administration/reports"
              className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <ClipboardList className="h-4 w-4 text-emerald-600" /> Stolen Vehicles Queue
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <Link
              href="/administration/analytics"
              className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-indigo-600" /> Surveillance Analytics
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <Link
              href="/administration/settings"
              className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Eye className="h-4 w-4 text-purple-600" /> Profile & Settings
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </CardContent>
        </Card>

        {/* Live Needs Review Column (2 Columns wide) */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" /> Cases Awaiting Review
            </CardTitle>
            <Link href="/administration/reports" className="text-xs font-semibold text-blue-600 hover:underline">
              View All →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading cases...</div>
            ) : reports.filter((r) => r.status === "pending").length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No cases currently pending review.</div>
            ) : (
              reports
                .filter((r) => r.status === "pending")
                .slice(0, 5)
                .map((r) => (
                  <Link
                    key={r.id}
                    href={`/administration/reports/${r.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 font-mono font-bold text-xs">
                        {r.plate.slice(0, 4)}
                      </div>
                      <div>
                        <p className="font-heading font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {r.plate}
                        </p>
                        <p className="text-xs text-slate-400">
                          {r.model} ({r.color}) · Reported by {r.owner}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </Link>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
