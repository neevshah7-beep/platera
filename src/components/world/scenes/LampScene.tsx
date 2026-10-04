'use client'

import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { Balance } from '../Balance'
import { Floor, useVelvet } from '../furniture'
import type { WorldPalette } from '../palette'
import { PiecePlane, lamp } from '../PiecePlane'
import { world, type PieceRef } from '../store'
import type { Pose } from './HomeScene'

/**
 * THE LAMP: one piece on a tilted velvet pad, close to the eye. The visitor moves
 * the light, not the piece: the pointer (or a finger dragged across the screen)
 * carries the lamp over the metal, the way everyone tilts a piece under a shop lamp.
 */
export const PAD_TILT = -0.95
export const BALANCE_X = 1.9
export const BALANCE_Z = -0.3

export function lampPoses(wide: boolean): Pose[] {
  // On a wide screen the piece sits left, under the gallery column; on a phone, centred above the text.
  // Pose 0: the piece under the lamp. Pose 1: the balance, for The Weighing.
  if (wide) {
    return [
      { pos: [0.34, 1.38, 0.92], look: [0.34, 1.02, 0] },
      { pos: [BALANCE_X - 0.38, 1.62, 1.3], look: [BALANCE_X - 0.38, 1.3, BALANCE_Z] },
      { pos: [BALANCE_X - 0.38, 1.7, 1.5], look: [BALANCE_X - 0.38, 1.3, BALANCE_Z] },
    ]
  }
  // Phone: the piece fills the top of the screen, above the name and price.
  return [
    { pos: [0, 1.3, 1.08], look: [0, 0.84, 0] },
    { pos: [BALANCE_X, 1.62, 1.75], look: [BALANCE_X, 1.12, BALANCE_Z] },
    { pos: [BALANCE_X, 1.7, 1.9], look: [BALANCE_X, 1.12, BALANCE_Z] },
  ]
}

export function LampScene({ p, tier, piece, weight }: { p: WorldPalette; tier: 'high' | 'mid' | 'low'; piece: PieceRef; weight: string | null }) {
  const velvet = useVelvet(p, true)
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const { pointer, scroll } = world.get()
    const idle = Math.sin(clock.elapsedTime * 0.4) * 0.12
    if (scroll < 0.6) lamp.lerp(target.set(pointer.x * 0.55 + idle, 1.25 + pointer.y * 0.25, 0.45 - pointer.y * 0.2), 0.08)
    else lamp.lerp(target.set(BALANCE_X - 0.3 + pointer.x * 0.3, 2.0, BALANCE_Z + 0.6), 0.05)
  })

  return (
    <group>
      <Floor p={p} tier={tier === 'high' ? 'mid' : tier} />
      <group position={[0, 1.0, 0]} rotation={[PAD_TILT + Math.PI / 2, 0, 0]}>
        {/* The pad, seen face on; the piece lies on it. */}
        <mesh material={velvet} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.006, 0]}>
          <boxGeometry args={[0.62, 0.62, 0.012]} />
        </mesh>
        <Suspense fallback={null}>
          <PiecePlane piece={piece} palette={p} size={0.5} position={[0, 0, 0]} resolution={tier === 'low' ? 960 : 1600} />
        </Suspense>
      </group>
      <group position={[BALANCE_X, 0, BALANCE_Z]}>
        <Balance p={p} piece={piece} weight={weight} arriveAt={0.85} />
      </group>
    </group>
  )
}
