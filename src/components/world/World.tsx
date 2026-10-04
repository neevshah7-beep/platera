'use client'

import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRouter } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { readPalette, type WorldPalette } from './palette'
import { lamp, lampColor, lampPower } from './PiecePlane'
import { HomeScene, homePoses, type Pose } from './scenes/HomeScene'
import { LampScene, lampPoses } from './scenes/LampScene'
import { RoomScene, roomPoses } from './scenes/RoomScene'
import { useWorld, world, type Station } from './store'

type Tier = 'high' | 'mid' | 'low'

function detectTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency ?? 4
  const memory = nav.deviceMemory ?? 4
  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (memory <= 3 || cores <= 4) return 'low'
  if (!coarse && cores >= 8 && memory >= 8) return 'high'
  return 'mid'
}

function posesFor(station: Station, wide: boolean): Pose[] {
  if (station.kind === 'home') return homePoses(station.alcoves.length)
  if (station.kind === 'room') return roomPoses(station.pieces.length)
  if (station.kind === 'lamp') return lampPoses(wide)
  return [{ pos: [0, 1.6, 3], look: [0, 1.2, 0] }]
}

const ease = (t: number) => t * t * (3 - 2 * t)

/**
 * CAMERA RIG. The camera follows the page's scroll value through the station's poses
 * (pose i at scroll i), eased between them and damped so it glides rather than jumps.
 * The pointer adds a small parallax: the camera moves, never the pieces.
 */
function CameraRig({ station, reduced }: { station: Station; reduced: boolean }) {
  const { camera, size } = useThree()
  const wide = size.width >= 1024
  const poses = useMemo(() => posesFor(station, wide), [station, wide])
  const pos = useMemo(() => new THREE.Vector3(...poses[0].pos), [poses])
  const look = useMemo(() => new THREE.Vector3(...poses[0].look), [poses])
  const curLook = useRef(new THREE.Vector3(...poses[0].look))
  const first = useRef(true)

  useEffect(() => {
    // A new station starts from its first pose: the transition wipe covers the cut.
    camera.position.set(...poses[0].pos)
    curLook.current.set(...poses[0].look)
    first.current = true
  }, [poses, camera])

  useFrame((_, dt) => {
    const { scroll, pointer } = world.get()
    const s = Math.min(poses.length - 1, Math.max(0, scroll))
    const i = Math.min(poses.length - 2, Math.floor(s))
    const a = poses[Math.max(0, i)]
    const b = poses[Math.min(poses.length - 1, i + 1)]
    const t = poses.length > 1 ? ease(s - Math.max(0, i)) : 0
    pos.set(a.pos[0] + (b.pos[0] - a.pos[0]) * t, a.pos[1] + (b.pos[1] - a.pos[1]) * t, a.pos[2] + (b.pos[2] - a.pos[2]) * t)
    look.set(a.look[0] + (b.look[0] - a.look[0]) * t, a.look[1] + (b.look[1] - a.look[1]) * t, a.look[2] + (b.look[2] - a.look[2]) * t)
    if (!reduced) {
      pos.x += pointer.x * 0.06
      pos.y += pointer.y * 0.035
    }
    const k = first.current || reduced ? 1 : 1 - Math.exp(-dt * 3.2)
    camera.position.lerp(pos, k)
    curLook.current.lerp(look, k)
    camera.lookAt(curLook.current)
    first.current = false
  })
  return null
}

/**
 * STUDIO. Jewellery is lit, not coloured: a large soft box overhead, two tall strips
 * either side (the long highlights on a band), a warm low kicker for the gold.
 * The environment turns very slowly so reflections travel across the metal.
 */
