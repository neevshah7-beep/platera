def edit(p, pairs):
    s = open(p, encoding='utf8').read()
    for a, b in pairs:
        assert a in s, (p, a[:80]); s = s.replace(a, b)
    open(p, 'w', encoding='utf8').write(s)
edit('src/scenes/collection/collection.ts', [
    ("import { photoTexture,", "import { reliefGeometry, relieve } from '../relief'\nimport { photoTexture,"),
    ("    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)\n    mesh.customDepthMaterial = depth",
     "    // In relief: the piece's own depth raises it off the plane, so it has form under the lamp.\n    const mesh = new THREE.Mesh(reliefGeometry(w, h), mat)\n    relieve(dr, Math.max(w, h), mat, depth)\n    mesh.customDepthMaterial = depth"),
])
edit('src/scenes/lamp/lamp.ts', [
    ("import { studioEnvironment, studioSource } from '../env'", "import { studioEnvironment, studioSource } from '../env'\nimport { reliefGeometry, relieve } from '../relief'"),
    ("""  if (piece.maps) {
    mat.normalMap = loader.load(`${piece.base}-normal.webp`)
    mat.normalScale.set(1.2, 1.2)
    mat.roughnessMap = loader.load(`${piece.base}-dr.webp`)
    mat.roughness = 1
  }
  const depthMat = new THREE.MeshDepthMaterial({ map, alphaTest: 0.5, depthPacking: THREE.RGBADepthPacking })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)""",
     """  const depthMat = new THREE.MeshDepthMaterial({ map, alphaTest: 0.5, depthPacking: THREE.RGBADepthPacking })
  if (piece.maps) {
    mat.normalMap = loader.load(`${piece.base}-normal.webp`)
    mat.normalScale.set(1.2, 1.2)
    const dr = loader.load(`${piece.base}-dr.webp`)
    mat.roughnessMap = dr
    mat.roughness = 1
    // In relief: the piece's own depth raises it off the tray (see relief.ts).
    relieve(dr, Math.max(w, h), mat, depthMat)
  }
  const mesh = new THREE.Mesh(piece.maps ? reliefGeometry(w, h) : new THREE.PlaneGeometry(w, h), mat)"""),
])
print('ok')
