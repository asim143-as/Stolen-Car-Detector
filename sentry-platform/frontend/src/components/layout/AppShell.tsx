"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ShieldCheck, LogOut, Menu, LayoutDashboard, FilePlus2, ClipboardList,
  Bot, Video, Bell, BarChart3, Users, Settings2, ScrollText, Mail,
} from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const ICON_MAP = {
  LayoutDashboard, FilePlus2, ClipboardList, Bot, Video, Bell,
  BarChart3, Users, Settings2, ScrollText, Mail,
}

export type NavItem = { href: string; label: string; icon: keyof typeof ICON_MAP }

export default function AppShell({
  children,
  navItems,
  roleLabel,
  roleBadgeVariant = "default",
  userEmail,
}: {
  children: React.ReactNode
  navItems: NavItem[]
  roleLabel: string
  roleBadgeVariant?: "default" | "crimson" | "secondary"
  userEmail?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/welcome")
    router.refresh()
  }

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-6 font-heading font-bold">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-white shadow-glow">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold leading-tight">Stolen Car Detection System</span>
      </div>
      <Badge variant={roleBadgeVariant} className="mx-5 mb-4 w-fit">{roleLabel}</Badge>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/")
          const Icon = ICON_MAP[item.icon]
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active ? "bg-gradient-brand text-white shadow-glow" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" /> {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3 px-1">
          <Avatar className="h-8 w-8 bg-gradient-brand"><AvatarFallback className="bg-transparent text-white">{userEmail?.[0]?.toUpperCase() ?? "?"}</AvatarFallback></Avatar>
          <p className="truncate text-sm text-muted-foreground">{userEmail}</p>
        </div>
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">{SidebarInner}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card">{SidebarInner}</aside>
        </div>
      )}

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
          <span className="font-heading font-bold text-sm">Stolen Car Detection System</span>
          <button onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
