"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Mail, CheckCircle2, Clock, Car, Shield, ArrowRight } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type MessageItem = {
  id: number
  sender_id: string | null
  sender_email: string | null
  sender_role: string
  recipient_id: string | null
  report_id: number | null
  message: string
  is_read: boolean
  created_at: string
  plate_number: string | null
  car_model: string | null
}

export default function UserMessagesPage() {
  const { token } = useSession()
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    loadMessages()
  }, [token])

  async function loadMessages() {
    if (!token) return
    setLoading(true)
    try {
      const data = await apiFetch("/api/messages/me", token)
      setMessages(data.messages || [])
    } catch (err) {
      console.error("Failed to load messages:", err)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: number) {
    if (!token) return
    try {
      await apiFetch(`/api/messages/${id}/read`, token, { method: "PATCH" })
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
      )
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  const unreadCount = messages.filter((m) => !m.is_read).length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Official Messages
          </h1>
          <p className="text-sm text-muted-foreground">
            Direct communications, sightings, and recovery alerts from Administration staff.
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="default" className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white w-fit px-3 py-1">
            {unreadCount} New Message{unreadCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : messages.length === 0 ? (
        <Card className="border-dashed border-slate-800 bg-slate-900/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">No messages yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              When Administration staff reviews surveillance footage or has an update regarding your reported vehicles, their direct messages will appear here.
            </p>
            <Link href="/user/reports" className="mt-5">
              <Button variant="outline" className="gap-2">
                Check My Reports <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <Card
              key={m.id}
              className={`transition-all duration-200 ${
                !m.is_read
                  ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/10"
                  : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/60"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-400">
                      <Shield className="h-4 w-4" />
                    </span>
                    <span className="font-semibold text-sm text-foreground">
                      Administration Staff
                    </span>
                    {!m.is_read && (
                      <Badge variant="default" className="text-[10px] bg-primary text-white">
                        NEW
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {m.plate_number && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Car className="h-3.5 w-3.5" />
                      Regarding Vehicle:
                    </span>
                    <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                      {m.plate_number}
                    </span>
                    {m.car_model && (
                      <span className="text-slate-400">({m.car_model})</span>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-2">
                <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {m.message}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Link href="/user/reports">
                    <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80 px-2">
                      View My Reports
                    </Button>
                  </Link>

                  {!m.is_read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsRead(m.id)}
                      className="text-xs gap-1.5 border-slate-700 hover:bg-slate-800"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Mark as read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
