import { createClient } from "@/lib/supabase/server"
import AppShell from "@/components/layout/AppShell"

const navItems = [
  { href: "/user/dashboard", label: "Dashboard", icon: "LayoutDashboard" as const },
  { href: "/user/report/new", label: "Report a Vehicle", icon: "FilePlus2" as const },
  { href: "/user/reports", label: "My Reports", icon: "ClipboardList" as const },
  { href: "/user/messages", label: "Messages", icon: "Mail" as const },
  { href: "/user/assistant", label: "Assistant", icon: "Bot" as const },
]

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AppShell navItems={navItems} roleLabel="Reporter" roleBadgeVariant="default" userEmail={user?.email ?? undefined}>
      {children}
    </AppShell>
  )
}
