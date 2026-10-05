'use client'

import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { ANCHORS, registry, type Pose } from '../registry'
import type { HomeData } from '../state'
import { tierName, useTier } from '../tier'
import { Arrival } from './Arrival'

/**
 * THE HOME SEQUENCE: Threshold → Plinth → … (built in T7/T8 onward). Until then the
 * hero piece stands alone in the dark so the pipeline (T2) has a subject.
 */
export function HomeRoom({ data }: { data: HomeData }) {
  const tier = tierName(useTier())
  const anchor = useMemo(() => new THREE.Vector3(...ANCHORS.home), [])
  const pose = useMemo(
    () => (progress: number, aspect: number, out: Pose) => {
      const a = 0.5 + progress * 0.6
      const r = aspect < 0.8 ? 1.9 : 1.25
      out.target.set(anchor.x, anchor.y + 0.12, anchor.z)
      out.position.set(anchor.x + Math.sin(a) * r, anchor.y + 0.38, anchor.z + Math.cos(a) * r)
      out.fov = aspect < 0.8 ? 40 : 30
      out.focus = r
    },
    [anchor],
  )
  useEffect(() => registry.register({ key: 'home', anchor, pose }), [anchor, pose])
  void data
  return (
    <group position={ANCHORS.home}>
      <Suspense fallback={null}>
        <group position={[0, -0.92, 0]}>
          <Arrival tier={tier} />
        </group>
      </Suspense>
    </group>
  )
}
