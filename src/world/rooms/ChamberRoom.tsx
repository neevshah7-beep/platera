'use client'

import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mediaBase } from '@/components/media/PieceImage'
import { useMaterials } from '../materials/library'
import { makePieceMaterial } from '../materials/pieceLight'
import { ANCHORS, registry, type Pose } from '../registry'
import type { TrayPiece } from '../state'
import { Cove } from './Cove'

export function chamberSlot(i: number): [number, number, number] {
  return [(i % 2 ? 0.7 : -0.7) + Math.sin(i * 2.1) * 0.2, 1.35 + Math.cos(i * 1.3) * 0.25, -i * 1.4]
}

function Hanging({ piece, at }: { piece: TrayPiece; at: [number, number, number] }) {
  const m = useMaterials()
  const map = useTexture(`${mediaBase(piece.src)}-960.webp`)
  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace
  }, [map])
  const mat = useMemo(() => makePieceMaterial(map, piece.gold, m.colors), [map, piece.gold, m])
  useEffect(() => () => mat.dispose(), [mat])
  useFrame(({ clock, camera }) => {
    mat.uniforms.uFade.value = 1
    mat.uniforms.uLightPos.value.set(camera.position.x, camera.position.y + 1.5, camera.position.z)
    void clock
  })
  const aspect = piece.width / piece.height
  const s = 0.7
  return (
    <mesh material={mat} position={at}>
      <planeGeometry args={[aspect >= 1 ? s : s * aspect, aspect >= 1 ? s / aspect : s]} />
    </mesh>
  )
}

export function ChamberRoom({ id, pieces }: { id: string; pieces: TrayPiece[] }) {
  const anchor = useMemo(() => new THREE.Vector3(...ANCHORS.chamber), [])
  const pose = useMemo(
    () => (progress: number, aspect: number, out: Pose) => {
      const z = -THREE.MathUtils.clamp(progress, 0, Math.max(0, pieces.length - 1)) * 1.4
      out.target.set(anchor.x, anchor.y + 1.35, anchor.z + z - 1.5)
      out.position.set(anchor.x, anchor.y + 1.45, anchor.z + z + 2.2)
      out.fov = aspect < 0.8 ? 50 : 38
      out.focus = 3.7
    },
    [anchor, pieces.length],
  )
  useEffect(() => registry.register({ key: 'chamber', anchor, pose }), [anchor, pose])
  return (
    <group position={ANCHORS.chamber}>
      <Cove z={-pieces.length * 0.7} depth={pieces.length * 1.4 + 16} />
      <Suspense fallback={null}>
        {pieces.map((p, i) => (
          <Hanging key={`${id}-${p.slug}`} piece={p} at={chamberSlot(i)} />
        ))}
      </Suspense>
    </group>
  )
}
