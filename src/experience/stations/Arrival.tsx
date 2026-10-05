'use client'

import { ContactShadows, MeshTransmissionMaterial, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { JEWEL_SCALE } from '../layout'
import { useMaterials } from '../materials'
import { Plinth } from '../Hall'
import { xp } from '../state'

const URL = '/models/emblem.glb'
useGLTF.preload(URL, '/draco/')

type Nodes = Record<string, THREE.Mesh>

/**
 * The Platera emblem, modelled in Blender (scripts/blender/build_hero.py), standing on a
 * marble plinth at ten times life size. It never spins: the light moves, and the
 * visitor's pointer moves the camera a little around it.
 */
export function Emblem({ tier, stoneDetail = 'full' }: { tier: 'high' | 'mid' | 'low'; stoneDetail?: 'full' | 'simple' }) {
  const { nodes } = useGLTF(URL, '/draco/') as unknown as { nodes: Nodes }
  const m = useMaterials()

  // The model's lowest point sits exactly on whatever it is placed on.
  const offset = useMemo(() => {
    const box = new THREE.Box3()
    for (const n of ['Band', 'GoldRim', 'Claws', 'Gallery', 'Pave', 'Prongs', 'CenterStone']) {
      const node = nodes[n]
      if (!node) continue
      node.updateWorldMatrix(true, false)
      box.expandByObject(node)
    }
    return -box.min.y
  }, [nodes])

  const part = (name: string, material: THREE.Material) => {
    const n = nodes[name]
    return n ? <mesh key={name} geometry={n.geometry} position={n.position} quaternion={n.quaternion} scale={n.scale} material={material} castShadow /> : null
  }
  const stone = nodes.CenterStone

  return (
    <group scale={JEWEL_SCALE} position={[0, offset * JEWEL_SCALE, 0]}>
      <group position={[0, 0, 0]}>
        {part('Band', m.silver)}
        {part('Claws', m.silver)}
        {part('Gallery', m.silver)}
        {part('Prongs', m.silver)}
        {part('GoldRim', m.gold)}
        {part('Pave', m.pave)}
        {stone && (
          <mesh geometry={stone.geometry} position={stone.position} quaternion={stone.quaternion} scale={stone.scale}>
            {tier === 'low' || stoneDetail === 'simple' ? (
              <meshPhysicalMaterial color="white" roughness={0} ior={2.15} transmission={1} thickness={0.5} dispersion={0.5} envMapIntensity={2.5} />
            ) : (
              <MeshTransmissionMaterial
                backside
                backsideThickness={0.3}
                thickness={0.6}
                ior={2.15}
                chromaticAberration={0.08}
                anisotropicBlur={0.05}
                distortion={0}
                roughness={0}
                samples={tier === 'high' ? 10 : 6}
                resolution={tier === 'high' ? 1024 : 512}
                envMapIntensity={2.2}
              />
            )}
          </mesh>
        )}
      </group>
    </group>
  )
}

export function Arrival({ tier }: { tier: 'high' | 'mid' | 'low' }) {
  const ring = useRef<THREE.Group>(null)
  const PLINTH = 0.92
  // A breath, not a spin: the ring settles a millimetre, as if on a soft pad.
  useFrame(({ clock }) => {
    if (ring.current && xp.get().progress < 1.2) ring.current.position.y = PLINTH + Math.sin(clock.elapsedTime * 0.7) * 0.0012
  })
  return (
    <group>
      <Plinth w={0.42} d={0.42} h={PLINTH} />
      <group ref={ring} position={[0, PLINTH, 0]}>
        <Emblem tier={tier} />
      </group>
      <ContactShadows position={[0, PLINTH + 0.001, 0]} scale={0.5} blur={2.2} opacity={0.45} far={0.3} resolution={512} frames={tier === 'low' ? 1 : Infinity} />
    </group>
  )
}
