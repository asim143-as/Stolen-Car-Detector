"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert, Mail } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { createClient } from "@/lib/supabase/client"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewReportPage() {
  const router = useRouter()
  const { token } = useSession()
  const [form, setForm] = useState({ plate: "", owner: "", model: "", color: "", email: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Auto-fill logged in user's email if available
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setForm((prev) => ({ ...prev, email: prev.email || data.user.email || "" }))
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return

    const trimmedEmail = form.email.trim()
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("A valid contact email is required to submit a report.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      await apiFetch("/api/reports", token, {
        method: "POST",
        body: JSON.stringify({
          ...form,
          plate: form.plate.trim(),
          owner: form.owner.trim(),
          model: form.model.trim(),
          color: form.color.trim(),
          email: trimmedEmail,
        }),
      })
      router.push("/user/reports")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-crimson" />
            <CardTitle>Report a stolen vehicle</CardTitle>
          </div>
          <CardDescription>Administration will review footage, trace the vehicle, and contact you directly.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="plate">License plate *</Label>
              <Input
                id="plate"
                required
                placeholder="ABC-123"
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
                className="mt-1.5 font-mono uppercase"
              />
            </div>

            <div>
              <Label htmlFor="owner">Owner name *</Label>
              <Input
                id="owner"
                required
                placeholder="Full Name"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-cyan-400" />
                Contact Email (Mandatory) *
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="your.email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Administration staff will use this email address to send direct updates and recovery notifications.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  required
                  placeholder="Toyota Corolla"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  required
                  placeholder="White"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" variant="crimson" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit report"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
