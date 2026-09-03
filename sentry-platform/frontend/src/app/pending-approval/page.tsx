import { Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PendingApprovalPage() {
  const supabase = createClient()
  await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <Clock className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-heading text-2xl font-bold">Awaiting approval</h1>
        <p className="mt-3 text-muted-foreground">
          Your Administration account is pending review by an Admin. You'll
          get access to the Administration portal as soon as it's approved.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <Link href="/welcome"><Button variant="outline">Back to home</Button></Link>
        </form>
      </div>
    </div>
  )
}
