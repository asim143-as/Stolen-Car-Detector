"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Video, ArrowLeft, Send, Mail, MessageSquare, Clock } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import StatusBadge from "@/components/shared/StatusBadge"

type Report = {
  id: number
  plate: string
  owner: string
  model: string
  color: string
  status: string
  date_added: string
  review_notes: string | null
  user_email?: string | null
}

type MessageItem = {
  id: number
  sender_email: string | null
  sender_role: string
  message: string
  created_at: string
  is_read: boolean
}

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token } = useSession()
  const [report, setReport] = useState<Report | null>(null)
  const [status, setStatus] = useState("pending")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  // Direct messaging state
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageSuccess, setMessageSuccess] = useState(false)

  useEffect(() => {
    if (!token) return
    apiFetch("/api/reports", token).then((d) => {
      const r = d.reports.find((x: Report) => String(x.id) === id)
      setReport(r ?? null)
      if (r) {
        setStatus(r.status)
        setNotes(r.review_notes || "")
      }
    })

    // Fetch message history for this report
    apiFetch(`/api/messages/report/${id}`, token)
      .then((d) => setMessages(d.messages || []))
      .catch(() => {})
  }, [token, id])

  async function save() {
    if (!token || !report) return
    setSaving(true)
    try {
      await apiFetch(`/api/reports/${report.id}/status`, token, { method: "PATCH", body: JSON.stringify({ status, notes }) })
      router.push("/administration/reports")
    } finally {
      setSaving(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !report || !newMessage.trim()) return
    setSendingMessage(true)
    setMessageSuccess(false)
    try {
      await apiFetch("/api/messages", token, {
        method: "POST",
        body: JSON.stringify({
          report_id: report.id,
          message: newMessage.trim(),
        }),
      })
      setNewMessage("")
      setMessageSuccess(true)
      // Refresh message list
      const d = await apiFetch(`/api/messages/report/${id}`, token)
      setMessages(d.messages || [])
      setTimeout(() => setMessageSuccess(false), 4000)
    } catch (err: any) {
      alert(err.message || "Failed to send message.")
    } finally {
      setSendingMessage(false)
    }
  }

  if (!report) return <p className="text-sm text-muted-foreground">Loading...</p>

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/administration/reports" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to queue
      </Link>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl font-bold font-mono tracking-wider">{report.plate}</CardTitle>
          <StatusBadge status={report.status} />
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Vehicle:</strong> {report.model} · {report.color}</p>
          <p><strong className="text-foreground">Reported by:</strong> {report.owner}</p>
          <p className="flex items-center gap-2">
            <strong className="text-foreground">Reporter Email:</strong>
            <span className="font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded text-xs">
              {report.user_email || "Not linked"}
            </span>
          </p>
          <p><strong className="text-foreground">Submitted:</strong> {new Date(report.date_added).toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* Direct Messaging to Reporter */}
      <Card className="border-cyan-800/30 bg-slate-900/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-cyan-400" />
            Send Direct Message to Reporter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Messages sent here appear directly in the vehicle owner's User Portal inbox in real-time.
          </p>

          {/* Previous messages thread */}
          {messages.length > 0 && (
            <div className="space-y-2 max-h-52 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs font-semibold text-slate-400 mb-2">Message History ({messages.length}):</p>
              {messages.map((m) => (
                <div key={m.id} className="rounded border border-cyan-900/40 bg-cyan-950/20 p-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="font-semibold text-cyan-300">Administration:</span>
                    <span className="flex items-center gap-1 text-[10px]">
                      <Clock className="h-3 w-3" />
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap">{m.message}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="space-y-3">
            <textarea
              placeholder={`Write a direct update or instructions for ${report.owner} (e.g. 'Vehicle spotted on North Camera, law enforcement notified')...`}
              value={newMessage}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
            />
            {messageSuccess && (
              <p className="text-xs text-emerald-400 font-medium">✓ Message successfully sent to reporter's portal!</p>
            )}
            <Button
              type="submit"
              disabled={sendingMessage || !newMessage.trim()}
              className="w-full gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
            >
              <Send className="h-4 w-4" />
              {sendingMessage ? "Sending..." : "Send Message to Reporter"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Review footage</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">Run detection on CCTV/dashcam footage to check for this plate.</p>
          <Link href="/administration/detect">
            <Button variant="outline" className="gap-2"><Video className="h-4 w-4" /> Go to Live Detect</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Update status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="found">Found</SelectItem>
                <SelectItem value="not_found">Not Found</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes (visible to the reporter)</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" placeholder="e.g. Matched on Elm St camera, 8/20 11:40pm" />
          </div>
          <Button onClick={save} disabled={saving} variant="crimson" className="w-full">{saving ? "Saving..." : "Save status"}</Button>
        </CardContent>
      </Card>
    </div>
  )
}

