"use client"
import dynamic from "next/dynamic"

const Hero3D = dynamic(() => import("./Hero3D"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-gradient-to-br from-violet-100 via-cyan-50 to-rose-100" />,
})

export default function Hero3DClient() {
  return <Hero3D />
}
