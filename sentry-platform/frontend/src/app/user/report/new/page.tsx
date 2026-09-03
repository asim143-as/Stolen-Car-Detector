"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert } from "lucide-react"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewReportPage() {
  const router = useRouter()
  const { token } = useSession()
  const [form, setForm] = useState({ plate: "", owner: "", model: "", color: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      await apiFetch("/api/reports", token, { method: "POST", body: JSON.stringify(form) })
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
          <CardDescription>Administration will review footage and update this report's status.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="plate">License plate</Label>
              <Input id="plate" required placeholder="ABC-123" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="owner">Owner name</Label>
              <Input id="owner" required value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="model">Model</Label>
                <Input id="model" required placeholder="Toyota Corolla" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input id="color" required placeholder="White" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="mt-1.5" />
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
