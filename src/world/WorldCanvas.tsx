'use client'

import { Environment, Stats } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Director } from './camera/Director'
import { registry } from './registry'
import { Rooms } from './Rooms'
import { xp } from './state'
import { guessTier, TIER } from './tier'

/** Raises `ready` once the first frame with content has been drawn. */
function Ready() {
  const done = useRef(false)
  useFrame(() => {
    if (done.current || !registry.get(xp.get().room.key)) return
    done.current = true
    requestAnimationFrame(() => xp.set({ ready: true }))
  })
  return null
}

/** Verification handle (development only): read the live camera from the T-scripts. */
function DebugHandle() {
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const w = window as unknown as { __world?: Record<string, unknown> }
    w.__world = { ...(w.__world ?? {}), camera: () => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z, room: xp.get().room.key }) }
  }, [camera])
  return null
}

/**
 * THE ONE CANVAS (Experience Bible §1–2). Created once per session by WorldProvider in
 * the shop layout and never unmounted: one WebGL2 renderer, one scene, one camera.
 * Renderer per §2: no MSAA (TAA resolves edges), high-performance GPU, ACES filmic at
 * exposure 1.1, sRGB output, VSM shadows.
 */
export default function WorldCanvas() {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.5])
  const [stats, setStats] = useState(false)
  useEffect(() => {
    setStats(process.env.NODE_ENV !== 'production' || new URLSearchParams(location.search).has('stats'))
  }, [])

  return (
    <Canvas
      aria-hidden
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      dpr={dpr}
      shadows={{ type: THREE.VSMShadowMap }}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false, logarithmicDepthBuffer: false }}
      camera={{ fov: 34, near: 0.02, far: 120, position: [0.55, 1.18, 1.25] }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
      onCreated={({ gl, scene }) => {
        registry.rendererCreated()
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
        gl.outputColorSpace = THREE.SRGBColorSpace
        const tier = guessTier(gl.getContext() as WebGL2RenderingContext)
        xp.set({ tier })
        setDpr(TIER.dpr[tier])
        const ground = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--ground').trim() || '#f4efe7')
        scene.background = ground
        scene.fog = new THREE.Fog(ground, 9, 26)
      }}
    >
      {stats && <Stats className="world-stats" />}
      <Environment files="/hdri/studio_small_09_1k.hdr" environmentIntensity={1} />
      <hemisphereLight intensity={0.5} />
      <Director />
      <Rooms />
      <Ready />
      <DebugHandle />
    </Canvas>
  )
}
