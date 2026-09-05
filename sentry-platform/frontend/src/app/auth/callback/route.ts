import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

// Handles OAuth (Google/Facebook) redirects and email confirmation links.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const portal = searchParams.get("portal") || "user"
  const next = searchParams.get("next")

  if (code) {
    // Array to collect all cookies set by Supabase Auth (handles multi-chunk tokens)
    const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookiesToSet.push({ name, value, options })
          },
          remove(name: string, options: CookieOptions) {
            cookiesToSet.push({ name, value: "", options })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("OAuth exchange error:", error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data?.user) {
      // Check user profile role in database
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle()

      let role = profile?.role

      // If user is Admin, they must not enter through citizen Google login
      if (role === "admin") {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(
            "Admin accounts cannot sign in from here. Please use the dedicated Admin Portal."
          )}`
        )
      }

      // If no profile role exists yet, create it with the requested portal role
      if (!role) {
        const assignedRole = portal === "administration" ? "administration" : "user"
        await supabase
          .from("profiles")
          .upsert({ id: data.user.id, email: data.user.email, role: assignedRole })
        role = assignedRole
      } else if (portal === "administration" && role !== "administration") {
        // If user logged in under Administration tab, allow updating role to administration
        await supabase
          .from("profiles")
          .update({ role: "administration" })
          .eq("id", data.user.id)
        role = "administration"
      }

      // Determine redirect destination
      let redirectUrl = `${origin}/user/dashboard`
      if (next) {
        redirectUrl = `${origin}${next}`
      } else if (role === "administration") {
        const { data: staff } = await supabase
          .from("administration_staff")
          .select("status")
          .eq("user_id", data.user.id)
          .maybeSingle()

        if (!staff) {
          await supabase.from("administration_staff").insert({ user_id: data.user.id, status: "pending" })
          redirectUrl = `${origin}/pending-approval`
        } else if (staff.status !== "approved") {
          redirectUrl = `${origin}/pending-approval`
        } else {
          redirectUrl = `${origin}/administration/dashboard`
        }
      } else {
        redirectUrl = `${origin}/user/dashboard`
      }

      const redirectResponse = NextResponse.redirect(redirectUrl)
      // Apply every cookie Supabase set to the redirect response so the session is active immediately!
      cookiesToSet.forEach(({ name, value, options }) => {
        redirectResponse.cookies.set(name, value, options)
      })

      return redirectResponse
    }
  }

  // Fallback if no user or no code
  return NextResponse.redirect(`${origin}/login`)
}
