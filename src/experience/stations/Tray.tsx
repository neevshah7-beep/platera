'use client'

import { RoundedBox, useTexture } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mediaBase } from '@/components/media/PieceImage'
import { track } from '@/lib/analytics/client'
import { useMaterials } from '../materials'
import { makePieceMaterial, makeShadowMaterial } from '../shaders/pieceLight'
import { stationOrigin } from '../layout'
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

/**
 * THE TRAY: a marble table with a velvet-lined tray, six pieces laid as a hand would set
 * them down. Scrolling slides the lamp across, so each piece catches the light in turn.
 */
export function Tray({ pieces, section, onOpen }: { pieces: TrayPiece[]; section: number; onOpen: (slug: string) => void }) {
  const m = useMaterials()
  const layout: [number, number, number, number][] = [
    [-0.42, -0.12, -0.12, 0.34],
    [0.0, -0.16, 0.08, 0.3],
    [0.42, -0.1, -0.06, 0.32],
    [-0.36, 0.2, 0.1, 0.28],
    [0.06, 0.22, -0.05, 0.26],
    [0.44, 0.2, 0.14, 0.28],
  ]
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const { progress, pointer, hovered } = xp.get()
    const local = THREE.MathUtils.clamp(progress - (section - 0.6), 0, 1.2) / 1.2
    const i = hovered ? pieces.findIndex((p) => p.slug === hovered) : -1
    if (i >= 0 && i < layout.length) target.set(layout[i][0], TABLE_H + 0.42, layout[i][1] + 0.12)
    else target.set(THREE.MathUtils.lerp(-0.7, 0.7, local) + pointer.x * 0.2, TABLE_H + 0.55, 0.1 - pointer.y * 0.15)
    target.z += stationOrigin(section)[2]
    trayLamp.lerp(target, 0.07)
  })

  return (
    <group>
      {/* Marble table */}
      <mesh material={m.marble} position={[0, TABLE_H / 2 - 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.25, TABLE_H - 0.04, 0.62]} />
      </mesh>
      <RoundedBox args={[1.5, 0.04, 0.82]} radius={0.01} smoothness={4} position={[0, TABLE_H, 0]} material={m.marble} castShadow receiveShadow />
      {/* Velvet tray with a thin gold rim */}
      <mesh material={m.velvet} position={[0, TABLE_H + 0.026, 0]} receiveShadow>
        <boxGeometry args={[1.36, 0.012, 0.7]} />
      </mesh>
      {[
        [0, 0.35, 1.37, 0],
        [0, -0.35, 1.37, 0],
        [0.68, 0, 0.71, Math.PI / 2],
        [-0.68, 0, 0.71, Math.PI / 2],
      ].map(([x, z, len, rot], i) => (
        <mesh key={i} material={m.gold} position={[x, TABLE_H + 0.034, z]} rotation={[0, rot, 0]}>
          <boxGeometry args={[len, 0.014, 0.008]} />
        </mesh>
      ))}
      <pointLight position={trayLamp} intensity={0} />
      <Suspense fallback={null}>
        {pieces.slice(0, 6).map((p, i) => (
          <TrayItem key={p.slug} piece={p} position={[layout[i][0], 0, layout[i][1]]} rotation={layout[i][2]} size={layout[i][3]} onOpen={onOpen} />
        ))}
      </Suspense>
    </group>
  )
}
