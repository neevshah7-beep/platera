'use client'

import { RoundedBox, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Plinth } from '../Hall'
import { useMaterials } from '../materials'
import { xp } from '../state'

/**
 * THE HALLMARK STRIKE. A bar of polished silver on a marble block; a hardened steel
 * punch above it. When the visitor arrives the punch drops, strikes, rebounds once and
 * lifts away: BIS · 925 is in the metal, set below the surface in a duller finish,
 * which is how a struck mark actually reads.
 */
export function Hallmark({ section }: { section: number }) {
  const m = useMaterials()
  const punch = useRef<THREE.Group>(null)
  const mark = useRef<THREE.Group>(null)
  const flash = useRef<THREE.PointLight>(null)
  const struck = useRef<number | null>(null)

  useFrame(({ clock }) => {
    const { progress } = xp.get()
    const now = clock.elapsedTime
    if (progress < section - 0.15) struck.current = null
    else struck.current ??= now
    const t = struck.current === null ? -1 : now - struck.current
    let y = 0.34
    if (t >= 0 && t < 0.16) y = 0.34 * (1 - (t / 0.16) ** 2)
    else if (t >= 0.16 && t < 0.4) y = Math.sin(((t - 0.16) / 0.24) * Math.PI) * 0.03
    else if (t >= 0.4) y = Math.min(0.34, (t - 0.4) * 0.25)
    if (punch.current) punch.current.position.y = 1.0 + 0.045 + y
    if (mark.current) mark.current.visible = t >= 0.16
    // A brief glint at the moment of contact, light glancing off freshly struck metal.
    if (flash.current) flash.current.intensity = t >= 0.16 && t < 0.6 ? 3 * Math.exp(-(t - 0.16) * 9) : 0
  })

  return (
    <group>
      <Plinth w={0.6} d={0.4} h={1.0} />
      <RoundedBox args={[0.42, 0.045, 0.16]} radius={0.008} smoothness={4} position={[0, 1.0 + 0.0225, 0]} material={m.silver} castShadow />
      <group ref={mark} position={[0, 1.046, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <Text font="/fonts/Gambetta-Regular.woff" fontSize={0.042} color={m.colors.mark} anchorX="center" anchorY="middle" letterSpacing={0.08}>
          BIS · 925
        </Text>
      </group>
      <pointLight ref={flash} position={[0, 1.12, 0.08]} intensity={0} distance={0.6} color={m.colors.lamp} />
      <group ref={punch} position={[0, 1.38, 0]}>
        <mesh material={m.steel} position={[0, 0.17, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.034, 0.3, 32]} />
        </mesh>
        <RoundedBox args={[0.14, 0.03, 0.06]} radius={0.004} smoothness={3} material={m.steel} castShadow />
      </group>
    </group>
  )
}
