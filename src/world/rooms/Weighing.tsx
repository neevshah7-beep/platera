'use client'

import { Text, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mediaBase } from '@/components/media/PieceImage'
import { Plinth } from './Hall'
import { useMaterials } from '../materials/library'
import { makePieceMaterial } from '../materials/pieceLight'
import { xp, type TrayPiece } from '../state'
import { lampTint } from './Tray'

const BEAM = 0.32
const PILLAR = 0.42
const TOP = 0.95

/**
 * THE WEIGHING: a jeweller's two-pan balance in polished brass. The piece rests on the
 * left pan, brass weights on the right. When the visitor arrives the beam is released:
 * it swings, overshoots and settles level (a damped oscillation), and the reading
 * appears. It always ends level, because the weight shown on this site is exact.
 */
export function Weighing({ piece, weight, section }: { piece: TrayPiece | null; weight: string | null; section: number }) {
  const m = useMaterials()
  const beam = useRef<THREE.Group>(null)
  const left = useRef<THREE.Group>(null)
  const right = useRef<THREE.Group>(null)
  const reading = useRef<THREE.Group>(null)
  const released = useRef<number | null>(null)

  useFrame(({ clock }, dt) => {
    const { progress } = xp.get()
    const now = clock.elapsedTime
    let angle = -0.18
    if (progress >= section - 0.2) {
      released.current ??= now
      const t = now - released.current
      angle = -0.18 * Math.exp(-t * 1.5) * Math.cos(t * 5)
    } else released.current = null
    if (beam.current) beam.current.rotation.z = angle
    const dy = Math.sin(angle) * BEAM
    left.current?.position.set(-Math.cos(angle) * BEAM, PILLAR - dy, 0)
    right.current?.position.set(Math.cos(angle) * BEAM, PILLAR + dy, 0)
    if (reading.current) {
      const settled = released.current !== null && now - released.current > 2
      reading.current.scale.setScalar(THREE.MathUtils.damp(reading.current.scale.x, settled ? 1 : 0.001, 5, dt))
    }
  })

  const Pan = ({ children }: { children?: React.ReactNode }) => (
    <group>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <mesh key={i} material={m.brass} position={[Math.cos(a) * 0.05, -0.1, Math.sin(a) * 0.05]} rotation={[Math.sin(a) * 0.26, 0, -Math.cos(a) * 0.26]}>
            <cylinderGeometry args={[0.0012, 0.0012, 0.21, 4]} />
          </mesh>
        )
      })}
      <mesh material={m.brass} position={[0, -0.21, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.1, 0.012, 64]} />
      </mesh>
      <group position={[0, -0.203, 0]}>{children}</group>
    </group>
  )

  return (
    <group>
      <Plinth w={0.9} d={0.5} h={TOP} />
      <group position={[0, TOP, 0]}>
        <mesh material={m.brass} position={[0, 0.015, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.03, 48]} />
        </mesh>
        <mesh material={m.brass} position={[0, PILLAR / 2, 0]} castShadow>
          <cylinderGeometry args={[0.009, 0.014, PILLAR, 24]} />
        </mesh>
        <group ref={beam} position={[0, PILLAR, 0]}>
          <mesh material={m.brass} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.005, 0.005, BEAM * 2, 16]} />
          </mesh>
          <mesh material={m.brass}>
            <sphereGeometry args={[0.014, 24, 16]} />
          </mesh>
        </group>
        <group ref={left}>
          <Pan>{piece && <PanPiece piece={piece} />}</Pan>
        </group>
        <group ref={right}>
          <Pan>
            {[0, 1, 2].map((i) => (
              <mesh key={i} material={m.brass} position={[(i - 1) * 0.04, 0.018, i % 2 ? 0.025 : -0.02]} castShadow>
                <cylinderGeometry args={[0.016 - i * 0.003, 0.016 - i * 0.003, 0.03 - i * 0.007, 24]} />
              </mesh>
            ))}
          </Pan>
        </group>
        {weight && (
          <group ref={reading} position={[0, PILLAR + 0.13, 0]} scale={0.001}>
            <Text font="/fonts/Gambetta-Regular.woff" fontSize={0.05} color={m.colors.ink} anchorX="center">
              {weight}
            </Text>
          </group>
        )}
      </group>
    </group>
  )
}

function PanPiece({ piece }: { piece: TrayPiece }) {
  const m = useMaterials()
  const map = useTexture(`${mediaBase(piece.src)}-960.webp`)
  useMemo(() => { map.colorSpace = THREE.SRGBColorSpace }, [map])
  const mat = useMemo(() => makePieceMaterial(map, piece.gold, m.colors), [map, piece.gold, m])
  useEffect(() => () => mat.dispose(), [mat])
  useFrame(({ camera }) => {
    mat.uniforms.uFade.value = 1
    mat.uniforms.uLightPos.value.set(camera.position.x - 0.4, camera.position.y + 0.8, camera.position.z - 0.6)
    mat.uniforms.uLightColor.value.copy(lampTint.color).multiplyScalar(lampTint.power)
  })
  const aspect = piece.width / piece.height
  const s = 0.2
  return (
    <mesh material={mat} position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[aspect >= 1 ? s : s * aspect, aspect >= 1 ? s / aspect : s]} />
    </mesh>
  )
}
