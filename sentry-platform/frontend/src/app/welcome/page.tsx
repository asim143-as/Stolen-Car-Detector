import Link from "next/link"
import { ShieldCheck, Video, Bot, Radar, Users, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Car3DClient from "@/components/shared/Car3DClient"
import HeroCarousel from "@/components/shared/HeroCarousel"
import AnimatedSection from "@/components/shared/AnimatedSection"
import FeatureCard from "@/components/shared/FeatureCard"
import StatsStrip from "@/components/shared/StatsStrip"

const FEATURES = [
  { icon: "Video" as const, title: "Live Video Detection", desc: "Upload footage and watch YOLO-powered plate detection stream in real time, frame by frame -- not just a result at the end.", color: "violet" as const },
  { icon: "Bot" as const, title: "Gemini Assistant", desc: "Role-scoped AI assistant built into every portal to answer user and administrative questions with live case context.", color: "cyan" as const },
  { icon: "Radar" as const, title: "Night-Aware Detection", desc: "Adaptive low-light enhancement and glare correction keep accuracy high after dark and on dashcam footage.", color: "rose" as const },
  { icon: "Users" as const, title: "Three-Portal Workflow", desc: "Reporters submit and track their case, Administration reviews footage and resolves it, Admin oversees everything.", color: "amber" as const },
  { icon: "Lock" as const, title: "Role-Secured", desc: "Every action is scoped to a verified role -- reporters never see another case, Administration can't touch user management.", color: "violet" as const },
  { icon: "ShieldCheck" as const, title: "Full Audit Trail", desc: "Every status change is logged: who reviewed it, when, and why.", color: "cyan" as const },
]

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-violet-600 selection:text-white relative overflow-x-hidden">
      {/* Dynamic Ambient Background Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-violet-600/20 via-cyan-500/10 to-transparent blur-[120px]" />
      <div className="pointer-events-none absolute top-[550px] -left-40 w-[450px] h-[450px] bg-violet-600/10 blur-[110px] rounded-full" />
      <div className="pointer-events-none absolute top-[850px] -right-40 w-[450px] h-[450px] bg-cyan-600/10 blur-[110px] rounded-full" />

      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 font-heading text-lg sm:text-xl font-bold">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.5)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Stolen Car Detection System
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800/60">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium shadow-[0_0_20px_rgba(124,58,237,0.4)] border-0">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
        <AnimatedSection>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/40 px-4 py-1.5 text-xs font-semibold text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)] backdrop-blur mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            AI-Powered Stolen Vehicle Detection & ANPR
          </div>
          <h1 className="font-heading text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl text-white">
            Report it once.<br />
            <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Watch it get found.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base sm:text-lg text-slate-400 leading-relaxed">
            Stolen Car Detection System pairs rapid community reporting with real-time deep learning plate recognition running frame-by-frame on surveillance footage, day or night.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {/* User → login/signup portal=user */}
            <Link href="/login?portal=user">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:brightness-110 text-white font-semibold shadow-[0_0_25px_rgba(124,58,237,0.4)] border-0">
                <ShieldCheck className="h-5 w-5" /> Report a stolen vehicle
              </Button>
            </Link>
            {/* Administration → login with portal=administration */}
            <Link href="/login?portal=administration">
              <Button size="lg" variant="outline" className="border-cyan-700/60 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-900/60 hover:text-white backdrop-blur">
                Administration
              </Button>
            </Link>
            {/* Admin (super admin) — separate portal */}
            <Link href="/admin-portal/login">
              <Button size="lg" variant="outline" className="border-slate-700 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white backdrop-blur text-sm">
                Admin
              </Button>
            </Link>
          </div>
        </AnimatedSection>

        {/* Real Lamborghini 3D Floating Showcase */}
        <AnimatedSection delay={0.15} className="relative flex items-center justify-center h-80 lg:h-[460px]">
          <Car3DClient />
        </AnimatedSection>
      </section>

      {/* Stats Strip */}
      <StatsStrip />

      {/* Video Surveillance Showcase */}
      <AnimatedSection className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="mb-6 font-heading text-2xl font-bold lg:text-3xl text-white">See it in action</h2>
        <div className="h-64 overflow-hidden rounded-2xl border border-slate-800 shadow-[0_0_35px_rgba(0,0,0,0.5)] lg:h-80">
          <HeroCarousel />
        </div>
      </AnimatedSection>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <AnimatedSection>
          <h2 className="font-heading text-2xl font-bold lg:text-3xl text-white">Built for real cases, not just demos</h2>
          <p className="mt-2 text-slate-400">Enterprise ANPR surveillance tailored for rapid recovery.</p>
        </AnimatedSection>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-8 text-center text-sm text-slate-500">
        Stolen Car Detection System — Intelligent ANPR & Real-Time Automated Recovery.
      </footer>
    </div>
  )
}
