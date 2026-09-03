"use client"
import dynamic from "next/dynamic"

const Car3D = dynamic(() => import("./Car3D"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-gradient-to-br from-violet-100 via-cyan-50 to-rose-100" />,
})

export default function Car3DClient() {
  return <Car3D />
}
