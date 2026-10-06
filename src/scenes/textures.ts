import * as THREE from 'three'

/** Fine pebbled leather grain as a normal map (made by scripts/make-textures.mjs). */
export function leatherNormals(): THREE.Texture {
  const t = new THREE.TextureLoader().load('/media/tex/leather-normal.png')
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 3)
  t.anisotropy = 8
  return t
}

/** A field of soft silk folds as a normal map (made by scripts/make-textures.mjs). */
export function silkNormals(): THREE.Texture {
  const t = new THREE.TextureLoader().load('/media/tex/silk-normal.png')
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(6, 2)
  t.anisotropy = 8
  return t
}
