'use client'

import { useRouter } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useMaterials } from '../materials/library'
import { ANCHORS, registry, type Pose } from '../registry'
import type { TrayPiece } from '../state'
import { TrayItem } from './Tray'

/** Pieces are laid along −Z, two abreast, 0.42 m apart. */
export function trayLayout(i: number): [number, number, number] {
  return [(i % 2 ? 0.26 : -0.26) + Math.sin(i * 1.7) * 0.05, 0, -Math.floor(i / 2) * 0.62 - (i % 2) * 0.24]
}

export function TrayRoom({ id, pieces }: { id: string; pieces: TrayPiece[] }) {
  const m = useMaterials()
  const router = useRouter()
  const open = useCallback((slug: string) => router.push(`/piece/${slug}`), [router])
  const anchor = useMemo(() => new THREE.Vector3(...ANCHORS.tray), [])
  const length = Math.max(3, Math.ceil(pieces.length / 2) * 0.62 + 1.2)
  const pose = useMemo(
    () => (progress: number, aspect: number, out: Pose) => {
      const z = -THREE.MathUtils.clamp(progress, 0, Math.max(0, pieces.length - 1)) * 0.31
      const back = aspect < 0.8 ? 1.5 : 1
      out.target.set(anchor.x, anchor.y + 0.9, anchor.z + z - 0.35)
      out.position.set(anchor.x + 0.15, anchor.y + 0.9 + 0.95 * back, anchor.z + z + 0.75 * back)
      out.fov = aspect < 0.8 ? 46 : 34
      out.focus = out.position.distanceTo(out.target)
    },
    [anchor, pieces.length],
  )
  useEffect(() => registry.register({ key: 'tray', anchor, pose, adjacent: ['lamp'] }), [anchor, pose])

  return (
    <group position={ANCHORS.tray}>
      <mesh material={m.marble} position={[0, 0.43, -length / 2 + 0.4]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.86, length]} />
      </mesh>
      <mesh material={m.velvet} position={[0, 0.866, -length / 2 + 0.4]} receiveShadow>
        <boxGeometry args={[0.9, 0.012, length - 0.1]} />
      </mesh>
      <Suspense fallback={null}>
        {pieces.map((p, i) => {
          const [x, , z] = trayLayout(i)
          return <TrayItem key={`${id}-${p.slug}`} piece={p} position={[x, 0, z]} rotation={Math.sin(i * 2.3) * 0.12} size={0.34} y={0.84} onOpen={open} />
        })}
      </Suspense>
    </group>
  )
}
