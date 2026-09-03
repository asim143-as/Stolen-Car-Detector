import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Admin-only: list every profile plus their Administration approval
// status (if any). Uses the service-role client so it isn't blocked by
// RLS -- but only after verifying the caller is actually an admin.
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (me?.role !== "admin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 })

  const admin = createAdminClient()
  const { data: profiles } = await admin.from("profiles").select("id, email, role, created_at").order("created_at", { ascending: false })
  const { data: staff } = await admin.from("administration_staff").select("user_id, status")

  const staffMap = new Map((staff || []).map((s) => [s.user_id, s.status]))
  const users = (profiles || []).map((p) => ({ ...p, staff_status: staffMap.get(p.id) ?? null }))

  return NextResponse.json({ users })
}
