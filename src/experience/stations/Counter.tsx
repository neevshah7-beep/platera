'use client'

import { RoundedBox, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useMaterials } from '../materials'
import { xp } from '../state'
import { Emblem } from './Arrival'

/**
 * THE COUNTER at the end of the hall: a long marble counter with a velvet viewing pad,
 * a brass lamp leaning over it and the emblem waiting on the pad, and the store's name
 * cut into the wall behind. This is where the walk ends: an invitation to see a piece
 * in your hand, at Gorai 1 or on a video call.
 */
export function Counter({ tier, section }: { tier: 'high' | 'mid' | 'low'; section: number }) {
  const m = useMaterials()
  const lamp = useRef<THREE.SpotLight>(null)
  const H = 0.98

  useFrame((_, dt) => {
    const near = THREE.MathUtils.smoothstep(xp.get().progress - (section - 0.8), 0, 0.8)
    if (lamp.current) lamp.current.intensity = THREE.MathUtils.damp(lamp.current.intensity, near * 6, 3, dt)
  })

  return (
    <group position={[0, 0, -0.6]}>
      <mesh material={m.marble} position={[0, H / 2 - 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, H - 0.06, 0.6]} />
      </mesh>
      <RoundedBox args={[2.8, 0.06, 0.74]} radius={0.012} smoothness={4} position={[0, H, 0]} material={m.marble} castShadow receiveShadow />
      <mesh material={m.gold} position={[0, H - 0.05, 0.371]}>
        <boxGeometry args={[2.78, 0.006, 0.004]} />
      </mesh>
      {/* Viewing pad, with the emblem set down on it */}
      <RoundedBox args={[0.42, 0.016, 0.3]} radius={0.006} smoothness={3} position={[0.2, H + 0.038, 0.08]} material={m.velvet} receiveShadow />
      <group position={[0.2, H + 0.046, 0.08]} scale={0.7}>
        <Emblem tier={tier} stoneDetail="simple" />
      </group>
      {/* Brass lamp: weighted foot, a stem, and an arm that leans over the pad */}
      <group position={[-0.25, H + 0.03, -0.12]}>
        <mesh material={m.brass} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.025, 40]} />
        </mesh>
        <mesh material={m.brass} position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.5, 16]} />
        </mesh>
        <mesh material={m.brass} position={[0.2, 0.5, 0.06]} rotation={[0, -0.3, -1.25]} castShadow>
          <cylinderGeometry args={[0.006, 0.006, 0.44, 16]} />
        </mesh>
        <mesh material={m.brass} position={[0.42, 0.42, 0.13]} rotation={[0.2, 0, 0.5]} castShadow>
          <coneGeometry args={[0.07, 0.11, 40, 1, true]} />
        </mesh>
        <spotLight ref={lamp} position={[0.42, 0.4, 0.13]} angle={0.6} penumbra={0.8} intensity={0} distance={2} color={m.colors.lamp} castShadow={tier === 'high'}>
          <object3D attach="target" position={[0.45, -0.1, 0.2]} />
        </spotLight>
      </group>
      {/* The name, cut into the wall behind */}
      <Text font="/fonts/Gambetta-Regular.woff" position={[0, 2.35, -2.4]} fontSize={0.34} letterSpacing={0.28} color={m.colors.shadowInk} anchorX="center">
        PLATERA
      </Text>
      <Text font="/fonts/Gambetta-Regular.woff" position={[0, 2.02, -2.4]} fontSize={0.075} letterSpacing={0.2} color={m.colors.shadowInk} anchorX="center">
        WITH BHAIRAV JEWELLERS · GORAI 1
      </Text>
    </group>
  )
}
