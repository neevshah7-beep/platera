'use client'

import { Text, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mediaBase } from '@/components/media/PieceImage'
import { useMaterials } from '../materials/library'
import { makePieceMaterial } from '../materials/pieceLight'
import { xp, type TrayPiece } from '../state'

/**
 * ON THE NECK: a jeweller's neck form in white marble at true adult scale, with a fine
 * gold ring for each common chain length (16, 18, 20, 24 in). As the visitor scrolls,
 * the rings draw themselves in, longest last, and the necklace settles at its length.
 *
 * Neck circumference ≈ 0.36 m; a chain of length L drops in front by roughly
 * (L − neck) / 2 below the base of the neck. The rings are drawn as that loop.
 */
const IN = 0.0254
const NECK_CIRC = 0.36
const NECK_R = NECK_CIRC / (2 * Math.PI)
const NECK_BASE = 1.33
const LENGTHS = [16, 18, 20, 24]
const drop = (inches: number) => Math.max(0.01, (inches * IN - NECK_CIRC) / 2) * 0.82

function chainCurve(inches: number) {
  const d = drop(inches)
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2
    const front = (Math.cos(a) + 1) / 2
    const r = NECK_R + 0.012 + front * front * d * 0.55
    pts.push(new THREE.Vector3(Math.sin(a) * r * 1.25, NECK_BASE - front ** 2.2 * d, Math.cos(a) * r + front * 0.02))
  }
  return new THREE.CatmullRomCurve3(pts, true)
}

/** A neck-and-shoulder form, turned on a lathe from a sculptor's profile. */
function bustGeometry() {
  const p = [
    [0.0, 0.98], [0.17, 0.99], [0.2, 1.02], [0.21, 1.1], [0.19, 1.18], [0.15, 1.24], [0.1, 1.28],
    [0.062, 1.32], [0.054, 1.38], [0.052, 1.46], [0.0, 1.47],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const g = new THREE.LatheGeometry(p, 96)
  g.scale(1.55, 1, 0.78) // shoulders wider than deep
  g.computeVertexNormals()
  return g
}

export function Neck({ piece, section }: { piece: TrayPiece | null; section: number }) {
  const m = useMaterials()
  const bust = useMemo(() => bustGeometry(), [])
  const rings = useMemo(() => LENGTHS.map((l) => new THREE.TubeGeometry(chainCurve(l), 200, 0.0016, 8, true)), [])
  const ringRefs = useRef<(THREE.Mesh | null)[]>([])
  useEffect(() => () => { bust.dispose(); rings.forEach((r) => r.dispose()) }, [bust, rings])

  useFrame(() => {
    const local = THREE.MathUtils.clamp(xp.get().progress - (section - 0.6), 0, 1)
    ringRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      // Each ring draws itself in, one after another.
      const t = THREE.MathUtils.clamp(local * 1.6 - i * 0.18, 0, 1)
      mesh.geometry.setDrawRange(0, Math.floor(t * (mesh.geometry.index?.count ?? 0)))
    })
  })

  return (
    <group>
      <mesh material={m.marble} position={[0, 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.16, 0.96, 48]} />
      </mesh>
      <mesh geometry={bust} material={m.marble} castShadow receiveShadow />
      {rings.map((g, i) => (
        <group key={LENGTHS[i]}>
          <mesh ref={(el) => { ringRefs.current[i] = el }} geometry={g} material={m.gold} />
          <Text font="/fonts/Gambetta-Regular.woff" position={[0.18, NECK_BASE - drop(LENGTHS[i]) * 0.65, 0.1]} fontSize={0.022} color={m.colors.ink} anchorX="left">
            {`${LENGTHS[i]}″`}
          </Text>
        </group>
      ))}
      {piece && <NeckPiece piece={piece} />}
    </group>
  )
}

function NeckPiece({ piece }: { piece: TrayPiece }) {
  const m = useMaterials()
  const map = useTexture(`${mediaBase(piece.src)}-960.webp`)
  useMemo(() => { map.colorSpace = THREE.SRGBColorSpace }, [map])
  const mat = useMemo(() => makePieceMaterial(map, piece.gold, m.colors), [map, piece.gold, m])
  useEffect(() => () => mat.dispose(), [mat])
  useFrame(({ camera }) => {
    mat.uniforms.uFade.value = 1
    mat.uniforms.uLightPos.value.set(camera.position.x + 0.3, camera.position.y + 0.4, camera.position.z)
  })
  const aspect = piece.width / piece.height
  const s = 0.26
  // Hung at 18 in against the chest: the most common length for a set like this.
  return (
    <mesh material={mat} position={[0, NECK_BASE - drop(18) + 0.07, NECK_R * 0.78 + 0.075]} rotation={[-0.32, 0, 0]}>
      <planeGeometry args={[aspect >= 1 ? s : s * aspect, aspect >= 1 ? s / aspect : s]} />
    </mesh>
  )
}
