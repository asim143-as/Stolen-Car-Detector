"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ShieldCheck, LogOut, Menu, X, LayoutDashboard, FilePlus2, ClipboardList,
  Bot, Video, Bell, BarChart3, Users, Settings2, ScrollText, Mail, Search,
  Shield, User, Check, Sun, Moon
} from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const ICON_MAP = {
  LayoutDashboard, FilePlus2, ClipboardList, Bot, Video, Bell,
  BarChart3, Users, Settings2, ScrollText, Mail,
}

export type NavItem = {
  href: string
  label: string
  icon: keyof typeof ICON_MAP
  group?: string
}

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
  const [searchQuery, setSearchQuery] = useState("")

  // Day / Night Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const saved = localStorage.getItem("scd_theme") as "light" | "dark" | null
    if (saved) {
      setTheme(saved)
      if (saved === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      const initial = prefersDark ? "dark" : "light"
      setTheme(initial)
      if (initial === "dark") document.documentElement.classList.add("dark")
    }
  }, [])

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    localStorage.setItem("scd_theme", next)
    if (next === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  // Determine portal type from path
  const portalType = pathname.startsWith("/admin-portal")
    ? "admin"
    : pathname.startsWith("/administration")
    ? "administration"
    : "user"

  const settingsHref = portalType === "admin"
    ? "/admin-portal/settings"
    : portalType === "administration"
    ? "/administration/settings"
    : "/user/settings"

  // User avatar & display name
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>("")

  function loadUserCachedData() {
    const cachedAvatar = localStorage.getItem(`scd_user_avatar_${portalType}`)
    const cachedName = localStorage.getItem(`scd_user_name_${portalType}`)
    if (cachedAvatar) setAvatarUrl(cachedAvatar)
    if (cachedName) setDisplayName(cachedName)
  }

  useEffect(() => {
    loadUserCachedData()
    window.addEventListener("storage", loadUserCachedData)
    return () => window.removeEventListener("storage", loadUserCachedData)
  }, [portalType])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/welcome")
    router.refresh()
  }

  // Group items by category if provided, or default
  const groupedItems: { [group: string]: NavItem[] } = {}
  navItems.forEach((item) => {
    const groupName = item.group || "MAIN MENU"
    if (!groupedItems[groupName]) groupedItems[groupName] = []
    groupedItems[groupName].push(item)
  })

  const SidebarInner = (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800">
      {/* Top Branding (Matches MediSight Style) */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <Link href="/welcome" className="flex items-center gap-2.5 font-heading font-bold text-slate-900 dark:text-white">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-blue-500/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-sm font-extrabold tracking-tight">
              Stolen Car Detection
            </span>
          </Link>

          {/* Close drawer button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Console indicator badge with green dot */}
        <div className="mt-3 flex items-center gap-1.5 px-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          <span className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            {roleLabel.toUpperCase()} CONSOLE
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-4 px-3 py-2 overflow-y-auto">
        {Object.entries(groupedItems).map(([groupTitle, items]) => (
          <div key={groupTitle} className="space-y-1">
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              {groupTitle}
            </p>
            {items.map((item) => {
              const active = pathname === item.href || (item.href !== `/${portalType}/dashboard` && pathname?.startsWith(item.href))
              const Icon = ICON_MAP[item.icon] || LayoutDashboard
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all",
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-400 dark:text-slate-500")} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Profile & Secure Logout */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-1">
        <Link
          href={settingsHref}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
            pathname === settingsHref
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span>{displayName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "U"}</span>
            )}
          </div>
          <div className="truncate text-left flex-1">
            <p className="truncate text-xs font-bold leading-tight text-slate-800 dark:text-slate-200">
              {displayName || (userEmail ? userEmail.split("@")[0] : "Profile")}
            </p>
            <p className="truncate text-[10px] text-slate-400">{userEmail}</p>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-rose-500/10 hover:text-rose-600 transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Secure Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50/70 dark:bg-slate-950 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{SidebarInner}</aside>

      {/* Mobile Drawer with smooth slide transition */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-all duration-300",
          mobileOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        )}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-72 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-in-out bg-white dark:bg-slate-900",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {SidebarInner}
        </aside>
      </div>

      {/* Main Content Area with Top Header */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar (Matches MediSight Top Bar) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-4 sm:px-8 py-3">
          {/* Left: Mobile hamburger menu & Search input */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search Bar pill */}
            <div className="relative w-full max-w-sm hidden sm:block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports, license plate, vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-1.5 pl-10 pr-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Right Header Actions: Theme Switcher + Notification Bell + Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Day / Night Theme Switcher (White / Black) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs"
              title={theme === "dark" ? "Switch to Day Mode (Light)" : "Switch to Night Mode (Dark)"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>

            {/* Notification Bell */}
            <Link
              href={portalType === "user" ? "/user/messages" : "/administration/alerts"}
              className="relative p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            </Link>

            {/* User Avatar linking to Settings */}
            <Link
              href={settingsHref}
              className="flex items-center gap-2.5 p-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
              title="Profile & Settings"
            >
              <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="User Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span>{displayName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "U"}</span>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content Body with slide bar for mobile & wide tables */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
