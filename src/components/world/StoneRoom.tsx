'use client'

import { MeshTransmissionMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { brilliantGeometry } from './Emblem'
import { Plinth } from './furniture'
import type { WorldPalette } from './palette'
import { world } from './store'

/**
 * THE STONE ROOM. One brilliant-cut stone, the size of a fist, on a plinth under the
 * lamp. Scrolling through the section turns it a full revolution; the pointer adds a
 * little more. The material splits light into colour at its facets (dispersion), the
 * "fire" people look for in a white stone. The page beside it says plainly what
 * cubic zirconia is and isn't.
 */
export function StoneRoom({ p, tier, section }: { p: WorldPalette; tier: 'high' | 'mid' | 'low'; section: number }) {
  const stone = useRef<THREE.Mesh>(null)
  const geo = useMemo(() => brilliantGeometry(tier === 'low' ? 16 : 32), [tier])
  useEffect(() => () => geo.dispose(), [geo])

  useFrame((_, dt) => {
    if (!stone.current) return
    const { scroll, pointer } = world.get()
    const local = THREE.MathUtils.clamp(scroll - section, 0, 1)
    const target = local * Math.PI * 2 + pointer.x * 0.6
    stone.current.rotation.y = THREE.MathUtils.damp(stone.current.rotation.y, target, 3, dt)
    stone.current.rotation.x = THREE.MathUtils.damp(stone.current.rotation.x, 0.08 + pointer.y * 0.12, 3, dt)
  })

  return (
    <group>
      <Plinth p={p} height={1.0} radius={0.36} />
      {/* A slim silver post and cup the stone's point rests in. */}
      <mesh position={[0, 1.06, 0]}>
        <cylinderGeometry args={[0.008, 0.012, 0.12, 16]} />
        <meshPhysicalMaterial color={p.silver} metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.13, 0]}>
        <cylinderGeometry args={[0.05, 0.012, 0.03, 32, 1, true]} />
        <meshPhysicalMaterial color={p.silver} metalness={1} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={stone} geometry={geo} position={[0, 1.13 + 0.86 * 0.13, 0]} scale={0.13}>
        {tier === 'low' ? (
          <meshPhysicalMaterial color="white" roughness={0} ior={2.15} transmission={1} thickness={1.2} dispersion={0.4} envMapIntensity={2.5} />
        ) : (
          <MeshTransmissionMaterial
            backside
            backsideThickness={0.4}
            thickness={1.2}
            ior={2.15}
            chromaticAberration={0.22}
            anisotropicBlur={0.05}
            roughness={0}
            distortion={0}
            samples={tier === 'high' ? 12 : 6}
            resolution={tier === 'high' ? 1024 : 512}
            envMapIntensity={2.6}
          />
        )}
      </mesh>
    </group>
  )
}
