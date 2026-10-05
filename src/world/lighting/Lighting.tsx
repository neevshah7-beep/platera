'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { STATIONS, stationOrigin } from '../layout'
import { useMaterials } from '../materials/library'
import { xp, type Mood } from '../state'
import { lampTint } from '../rooms/Tray'

function token(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return new THREE.Color(v || fallback)
}

type Look = { key: THREE.Color; fill: THREE.Color; keyPower: number; fillPower: number; env: number; flame: number }

/**
 * LIGHT MOODS: the whole hall relit for an occasion. Each mood is a key light colour and
 * strength, a fill from below, how much the studio HDRI contributes, and (for the diya)
 * a flickering flame near whatever the visitor is looking at. Colours are the
 * --mood-* tokens in globals.css; every change is eased, never cut.
 */
export function Lighting({ tier, reduced }: { tier: 'high' | 'mid' | 'low'; reduced: boolean }) {
  const m = useMaterials()
  const scene = useThree((s) => s.scene)
  const key = useRef<THREE.SpotLight>(null)
  const fill = useRef<THREE.HemisphereLight>(null)
  const flame = useRef<THREE.PointLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])

  const looks = useMemo<Record<Mood, Look>>(() => {
    const lamp = m.colors.lamp
    return {
      studio: { key: lamp, fill: m.colors.ground, keyPower: 26, fillPower: 0.55, env: 1, flame: 0 },
      daylight: { key: token('--mood-daylight', '#f4f7ff'), fill: token('--mood-daylight', '#f4f7ff'), keyPower: 30, fillPower: 0.85, env: 1.25, flame: 0 },
      diya: { key: token('--mood-diya', '#ffb25e'), fill: token('--mood-diya', '#ffb25e'), keyPower: 7, fillPower: 0.12, env: 0.28, flame: 1 },
      evening: { key: token('--mood-evening', '#ffd9b8'), fill: m.colors.shadowInk, keyPower: 18, fillPower: 0.3, env: 0.55, flame: 0 },
      mandap: { key: token('--mood-mandap', '#ffc36b'), fill: token('--mood-mandap-rose', '#ff8a7a'), keyPower: 22, fillPower: 0.45, env: 0.7, flame: 0.4 },
    }
  }, [m])

  const cur = useRef({ key: new THREE.Color(), fill: new THREE.Color(), keyPower: 26, fillPower: 0.55, env: 1, flame: 0, init: false })

  useFrame(({ clock, camera }, dt) => {
    const { mood, progress } = xp.get()
    const goal = looks[mood]
    const c = cur.current
    if (!c.init) {
      c.key.copy(goal.key)
      c.fill.copy(goal.fill)
      c.init = true
    }
    const k = 1 - Math.exp(-dt * 2.2)
    c.key.lerp(goal.key, k)
    c.fill.lerp(goal.fill, k)
    c.keyPower = THREE.MathUtils.lerp(c.keyPower, goal.keyPower, k)
    c.fillPower = THREE.MathUtils.lerp(c.fillPower, goal.fillPower, k)
    c.env = THREE.MathUtils.lerp(c.env, goal.env, k)
    c.flame = THREE.MathUtils.lerp(c.flame, goal.flame, k)

    // The key light hangs over the station being looked at, and travels with the walk.
    const i = THREE.MathUtils.clamp(Math.round(progress), 0, STATIONS.length - 1)
    const z = stationOrigin(i)[2]
    const z0 = THREE.MathUtils.lerp(stationOrigin(Math.floor(progress))[2], stationOrigin(Math.ceil(progress))[2], progress % 1)
    target.position.set(0, 1, z0)
    if (key.current) {
      key.current.position.set(0.9, 3.4, z0 + 1.1)
      key.current.color.copy(c.key)
      key.current.intensity = c.keyPower
    }
    if (fill.current) {
      fill.current.color.copy(c.fill)
      fill.current.groundColor.copy(m.colors.raised)
      fill.current.intensity = c.fillPower
    }
    if (flame.current) {
      const t = clock.elapsedTime
      const flicker = reduced ? 1 : 0.85 + Math.sin(t * 11) * 0.06 + Math.sin(t * 23.7) * 0.05 + Math.sin(t * 5.3) * 0.04
      flame.current.intensity = c.flame * 2.4 * flicker
      flame.current.color.copy(looks.diya.key)
      flame.current.position.set(-0.35, 1.05, z + 0.35)
    }
    lampTint.color.copy(c.key)
    lampTint.power = THREE.MathUtils.clamp(c.keyPower / 26, 0.35, 1.2)
    scene.environmentIntensity = c.env
    // A little of the camera's height in the fog colour keeps the far hall soft.
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(m.colors.ground).multiplyScalar(0.55 + c.env * 0.45)
    if (scene.background instanceof THREE.Color) scene.background.copy(m.colors.ground).multiplyScalar(0.55 + c.env * 0.45)
    void camera
  })

  return (
    <>
      <hemisphereLight ref={fill} intensity={0.55} />
      <primitive object={target} />
      <spotLight
        ref={key}
        target={target}
        angle={0.55}
        penumbra={0.9}
        distance={9}
        decay={1.8}
        castShadow={tier !== 'low'}
        shadow-mapSize={tier === 'high' ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <pointLight ref={flame} intensity={0} distance={2.4} decay={2} />
    </>
  )
}
