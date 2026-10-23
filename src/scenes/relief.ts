import * as THREE from 'three'
import { isPhone } from './gl'

/**
 * RELIEF. A cut-out photograph given real depth. Each piece's depth map (the R channel of
 * its -dr.webp, made by src/pipeline/make-maps.py) raises a finely divided plane into the
 * piece's actual form: the stone stands proud of its setting, a band curves away at its
 * edges. Under a moving camera or lamp the piece shows parallax and its own shadowing, so it
 * reads as an object rather than a printed card.
 *
 * reliefGeometry: the divided plane (more divisions along the longer side).
 * relieve: switches displacement on for a piece's material and its shadow material.
 * RELIEF: how far the deepest point stands out, as a share of the piece's longer side.
 */
export const RELIEF = 0.09

export function reliefGeometry(w: number, h: number): THREE.PlaneGeometry {
  const n = isPhone() ? 110 : 200
  const sx = w >= h ? n : Math.max(24, Math.round((n * w) / h))
  const sy = h >= w ? n : Math.max(24, Math.round((n * h) / w))
  return new THREE.PlaneGeometry(w, h, sx, sy)
}

export function relieve(
  dr: THREE.Texture,
  depthOf: number,
  ...mats: (THREE.MeshStandardMaterial | THREE.MeshDepthMaterial | THREE.MeshDistanceMaterial)[]
) {
  for (const m of mats) {
    m.displacementMap = dr
    m.displacementScale = depthOf * RELIEF
    m.displacementBias = 0
    m.needsUpdate = true
  }
}
