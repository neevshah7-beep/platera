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

function PadPiece({ piece }: { piece: TrayPiece }) {
  const m = useMaterials()
  const map = useTexture(`${mediaBase(piece.src)}-1600.webp`)
  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace
  }, [map])
  const mat = useMemo(() => makePieceMaterial(map, piece.gold, m.colors), [map, piece.gold, m])
  useEffect(() => () => mat.dispose(), [mat])
  useFrame(({ camera }) => {
    mat.uniforms.uFade.value = 1
    mat.uniforms.uLightPos.value.set(camera.position.x + 0.4, camera.position.y + 0.6, camera.position.z)
  })
  const aspect = piece.width / piece.height
  const s = 0.42
  return (
    <mesh material={mat} position={[0, 0.955, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[aspect >= 1 ? s : s * aspect, aspect >= 1 ? s / aspect : s]} />
    </mesh>
  )
}

export function LampRoom({ piece }: { piece: TrayPiece }) {
  const m = useMaterials()
  const anchor = useMemo(() => new THREE.Vector3(...ANCHORS.lamp), [])
  const pose = useMemo(
    () => (progress: number, aspect: number, out: Pose) => {
      const back = aspect < 0.8 ? 1.6 : 1
      out.target.set(anchor.x - (aspect < 0.8 ? 0 : 0.14), anchor.y + 0.93, anchor.z)
      out.position.set(anchor.x - 0.1, anchor.y + 0.93 + 0.62 * back, anchor.z + 0.5 * back + progress * 0.2)
      out.fov = aspect < 0.8 ? 44 : 32
      out.focus = out.position.distanceTo(out.target)
    },
    [anchor],
  )
  useEffect(() => registry.register({ key: 'lamp', anchor, pose, adjacent: ['tray'] }), [anchor, pose])
  return (
    <group position={ANCHORS.lamp}>
      <mesh material={m.marble} position={[0, 0.465, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.93, 0.6]} />
      </mesh>
      <mesh material={m.velvet} position={[0, 0.94, 0]} receiveShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.02, 64]} />
      </mesh>
      <Suspense fallback={null}>
        <PadPiece piece={piece} />
      </Suspense>
    </group>
  )
}
