import { ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/welcome" className="mb-8 flex items-center justify-center gap-2 font-heading text-xl font-bold">
          <ShieldCheck className="h-6 w-6 text-primary" /> Sentry
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-premium">{children}</div>
      </div>
    </div>
  )
}
