import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AppShell from "@/components/layout/AppShell"

const navItems = [
  { href: "/admin-portal/dashboard", label: "Dashboard", icon: "LayoutDashboard" as const },
  { href: "/admin-portal/users", label: "Users & Roles", icon: "Users" as const },
  { href: "/admin-portal/reports", label: "All Reports", icon: "ClipboardList" as const },
  { href: "/admin-portal/models", label: "Detection Settings", icon: "Settings2" as const },
  { href: "/admin-portal/audit", label: "Audit Log", icon: "ScrollText" as const },
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
