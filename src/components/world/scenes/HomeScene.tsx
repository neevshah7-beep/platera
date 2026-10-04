'use client'

import { WORLD_FONT } from '../fonts'
import { ContactShadows, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { Emblem } from '../Emblem'
import { HallmarkStrike } from '../HallmarkStrike'
import { StoneRoom } from '../StoneRoom'
import { Floor, Plinth, TRAY_TOP, TrayTable, useVelvet } from '../furniture'
import type { WorldPalette } from '../palette'
import { PiecePlane, lamp } from '../PiecePlane'
import { world, type Alcove } from '../store'

/**
 * THE HOUSE, walked by scrolling. Section by section:
 *   0  the entrance: the emblem on its plinth under one lamp
 *   1  the corridor opens past the plinth (why these pieces)
 *   2  the Hallmark Strike
 *   3  the Stone Room
 *   4…  one alcove per collection, alternating sides, each with its own tray
 *   last the counter at the end, where viewings are arranged
 * HomeScene builds the place; CameraRig (in World) moves through it using HOME_POSES.
 */
export const ALCOVE_Z = (k: number) => -8 - k * 6
export const HALLMARK_AT: [number, number, number] = [-0.95, 0, -3.0]
export const STONE_AT: [number, number, number] = [0.95, 0, -4.6]
export const ALCOVE_SIDE = (k: number) => (k % 2 === 0 ? -1 : 1)
const TRAY_W = 1.3
const TRAY_D = 0.78

export type Pose = { pos: [number, number, number]; look: [number, number, number] }

export function homePoses(alcoveCount: number): Pose[] {
  const poses: Pose[] = [
    { pos: [0, 1.62, 3.7], look: [0, 1.5, 0] },
    { pos: [0, 1.62, 1.75], look: [0, 1.52, 0] },
    { pos: [0.75, 1.7, -1.6], look: [0, 1.3, -9] },
    // The Hallmark Strike, seen from above and in front.
    { pos: [HALLMARK_AT[0] + 0.05, 1.46, HALLMARK_AT[2] + 0.55], look: [HALLMARK_AT[0], 1.03, HALLMARK_AT[2]] },
    // The Stone Room.
    { pos: [STONE_AT[0] - 0.2, 1.3, STONE_AT[2] + 0.95], look: [STONE_AT[0], 1.24, STONE_AT[2]] },
  ]
  for (let k = 0; k < alcoveCount; k++) {
    const z = ALCOVE_Z(k)
    const s = ALCOVE_SIDE(k)
    poses.push({ pos: [s * 0.15, 1.72, z + 1.25], look: [s * 1.55, TRAY_TOP, z - 0.05] })
  }
  const end = ALCOVE_Z(alcoveCount) + 1
  poses.push({ pos: [0, 1.62, end + 3.4], look: [0, 1.05, end - 0.6] })
  return poses
}

function Corridor({ p, length }: { p: WorldPalette; length: number }) {
  const velvet = useVelvet(p)
  const width = 4.6
  const height = 3.4
  // Recessed light lines run along the ceiling edges: the corridor's only decoration.
  const lineMat = useMemo(() => new THREE.MeshBasicMaterial({ color: p.lamp, toneMapped: false, transparent: true, opacity: 0.55 }), [p])
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} material={velvet} position={[(s * width) / 2, height / 2, -length / 2 + 1.5]} rotation={[0, -s * Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[length, height]} />
        </mesh>
      ))}
      <mesh material={velvet} position={[0, height, -length / 2 + 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
      </mesh>
      <mesh material={velvet} position={[0, height / 2, -length + 1.5]}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`l${s}`} material={lineMat} position={[s * (width / 2 - 0.08), height - 0.02, -length / 2 + 1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.025, length]} />
        </mesh>
      ))}
    </group>
  )
}

