import { createClient } from "@/lib/supabase/server"
import AppShell, { type NavItem } from "@/components/layout/AppShell"

const navItems: NavItem[] = [
  { href: "/user/dashboard", label: "Dashboard", icon: "LayoutDashboard", group: "VEHICLE CASES" },
  { href: "/user/report/new", label: "Report a Vehicle", icon: "FilePlus2", group: "VEHICLE CASES" },
  { href: "/user/reports", label: "My Reports", icon: "ClipboardList", group: "VEHICLE CASES" },
  { href: "/user/messages", label: "Messages & Alerts", icon: "Mail", group: "VEHICLE CASES" },
  { href: "/user/assistant", label: "AI Assistant", icon: "Bot", group: "VEHICLE CASES" },
  { href: "/user/settings", label: "Settings", icon: "Settings2", group: "SYSTEM" },
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
