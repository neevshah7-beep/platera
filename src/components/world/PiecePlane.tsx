'use client'

import { useTexture } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mediaBase } from '@/components/media/PieceImage'
import type { WorldPalette } from './palette'
import { makePieceMaterial, makeShadowMaterial } from './shaders/pieceLight'
import { world, type PieceRef } from './store'
import { track } from '@/lib/analytics/client'

/** One lamp for the whole house. Scenes move it; Light Moods colour it; every piece reads it. */
export const lamp = new THREE.Vector3(0, 2.2, 1)
export const lampColor = new THREE.Color(1, 0.96, 0.9)
export const lampPower = { value: 1 }

/**
 * A photographed piece lying on a surface: the relit photograph, and its soft shadow
 * on the velvet beneath. `size` is the length of the photo's long side in metres;
 * real necklaces are about 0.3 m laid flat, payals 0.25 m, earrings 0.08 m.
 */
export function PiecePlane({
  piece,
  palette,
  size,
  position,
  rotation = 0,
  lying = true,
  delay = 0,
  onSelect,
  resolution = 960,
}: {
  piece: PieceRef
  palette: WorldPalette
  size: number
  position: [number, number, number]
  rotation?: number
  lying?: boolean
  delay?: number
  onSelect?: (slug: string) => void
  resolution?: 480 | 960 | 1600
}) {
  const map = useTexture(`${mediaBase(piece.src)}-${resolution}.webp`)
  const born = useRef<number | null>(null)
  const hoverAmt = useRef(0)

  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 4
  }, [map])

  const mat = useMemo(() => makePieceMaterial(map, piece.gold, palette), [map, piece.gold, palette])
  const shadow = useMemo(() => makeShadowMaterial(map, palette), [map, palette])
  useEffect(() => () => { mat.dispose(); shadow.dispose() }, [mat, shadow])

  const aspect = piece.width / piece.height
  const w = aspect >= 1 ? size : size * aspect
  const h = aspect >= 1 ? size / aspect : size

  const local = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ clock }, dt) => {
    if (born.current === null) born.current = clock.elapsedTime
    const t = Math.min(1, Math.max(0, (clock.elapsedTime - born.current - delay) / 1.4))
    const eased = 1 - Math.pow(1 - t, 3)
    mat.uniforms.uFade.value = eased
    shadow.uniforms.uOpacity.value = eased * 0.55
    mat.uniforms.uLightPos.value.copy(lamp)
    mat.uniforms.uLightColor.value.copy(lampColor).multiplyScalar(lampPower.value)

    // The shadow falls away from the lamp, in the plane's own uv space.
    local.set(lamp.x - position[0], 0, lamp.z - position[2]).normalize()
    shadow.uniforms.uOffset.value.set(local.x * 0.018, -local.z * 0.018)

    const target = world.get().hovered === piece.slug ? 1 : 0
    hoverAmt.current += (target - hoverAmt.current) * Math.min(1, dt * 5)
    mat.uniforms.uSpecular.value = 1.1 + hoverAmt.current * 0.6
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!onSelect) return
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
    world.set({ hovered: piece.slug })
  }
  const out = () => {
    if (!onSelect) return
    document.body.style.cursor = ''
    if (world.get().hovered === piece.slug) world.set({ hovered: null })
  }

  return (
    <group position={position} rotation={lying ? [-Math.PI / 2, 0, rotation] : [0, rotation, 0]}>
      <mesh material={shadow} position={[0, 0, 0.0005]} renderOrder={1}>
        <planeGeometry args={[w * 1.08, h * 1.08]} />
      </mesh>
      <mesh
        material={mat}
        position={[0, 0, 0.003]}
        renderOrder={2}
        onPointerOver={over}
        onPointerOut={out}
        onClick={
          onSelect
            ? (e) => {
                // The world hears clicks through the page; a click on a real link or button is that control's, not the piece's.
                if ((e.nativeEvent.target as HTMLElement | null)?.closest('a,button,input,select,textarea,label,[role=radio]')) return
                e.stopPropagation()
                track('piece_picked_in_3d', { piece: piece.slug })
                onSelect(piece.slug)
              }
            : undefined
        }
      >
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  )
}
