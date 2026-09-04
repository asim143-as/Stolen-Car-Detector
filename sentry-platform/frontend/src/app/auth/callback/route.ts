import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

// Handles OAuth (Google/Facebook) redirects and email confirmation links.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const portal = searchParams.get("portal") || "user"
  const next = searchParams.get("next")

  if (code) {
    let response = NextResponse.next()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: "", ...options })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value: "", ...options })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      // Check if user already has a role — or assign based on portal
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle()

      let role = profile?.role
      if (!role) {
        const assignedRole = portal === "administration" ? "administration" : "user"
        await supabase
          .from("profiles")
          .upsert({ id: data.user.id, email: data.user.email, role: assignedRole })
        role = assignedRole
      }

      let redirectUrl = `${origin}/user/dashboard`
      if (next) {
        redirectUrl = `${origin}${next}`
      } else if (role === "administration") {
        redirectUrl = `${origin}/administration/dashboard`
      } else if (role === "admin") {
        redirectUrl = `${origin}/admin-portal/dashboard`
      } else {
        redirectUrl = `${origin}/user/dashboard`
      }

      const redirectResponse = NextResponse.redirect(redirectUrl)
      // Copy all session cookies to the redirect response so browser has active session immediately!
      response.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value, c)
      })

      return redirectResponse
    }
  }

  // Fallback if no user or error
  return NextResponse.redirect(`${origin}/login`)
}
