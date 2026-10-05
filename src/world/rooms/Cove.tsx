'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { useMaterials } from '../materials/library'

/**
 * A photographer's infinity cove: a floor that curves up into the back wall with no
 * horizon line, in the gallery's ivory plaster. Rooms outside the hall stand in one.
 */
export function Cove({ width = 18, depth = 26, height = 9, radius = 3.5, z = 0 }: { width?: number; depth?: number; height?: number; radius?: number; z?: number }) {
  const m = useMaterials()
  const geo = useMemo(() => {
    // Profile in (z, y): flat floor, quarter circle, vertical wall. Extruded along x.
    const pts: THREE.Vector2[] = []
    pts.push(new THREE.Vector2(depth / 2, 0))
    pts.push(new THREE.Vector2(-depth / 2 + radius, 0))
    for (let i = 1; i <= 24; i++) {
      const a = (i / 24) * (Math.PI / 2)
      pts.push(new THREE.Vector2(-depth / 2 + radius - Math.sin(a) * radius, radius - Math.cos(a) * radius))
    }
    pts.push(new THREE.Vector2(-depth / 2, height))
    const g = new THREE.BufferGeometry()
    const pos: number[] = []
    const idx: number[] = []
    const segs = 2
    for (let i = 0; i < pts.length; i++) for (let j = 0; j <= segs; j++) pos.push(-width / 2 + (width * j) / segs, pts[i].y, pts[i].x)
    for (let i = 0; i < pts.length - 1; i++)
      for (let j = 0; j < segs; j++) {
        const a = i * (segs + 1) + j, b = a + 1, c = a + segs + 1, d = c + 1
        idx.push(a, c, b, b, c, d)
      }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [width, depth, height, radius])
  return <mesh geometry={geo} material={m.plaster} position={[0, 0, z]} receiveShadow />
}
