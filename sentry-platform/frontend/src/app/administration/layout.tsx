import { createClient } from "@/lib/supabase/server"
import AppShell from "@/components/layout/AppShell"

const navItems = [
  { href: "/administration/dashboard", label: "Dashboard", icon: "LayoutDashboard" as const },
  { href: "/administration/reports", label: "Reports Queue", icon: "ClipboardList" as const },
  { href: "/administration/detect", label: "Live Detect", icon: "Video" as const },
  { href: "/administration/alerts", label: "Alerts", icon: "Bell" as const },
  { href: "/administration/analytics", label: "Analytics", icon: "BarChart3" as const },
  { href: "/administration/assistant", label: "Assistant", icon: "Bot" as const },
]

export default async function AdministrationLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AppShell navItems={navItems} roleLabel="Administration" roleBadgeVariant="crimson" userEmail={user?.email ?? undefined}>
      {children}
    </AppShell>
  )
}
