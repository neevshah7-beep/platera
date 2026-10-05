'use client'

import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Plinth } from './Hall'
import { useMaterials } from '../materials/library'
import { xp } from '../state'
import { Emblem } from './Arrival'

/**
 * THE GIFT BOX: a Platera box in ivory card lined with velvet. As the visitor scrolls,
 * the ring settles into its slot, the lid swings closed, and a silk ribbon draws itself
 * across in both directions. Jewellery is bought for someone else more often than not.
 */
export function GiftBox({ tier, section }: { tier: 'high' | 'mid' | 'low'; section: number }) {
  const m = useMaterials()
  const lid = useRef<THREE.Group>(null)
  const ribbonA = useRef<THREE.Mesh>(null)
  const ribbonB = useRef<THREE.Mesh>(null)
  const card = useMemo(() => new THREE.MeshPhysicalMaterial({ color: m.colors.ground, roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(1, 1, 1) }), [m])
  const silk = useMemo(() => new THREE.MeshPhysicalMaterial({ color: m.colors.gold, roughness: 0.35, sheen: 1, sheenRoughness: 0.3, sheenColor: m.colors.raised }), [m])
  const H = 0.95
  const S = 0.24

  useFrame((_, dt) => {
    const local = THREE.MathUtils.clamp(xp.get().progress - (section - 0.5), 0, 1)
    const close = THREE.MathUtils.smoothstep(local, 0.15, 0.6)
    const tie = THREE.MathUtils.smoothstep(local, 0.6, 0.95)
    if (lid.current) lid.current.rotation.x = THREE.MathUtils.damp(lid.current.rotation.x, -1.9 * (1 - close), 6, dt)
    ribbonA.current?.scale.set(Math.max(0.001, tie), 1, 1)
    ribbonB.current?.scale.set(1, 1, Math.max(0.001, tie))
  })

  return (
    <group>
      <Plinth w={0.5} d={0.5} h={H} />
      <group position={[0, H, 0]}>
        {/* Box base, with velvet lining and the ring in its slot */}
        <RoundedBox args={[S, 0.07, S]} radius={0.006} smoothness={4} position={[0, 0.035, 0]} material={card} castShadow />
        <mesh material={m.velvet} position={[0, 0.071, 0]}>
          <boxGeometry args={[S - 0.02, 0.002, S - 0.02]} />
        </mesh>
        <group position={[0, 0.055, 0]} scale={0.62}>
          <Emblem tier={tier} stoneDetail="simple" />
        </group>
        {/* Lid, hinged at the back edge */}
        <group ref={lid} position={[0, 0.07, -S / 2]}>
          <RoundedBox args={[S + 0.006, 0.045, S + 0.006]} radius={0.006} smoothness={4} position={[0, 0.0225, S / 2]} material={card} castShadow />
          <mesh ref={ribbonA} material={silk} position={[0, 0.046, S / 2]}>
            <boxGeometry args={[S + 0.01, 0.002, 0.026]} />
          </mesh>
          <mesh ref={ribbonB} material={silk} position={[0, 0.046, S / 2]}>
            <boxGeometry args={[0.026, 0.002, S + 0.01]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
