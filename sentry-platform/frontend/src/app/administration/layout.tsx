import { createClient } from "@/lib/supabase/server"
import AppShell, { type NavItem } from "@/components/layout/AppShell"

const navItems: NavItem[] = [
  { href: "/administration/dashboard", label: "Dashboard", icon: "LayoutDashboard", group: "OPERATIONS" },
  { href: "/administration/detect", label: "Live Detect", icon: "Video", group: "OPERATIONS" },
  { href: "/administration/reports", label: "Reports Queue", icon: "ClipboardList", group: "OPERATIONS" },
  { href: "/administration/alerts", label: "Alerts Center", icon: "Bell", group: "OPERATIONS" },
  { href: "/administration/assistant", label: "AI Assistant", icon: "Bot", group: "OPERATIONS" },
  { href: "/administration/analytics", label: "Analytics", icon: "BarChart3", group: "MANAGEMENT" },
  { href: "/administration/settings", label: "Settings", icon: "Settings2", group: "SYSTEM" },
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
