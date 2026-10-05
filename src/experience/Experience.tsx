'use client'

import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, N8AO, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { useRouter } from 'next/navigation'
import { ToneMappingMode } from 'postprocessing'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Festival, type FestivalKey } from './Festival'
import { Hall } from './Hall'
import { STATIONS, stationOrigin } from './layout'
import { Lighting } from './Lighting'
import { useMaterials } from './materials'
import { xp, type TrayPiece } from './state'
import { Arrival } from './stations/Arrival'
import { Counter } from './stations/Counter'
import { GiftBox } from './stations/GiftBox'
import { Hallmark } from './stations/Hallmark'
import { Neck } from './stations/Neck'
import { StoneRoom } from './stations/StoneRoom'
import { Tray } from './stations/Tray'
import { Vault } from './stations/Vault'
import { Weighing } from './stations/Weighing'

type Tier = 'high' | 'mid' | 'low'

export type ExperienceData = {
  tray: TrayPiece[]
  vault: TrayPiece[]
  weighed: { piece: TrayPiece; weight: string | null } | null
  neck: TrayPiece | null
  festival: FestivalKey
}

const idx = (id: (typeof STATIONS)[number]['id']) => STATIONS.findIndex((s) => s.id === id)

function detectTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency ?? 4
  const memory = nav.deviceMemory ?? 4
  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (memory <= 2 || cores <= 2) return 'low'
  if (!coarse && cores >= 8 && memory >= 8) return 'high'
  return 'mid'
}

const smoother = (e0: number, e1: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * The camera walks the hall. Between two stations it rises a little and glides (a crane
 * move, not a dolly), then dwells at each station while its text is read. The pointer
 * (or the phone's tilt) moves it a few centimetres, enough to feel the depth.
 */
function CameraRig({ reduced }: { reduced: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const smooth = useRef(0)
  const look = useMemo(() => new THREE.Vector3(), [])
  const a = useMemo(() => new THREE.Vector3(), [])
  const b = useMemo(() => new THREE.Vector3(), [])
  const la = useMemo(() => new THREE.Vector3(), [])
  const lb = useMemo(() => new THREE.Vector3(), [])
  const sway = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const portrait = size.width / size.height < 0.8
    camera.fov = portrait ? 46 : 34
    camera.updateProjectionMatrix()
  }, [camera, size])

  useFrame((_, dt) => {
    const { progress, pointer } = xp.get()
    smooth.current = reduced ? progress : THREE.MathUtils.damp(smooth.current, progress, 3.2, Math.min(dt, 0.05))
    const s = smooth.current
    const i = Math.floor(s)
    const j = Math.min(i + 1, STATIONS.length - 1)
    const e = smoother(0.22, 0.78, s - i)
    // Phones are portrait: stand further back so the object fits the narrow frame.
    const back = size.width / size.height < 0.8 ? 1.55 : 1
    const pose = (k: number, out: THREE.Vector3, at: THREE.Vector3) => {
      const st = STATIONS[k]
      const o = stationOrigin(k)
      at.set(st.look[0] + o[0], st.look[1] + o[1], st.look[2] + o[2])
      out.set((st.cam[0] - st.look[0]) * back + at.x, st.cam[1] + (back - 1) * 0.25, (st.cam[2] - st.look[2]) * back + at.z)
    }
    pose(i, a, la)
    pose(j, b, lb)
    camera.position.lerpVectors(a, b, e)
    camera.position.y += Math.sin(e * Math.PI) * 0.45
    look.lerpVectors(la, lb, e)
    sway.current.x = THREE.MathUtils.damp(sway.current.x, reduced ? 0 : pointer.x, 2.5, dt)
    sway.current.y = THREE.MathUtils.damp(sway.current.y, reduced ? 0 : pointer.y, 2.5, dt)
    camera.position.x += sway.current.x * 0.09
    camera.position.y += sway.current.y * 0.05
    camera.lookAt(look)
  })
  return null
}

/** Stations far from the camera are hidden (still mounted, so nothing reloads). */
function Station({ index, children }: { index: number; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    if (g.current) g.current.visible = Math.abs(xp.get().progress - index) < 1.6
  })
  return (
    <group ref={g} position={stationOrigin(index)}>
      {children}
    </group>
  )
}

