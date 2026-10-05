'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { rig } from '../camera/rig'
import { xp } from '../state'
import { useTier } from '../tier'
import { Pipeline, TIER_PASSES, type PassFlags } from './Pipeline'

/** Development panel: every pass individually toggleable (protocol T2). */
function DevToggles({ pipe }: { pipe: Pipeline }) {
  const tier = useTier()
  const flags = useControls('post · passes', { ...TIER_PASSES[tier] }, [tier])
  useEffect(() => {
    Object.assign(pipe.flags, flags as PassFlags)
  }, [flags, pipe])
  return null
}

/**
 * Mounts the render pipeline into the canvas and takes over rendering (useFrame priority 1
 * stops R3F's own render). The pipeline lives as long as the renderer does.
 */
export function Post() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const tier = useTier()
  const pipe = useMemo(() => new Pipeline(gl, scene, camera, xp.get().tier), [gl, scene, camera])
  useEffect(() => () => pipe.dispose(), [pipe])
  useEffect(() => {
    const v = gl.getDrawingBufferSize(new THREE.Vector2())
    pipe.setSize(v.x, v.y)
  }, [gl, pipe, size, dpr])
  useEffect(() => pipe.setTier(tier), [pipe, tier])

  // Verification handle (development): toggle passes from the T-scripts.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const w = window as unknown as { __world?: Record<string, unknown> }
    w.__world = { ...(w.__world ?? {}), post: { flags: pipe.flags, set: (patch: Partial<PassFlags>) => Object.assign(pipe.flags, patch) } }
  }, [pipe])

  useFrame((state, dt) => {
    const s = xp.get()
    pipe.render(dt, state.clock.elapsedTime, s.velocity, rig.speed, rig.focus)
  }, 1)

  return process.env.NODE_ENV !== 'production' ? <DevToggles pipe={pipe} /> : null
}
