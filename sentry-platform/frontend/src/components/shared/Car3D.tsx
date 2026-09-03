"use client"
import { useRef, useState } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import Image from "next/image"
import { Scan, Sparkles } from "lucide-react"

export default function Car3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Interactive 3D mouse tilt
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 120 }
  const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [16, -16]), springConfig)
  const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-22, 22]), springConfig)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  function handleMouseLeave() {
    setIsHovered(false)
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative flex h-full w-full select-none items-center justify-center [perspective:1200px]"
    >
      {/* Background Hologram & Ambient Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-64 w-64 rounded-full bg-gradient-to-tr from-violet-500/25 via-cyan-400/20 to-rose-400/15 blur-3xl" />
        <div className="absolute h-72 w-72 rounded-full border border-violet-400/20 [animation:spin_25s_linear_infinite]" />
        <div className="absolute h-96 w-96 rounded-full border border-dashed border-cyan-400/25 [animation:spin_35s_linear_infinite_reverse]" />
      </div>

      {/* Main 3D Rotating & Floating Wrapper */}
      <motion.div
        style={{
          rotateX: isHovered ? tiltX : 0,
          rotateY: isHovered ? tiltY : 0,
          transformStyle: "preserve-3d",
        }}
        animate={
          !isHovered
            ? {
                rotateY: [-16, 16, -16],
                rotateX: [6, -4, 6],
                y: [-12, 12, -12],
              }
            : { y: -8 }
        }
        transition={
          !isHovered
            ? {
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : { duration: 0.3 }
        }
        className="relative flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
      >
        {/* Floating AI Detection Badge Top-Right */}
        <motion.div
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-3 -right-2 z-20 flex items-center gap-1.5 rounded-full border border-cyan-300/60 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-cyan-900 shadow-lg backdrop-blur-md dark:bg-slate-900/90 dark:text-cyan-200"
          style={{ transform: "translateZ(50px)" }}
        >
          <Scan className="h-3.5 w-3.5 text-cyan-500 animate-pulse" />
          <span>ANPR Live Tracked</span>
        </motion.div>

        {/* Floating Spec Badge Bottom-Left */}
        <motion.div
          animate={{ y: [4, -4, 4] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-2 -left-2 z-20 flex items-center gap-1.5 rounded-full border border-violet-300/60 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-violet-900 shadow-lg backdrop-blur-md dark:bg-slate-900/90 dark:text-violet-200"
          style={{ transform: "translateZ(45px)" }}
        >
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span>Real-Time Plate Detection</span>
        </motion.div>

        {/* Real Lamborghini Image (Medium Size) */}
        <div
          className="relative w-[320px] sm:w-[380px] md:w-[430px] max-w-full drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)] transition-transform duration-300 hover:scale-105"
          style={{ transform: "translateZ(30px)" }}
        >
          <Image
            src="/lamborghini.png"
            alt="Real Lamborghini Supercar"
            width={1000}
            height={394}
            priority
            className="h-auto w-full object-contain filter contrast-105 drop-shadow-md"
          />
        </div>

        {/* Realistic Ground Shadow & Ambient Underglow */}
        <div
          className="mt-[-15px] h-6 w-[85%] rounded-[100%] bg-black/45 blur-md"
          style={{ transform: "translateZ(0px) rotateX(75deg)" }}
        />
        <div
          className="mt-[-10px] h-3 w-3/5 rounded-[100%] bg-violet-600/35 blur-sm"
          style={{ transform: "translateZ(0px) rotateX(75deg)" }}
        />
      </motion.div>
    </div>
  )
}
