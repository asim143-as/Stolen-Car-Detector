"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

// Rotating hero imagery for the landing page -- license-plate / traffic
// camera / night-road shots that set the "vehicle surveillance" tone.
const SLIDES = [
  { src: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&q=80", alt: "Highway traffic at night" },
  { src: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1600&q=80", alt: "City street surveillance view" },
  { src: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1600&q=80", alt: "Parking lot at dusk" },
  { src: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1600&q=80", alt: "Car dashboard camera view" },
]

export default function HeroCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 4500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border shadow-premium">
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <Image src={SLIDES[index].src} alt={SLIDES[index].alt} fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-1.5 bg-white/40"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <div className="absolute left-4 top-4 status-pill bg-crimson/90 text-crimson-foreground">
        <span className="live-dot bg-white" /> LIVE MONITORING
      </div>
    </div>
  )
}
