'use client'

import { MeshReflectorMaterial } from '@react-three/drei'
import { SPACING, STATIONS } from '../layout'
import { useMaterials } from '../materials/library'

/**
 * THE GALLERY HALL: a long room of ivory plaster with a polished marble floor that
 * softly mirrors what stands on it. Recessed light slots run along the ceiling.
 * Plain on purpose: the architecture frames the jewellery, it doesn't compete with it.
 */
export function Hall({ tier }: { tier: 'high' | 'mid' | 'low' }) {
  const m = useMaterials()
  const length = (STATIONS.length + 1) * SPACING
  const width = 7
  const height = 4.2
  const zMid = -length / 2 + SPACING

  return (
    <group>
      {/* Floor: polished marble with a blurred reflection on capable devices */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zMid]} receiveShadow>
        <planeGeometry args={[width, length]} />
        {tier === 'low' ? (
          <primitive object={m.marbleMatte} attach="material" />
        ) : (
          <MeshReflectorMaterial
            map={m.marbleMap}
            blur={[300, 80]}
            resolution={tier === 'high' ? 1024 : 512}
            mixBlur={1}
            mixStrength={0.65}
            roughness={0.55}
            depthScale={0.6}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            metalness={0}
            mirror={0}
          />
        )}
      </mesh>
      {/* Walls and ceiling */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.plaster} position={[(s * width) / 2, height / 2, zMid]} rotation={[0, -s * (Math.PI / 2), 0]} receiveShadow>
          <planeGeometry args={[length, height]} />
        </mesh>
      ))}
      <mesh material={m.plaster} position={[0, height, zMid]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
      </mesh>
      <mesh material={m.plaster} position={[0, height / 2, -length + SPACING]}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {/* Light slots in the ceiling: the hall's only ornament */}
      {[-1.6, 1.6].map((x) => (
        <mesh key={x} position={[x, height - 0.01, zMid]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.06, length]} />
          <meshBasicMaterial color={m.colors.lamp} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

/** A marble plinth with a softly rounded top edge. */
export function Plinth({ w = 0.5, d = 0.5, h = 0.92, material }: { w?: number; d?: number; h?: number; material?: 'marble' | 'matte' }) {
  const m = useMaterials()
  return (
    <mesh position={[0, h / 2, 0]} material={material === 'matte' ? m.marbleMatte : m.marble} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  )
}
