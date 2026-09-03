"use client"
import { useState, useRef, useEffect } from "react"
import { Send, Bot } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Turn = { role: "user" | "assistant"; text: string }

export default function AssistantChat() {
  const { token } = useSession()
  const [messages, setMessages] = useState<Turn[]>([{ role: "assistant", text: "Hi! Ask me anything." }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || !token) return
    setInput("")
    const history = messages.slice(-20)
    setMessages((m) => [...m, { role: "user", text }])
    setLoading(true)
    try {
      const data = await apiFetch("/api/chat", token, { method: "POST", body: JSON.stringify({ message: text, history }) })
      setMessages((m) => [...m, { role: "assistant", text: data.reply }])
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", text: `Error: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex h-[70vh] flex-col">
      <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Gemini Assistant</CardTitle></CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary"}`}>
              {m.text}
            </div>
          ))}
          {loading && <div className="max-w-[85%] rounded-xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">Thinking...</div>}
          <div ref={bottomRef} />
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message..." />
          <Button onClick={send} disabled={loading} size="icon"><Send className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  )
}
