'use client'

import { MeshReflectorMaterial, RoundedBox } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { WorldPalette } from './palette'

/** Velvet: no shine, but a soft lighter sheen where light grazes it, as real pile does. */
export function useVelvet(p: WorldPalette, raised = false) {
  const m = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: raised ? p.velvetRaised : p.velvet,
        roughness: 1,
        metalness: 0,
        sheen: 0.7,
        sheenRoughness: 0.6,
        sheenColor: p.velvetSheen,
      }),
    [p, raised],
  )
  useEffect(() => () => m.dispose(), [m])
  return m
}

/** Green marble: dark, polished, faintly reflective. */
export function useStone(p: WorldPalette) {
  const m = useMemo(() => new THREE.MeshPhysicalMaterial({ color: p.stone, roughness: 0.28, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.18 }), [p])
  useEffect(() => () => m.dispose(), [m])
  return m
}

export function useMetal(p: WorldPalette, gold = false) {
  const m = useMemo(() => new THREE.MeshPhysicalMaterial({ color: gold ? p.gold : p.silver, metalness: 1, roughness: 0.3 }), [p, gold])
  useEffect(() => () => m.dispose(), [m])
  return m
}

/** The floor of the house: polished dark stone with a soft reflection on capable devices. */
export function Floor({ p, tier, size = 80 }: { p: WorldPalette; tier: 'high' | 'mid' | 'low'; size?: number }) {
  const stone = useStone(p)
  if (tier === 'high') {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <MeshReflectorMaterial
          color={p.stone}
          blur={[400, 120]}
          resolution={512}
          mixBlur={1}
          mixStrength={1.4}
          roughness={0.85}
          depthScale={1}
          minDepthThreshold={0.6}
          maxDepthThreshold={1.2}
          metalness={0.2}
          mirror={0}
        />
      </mesh>
    )
  }
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={stone} receiveShadow>
      <planeGeometry args={[size, size]} />
    </mesh>
  )
}

/** A stone plinth with a thin metal band at the top edge. */
export function Plinth({ p, height = 1.05, radius = 0.42 }: { p: WorldPalette; height?: number; radius?: number }) {
  const stone = useStone(p)
  const metal = useMetal(p, true)
  return (
    <group>
      <mesh material={stone} position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.06, height, 64]} />
      </mesh>
      <mesh material={metal} position={[0, height - 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius + 0.002, 0.004, 8, 96]} />
      </mesh>
    </group>
  )
}

/**
 * A jeweller's tray: a shallow velvet-lined box on a stone table, with a gold rim.
 * Pieces are laid on its floor at y = TRAY_TOP relative to the group.
 */
export const TABLE_HEIGHT = 0.88
export const TRAY_TOP = TABLE_HEIGHT + 0.035

export function TrayTable({ p, width, depth }: { p: WorldPalette; width: number; depth: number }) {
  const stone = useStone(p)
  const velvet = useVelvet(p, true)
  const gold = useMetal(p, true)
  return (
    <group>
      {/* Table: a stone slab on a recessed plinth. */}
      <mesh material={stone} position={[0, TABLE_HEIGHT / 2 - 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.86, TABLE_HEIGHT - 0.04, depth * 0.7]} />
      </mesh>
      <RoundedBox args={[width + 0.1, 0.05, depth + 0.1]} radius={0.012} smoothness={3} position={[0, TABLE_HEIGHT, 0]} material={stone} castShadow receiveShadow />
      {/* Tray floor in velvet, with a thin gold rim around it. */}
      <mesh material={velvet} position={[0, TRAY_TOP - 0.006, 0]} receiveShadow>
        <boxGeometry args={[width, 0.012, depth]} />
      </mesh>
      {[
        [0, depth / 2, width, 0],
        [0, -depth / 2, width, 0],
        [width / 2, 0, depth, Math.PI / 2],
        [-width / 2, 0, depth, Math.PI / 2],
      ].map(([x, z, len, rot], i) => (
        <mesh key={i} material={gold} position={[x, TRAY_TOP + 0.004, z]} rotation={[0, rot, 0]}>
          <boxGeometry args={[len + 0.01, 0.018, 0.008]} />
        </mesh>
      ))}
    </group>
  )
}
