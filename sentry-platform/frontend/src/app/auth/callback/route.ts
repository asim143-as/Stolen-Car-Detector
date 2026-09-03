import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Handles both OAuth (Google) redirects and email confirmation links.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const portal = searchParams.get("portal") || "user"

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Check if user already has a role — or assign based on portal
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      let role = profile?.role
      if (!role) {
        const assignedRole = portal === "administration" ? "administration" : "user"
        await supabase
          .from("profiles")
          .upsert({ id: user.id, email: user.email, role: assignedRole })
        role = assignedRole
      }

      if (role === "administration") {
        return NextResponse.redirect(`${origin}/administration/dashboard`)
      } else if (role === "admin") {
        return NextResponse.redirect(`${origin}/admin-portal/dashboard`)
      } else {
        return NextResponse.redirect(`${origin}/user/dashboard`)
      }
    }
  }

  // Fallback if no user
  return NextResponse.redirect(`${origin}/login`)
}
