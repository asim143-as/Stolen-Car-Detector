"use client"
import { motion } from "framer-motion"

const STATS = [
  { value: "24/7", label: "Live monitoring" },
  { value: "3", label: "Role-based portals" },
  { value: "<1s", label: "Per-frame detection" },
  { value: "100%", label: "Your own Supabase" },
]

export default function StatsStrip() {
  return (
    <div className="border-y border-slate-800/80 bg-slate-900/40 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-8 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="text-center"
          >
            <p className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent font-heading text-3xl font-extrabold">{s.value}</p>
            <p className="mt-1 text-sm text-slate-400">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
