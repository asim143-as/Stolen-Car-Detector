"use client"
import { Suspense, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, ContactShadows, RoundedBox } from "@react-three/drei"
import * as THREE from "three"

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.42, 0.42, 0.32, 24]} />
      <meshStandardMaterial color="#18181b" roughness={0.6} metalness={0.2} />
    </mesh>
  )
}

function Car() {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.5
  })

  return (
    <group ref={group} position={[0, -0.1, 0]}>
      {/* Lower body */}
      <RoundedBox args={[2.6, 0.55, 1.15]} radius={0.12} smoothness={4} position={[0, 0.35, 0]} castShadow>
        <meshStandardMaterial color="#7c3aed" roughness={0.25} metalness={0.7} />
      </RoundedBox>
      {/* Cabin */}
      <RoundedBox args={[1.3, 0.5, 1.05]} radius={0.15} smoothness={4} position={[-0.05, 0.82, 0]} castShadow>
        <meshStandardMaterial color="#a78bfa" roughness={0.1} metalness={0.3} transparent opacity={0.85} />
      </RoundedBox>
      {/* Headlights */}
      <mesh position={[1.28, 0.4, 0.38]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[1.28, 0.4, -0.38]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.6} />
      </mesh>
      {/* Taillights */}
      <mesh position={[-1.28, 0.4, 0.38]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[-1.28, 0.4, -0.38]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={1.4} />
      </mesh>
      {/* Wheels */}
      <Wheel position={[0.85, 0.05, 0.58]} />
      <Wheel position={[0.85, 0.05, -0.58]} />
      <Wheel position={[-0.85, 0.05, 0.58]} />
      <Wheel position={[-0.85, 0.05, -0.58]} />
    </group>
  )
}

export default function Car3D() {
  return (
    <div className="h-full w-full">
      <Canvas shadows camera={{ position: [3.4, 1.6, 3.4], fov: 40 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 5, 3]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
          <pointLight position={[-4, 2, -3]} intensity={0.5} color="#22d3ee" />
          <Car />
          <ContactShadows position={[0, -0.35, 0]} opacity={0.5} scale={8} blur={2.2} far={2} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  )
}
