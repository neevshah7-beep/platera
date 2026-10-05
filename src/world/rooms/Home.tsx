'use client'

import { useRouter } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { STATIONS, stationOrigin } from '../layout'
import { Lighting } from '../lighting/Lighting'
import { ANCHORS, registry, type Pose } from '../registry'
import { xp, type HomeData } from '../state'
import { tierName, useTier } from '../tier'
import { Arrival } from './Arrival'
import { Counter } from './Counter'
import { Festival } from './Festival'
import { GiftBox } from './GiftBox'
import { Hall } from './Hall'
import { Hallmark } from './Hallmark'
import { Neck } from './Neck'
import { StoneRoom } from './StoneRoom'
import { Tray } from './Tray'
import { Vault as Drawer } from './Vault'
import { Weighing } from './Weighing'

const idx = (id: (typeof STATIONS)[number]['id']) => STATIONS.findIndex((s) => s.id === id)
const smoother = (e0: number, e1: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * The home walk: one long gallery down −Z with a station every 5.2 m. Between stations
 * the camera rises a little and glides (a crane move); at each station it dwells while
 * the text is read. Portrait screens stand further back so the subject fits.
 */
function homePose() {
  const a = new THREE.Vector3(), b = new THREE.Vector3(), la = new THREE.Vector3(), lb = new THREE.Vector3()
  const at = (k: number, back: number, out: THREE.Vector3, look: THREE.Vector3) => {
    const st = STATIONS[k]
    const o = stationOrigin(k)
    look.set(st.look[0] + o[0], st.look[1] + o[1], st.look[2] + o[2])
    out.set((st.cam[0] - st.look[0]) * back + look.x, st.cam[1] + (back - 1) * 0.25, (st.cam[2] - st.look[2]) * back + look.z)
  }
  return (progress: number, aspect: number, out: Pose) => {
    const s = THREE.MathUtils.clamp(progress, 0, STATIONS.length - 1)
    const i = Math.floor(s)
    const j = Math.min(i + 1, STATIONS.length - 1)
    const e = smoother(0.22, 0.78, s - i)
    const back = aspect < 0.8 ? 1.55 : 1
    at(i, back, a, la)
    at(j, back, b, lb)
    out.position.lerpVectors(a, b, e)
    out.position.y += Math.sin(e * Math.PI) * 0.45
    out.target.lerpVectors(la, lb, e)
    out.fov = aspect < 0.8 ? 46 : 34
    out.focus = out.position.distanceTo(out.target)
  }
}

/** Stations far from the camera are hidden (still mounted, so nothing reloads). */
function Station({ index, children }: { index: number; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    if (g.current) g.current.visible = xp.get().room.key !== 'home' || Math.abs(xp.get().progress - index) < 1.6
  })
  return (
    <group ref={g} position={stationOrigin(index)}>
      {children}
    </group>
  )
}

export function HomeRoom({ data }: { data: HomeData }) {
  const router = useRouter()
  const tier = tierName(useTier())
  const open = useCallback((slug: string) => router.push(`/piece/${slug}`), [router])
  const pose = useMemo(homePose, [])
  useEffect(() => registry.register({ key: 'home', anchor: new THREE.Vector3(...ANCHORS.home), pose }), [pose])

  return (
    <group position={ANCHORS.home}>
      <Lighting tier={tier} reduced={xp.get().reduced} />
      <Suspense fallback={null}>
        <Hall tier={tier} />
        <Festival kind={data.festival} />
        <Station index={idx('arrival')}><Arrival tier={tier} /></Station>
        <Station index={idx('stone')}><StoneRoom tier={tier} section={idx('stone')} /></Station>
        <Station index={idx('hallmark')}><Hallmark section={idx('hallmark')} /></Station>
        <Station index={idx('tray')}><Tray pieces={data.tray} section={idx('tray')} onOpen={open} /></Station>
        <Station index={idx('vault')}><Drawer pieces={data.drawer} section={idx('vault')} onOpen={open} /></Station>
        <Station index={idx('weighing')}><Weighing piece={data.weighed?.piece ?? null} weight={data.weighed?.weight ?? null} section={idx('weighing')} /></Station>
        <Station index={idx('neck')}><Neck piece={data.neck} section={idx('neck')} /></Station>
        <Station index={idx('gift')}><GiftBox tier={tier} section={idx('gift')} /></Station>
        <Station index={idx('appointment')}><Counter tier={tier} section={idx('appointment')} /></Station>
      </Suspense>
    </group>
  )
}
