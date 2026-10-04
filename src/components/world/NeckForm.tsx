'use client'

import { Text } from '@react-three/drei'
import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { WORLD_FONT } from './fonts'
import { useVelvet } from './furniture'
import type { WorldPalette } from './palette'
import { PiecePlane } from './PiecePlane'
import type { PieceRef } from './store'

/**
 * ON THE NECK. A jeweller's neck form in velvet, at true adult scale, with a fine
 * metal ring for each common length (16, 18, 20, 24 in). The piece hangs at its own
 * length. Misjudged size is the most common reason jewellery is sent back; this is
 * the answer to "where will it sit?".
 *
 * Geometry, in metres: neck circumference ≈ 0.36 m. A chain of length L, worn, drops
 * in front by roughly (L − neck)/2 below the base of the neck. The rings are drawn as
 * that loop: round at the back of the neck, falling to a soft point at the front.
 */
const IN = 0.0254
const NECK_CIRC = 0.36
const NECK_R = NECK_CIRC / (2 * Math.PI)
const NECK_BASE_Y = 1.32
export const LENGTHS = [16, 18, 20, 24] as const

/** Where a chain of `inches` hangs at its lowest point, relative to the neck base. */
export function dropFor(inches: number) {
  return Math.max(0.01, (inches * IN - NECK_CIRC) / 2) * 0.82
}

function chainCurve(inches: number): THREE.CatmullRomCurve3 {
  const drop = dropFor(inches)
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2 // 0 = front, π = back
    const front = (Math.cos(a) + 1) / 2 // 1 at the front, 0 at the back
    const r = NECK_R + 0.012 + front * front * drop * 0.55
    const y = NECK_BASE_Y - front ** 2.2 * drop
    pts.push(new THREE.Vector3(Math.sin(a) * r * 1.25, y, Math.cos(a) * r + front * 0.02))
  }
  return new THREE.CatmullRomCurve3(pts, true)
}

export function NeckForm({ p, piece, lengthIn }: { p: WorldPalette; piece: PieceRef; lengthIn: number | null }) {
  const velvet = useVelvet(p, true)
  const ringMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: p.gold, metalness: 1, roughness: 0.3, transparent: true, opacity: 0.85 }), [p])
  const rings = useMemo(() => LENGTHS.map((l) => ({ l, geo: new THREE.TubeGeometry(chainCurve(l), 160, 0.0012, 6, true) })), [])
  useEffect(() => () => { ringMat.dispose(); rings.forEach((r) => r.geo.dispose()) }, [ringMat, rings])

  const shown = lengthIn ?? 18
  const pieceY = NECK_BASE_Y - dropFor(shown) + 0.06

  return (
    <group>
      {/* Stand: a slim stone column. */}
      <mesh position={[0, 0.5, -0.02]}>
        <cylinderGeometry args={[0.05, 0.12, 1.0, 32]} />
        <meshPhysicalMaterial color={p.stone} roughness={0.3} clearcoat={0.6} />
      </mesh>
      {/* Shoulders and chest: a flattened capsule, then the neck. */}
      <mesh material={velvet} position={[0, 1.12, 0]} scale={[1.9, 1, 0.8]}>
        <capsuleGeometry args={[0.1, 0.16, 12, 32]} />
      </mesh>
      <mesh material={velvet} position={[0, NECK_BASE_Y + 0.07, 0]}>
        <cylinderGeometry args={[NECK_R * 0.95, NECK_R * 1.15, 0.16, 48]} />
      </mesh>

      {rings.map(({ l, geo }) => (
        <group key={l}>
          <mesh geometry={geo} material={ringMat} />
          <Text font={WORLD_FONT} position={[0.165, NECK_BASE_Y - dropFor(l) * 0.62, 0.08]} fontSize={0.016} color={p.ivory} anchorX="left">
            {`${l}″`}
          </Text>
        </group>
      ))}

      {/* The piece, hung flat against the chest at its length. */}
      <Suspense fallback={null}>
        <PiecePlane piece={piece} palette={p} size={0.26} position={[0, pieceY, NECK_R * 0.9 + 0.035]} lying={false} resolution={960} />
      </Suspense>
    </group>
  )
}
