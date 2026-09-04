import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AppShell, { type NavItem } from "@/components/layout/AppShell"

const navItems: NavItem[] = [
  { href: "/admin-portal/dashboard", label: "Dashboard", icon: "LayoutDashboard", group: "COMMAND" },
  { href: "/admin-portal/reports", label: "All Reports", icon: "ClipboardList", group: "COMMAND" },
  { href: "/admin-portal/users", label: "Users & Roles", icon: "Users", group: "MANAGEMENT" },
  { href: "/admin-portal/audit", label: "Audit Log", icon: "ScrollText", group: "MANAGEMENT" },
  { href: "/admin-portal/models", label: "Detection Settings", icon: "Settings2", group: "SYSTEM" },
  { href: "/admin-portal/settings", label: "Settings", icon: "Settings2", group: "SYSTEM" },
]

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/admin-portal/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/admin-portal/login")

  return (
    <AppShell navItems={navItems} roleLabel="Admin" roleBadgeVariant="secondary" userEmail={user.email ?? undefined}>
      {children}
    </AppShell>
  )
}
