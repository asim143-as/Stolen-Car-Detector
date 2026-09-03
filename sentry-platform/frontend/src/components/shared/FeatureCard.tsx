"use client"
import { motion } from "framer-motion"
import { Video, Bot, Radar, Users, Lock, ShieldCheck } from "lucide-react"

const ICON_MAP = { Video, Bot, Radar, Users, Lock, ShieldCheck }

const COLOR_MAP = {
  violet: "text-violet-400 bg-violet-950/60 border border-violet-800/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]",
  cyan: "text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]",
  rose: "text-rose-400 bg-rose-950/60 border border-rose-800/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
  amber: "text-amber-400 bg-amber-950/60 border border-amber-800/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
}

export default function FeatureCard({
  icon,
  title,
  desc,
  color,
  delay = 0,
}: {
  icon: keyof typeof ICON_MAP
  title: string
  desc: string
  color: keyof typeof COLOR_MAP
  delay?: number
}) {
  const Icon = ICON_MAP[icon]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ y: -6, rotateX: 3, rotateY: -3 }}
      transition={{ duration: 0.5, delay }}
      style={{ transformStyle: "preserve-3d", perspective: 800 }}
      className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-md transition-all duration-300 hover:border-violet-500/50 hover:bg-slate-900/75 hover:shadow-[0_0_25px_rgba(124,58,237,0.15)]"
    >
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${COLOR_MAP[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-heading font-semibold text-white text-lg">{title}</h3>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{desc}</p>
    </motion.div>
  )
}
