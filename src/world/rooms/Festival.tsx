'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SPACING, STATIONS } from '../layout'
import { useMaterials } from '../materials/library'

function token(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return new THREE.Color(v || fallback)
}

export type FestivalKey = 'none' | 'diwali' | 'wedding'

/**
 * FESTIVAL ROOMS: switched from the admin (setting `festival`). For Diwali, rows of clay
 * diyas line the hall on both sides, each flame flickering on its own clock. For the
 * wedding season, marigold strings hang in swags between the light slots. Instanced,
 * so a hundred lamps cost one draw call each for clay and flame.
 */
export function Festival({ kind }: { kind: FestivalKey }) {
  if (kind === 'diwali') return <Diyas />
  if (kind === 'wedding') return <Marigolds />
  return null
}

function Diyas() {
  const m = useMaterials()
  const clay = useRef<THREE.InstancedMesh>(null)
  const flames = useRef<THREE.InstancedMesh>(null)
  const spots = useMemo(() => {
    const out: THREE.Vector3[] = []
    const n = STATIONS.length * 6
    for (let i = 0; i < n; i++) for (const s of [-1, 1]) out.push(new THREE.Vector3(s * 2.9, 0.02, 2 - i * (SPACING / 6)))
    return out
  }, [])
  const clayMat = useMemo(() => new THREE.MeshStandardMaterial({ color: m.colors.shadowInk, roughness: 0.9 }), [m])
  const flameMat = useMemo(() => new THREE.MeshBasicMaterial({ color: token('--mood-diya', '#ffb25e').multiplyScalar(4), toneMapped: false }), [])
  const tmp = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }) => {
    if (!clay.current || !flames.current) return
    const t = clock.elapsedTime
    spots.forEach((p, i) => {
      tmp.position.copy(p)
      tmp.scale.set(1, 1, 1)
      tmp.rotation.set(0, 0, 0)
      tmp.updateMatrix()
      clay.current!.setMatrixAt(i, tmp.matrix)
      const f = 0.8 + Math.sin(t * 9 + i * 1.7) * 0.12 + Math.sin(t * 17 + i) * 0.08
      tmp.position.set(p.x, p.y + 0.05, p.z)
      tmp.scale.set(f, f * 1.3, f)
      tmp.updateMatrix()
      flames.current!.setMatrixAt(i, tmp.matrix)
    })
    clay.current.instanceMatrix.needsUpdate = true
    flames.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={clay} args={[undefined, clayMat, spots.length]} castShadow>
        <sphereGeometry args={[0.05, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </instancedMesh>
      <instancedMesh ref={flames} args={[undefined, flameMat, spots.length]}>
        <coneGeometry args={[0.009, 0.035, 8]} />
      </instancedMesh>
    </group>
  )
}

function Marigolds() {
  const m = useMaterials()
  const geo = useMemo(() => {
    const curves: THREE.TubeGeometry[] = []
    for (let i = 0; i < STATIONS.length * 2; i++) {
      const z0 = 2 - i * (SPACING / 2)
      for (const x of [-1.6, 1.6]) {
        const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 4.1, z0), new THREE.Vector3(x, 3.5, z0 - SPACING / 4), new THREE.Vector3(x, 4.1, z0 - SPACING / 2))
        curves.push(new THREE.TubeGeometry(c, 40, 0.035, 8, false))
      }
    }
    return curves
  }, [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: token('--mood-mandap', '#ffc36b'), roughness: 0.85 }), [])
  void m
  return (
    <group>
      {geo.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} />
      ))}
    </group>
  )
}
