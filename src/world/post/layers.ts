import type * as THREE from 'three'

/**
 * Render layers the post chain reads. Objects opt in; everything is also on layer 0.
 *   BLOOM        highlights on this object may bloom (metal, stones). Nothing else ever does.
 *   SSR_VELVET   receives soft, rough screen-space reflections (tray velvet)
 *   SSR_POLISH   receives sharper reflections (polished plinth and counter tops)
 *   NO_GBUFFER   excluded from depth/normals (volumetric shafts, particles, overlays)
 */
export const LAYER = { BLOOM: 3, SSR_VELVET: 4, SSR_POLISH: 5, NO_GBUFFER: 6 } as const

export function bloom<T extends THREE.Object3D>(o: T | null): T | null {
  if (o) o.traverse((c) => c.layers.enable(LAYER.BLOOM))
  return o
}
export function reflective<T extends THREE.Object3D>(o: T | null, kind: 'velvet' | 'polish'): T | null {
  if (o) o.traverse((c) => c.layers.enable(kind === 'velvet' ? LAYER.SSR_VELVET : LAYER.SSR_POLISH))
  return o
}
export function noGBuffer<T extends THREE.Object3D>(o: T | null): T | null {
  if (o) o.traverse((c) => c.layers.enable(LAYER.NO_GBUFFER))
  return o
}