function Studio({ p, reduced }: { p: WorldPalette; reduced: boolean }) {
  const scene = useThree((s) => s.scene)
  useFrame((_, dt) => {
    if (!reduced) scene.environmentRotation.y += dt * 0.05
  })
  return (
    <>
      <Environment resolution={256} frames={1} background={false}>
        <Lightformer form="rect" intensity={3.2} color={p.lamp} position={[0, 5, -1]} rotation-x={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={2.2} color={p.lamp} position={[-4, 2, 1]} rotation-y={Math.PI / 2} scale={[0.6, 6, 1]} />
        <Lightformer form="rect" intensity={2.2} color={p.lamp} position={[4, 2, -1]} rotation-y={-Math.PI / 2} scale={[0.6, 6, 1]} />
        <Lightformer form="ring" intensity={1.4} color={p.gold} position={[2, -1, 4]} scale={2} />
        <Lightformer form="rect" intensity={0.6} color={p.velvetSheen} position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
        {/* A soft surround: polished silver needs a graded room to reflect, or it reads black. */}
        <Lightformer form="ring" intensity={0.55} color={p.ivory} position={[0, 0.5, -6]} scale={12} />
        <Lightformer form="rect" intensity={0.9} color={p.ivory} position={[0, 1, 6]} scale={[10, 4, 1]} />
      </Environment>
      <ambientLight intensity={0.12} color={p.velvetSheen} />
    </>
  )
}

/**
 * LIGHT MOODS. The same piece under the light of the occasion it's bought for.
 * Each mood sets the lamp's colour and strength and how much of the studio's
 * reflected light remains; changes are eased over about a second, like a dimmer.
 * The diya flickers, gently, the way a flame breathes.
 */
const MOODS = {
  studio: { color: 'lamp', power: 1, env: 1 },
  daylight: { color: 'moodDaylight', power: 1.25, env: 1.35 },
  diya: { color: 'moodDiya', power: 0.8, env: 0.32 },
  evening: { color: 'moodEvening', power: 0.95, env: 0.65 },
  mandap: { color: 'moodMandap', power: 1.1, env: 0.75 },
} as const

function MoodController({ p }: { p: WorldPalette }) {
  const scene = useThree((s) => s.scene)
  const rose = useRef<THREE.PointLight>(null)
  useFrame(({ clock }, dt) => {
    const { mood } = world.get()
    const m = MOODS[mood]
    const k = 1 - Math.exp(-dt * 2.5)
    lampColor.lerp(p[m.color], k)
    const flicker = mood === 'diya' ? 1 + Math.sin(clock.elapsedTime * 9.1) * 0.035 + Math.sin(clock.elapsedTime * 23.7) * 0.02 : 1
    lampPower.value += (m.power * flicker - lampPower.value) * k
    scene.environmentIntensity += (m.env - scene.environmentIntensity) * k
    if (rose.current) rose.current.intensity += ((mood === 'mandap' ? 2.2 : 0) - rose.current.intensity) * k
  })
  // Under a mandap there is always a second, rosier light from the canopy.
  return <pointLight ref={rose} position={[-1.2, 0.6, 1.2]} color={p.moodMandapRose} intensity={0} distance={5} decay={1.5} />
}

/** A real light at the lamp's position, so the velvet and stone respond as the photos do. */
function LampLight({ p, tier }: { p: WorldPalette; tier: Tier }) {
  const light = useRef<THREE.SpotLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    if (!light.current) return
    light.current.position.copy(lamp)
    light.current.color.copy(lampColor)
    light.current.intensity = 9 * lampPower.value
    target.position.set(lamp.x, 0, lamp.z - 0.2)
    target.updateMatrixWorld()
  })
  return (
    <>
      <primitive object={target} />
      <spotLight
        ref={light}
        target={target}
        color={p.lamp}
        intensity={9}
        angle={0.62}
        penumbra={0.85}
        distance={7}
        decay={1.6}
        castShadow={tier === 'high'}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
    </>
  )
}

function Ready() {
  const done = useRef(false)
  useFrame(() => {
    if (!done.current) {
      done.current = true
      requestAnimationFrame(() => world.set({ ready: true }))
    }
  })
  return null
}

export default function World() {
  const station = useWorld((s) => s.station)
  const router = useRouter()
  const [tier, setTier] = useState<Tier>('mid')
  const [palette, setPalette] = useState<WorldPalette | null>(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const t = detectTier()
    setTier(t)
    world.set({ tier: t })
    setPalette(readPalette())
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)

    const onMove = (e: PointerEvent) => {
      world.mutate({ pointer: { x: (e.clientX / window.innerWidth) * 2 - 1, y: -((e.clientY / window.innerHeight) * 2 - 1) } })
    }
    // On phones, tilting the device moves the light too.
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      world.mutate({ pointer: { x: Math.max(-1, Math.min(1, e.gamma / 30)), y: Math.max(-1, Math.min(1, (45 - e.beta) / 30)) } })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('deviceorientation', onTilt, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('deviceorientation', onTilt)
    }
  }, [])

  const onSelect = useCallback((slug: string) => router.push(`/piece/${slug}`), [router])

  if (!palette) return null
  const dpr: [number, number] = tier === 'high' ? [1, 2] : tier === 'mid' ? [1, 1.5] : [1, 1]

  return (
    <Canvas
      aria-hidden
      className="!fixed inset-0 -z-0"
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      dpr={dpr}
      shadows={tier === 'high' ? 'percentage' : false}
      // Quiet pages (policies, checkout) draw one frame and stop: no battery spent on an empty room.
      frameloop={reduced || station.kind === 'quiet' ? 'demand' : 'always'}
      gl={{ antialias: tier !== 'low', powerPreference: 'high-performance', alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: 38, near: 0.05, far: 80, position: [0, 1.5, 3.3] }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
      onCreated={({ scene }) => {
        scene.background = palette.velvet.clone()
        scene.fog = new THREE.Fog(palette.velvet, 6, 22)
      }}
    >
      <PerformanceMonitor onDecline={() => tier !== 'low' && (setTier((t) => (t === 'high' ? 'mid' : 'low')), world.set({ tier: tier === 'high' ? 'mid' : 'low' }))} />
      <AdaptiveDpr pixelated={false} />
      <Studio p={palette} reduced={reduced} />
      <LampLight p={palette} tier={tier} />
      <MoodController p={palette} />
      <CameraRig station={station} reduced={reduced} />
      <Suspense fallback={null}>
        {station.kind === 'home' && <HomeScene p={palette} tier={tier} alcoves={station.alcoves} onSelect={onSelect} />}
        {station.kind === 'room' && <RoomScene key={station.key} p={palette} tier={tier} pieces={station.pieces} onSelect={onSelect} />}
        {station.kind === 'lamp' && <LampScene key={station.piece.slug} p={palette} tier={tier} piece={station.piece} weight={station.weight} />}
        {/* Inside the Suspense boundary: mounts only after this station's textures have loaded. */}
        <Ready key={JSON.stringify(station)} />
      </Suspense>
    </Canvas>
  )
}
