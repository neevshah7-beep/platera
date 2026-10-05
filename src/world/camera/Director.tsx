'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { duration } from '@tokens/motion'
import { easeCamera } from '@/motion/springs'
import { makePose, registry, type RoomKey } from '../registry'
import { xp } from '../state'
import { rig } from './rig'

/**
 * THE TRANSITION ORCHESTRATOR. Watches the room the page has declared; when it changes,
 * the camera travels from wherever it is to the new room's pose over duration.camera
 * (1.6 s) on ease.camera, along a curved path that lifts between the rooms. Because the
 * move is computed from the live camera, browser back simply plays it the other way.
 * Rooms that are not spatially adjacent hand the cut to the liquid-metal wipe (T14).
 */
export function Director() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const live = useMemo(makePose, [])
  const from = useMemo(makePose, [])
  const out = useMemo(makePose, [])
  const mid = useMemo(() => new THREE.Vector3(), [])
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()), [])
  const move = useRef<{ key: RoomKey; t0: number; dolly: boolean } | null>(null)
  const current = useRef<RoomKey | null>(null)
  const settled = useRef(false)

  useEffect(() => {
    camera.near = 0.02
    camera.far = 120
    camera.updateProjectionMatrix()
  }, [camera])

  useFrame(({ clock }, dt) => {
    const s = xp.get()
    const key = s.room.key
    const entry = registry.get(key)
    if (!entry) return // the room is still loading; hold the shot
    entry.pose(s.progress, size.width / size.height, live)

    // A new room: start the move from the camera's present pose.
    if (current.current !== key) {
      const prev = current.current
      current.current = key
      if (prev === null || s.reduced) {
        rig.snap(live)
        settled.current = true
      } else {
        from.position.copy(rig.pose.position)
        from.target.copy(rig.pose.target)
        from.fov = rig.pose.fov
        from.focus = rig.pose.focus
        const prevEntry = registry.get(prev)
        const dolly = Boolean(prevEntry?.adjacent?.includes(key) || entry.adjacent?.includes(prev))
        move.current = { key, t0: clock.elapsedTime, dolly }
        rig.transition = { dolly, startedAt: clock.elapsedTime, fromKey: prev, toKey: key }
      }
    }

    if (move.current) {
      const t = (clock.elapsedTime - move.current.t0) / (duration.camera / 1000)
      const e = easeCamera(Math.min(1, t))
      // A curved path: the midpoint rises and pulls back, so the camera arcs over the space.
      mid.lerpVectors(from.position, live.position, 0.5)
      mid.y += Math.min(6, from.position.distanceTo(live.position) * 0.18)
      curve.v0.copy(from.position)
      curve.v1.copy(mid)
      curve.v2.copy(live.position)
      curve.getPoint(e, out.position)
      out.target.lerpVectors(from.target, live.target, e)
      out.fov = THREE.MathUtils.lerp(from.fov, live.fov, e)
      out.focus = THREE.MathUtils.lerp(from.focus, live.focus, e)
      rig.place(out, dt, true)
      if (t >= 1) {
        move.current = null
        rig.transition = null
      }
    } else {
      rig.place(live, dt, false)
    }
    rig.apply(camera, clock.elapsedTime, dt)
  })
  return null
}