function AlcoveTray({ alcove, k, p, onSelect }: { alcove: Alcove; k: number; p: WorldPalette; onSelect: (slug: string) => void }) {
  const z = ALCOVE_Z(k)
  const s = ALCOVE_SIDE(k)
  const x = s * 1.55
  // Up to four pieces, laid as a jeweller would: not a grid, each a little turned.
  const layout: [number, number, number, number][] = [
    [-0.36, -0.13, 0.36, -0.08],
    [0.3, -0.18, 0.3, 0.12],
    [-0.1, 0.2, 0.3, 0.05],
    [0.42, 0.22, 0.2, -0.15],
  ]
  return (
    <group position={[x, 0, z]} rotation={[0, -s * 0.12, 0]}>
      <TrayTable p={p} width={TRAY_W} depth={TRAY_D} />
      <Suspense fallback={null}>
        {alcove.pieces.slice(0, 4).map((piece, i) => {
          const [px, pz, size, rot] = layout[i]
          return (
            <PiecePlane
              key={piece.slug}
              piece={piece}
              palette={p}
              size={size}
              position={[px, TRAY_TOP, pz]}
              rotation={rot}
              delay={0.15 * i}
              onSelect={onSelect}
              resolution={960}
            />
          )
        })}
      </Suspense>
      {/* The collection's name, set in the wall like an engraved plate. */}
      <Text
        font={WORLD_FONT}
        position={[s * 0.62, 2.05, -0.25]}
        rotation={[0, -s * Math.PI / 2 + s * 0.12, 0]}
        fontSize={0.16}
        color={p.ivory}
        anchorX="center"
        anchorY="middle"
        letterSpacing={-0.02}
      >
        {alcove.name}
      </Text>
    </group>
  )
}

export function HomeScene({ p, tier, alcoves, onSelect }: { p: WorldPalette; tier: 'high' | 'mid' | 'low'; alcoves: Alcove[]; onSelect: (slug: string) => void }) {
  const length = Math.abs(ALCOVE_Z(alcoves.length)) + 6

  // The lamp: over the emblem at the entrance, it travels slowly across so the facets
  // light one after another; deeper in the house it follows the visitor's eye.
  useFrame(({ clock, camera }) => {
    const { scroll, pointer, hovered } = world.get()
    const t = clock.elapsedTime
    if (scroll < 1.6) {
      lamp.set(Math.sin(t * 0.35) * 0.9 + pointer.x * 0.4, 1.95 + pointer.y * 0.15, 0.55 + Math.cos(t * 0.35) * 0.35)
    } else if (scroll < 2.9) {
      lamp.lerp(new THREE.Vector3(HALLMARK_AT[0] + 0.35 + pointer.x * 0.25, 1.75, HALLMARK_AT[2] + 0.45), 0.06)
    } else if (scroll < 3.9) {
      lamp.lerp(new THREE.Vector3(STONE_AT[0] - 0.4 + pointer.x * 0.4, 2.0, STONE_AT[2] + 0.7), 0.06)
    } else {
      const k = Math.min(alcoves.length - 1, Math.max(0, Math.round(scroll - 4.5)))
      const z = ALCOVE_Z(k)
      const s = ALCOVE_SIDE(k)
      const target = new THREE.Vector3(s * 1.55 + pointer.x * 0.45, TRAY_TOP + 0.75, z - pointer.y * 0.3)
      if (hovered) target.y -= 0.15
      lamp.lerp(target, 0.06)
    }
    void camera
  })

  return (
    <group>
      <Floor p={p} tier={tier} size={Math.max(60, length + 20)} />
      <Corridor p={p} length={length} />

      {/* The entrance. */}
      <group position={[0, 0, 0]}>
        <Plinth p={p} />
        <group position={[0, 1.05 + (0.42 + 0.045) * 0.8, 0]} scale={0.8}>
          <Emblem palette={p} tier={tier} />
        </group>
        <ContactShadows position={[0, 1.051, 0]} scale={1} blur={2.4} opacity={0.65} far={0.6} resolution={256} color={p.shadowInk} frames={tier === 'low' ? 1 : Infinity} />
      </group>

      <group position={HALLMARK_AT} rotation={[0, 0.35, 0]}>
        <HallmarkStrike p={p} strikeAt={2.72} />
      </group>
      <group position={STONE_AT}>
        <StoneRoom p={p} tier={tier} section={3} />
      </group>

      {alcoves.map((a, k) => (
        <AlcoveTray key={a.slug} alcove={a} k={k} p={p} onSelect={onSelect} />
      ))}

      {/* The counter at the end of the corridor. */}
      <group position={[0, 0, ALCOVE_Z(alcoves.length) + 0.4]}>
        <TrayTable p={p} width={2.2} depth={0.7} />
      </group>
    </group>
  )
}
