"use client"
import { useEffect, useRef, useState } from "react"
import { Video, Upload, ShieldAlert } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { API_BASE } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Alert = { plate: string; owner: string; model: string; color: string; time: number; frame: number; image_url: string }
type PlateBox = { x1: number; y1: number; x2: number; y2: number }
type Box = { x1: number; y1: number; x2: number; y2: number; plate: string; matched: boolean; plate_box: PlateBox | null }

export default function LiveDetectPage() {
  const { token } = useSession()
  const fileRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Refs (not state) for anything updated every frame -- avoids a React
  // re-render per frame; the canvas is painted directly instead.
  const boxesRef = useRef<Box[]>([])
  const scaleRef = useRef(1)

  const [status, setStatus] = useState<"idle" | "uploading" | "live" | "done" | "error">("idle")
  const [progress, setProgress] = useState("")
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  function drawFrame(imageB64: string) {
    const canvas = canvasRef.current
    if (!canvas) return
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(img, 0, 0)

      // Boxes are computed on the full-resolution frame; the streamed
      // image is scaled down for bandwidth, so scale box coordinates
      // to match -- this is why boxes and image are sent separately
      // instead of baked together: it lets the video keep moving at
      // full speed while detection (the slow part) catches up whenever
      // it can, without ever blocking playback.
      const s = scaleRef.current

      for (const b of boxesRef.current) {
        // Outer box: the vehicle itself. Green normally, red if it's a
        // confirmed stolen-plate match.
        const x1 = b.x1 * s, y1 = b.y1 * s, x2 = b.x2 * s, y2 = b.y2 * s
        ctx.lineWidth = 2.5
        ctx.strokeStyle = b.matched ? "#ef4444" : "#22c55e"
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)

        // Inner box: the license plate specifically
        if (b.plate_box) {
          const px1 = b.plate_box.x1 * s, py1 = b.plate_box.y1 * s
          const px2 = b.plate_box.x2 * s, py2 = b.plate_box.y2 * s
          const pColor = b.matched ? "#ef4444" : (b.plate ? "#f59e0b" : "#38bdf8")
          ctx.lineWidth = 2
          ctx.strokeStyle = pColor
          ctx.strokeRect(px1, py1, px2 - px1, py2 - py1)

          const label = b.matched ? `STOLEN: ${b.plate}` : (b.plate ? b.plate : "PLATE")
          ctx.font = "bold 13px monospace"
          const textY = Math.max(15, py1 - 5)
          // Faint outline behind the text so it stays legible over any background
          ctx.strokeStyle = "#000000"
          ctx.lineWidth = 3
          ctx.strokeText(label, px1, textY)
          ctx.fillStyle = pColor
          ctx.fillText(label, px1, textY)
        }
      }
    }
    img.src = `data:image/jpeg;base64,${imageB64}`
  }

  async function handleFile(file: File) {
    if (!token) return
    setStatus("uploading")
    setAlerts([])
    setOutputUrl(null)
    setErrorMsg("")
    boxesRef.current = []

    const body = new FormData()
    body.append("file", file)

    let jobId: string
    try {
      const res = await fetch(`${API_BASE}/api/detect/video/start`, {
        method: "POST", body, headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error((await res.json()).detail || "Upload failed")
      jobId = (await res.json()).job_id
    } catch (e: any) {
      setStatus("error"); setErrorMsg(e.message); return
    }

    const wsUrl = `${API_BASE.replace(/^http/, "ws")}/ws/detect/${jobId}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => setStatus("live")
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data)
      if (msg.type === "frame") {
        scaleRef.current = msg.scale ?? 1
        if (msg.boxes) {
          boxesRef.current = msg.boxes
        }
        drawFrame(msg.image_b64)
        setProgress(`frame ${msg.frame_idx}${msg.total_frames ? ` / ~${msg.total_frames}` : ""} · ${msg.video_time}s`)
      } else if (msg.type === "boxes") {
        boxesRef.current = msg.boxes
      } else if (msg.type === "alert") {
        setAlerts((a) => [msg, ...a])
      } else if (msg.type === "done") {
        setStatus("done")
        setOutputUrl(`${API_BASE}${msg.output_video_url}`)
      } else if (msg.type === "error") {
        setStatus("error"); setErrorMsg(msg.message)
      }
    }
    ws.onerror = () => { setStatus("error"); setErrorMsg("Live connection failed") }
  }

  useEffect(() => {
    return () => { boxesRef.current = [] }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Live detection</h1>
        <p className="text-muted-foreground">Video plays at normal speed -- detection boxes update live on top, however fast the model can keep up.</p>
      </div>

      {status === "idle" && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Upload CCTV or dashcam footage</p>
              <p className="text-sm text-muted-foreground">MP4, MOV, or AVI</p>
            </div>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Button onClick={() => fileRef.current?.click()} className="gap-2"><Video className="h-4 w-4" /> Choose video</Button>
          </CardContent>
        </Card>
      )}

      {status === "uploading" && <p className="text-muted-foreground">Uploading...</p>}

      {status === "error" && <p className="text-destructive">Error: {errorMsg}</p>}

      {(status === "live" || status === "done") && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {status === "live" && <span className="live-dot" />} {status === "live" ? "Live" : "Finished"}
              </CardTitle>
              <CardDescription>{progress}</CardDescription>
            </CardHeader>
            <CardContent>
              <canvas ref={canvasRef} className={`w-full rounded-lg border border-border ${status === "done" ? "hidden" : ""}`} />
              {status === "done" && outputUrl && <video controls src={outputUrl} className="w-full rounded-lg border border-border" />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-crimson" /> Matches ({alerts.length})</CardTitle></CardHeader>
            <CardContent className="max-h-[420px] space-y-3 overflow-y-auto">
              {alerts.length === 0 && <p className="text-sm text-muted-foreground">No matches yet.</p>}
              {alerts.map((a, i) => (
                <div key={i} className="rounded-lg border border-crimson/40 bg-crimson/5 p-3 text-sm">
                  <p className="font-semibold text-crimson">{a.plate}</p>
                  <p className="text-muted-foreground">{a.model} · {a.color} · {a.time}s</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}