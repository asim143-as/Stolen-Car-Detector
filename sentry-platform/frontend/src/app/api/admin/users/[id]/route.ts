import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (me?.role !== "admin") return NextResponse.json({ detail: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const admin = createAdminClient()

  if (body.role) {
    await admin.from("profiles").update({ role: body.role }).eq("id", params.id)
  }
  if (body.staff_status) {
    await admin.from("administration_staff").upsert({ user_id: params.id, status: body.staff_status })
  }

  return NextResponse.json({ success: true })
}