function Ready() {
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    requestAnimationFrame(() => xp.set({ ready: true }))
  })
  return null
}

function Scene({ data, tier, reduced }: { data: ExperienceData; tier: Tier; reduced: boolean }) {
  const router = useRouter()
  const m = useMaterials()
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    scene.background = m.colors.ground.clone()
    scene.fog = new THREE.Fog(m.colors.ground, 7, 19)
  }, [scene, m])
  const open = useCallback((slug: string) => router.push(`/piece/${slug}`), [router])

  return (
    <>
      <Lighting tier={tier} reduced={reduced} />
      <CameraRig reduced={reduced} />
      <Suspense fallback={null}>
        <Hall tier={tier} />
        <Festival kind={data.festival} />
        <Station index={idx('arrival')}><Arrival tier={tier} /></Station>
        <Station index={idx('stone')}><StoneRoom tier={tier} section={idx('stone')} /></Station>
        <Station index={idx('hallmark')}><Hallmark section={idx('hallmark')} /></Station>
        <Station index={idx('tray')}><Tray pieces={data.tray} section={idx('tray')} onOpen={open} /></Station>
        <Station index={idx('vault')}><Vault pieces={data.vault} section={idx('vault')} onOpen={open} /></Station>
        <Station index={idx('weighing')}><Weighing piece={data.weighed?.piece ?? null} weight={data.weighed?.weight ?? null} section={idx('weighing')} /></Station>
        <Station index={idx('neck')}><Neck piece={data.neck} section={idx('neck')} /></Station>
        <Station index={idx('gift')}><GiftBox tier={tier} section={idx('gift')} /></Station>
        <Station index={idx('appointment')}><Counter tier={tier} section={idx('appointment')} /></Station>
        <Ready />
      </Suspense>
      {tier !== 'low' && (
        <EffectComposer multisampling={tier === 'high' ? 4 : 0}>
          <N8AO aoRadius={0.35} distanceFalloff={0.6} intensity={1.6} halfRes={tier !== 'high'} />
          <Bloom mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.1} intensity={0.32} />
          <ToneMapping mode={ToneMappingMode.AGX} />
          <Vignette offset={0.32} darkness={0.32} />
          <Noise opacity={0.022} premultiply />
        </EffectComposer>
      )}
    </>
  )
}

export default function Experience({ data }: { data: ExperienceData }) {
  const [tier, setTier] = useState<Tier | null>(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const t = detectTier()
    setTier(t)
    xp.set({ tier: t })
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  if (!tier) return null
  const dpr: [number, number] = tier === 'high' ? [1, 1.75] : tier === 'mid' ? [1, 1.5] : [0.8, 1]

  return (
    <Canvas
      aria-hidden
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      dpr={dpr}
      shadows={tier !== 'low' ? 'soft' : false}
      gl={{
        antialias: tier === 'low',
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        // With the composer the AgX pass tone-maps; without it the renderer does.
        toneMapping: tier === 'low' ? THREE.AgXToneMapping : THREE.NoToneMapping,
      }}
      camera={{ fov: 34, near: 0.05, far: 60, position: [0.55, 1.18, 1.25] }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
    >
      <PerformanceMonitor
        onDecline={() => {
          const next: Tier = tier === 'high' ? 'mid' : 'low'
          setTier(next)
          xp.set({ tier: next })
        }}
      />
      <AdaptiveDpr pixelated={false} />
      <Scene data={data} tier={tier} reduced={reduced} />
    </Canvas>
  )
}
