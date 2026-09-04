import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function RootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    const role = profile?.role
    if (role === "administration") {
      redirect("/administration/dashboard")
    } else if (role === "admin") {
      redirect("/admin-portal/dashboard")
    } else {
      redirect("/user/dashboard")
    }
  }

  redirect("/welcome")
}
