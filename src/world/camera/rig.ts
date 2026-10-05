'use client'

import * as THREE from 'three'
import { camera as cam, spring } from '@tokens/motion'
import { noise1, Spring, Spring3 } from '@/motion/springs'
import { makePose, type Pose, type RoomKey } from '../registry'
import { xp } from '../state'

/**
 * THE CAMERA RIG (Experience Bible §5). Every move is spring-driven; nothing tweens
 * linearly. Layers, applied in order each frame:
 *
 *   1. the room's pose for the current scroll (DOLLY along a path, ORBIT on the plinth),
 *      followed on spring.soft so stopping the scroll decelerates the world;
 *   2. PARALLAX: the pointer offsets the camera on its own spring (60 / 18), up to ±0.4
 *      units at the reference distance of 4 m, scaled with the distance to the subject;
 *   3. RACK FOCUS: the focal distance on its own spring, independent of position;
 *   4. HANDHELD: 0.0015 rad of noise on rotation at 0.3 Hz. Always on (except
 *      prefers-reduced-motion). No shot is ever dead-still.
 *
 * PUSH-IN and room transitions are driven by the Director, which places the rig exactly.
 */
class Rig {
  pose = makePose()
  private pos = new Spring3([0, 1.2, 3], spring.soft)
  private tgt = new Spring3([0, 1, 0], spring.soft)
  private fov = new Spring(34, spring.soft)
  private focusSpring = new Spring(1, spring.soft)
  private px = new Spring(0, spring.parallax)
  private py = new Spring(0, spring.parallax)
  private rack = new Spring(0, spring.default)
  private right = new THREE.Vector3()
  private up = new THREE.Vector3()
  private fwd = new THREE.Vector3()
  private prev = new THREE.Vector3()
  private euler = new THREE.Euler()
  private q = new THREE.Quaternion()
  /** Camera speed in m/s, for motion blur and the light trails. */
  speed = 0
  /** Focal distance in metres (DOF), after rack focus. */
  focus = 1
  /** Extra focal offset driven by rack focus (0 = subject, 1 = ledger). */
  rackDistance = 0.6
  transition: { dolly: boolean; startedAt: number; fromKey: RoomKey; toKey: RoomKey } | null = null

  snap(p: Pose) {
    this.pos.snap(p.position.x, p.position.y, p.position.z)
    this.tgt.snap(p.target.x, p.target.y, p.target.z)
    this.fov.snap(p.fov)
    this.focusSpring.snap(p.focus)
    this.pose.position.copy(p.position)
    this.pose.target.copy(p.target)
    this.pose.fov = p.fov
    this.pose.focus = p.focus
  }

  /** Follow a pose on springs, or (exact) sit on it, keeping the springs in step. */
  place(p: Pose, dt: number, exact: boolean) {
    if (exact) {
      this.snap(p)
      return
    }
    this.pos.set(p.position.x, p.position.y, p.position.z)
    this.tgt.set(p.target.x, p.target.y, p.target.z)
    this.fov.target = p.fov
    this.focusSpring.target = p.focus
    this.pos.step(dt, this.pose.position)
    this.tgt.step(dt, this.pose.target)
    this.pose.fov = this.fov.step(dt)
    this.pose.focus = this.focusSpring.step(dt)
  }

  apply(camera: THREE.PerspectiveCamera, time: number, dt: number) {
    const s = xp.get()
    const still = s.reduced
    this.prev.copy(camera.position)

    // Parallax in the camera's own plane, scaled to the subject distance.
    this.px.target = still ? 0 : s.pointer.x
    this.py.target = still ? 0 : s.pointer.y
    const ox = this.px.step(dt)
    const oy = this.py.step(dt)
    const dist = this.pose.position.distanceTo(this.pose.target)
    const amp = cam.parallaxMax * Math.min(1, dist / 4)
    this.fwd.subVectors(this.pose.target, this.pose.position).normalize()
    this.right.crossVectors(this.fwd, THREE.Object3D.DEFAULT_UP).normalize()
    this.up.crossVectors(this.right, this.fwd).normalize()
    camera.position.copy(this.pose.position).addScaledVector(this.right, ox * amp).addScaledVector(this.up, oy * amp * 0.6)
    camera.lookAt(this.pose.target)

    // Handheld: a breath of rotation noise, three independent axes.
    if (!still) {
      const a = cam.handheldAmplitude
      const f = cam.handheldHz
      this.euler.set(noise1(time * f, 1) * a, noise1(time * f, 2) * a, noise1(time * f * 0.7, 3) * a * 0.6)
      this.q.setFromEuler(this.euler)
      camera.quaternion.multiply(this.q)
    }

    if (Math.abs(camera.fov - this.pose.fov) > 1e-3) {
      camera.fov = this.pose.fov
      camera.updateProjectionMatrix()
    }

    // Rack focus: the subject, or the ledger set beside it.
    this.rack.target = s.rack
    this.focus = this.pose.focus + this.rack.step(dt) * this.rackDistance
    this.speed = dt > 0 ? camera.position.distanceTo(this.prev) / dt : 0
  }
}

export const rig = new Rig()
