'use client'

import { useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { ANCHORS, registry, type Pose } from '../registry'
import { xp } from '../state'
import { tierName, useTier } from '../tier'
import { Arrival } from './Arrival'
import { Cove } from './Cove'

/**
 * The quiet room, behind the pages that are mostly reading (policies, checkout, bag):
 * the emblem on its plinth in a cove, far back and slowly circled, so the world is
 * present without competing with the form in front of it.
 */
export function QuietRoom() {
  const tier = tierName(useTier())
  const anchor = useMemo(() => new THREE.Vector3(...ANCHORS.quiet), [])
  const pose = useMemo(
    () => (progress: number, aspect: number, out: Pose) => {
      const a = 0.6 + progress * 0.4
      out.target.set(anchor.x, anchor.y + 1.0, anchor.z)
      out.position.set(anchor.x + Math.sin(a) * 2.6, anchor.y + 1.5, anchor.z + Math.cos(a) * 2.6)
      out.fov = aspect < 0.8 ? 44 : 30
      out.focus = 2.6
    },
    [anchor],
  )
  useEffect(() => registry.register({ key: 'quiet', anchor, pose }), [anchor, pose])
  useFrame(() => void xp)
  return (
    <group position={ANCHORS.quiet}>
      <Cove />
      <Suspense fallback={null}>
        <Arrival tier={tier} />
      </Suspense>
    </group>
  )
}
