import { redirect } from "next/navigation"
import { Clock, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PendingApprovalPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Check the profile role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  // If role is administration, check if there's a row in administration_staff
  // If no row exists OR status is 'approved', let them through
  if (profile?.role === "administration") {
    const { data: staff } = await supabase
      .from("administration_staff")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle()

    // No row in administration_staff = admin approved them directly via profiles table
    // OR status is explicitly 'approved' → redirect to dashboard
    if (!staff || staff.status === "approved") {
      redirect("/administration/dashboard")
    }
  } else if (profile?.role !== "administration") {
    // Not an administration user anymore
    redirect("/user/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <Clock className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-heading text-2xl font-bold">Awaiting approval</h1>
        <p className="mt-3 text-muted-foreground">
          Your Administration account is pending review by an Admin. You'll
          get access to the Administration portal as soon as it's approved.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Already approved? <a href="/pending-approval" className="text-primary underline underline-offset-2">Refresh this page</a> or try logging in again.
        </p>
        <div className="mt-6">
          <Link href="/welcome"><Button variant="outline">Back to home</Button></Link>
        </div>
      </div>
    </div>
  )
}
