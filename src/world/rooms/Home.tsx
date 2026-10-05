'use client'

import { ContactShadows } from '@react-three/drei'
import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useMaterials } from '../materials/library'
import { reflective } from '../post/layers'
import { ANCHORS, registry, type Pose } from '../registry'
import type { HomeData } from '../state'
import { tierName, useTier } from '../tier'
import { Emblem } from './Arrival'

/**
 * THE HOME SEQUENCE: Threshold → Plinth → … is built from T7 onward. Until then the hero
 * ring stands on a polished obsidian plinth with a velvet pad, the subject the render
 * pipeline (T2) is judged on: metal for bloom, a mirror top for SSR, depth for DOF.
 */
export function HomeRoom({ data }: { data: HomeData }) {
  const m = useMaterials()
  const tier = tierName(useTier())
  const anchor = useMemo(() => new THREE.Vector3(...ANCHORS.home), [])
  const pose = useMemo(
    () => (progress: number, aspect: number, out: Pose) => {
      const a = 0.55 + progress * 0.6
      const r = aspect < 0.8 ? 1.7 : 1.05
      out.target.set(anchor.x, anchor.y + 1.0, anchor.z)
      out.position.set(anchor.x + Math.sin(a) * r, anchor.y + 1.22, anchor.z + Math.cos(a) * r)
      out.fov = aspect < 0.8 ? 40 : 30
      out.focus = r
    },
    [anchor],
  )
  useEffect(() => registry.register({ key: 'home', anchor, pose }), [anchor, pose])
  void data
  const H = 0.92
  return (
    <group position={ANCHORS.home}>
      <mesh material={m.obsidianHoned} position={[0, H / 2 - 0.01, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, H - 0.02, 0.6]} />
      </mesh>
      <mesh ref={(o) => reflective(o, 'polish')} material={m.obsidian} position={[0, H - 0.01, 0]} receiveShadow>
        <boxGeometry args={[0.62, 0.02, 0.62]} />
      </mesh>
      <mesh ref={(o) => reflective(o, 'velvet')} material={m.velvet} position={[0, H + 0.004, 0.02]} receiveShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.008, 96]} />
      </mesh>
      <mesh ref={(o) => reflective(o, 'polish')} material={m.obsidian} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
      </mesh>
      <Suspense fallback={null}>
        <group position={[0, H + 0.008, 0.02]}>
          <Emblem tier={tier} />
        </group>
      </Suspense>
      <ContactShadows position={[0, H + 0.0085, 0.02]} scale={0.4} blur={2.4} opacity={0.6} far={0.2} resolution={512} />
      <spotLight position={[-0.9, 2.2, 0.8]} angle={0.4} penumbra={0.9} intensity={18} distance={6} castShadow color="#fff1dc" />
      <spotLight position={[0.6, 1.9, -1.1]} angle={0.5} penumbra={1} intensity={10} distance={5} color="#dfe8ff" />
    </group>
  )
}
