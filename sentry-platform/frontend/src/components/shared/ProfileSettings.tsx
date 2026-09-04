"use client"
import { useState, useEffect, useRef } from "react"
import { User, Mail, Shield, Phone, Camera, Check, Save, Sparkles, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface ProfileSettingsProps {
  portalRole: "user" | "administration" | "admin"
  roleLabel: string
}

export default function ProfileSettings({ portalRole, roleLabel }: ProfileSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Form state
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [stationOrCity, setStationOrCity] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    // 1. Load from Supabase session
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setEmail(data.user.email || "")
        // Check profile table
        supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile) {
              if (profile.full_name) setFullName(profile.full_name)
              if (profile.phone) setPhone(profile.phone)
              if (profile.avatar_url) setAvatarUrl(profile.avatar_url)
            }
          })
      }
    })

    // 2. Load from localStorage cache
    const cachedName = localStorage.getItem(`scd_user_name_${portalRole}`)
    const cachedPhone = localStorage.getItem(`scd_user_phone_${portalRole}`)
    const cachedCity = localStorage.getItem(`scd_user_station_${portalRole}`)
    const cachedAvatar = localStorage.getItem(`scd_user_avatar_${portalRole}`)

    if (cachedName) setFullName(cachedName)
    if (cachedPhone) setPhone(cachedPhone)
    if (cachedCity) setStationOrCity(cachedCity)
    if (cachedAvatar) setAvatarUrl(cachedAvatar)
  }, [portalRole])

  // Handle avatar image selection
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setAvatarUrl(result)
      localStorage.setItem(`scd_user_avatar_${portalRole}`, result)
      // Broadcast change so AppShell header/sidebar updates live
      window.dispatchEvent(new Event("storage"))
    }
    reader.readAsDataURL(file)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSavedSuccess(false)

    try {
      // Save to localStorage for instant persistent preview across all pages
      localStorage.setItem(`scd_user_name_${portalRole}`, fullName.trim())
      localStorage.setItem(`scd_user_phone_${portalRole}`, phone.trim())
      localStorage.setItem(`scd_user_station_${portalRole}`, stationOrCity.trim())
      if (avatarUrl) {
        localStorage.setItem(`scd_user_avatar_${portalRole}`, avatarUrl)
      }

      // Save to Supabase profile
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email,
          role: portalRole,
          full_name: fullName.trim(),
          phone: phone.trim(),
          avatar_url: avatarUrl,
        })
      }

      // Broadcast storage update event
      window.dispatchEvent(new Event("storage"))
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 4000)
    } catch (err) {
      console.error("Failed to save settings:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Profile & Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage your personal credentials, operational role, and account avatar.
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300">
          <Check className="h-5 w-5" />
          <span>Profile details and avatar updated successfully!</span>
        </div>
      )}

      {/* Profile Overview Card (Matches MediSight Settings Card Exactly) */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar Circle with upload trigger */}
            <div className="relative group shrink-0">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="User Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span>{fullName?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || "U"}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
              >
                <Camera className="h-6 w-6" />
                <span className="text-[10px] font-semibold mt-1">Change</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* User details and Upload Avatar Button */}
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 px-4 py-2"
                >
                  <Camera className="h-4 w-4 mr-2" /> Upload Avatar
                </Button>
                <span className="text-xs text-slate-400">JPG, PNG or WEBP (Max 5MB)</span>
              </div>

              <div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {fullName || "System User"}
                </h3>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      portalRole === "admin"
                        ? "border-crimson/40 bg-crimson/10 text-crimson"
                        : portalRole === "administration"
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                        : "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    <Shield className="h-3 w-3 mr-1" /> {roleLabel}
                  </Badge>
                  <span className="text-xs text-slate-400">{email}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Form (Sections matching MediSight: Account Info, Personal Details) */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: ACCOUNT INFO */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountEmail" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="accountEmail"
                    type="email"
                    disabled
                    value={email}
                    className="rounded-xl pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm opacity-80 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="accountRole" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  System Role
                </Label>
                <div className="relative mt-1.5">
                  <Shield className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="accountRole"
                    disabled
                    value={`${roleLabel} (managed by admin)`}
                    className="rounded-xl pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm opacity-80 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: PERSONAL DETAILS */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </Label>
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="fullName"
                    required
                    placeholder="e.g. Muhammad Asim"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-xl pl-10 bg-blue-50/20 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number
                </Label>
                <div className="relative mt-1.5">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="phone"
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl pl-10 bg-blue-50/20 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Format example: +92 300 1234567</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: OPERATIONAL INFORMATION */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {portalRole === "user" ? "Contact & Residential Details" : "Department & Station Assignment"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="station" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {portalRole === "user" ? "City / Primary Address" : "Police Station / Headquarters Division"}
              </Label>
              <div className="relative mt-1.5">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="station"
                  placeholder={portalRole === "user" ? "Islamabad / Rawalpindi, Pakistan" : "Central Traffic Command - Station 4"}
                  value={stationOrCity}
                  onChange={(e) => setStationOrCity(e.target.value)}
                  className="rounded-xl pl-10 bg-blue-50/20 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="rounded-xl px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/20 gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

