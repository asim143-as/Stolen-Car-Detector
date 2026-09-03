"use client"
import { motion } from "framer-motion"
import { Video, Bot, Radar, Users, Lock, ShieldCheck } from "lucide-react"

const ICON_MAP = { Video, Bot, Radar, Users, Lock, ShieldCheck }

const COLOR_MAP = {
  violet: "text-violet-600 bg-violet-50",
  cyan: "text-cyan-600 bg-cyan-50",
  rose: "text-rose-600 bg-rose-50",
  amber: "text-amber-600 bg-amber-50",
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
      whileHover={{ y: -6, rotateX: 4, rotateY: -4 }}
      transition={{ duration: 0.5, delay }}
      style={{ transformStyle: "preserve-3d", perspective: 800 }}
      className="glass-card p-6"
    >
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${COLOR_MAP[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-heading font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </motion.div>
  )
}
