'use client'

import { MeshTransmissionMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import { Plinth } from '../Hall'
import { useMaterials } from '../materials'
import { xp } from '../state'

/** A round brilliant built from its facet vertices (convex hull), the same geometry as the Blender model. */
export function brilliantGeometry(): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = []
  const ring = (r: number, y: number, n: number, off = 0) => {
    for (let i = 0; i < n; i++) {
      const a = (2 * Math.PI * (i + off)) / n
      pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)))
    }
  }
  ring(0.57, 0.162, 8)
  ring(0.79, 0.078, 8, 0.5)
  ring(1, 0.012, 16)
  ring(1, -0.012, 16)
  ring(0.8, -0.181, 8, 0.5)
  pts.push(new THREE.Vector3(0, -0.431, 0))
  const g = new ConvexGeometry(pts).toNonIndexed()
  g.computeVertexNormals()
  return g
}

/**
 * THE STONE ROOM: one brilliant the size of a fist, turning a full revolution as the
 * visitor scrolls through the section, splitting light into colour at its facets.
 * The words beside it say plainly what cubic zirconia is and isn't.
 */
export function StoneRoom({ tier, section }: { tier: 'high' | 'mid' | 'low'; section: number }) {
  const m = useMaterials()
  const stone = useRef<THREE.Mesh>(null)
  const geo = useMemo(() => brilliantGeometry(), [])
  useEffect(() => () => geo.dispose(), [geo])

  useFrame((_, dt) => {
    const s = stone.current
    if (!s) return
    const { progress, pointer } = xp.get()
    const local = THREE.MathUtils.clamp(progress - (section - 0.5), 0, 1.5)
    s.rotation.y = THREE.MathUtils.damp(s.rotation.y, local * Math.PI * 1.6 + pointer.x * 0.5, 3, dt)
    s.rotation.x = THREE.MathUtils.damp(s.rotation.x, 0.42 + pointer.y * 0.2, 3, dt)
    s.position.y = 1.12 + Math.sin(performance.now() / 1400) * 0.006
  })

  return (
    <group>
      <Plinth w={0.36} d={0.36} h={0.86} />
      {/* A silver cradle: three slim prongs the stone rests in */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <mesh key={i} material={m.silver} position={[Math.cos(a) * 0.045, 0.93, Math.sin(a) * 0.045]} rotation={[Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4]}>
            <cylinderGeometry args={[0.004, 0.006, 0.15, 12]} />
          </mesh>
        )
      })}
      <mesh ref={stone} geometry={geo} position={[0, 1.12, 0]} scale={0.14}>
        {tier === 'low' ? (
          <meshPhysicalMaterial color="white" roughness={0} ior={2.15} transmission={1} thickness={1} dispersion={0.6} envMapIntensity={2.5} />
        ) : (
          <MeshTransmissionMaterial
            backside
            backsideThickness={0.4}
            thickness={1.0}
            ior={2.15}
            chromaticAberration={0.35}
            anisotropicBlur={0.04}
            distortion={0}
            roughness={0}
            samples={tier === 'high' ? 12 : 6}
            resolution={tier === 'high' ? 1024 : 512}
            envMapIntensity={2.6}
          />
        )}
      </mesh>
    </group>
  )
}
