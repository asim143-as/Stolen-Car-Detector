import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import Car3DClient from "@/components/shared/Car3DClient"
import HeroCarousel from "@/components/shared/HeroCarousel"
import AnimatedSection from "@/components/shared/AnimatedSection"
import FeatureCard from "@/components/shared/FeatureCard"
import StatsStrip from "@/components/shared/StatsStrip"

const FEATURES = [
  { icon: "Video" as const, title: "Live Video Detection", desc: "Upload footage and watch YOLO-powered plate detection stream in real time, frame by frame -- not just a result at the end.", color: "violet" as const },
  { icon: "Bot" as const, title: "Gemini Assistant", desc: "An AI assistant built into every portal to answer questions, day or night.", color: "cyan" as const },
  { icon: "Radar" as const, title: "Night-Aware Detection", desc: "Adaptive low-light enhancement and glare correction keep accuracy high after dark and on dashcam footage.", color: "rose" as const },
  { icon: "Users" as const, title: "Three-Portal Workflow", desc: "Reporters submit and track their case, Administration reviews footage and resolves it, Admin oversees everything.", color: "amber" as const },
  { icon: "Lock" as const, title: "Role-Secured", desc: "Every action is scoped to a verified role -- reporters never see another case, Administration can't touch user management.", color: "violet" as const },
  { icon: "ShieldCheck" as const, title: "Full Audit Trail", desc: "Every status change is logged: who reviewed it, when, and why.", color: "cyan" as const },
]

export default function WelcomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <nav className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-heading text-xl font-bold">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-glow">
              <ShieldCheck className="h-5 w-5" />
            </div>
            Sentry
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost">Log in</Button></Link>
            <Link href="/signup"><Button className="bg-gradient-brand shadow-glow border-0">Get started</Button></Link>
          </div>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-6 px-6 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
        <div className="blob -left-20 top-10 h-72 w-72 bg-violet-300" />
        <div className="blob right-0 top-40 h-72 w-72 bg-cyan-300" />

        <AnimatedSection>
          <div className="status-pill mb-5 border border-violet-200 bg-white/80 text-violet-700 shadow-sm backdrop-blur">
            <span className="live-dot" /> AI-powered stolen vehicle detection
          </div>
          <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight lg:text-6xl">
            Report it once.<br />
            <span className="gradient-text">Watch it get found.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Sentry pairs a simple report with real, live vehicle detection --
            plate recognition running frame by frame on review footage, day
            or night, with a dedicated team watching for the match.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup"><Button size="lg" className="gap-2 bg-gradient-brand border-0 shadow-glow"><ShieldCheck className="h-4 w-4" /> Report a stolen vehicle</Button></Link>
            <Link href="/admin-portal/login"><Button size="lg" variant="outline">Admin portal</Button></Link>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15} className="relative h-80 lg:h-[480px]">
          <Car3DClient />
        </AnimatedSection>
      </section>

      <StatsStrip />

      <AnimatedSection className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="mb-6 font-heading text-2xl font-bold lg:text-3xl">See it in action</h2>
        <div className="h-64 overflow-hidden rounded-2xl shadow-premium lg:h-80">
          <HeroCarousel />
        </div>
      </AnimatedSection>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <AnimatedSection>
          <h2 className="font-heading text-2xl font-bold lg:text-3xl">Built for real cases, not just demos</h2>
        </AnimatedSection>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.08} />
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        Sentry -- local-first stolen vehicle detection. No data leaves your own Supabase project.
      </footer>
    </div>
  )
}
