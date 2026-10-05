'use client'

import { useTexture } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mediaBase } from '@/components/media/PieceImage'
import { track } from '@/lib/analytics/client'
import { useMaterials } from '../materials/library'
import { makePieceMaterial, makeShadowMaterial } from '../materials/pieceLight'
import { xp, type TrayPiece } from '../state'

/** The lamp over the tray, in world space. It sweeps across with the scroll and settles over whatever is pointed at. */
export const trayLamp = new THREE.Vector3(0, 1.6, 0.3)
export const lampTint = { color: new THREE.Color(1, 0.97, 0.92), power: 1 }

const TABLE_H = 0.9

/**
 * One photographed piece lying on the tray. The cut-out photo is relit live by the lamp
 * (pieceLight shader), with its own soft shadow beneath. When pointed at it lifts a
 * centimetre off the velvet, the way a jeweller raises a piece to show you.
 */
export function TrayItem({ piece, position, rotation, size, onOpen, y = TABLE_H, lamp = trayLamp }: { piece: TrayPiece; position: [number, number, number]; rotation: number; size: number; onOpen: (slug: string) => void; y?: number; lamp?: THREE.Vector3 }) {
  const m = useMaterials()
  const map = useTexture(`${mediaBase(piece.src)}-960.webp`)
  const group = useRef<THREE.Group>(null)
  const lift = useRef(0)
  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 8
  }, [map])
  const mat = useMemo(() => makePieceMaterial(map, piece.gold, m.colors), [map, piece.gold, m])
  const shadow = useMemo(() => makeShadowMaterial(map, m.colors), [map, m])
  useEffect(() => () => { mat.dispose(); shadow.dispose() }, [mat, shadow])
  const aspect = piece.width / piece.height
  const w = aspect >= 1 ? size : size * aspect
  const h = aspect >= 1 ? size / aspect : size

  useFrame(({ clock }, dt) => {
    const hovered = xp.get().hovered === piece.slug
    lift.current = THREE.MathUtils.damp(lift.current, hovered ? 1 : 0, 6, dt)
    if (group.current) group.current.position.y = y + 0.032 + lift.current * 0.03
    mat.uniforms.uFade.value = Math.min(1, clock.elapsedTime / 1.2)
    mat.uniforms.uLightPos.value.copy(lamp)
    mat.uniforms.uLightColor.value.copy(lampTint.color).multiplyScalar(lampTint.power)
    mat.uniforms.uSpecular.value = 1.1 + lift.current * 0.8
    shadow.uniforms.uOpacity.value = 0.5 - lift.current * 0.2
    shadow.uniforms.uBlur.value = 0.012 + lift.current * 0.02
  })

  const isControl = (e: ThreeEvent<PointerEvent | MouseEvent>) => Boolean((e.nativeEvent.target as HTMLElement | null)?.closest('a,button,input,select,textarea,label,[role=radio]'))

  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh material={shadow} position={[0, y + 0.0315, 0]} rotation={[-Math.PI / 2, 0, rotation]}>
        <planeGeometry args={[w * 1.1, h * 1.1]} />
      </mesh>
      <group ref={group} position={[0, y + 0.032, 0]}>
        <mesh
          material={mat}
          rotation={[-Math.PI / 2, 0, rotation]}
          onPointerOver={(e) => {
            if (isControl(e)) return
            e.stopPropagation()
            document.body.style.cursor = 'pointer'
            xp.set({ hovered: piece.slug })
          }}
          onPointerOut={() => {
            document.body.style.cursor = ''
            if (xp.get().hovered === piece.slug) xp.set({ hovered: null })
          }}
          onClick={(e) => {
            if (isControl(e)) return
            track('piece_picked_in_3d', { piece: piece.slug })
            onOpen(piece.slug)
          }}
        >
          <planeGeometry args={[w, h]} />
        </mesh>
      </group>
    </group>
  )
}
