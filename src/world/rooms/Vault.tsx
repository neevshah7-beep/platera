'use client'

import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { stationOrigin } from '../layout'
import { useMaterials } from '../materials/library'
import { xp, type TrayPiece } from '../state'
import { TrayItem } from './Tray'

const H = 0.86
const DRAWER_D = 0.56

/**
 * THE VAULT DRAWER: a marble cabinet with a brass-handled drawer. As the visitor scrolls,
 * the drawer slides out on its runners and the pieces kept back from the tray come into
 * the light, each in its own velvet compartment, the way a jeweller opens the drawer
 * under the counter for a customer who has asked to see more.
 */
export function Vault({ pieces, section, onOpen }: { pieces: TrayPiece[]; section: number; onOpen: (slug: string) => void }) {
  const m = useMaterials()
  const drawer = useRef<THREE.Group>(null)
  const lamp = useMemo(() => new THREE.Vector3(), [])
  const shown = pieces.slice(0, 6)

  useFrame((_, dt) => {
    const { progress, pointer } = xp.get()
    const open = THREE.MathUtils.smoothstep(progress - (section - 0.75), 0, 0.65)
    if (drawer.current) drawer.current.position.z = THREE.MathUtils.damp(drawer.current.position.z, open * 0.46, 7, dt)
    lamp.set(pointer.x * 0.5, H + 0.6, stationOrigin(section)[2] + 0.45 - pointer.y * 0.15)
  })

  return (
    <group>
      {/* Cabinet carcass */}
      <mesh material={m.marble} position={[0, H / 2 - 0.06, -0.06]} castShadow receiveShadow>
        <boxGeometry args={[1.0, H - 0.12, 0.56]} />
      </mesh>
      <RoundedBox args={[1.1, 0.04, 0.66]} radius={0.01} smoothness={4} position={[0, H - 0.02, -0.06]} material={m.marble} castShadow receiveShadow />
      {/* The drawer: velvet-lined, six compartments divided by thin brass strips */}
      <group ref={drawer}>
        <mesh material={m.marble} position={[0, H - 0.12, 0.22]} castShadow>
          <boxGeometry args={[0.96, 0.1, 0.02]} />
        </mesh>
        <mesh material={m.brass} position={[0, H - 0.12, 0.24]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.16, 16]} />
        </mesh>
        <group position={[0, H - 0.16, 0.21 - DRAWER_D / 2]}>
          <mesh material={m.velvet} receiveShadow>
            <boxGeometry args={[0.92, 0.012, DRAWER_D - 0.02]} />
          </mesh>
          {[-0.153, 0.153].map((x) => (
            <mesh key={x} material={m.brass} position={[x, 0.014, 0]}>
              <boxGeometry args={[0.004, 0.02, DRAWER_D - 0.02]} />
            </mesh>
          ))}
          <mesh material={m.brass} position={[0, 0.014, 0]}>
            <boxGeometry args={[0.92, 0.02, 0.004]} />
          </mesh>
          <Suspense fallback={null}>
            {shown.map((p, i) => (
              <TrayItem
                key={p.slug}
                piece={p}
                position={[((i % 3) - 1) * 0.306, 0, (Math.floor(i / 3) - 0.5) * 0.27]}
                rotation={(i % 2 ? -1 : 1) * 0.06}
                size={0.21}
                y={-0.026}
                lamp={lamp}
                onOpen={onOpen}
              />
            ))}
          </Suspense>
        </group>
      </group>
    </group>
  )
}
