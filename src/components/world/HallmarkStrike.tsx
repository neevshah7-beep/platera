'use client'

import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { WORLD_FONT } from './fonts'
import type { WorldPalette } from './palette'
import { world } from './store'

/**
 * THE HALLMARK STRIKE. A bar of polished silver on a small stand; a hardened steel
 * punch above it. When the visitor arrives (scroll ≥ strikeAt) the punch drops,
 * strikes, rebounds once and lifts away, and the mark is in the metal: BIS · 925.
 * The mark is set slightly below the surface and in a darker, rougher finish, which
 * is how a struck hallmark actually reads: a recess that catches less light.
 */
export function HallmarkStrike({ p, strikeAt }: { p: WorldPalette; strikeAt: number }) {
  const punch = useRef<THREE.Group>(null)
  const mark = useRef<THREE.Group>(null)
  const struckAt = useRef<number | null>(null)

  const silver = useMemo(() => new THREE.MeshPhysicalMaterial({ color: p.silver, metalness: 1, roughness: 0.1, clearcoat: 0.3 }), [p])
  const steel = useMemo(() => new THREE.MeshPhysicalMaterial({ color: p.silver.clone().multiplyScalar(0.55), metalness: 1, roughness: 0.38 }), [p])
  const stone = useMemo(() => new THREE.MeshPhysicalMaterial({ color: p.stone, roughness: 0.3, clearcoat: 0.6 }), [p])
  useEffect(() => () => { silver.dispose(); steel.dispose(); stone.dispose() }, [silver, steel, stone])

  useFrame(({ clock }) => {
    const { scroll } = world.get()
    const now = clock.elapsedTime
    if (scroll < strikeAt) struckAt.current = null
    else struckAt.current ??= now
    const t = struckAt.current === null ? -1 : now - struckAt.current

    // Punch height above the bar: waits, drops fast, rebounds a little, lifts slowly away.
    let y = 0.32
    if (t >= 0 && t < 0.18) y = 0.32 * (1 - (t / 0.18) ** 2)
    else if (t >= 0.18 && t < 0.42) y = Math.sin(((t - 0.18) / 0.24) * Math.PI) * 0.025
    else if (t >= 0.42) y = Math.min(0.32, (t - 0.42) * 0.22)
    if (punch.current) punch.current.position.y = y + 0.06

    // The mark appears at the moment of contact.
    if (mark.current) mark.current.visible = t >= 0.18
  })

  return (
    <group>
      {/* Stand */}
      <mesh material={stone} position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 1.0, 0.36]} />
      </mesh>
      <group position={[0, 1.0, 0]}>
        {/* The silver bar */}
        <mesh material={silver} position={[0, 0.02, 0]}>
          <boxGeometry args={[0.34, 0.04, 0.14]} />
        </mesh>
        {/* The mark, set into the top face */}
        <group ref={mark} position={[0, 0.0405, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <Text font={WORLD_FONT} fontSize={0.034} color={p.silver.clone().multiplyScalar(0.45)} anchorX="center" anchorY="middle" letterSpacing={0.06}>
            BIS · 925
          </Text>
        </group>
        {/* The punch: a steel rod with a square face */}
        <group ref={punch} position={[0, 0.38, 0]}>
          <mesh material={steel} position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 24]} />
          </mesh>
          <mesh material={steel} position={[0, 0.0, 0]}>
            <boxGeometry args={[0.12, 0.024, 0.05]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
