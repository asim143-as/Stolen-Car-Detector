"use client"
import { useEffect, useState } from "react"
import { ShieldAlert } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { apiFetch, API_BASE } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Detection = { id: number; plate: string; owner: string; model: string; color: string; time: number; image_url: string | null; source_video: string; detected_at: string }

export default function AlertsPage() {
  const { token } = useSession()
  const [detections, setDetections] = useState<Detection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    apiFetch("/api/detections", token).then((d) => setDetections(d.detections)).finally(() => setLoading(false))
  }, [token])

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Alerts</h1>
      <p className="text-muted-foreground">Every stolen-plate match found across all detection runs.</p>

      {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : detections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matches recorded yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {detections.map((d) => (
            <Card key={d.id} className="overflow-hidden border-crimson/30">
              {d.image_url && <img src={`${API_BASE}${d.image_url}`} className="h-40 w-full object-cover" alt={d.plate} />}
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="h-4 w-4 text-crimson" /> {d.plate}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{d.model} · {d.color}</p>
                <p>{new Date(d.detected_at).toLocaleString()}</p>
                <p className="truncate">Source: {d.source_video}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
