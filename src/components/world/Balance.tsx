'use client'

import { WORLD_FONT } from './fonts'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Plinth } from './furniture'
import type { WorldPalette } from './palette'
import { PiecePlane } from './PiecePlane'
import { world, type PieceRef } from './store'

/**
 * THE WEIGHING. A jeweller's two-pan balance in polished brass. The piece rests on the
 * left pan, brass weights on the right. When the visitor arrives (scroll ≥ `arriveAt`),
 * the beam is released: it swings, overshoots, and settles level, a damped oscillation,
 * and the reading appears. Everything about weight on this site is exact, so the
 * animation always ends level: the scale agrees with the number.
 */
const BEAM = 0.62
const PILLAR = 0.52

export function Balance({ p, piece, weight, arriveAt }: { p: WorldPalette; piece: PieceRef; weight: string | null; arriveAt: number }) {
  const beam = useRef<THREE.Group>(null)
  const left = useRef<THREE.Group>(null)
  const right = useRef<THREE.Group>(null)
  const needle = useRef<THREE.Mesh>(null)
  const reading = useRef<THREE.Group>(null)
  const released = useRef<number | null>(null)

  const brass = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: p.gold.clone().lerp(new THREE.Color(1, 0.85, 0.55), 0.15), metalness: 1, roughness: 0.24, clearcoat: 0.4, clearcoatRoughness: 0.2 }),
    [p],
  )
  const chain = useMemo(() => new THREE.MeshPhysicalMaterial({ color: p.gold, metalness: 1, roughness: 0.35 }), [p])
  useEffect(() => () => { brass.dispose(); chain.dispose() }, [brass, chain])

  useFrame(({ clock }) => {
    const { scroll } = world.get()
    const now = clock.elapsedTime
    let angle: number
    if (scroll < arriveAt) {
      // Before release the beam rests tipped toward the empty pan.
      released.current = null
      angle = -0.16
    } else {
      released.current ??= now
      const t = now - released.current
      // Damped oscillation around level: amplitude 0.16 rad, settling in about 2.5 s.
      angle = -0.16 * Math.exp(-t * 1.6) * Math.cos(t * 5.2)
    }
    if (beam.current) beam.current.rotation.z = angle
    // Pans hang plumb: counter-rotate and follow the beam's ends.
    const dy = Math.sin(angle) * BEAM
    if (left.current) left.current.position.set(-Math.cos(angle) * BEAM, PILLAR - dy, 0)
    if (right.current) right.current.position.set(Math.cos(angle) * BEAM, PILLAR + dy, 0)
    if (needle.current) needle.current.rotation.z = angle
    if (reading.current) {
      const settled = released.current !== null && now - released.current > 2.2
      const s = THREE.MathUtils.damp(reading.current.scale.x, settled ? 1 : 0.001, 4, 1 / 60)
      reading.current.scale.setScalar(s)
    }
  })

  const Pan = ({ children }: { children?: React.ReactNode }) => (
    <group>
      {/* Three fine chains meeting at the hook. */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <mesh key={i} material={chain} position={[Math.cos(a) * 0.09, -0.16, Math.sin(a) * 0.09]} rotation={[Math.sin(a) * 0.28, 0, -Math.cos(a) * 0.28]}>
            <cylinderGeometry args={[0.0018, 0.0018, 0.33, 4]} />
          </mesh>
        )
      })}
      <mesh material={brass} position={[0, -0.33, 0]}>
        <cylinderGeometry args={[0.2, 0.17, 0.018, 64]} />
      </mesh>
      <group position={[0, -0.32, 0]}>{children}</group>
    </group>
  )

  return (
    <group>
      <Plinth p={p} height={0.9} radius={0.5} />
      <group position={[0, 0.9, 0]}>
        {/* Base and pillar */}
        <mesh material={brass} position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.16, 0.2, 0.04, 48]} />
        </mesh>
        <mesh material={brass} position={[0, PILLAR / 2, 0]}>
          <cylinderGeometry args={[0.018, 0.026, PILLAR, 24]} />
        </mesh>
        {/* Scale arc the needle reads against */}
        <mesh material={brass} position={[0, PILLAR - 0.16, 0.02]} rotation={[0, 0, Math.PI / 2 - 0.35]}>
          <torusGeometry args={[0.12, 0.003, 6, 32, 0.7]} />
        </mesh>
        {/* Beam on its fulcrum */}
        <group ref={beam} position={[0, PILLAR, 0]}>
          <mesh material={brass} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.009, 0.009, BEAM * 2, 16]} />
          </mesh>
          <mesh material={brass}>
            <sphereGeometry args={[0.022, 24, 16]} />
          </mesh>
        </group>
        <mesh ref={needle} material={brass} position={[0, PILLAR, 0.025]}>
          <boxGeometry args={[0.004, 0.0001, 0.001]} />
        </mesh>
        <group ref={left}>
          <Pan>
            <Suspense fallback={null}>
              <PiecePlane piece={piece} palette={p} size={0.3} position={[0, 0.012, 0]} resolution={960} />
            </Suspense>
          </Pan>
        </group>
        <group ref={right}>
          <Pan>
            {[0, 1, 2].map((i) => (
              <mesh key={i} material={brass} position={[(i - 1) * 0.07, 0.03 - i * 0.004, i % 2 ? 0.04 : -0.03]}>
                <cylinderGeometry args={[0.028 - i * 0.006, 0.028 - i * 0.006, 0.05 - i * 0.012, 24]} />
              </mesh>
            ))}
          </Pan>
        </group>
        {weight && (
          <group ref={reading} position={[0, PILLAR + 0.2, 0]} scale={0.001}>
            <Text font={WORLD_FONT} fontSize={0.075} color={p.ivory} anchorX="center" anchorY="middle" letterSpacing={-0.01}>
              {weight}
            </Text>
          </group>
        )}
      </group>
    </group>
  )
}
