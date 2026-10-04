'use client'

import { MeshTransmissionMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { WorldPalette } from './palette'

/**
 * THE PLATERA EMBLEM: the house's own piece, built in code rather than modelled.
 * An upright band of polished 925 silver with an antique-gold inner rim, a pavé of
 * small stones across its shoulders, and a crown of six claws holding one large
 * brilliant-cut stone. It stands on its plinth; it never spins. What moves is the
 * light (the environment turns slowly, so facets light one after another).
 */

/** A round brilliant, built as a lathe from its profile, then split into flat facets. */
export function brilliantGeometry(segments = 16): THREE.BufferGeometry {
  // Profile from culet (bottom point) to table (top flat), in units of girdle radius.
  const profile = [
    new THREE.Vector2(0.0, -0.86), // culet
    new THREE.Vector2(0.48, -0.36), // lower pavilion break
    new THREE.Vector2(1.0, 0.0), // girdle, bottom edge
    new THREE.Vector2(1.0, 0.04), // girdle, top edge
    new THREE.Vector2(0.78, 0.18), // upper crown break
    new THREE.Vector2(0.56, 0.32), // table edge
    new THREE.Vector2(0.0, 0.32), // table centre
  ]
  // Few radial segments + non-indexed geometry = hard facet edges, which is what makes a stone sparkle.
  const g = new THREE.LatheGeometry(profile, segments).toNonIndexed()
  g.computeVertexNormals()
  return g
}

function silverMaterial(p: WorldPalette) {
  return new THREE.MeshPhysicalMaterial({
    color: p.silver.clone().lerp(new THREE.Color(1, 1, 1), 0.35),
    metalness: 1,
    roughness: 0.13,
    anisotropy: 0.55, // brushed highlights stretch along the band
    anisotropyRotation: Math.PI / 2,
    clearcoat: 0.25,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.35,
  })
}

function goldMaterial(p: WorldPalette) {
  return new THREE.MeshPhysicalMaterial({ color: p.gold, metalness: 1, roughness: 0.22, envMapIntensity: 1.2 })
}

/** Small stones: cheap physical glass with a diamond's index; sparkle comes from the environment. */
function paveMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(1, 1, 1),
    metalness: 0,
    roughness: 0,
    ior: 2.4,
    specularIntensity: 1,
    envMapIntensity: 3.2,
    transmission: 0,
    iridescence: 0.25, // a hint of fire on the facets
    iridescenceIOR: 1.8,
  })
}

export function Emblem({ palette, tier }: { palette: WorldPalette; tier: 'high' | 'mid' | 'low' }) {
  const group = useRef<THREE.Group>(null)
  const pave = useRef<THREE.InstancedMesh>(null)
  const stoneGeo = useMemo(() => brilliantGeometry(16), [])
  const paveGeo = useMemo(() => brilliantGeometry(8), [])
  const silver = useMemo(() => silverMaterial(palette), [palette])
  const gold = useMemo(() => goldMaterial(palette), [palette])
  const paveMat = useMemo(() => paveMaterial(), [])
  const paveCount = tier === 'low' ? 14 : 26

  // Band: a torus slightly flattened front-to-back, like a real shank.
  const R = 0.42
  const tube = 0.045

  // Place pavé stones on the outer face of the band's upper half, facing outward.
  useLayoutEffect(() => {
    const mesh = pave.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    for (let i = 0; i < paveCount; i++) {
      // From about 20° to 160° around the top, leaving the crown's base clear.
      const t = THREE.MathUtils.lerp(0.32, Math.PI - 0.32, i / (paveCount - 1))
      if (Math.abs(t - Math.PI / 2) < 0.2) {
        m.makeScale(0, 0, 0)
        mesh.setMatrixAt(i, m)
        continue
      }
      const out = new THREE.Vector3(Math.cos(t), Math.sin(t), 0)
      const pos = out.clone().multiplyScalar(R + tube * 0.82)
      q.setFromUnitVectors(up, out)
      m.compose(pos, q, new THREE.Vector3(0.021, 0.021, 0.021))
      mesh.setMatrixAt(i, m)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [paveCount])

  useLayoutEffect(
    () => () => {
      stoneGeo.dispose()
      paveGeo.dispose()
      silver.dispose()
      gold.dispose()
      paveMat.dispose()
    },
    [stoneGeo, paveGeo, silver, gold, paveMat],
  )

  // Breath, not spin: the emblem settles a millimetre as if on a soft pad.
  useFrame(({ clock }) => {
    if (group.current) group.current.position.y = Math.sin(clock.elapsedTime * 0.6) * 0.0015
  })

  const crownY = R + tube + 0.02
  const claws = Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2)

  return (
    <group ref={group} dispose={null}>
      {/* Shank: silver outside, gold inner rim. */}
      <mesh material={silver} scale={[1, 1, 0.78]} castShadow>
        <torusGeometry args={[R, tube, 48, 220]} />
      </mesh>
      <mesh material={gold} scale={[1, 1, 0.7]}>
        <torusGeometry args={[R - tube * 0.92, tube * 0.18, 16, 220]} />
      </mesh>

      {/* Pavé across the shoulders. */}
      <instancedMesh ref={pave} args={[paveGeo, paveMat, paveCount]} />

      {/* Crown: a collar and six claws holding the centre stone. */}
      <group position={[0, crownY, 0]}>
        <mesh material={silver} position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.105, 0.07, 0.07, 48, 1, true]} />
        </mesh>
        {claws.map((a) => (
          <mesh key={a} material={silver} position={[Math.cos(a) * 0.118, 0.05, Math.sin(a) * 0.118]} rotation={[Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]}>
            <capsuleGeometry args={[0.0085, 0.085, 4, 10]} />
          </mesh>
        ))}
        <mesh geometry={stoneGeo} position={[0, 0.075, 0]} scale={0.13} castShadow>
          {tier === 'low' ? (
            <meshPhysicalMaterial color="white" metalness={0} roughness={0} ior={2.4} transmission={1} thickness={0.6} envMapIntensity={2.5} />
          ) : (
            <MeshTransmissionMaterial
              backside
              backsideThickness={0.25}
              thickness={0.55}
              ior={2.4}
              chromaticAberration={0.06}
              anisotropicBlur={0.08}
              distortion={0}
              roughness={0}
              samples={tier === 'high' ? 10 : 5}
              resolution={tier === 'high' ? 1024 : 512}
              envMapIntensity={2.4}
            />
          )}
        </mesh>
      </group>
    </group>
  )
}
