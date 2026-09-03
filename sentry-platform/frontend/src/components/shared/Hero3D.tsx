"use client"
import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { Float, MeshDistortMaterial, Environment, Sparkles } from "@react-three/drei"

function Blob({ position, color, scale = 1, speed = 1 }: { position: [number, number, number]; color: string; scale?: number; speed?: number }) {
  return (
    <Float speed={speed} rotationIntensity={1.1} floatIntensity={1.6}>
      <mesh position={position} scale={scale}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial color={color} distort={0.4} speed={2} roughness={0.15} metalness={0.3} />
      </mesh>
    </Float>
  )
}

function Ring() {
  return (
    <Float speed={0.8} rotationIntensity={2} floatIntensity={0.6}>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.1, 0.05, 16, 100]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.2} metalness={0.6} />
      </mesh>
    </Float>
  )
}

export default function Hero3D() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 7], fov: 42 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <pointLight position={[-5, -3, -5]} intensity={0.6} color="#22d3ee" />
          <Blob position={[0, 0.3, 0]} color="#7c3aed" scale={1.5} speed={1.2} />
          <Blob position={[2.3, -1.2, -1]} color="#22d3ee" scale={0.7} speed={1.6} />
          <Blob position={[-2.2, 1.1, -1.5]} color="#f43f5e" scale={0.55} speed={2} />
          <Ring />
          <Sparkles count={60} scale={7} size={2.5} speed={0.4} color="#f59e0b" />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  )
}
