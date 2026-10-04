'use client'

import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { Floor, TRAY_TOP, TrayTable, useVelvet } from '../furniture'
import type { WorldPalette } from '../palette'
import { PiecePlane, lamp } from '../PiecePlane'
import { world, type PieceRef } from '../store'
import type { Pose } from './HomeScene'

/**
 * A COLLECTION ROOM: one long tray with every piece of the collection laid on it,
 * in two loose rows, each piece turned a little as a hand would set it down.
 * Scrolling slides the camera along the tray; the lamp follows the pointer, and
 * settles over whichever piece is being pointed at.
 */
const SPACING = 0.46
export const roomLayout = (n: number) => {
  const cols = Math.max(2, Math.ceil(n / 2))
  const width = cols * SPACING + 0.3
  // Deterministic "random" so a piece always lies the same way.
  const jitter = (i: number, k: number) => Math.sin(i * 12.9898 + k * 78.233) * 0.5
  const items = Array.from({ length: n }, (_, i) => {
    const col = Math.floor(i / 2)
    const row = i % 2
    return {
      x: -width / 2 + 0.15 + SPACING * (col + 0.5) + jitter(i, 1) * 0.06 + (row ? SPACING * 0.22 : 0),
      z: (row ? 0.2 : -0.2) + jitter(i, 2) * 0.05,
      rot: jitter(i, 3) * 0.35,
    }
  })
  return { width, depth: 0.95, items }
}

export function roomPoses(n: number): Pose[] {
  const { width } = roomLayout(n)
  const half = Math.max(0, width / 2 - 0.65)
  return [
    { pos: [-half, 1.75, 0.95], look: [-half, TRAY_TOP, -0.05] },
    { pos: [half, 1.75, 0.95], look: [half, TRAY_TOP, -0.05] },
  ]
}

export function RoomScene({ p, tier, pieces, onSelect }: { p: WorldPalette; tier: 'high' | 'mid' | 'low'; pieces: PieceRef[]; onSelect: (slug: string) => void }) {
  const { width, depth, items } = useMemo(() => roomLayout(pieces.length), [pieces.length])
  const wall = useVelvet(p)
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera }) => {
    const { pointer, hovered } = world.get()
    const i = hovered ? pieces.findIndex((x) => x.slug === hovered) : -1
    if (i >= 0) target.set(items[i].x, TRAY_TOP + 0.55, items[i].z + 0.1)
    else target.set(camera.position.x + pointer.x * 0.9, TRAY_TOP + 0.7, -pointer.y * 0.35)
    lamp.lerp(target, 0.07)
  })

  return (
    <group>
      <Floor p={p} tier={tier} />
      <mesh material={wall} position={[0, 1.7, -1.4]}>
        <planeGeometry args={[Math.max(12, width + 6), 3.4]} />
      </mesh>
      <TrayTable p={p} width={width} depth={depth} />
      <Suspense fallback={null}>
        {pieces.map((piece, i) => (
          <PiecePlane
            key={piece.slug}
            piece={piece}
            palette={p}
            size={0.36}
            position={[items[i].x, TRAY_TOP, items[i].z]}
            rotation={items[i].rot}
            delay={0.06 * i}
            onSelect={onSelect}
            resolution={tier === 'low' ? 480 : 960}
          />
        ))}
      </Suspense>
    </group>
  )
}
