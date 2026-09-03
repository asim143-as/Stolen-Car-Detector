import { Settings2, Moon, Bot, Gauge } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Repurposed from MediSight's MLOps/model-management page. The actual
// values live in the FastAPI backend's .env (they affect a running
// detection pipeline, so changing them safely means restarting that
// service) -- this page is a transparent read-only summary of what's
// configured, for the Admin to sanity-check.
export default function ModelSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Detection settings</h1>
        <p className="text-muted-foreground">Configuration for the YOLO detection pipeline and Gemini assistant.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> Detection confidence</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Daytime: <span className="font-mono text-foreground">0.40</span></p>
            <p>Night (auto-detected): <span className="font-mono text-foreground">0.25</span></p>
            <p className="pt-2">Set via <code className="rounded bg-secondary px-1.5 py-0.5">DAY_CAR_CONF</code> / <code className="rounded bg-secondary px-1.5 py-0.5">NIGHT_CAR_CONF</code> in the backend.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Moon className="h-4 w-4 text-primary" /> Night enhancement</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Auto-gamma + glare rolloff + denoise, triggered below brightness <span className="font-mono text-foreground">95/255</span>.</p>
            <p className="pt-2">Set via <code className="rounded bg-secondary px-1.5 py-0.5">LOW_LIGHT_THRESHOLD</code> in the backend.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> Gemini assistant</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Model: <span className="font-mono text-foreground">gemini-3.7-flash</span> (configurable)</p>
            <p className="pt-2">Set via <code className="rounded bg-secondary px-1.5 py-0.5">GEMINI_MODEL</code> in the backend.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /> OCR retries</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Night frames try 3 preprocessing variants (adaptive threshold, CLAHE+Otsu, plain grayscale) and keep whichever EasyOCR is most confident about.</p>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        These are backend-side settings (backend/app.py + .env) -- editing them here isn't wired up yet since changing them safely requires restarting the detection service. Ask your backend dev to adjust the .env values directly for now.
      </p>
    </div>
  )
}
