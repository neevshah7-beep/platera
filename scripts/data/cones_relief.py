p = 'src/scenes/collection/cones.ts'
s = open(p, encoding='utf8').read()
def rep(a, b):
    global s
    assert a in s, a[:80]; s = s.replace(a, b)
rep("import type { CollectionApi, CollectionPiece } from './collection'", "import type { CollectionApi, CollectionPiece } from './collection'\nimport { reliefGeometry, relieve } from '../relief'")
rep("alphaTest: 0.5, side: THREE.DoubleSide })\n    const depth", "alphaTest: 0.5 })\n    const depth")
rep("    const ringGeo = new THREE.PlaneGeometry(w, h)", "    // The ring in relief, front and back: a solid you can see turn, not a card.\n    const ringGeo = reliefGeometry(w, h)")
rep("""    mesh.customDepthMaterial = depth
    mesh.castShadow = true
    mesh.userData.slug = p.slug""", """    mesh.customDepthMaterial = depth
    mesh.castShadow = true
    mesh.userData.slug = p.slug
    relieve(dr, Math.max(w, h), mat, depth)
    const back = new THREE.Mesh(ringGeo, mat)
    back.rotation.y = Math.PI
    back.customDepthMaterial = depth
    back.castShadow = true
    mesh.add(back)""")
rep("it.mesh.rotation.y = toCam * (0.85 + 0.15 * it.lift) + Math.sin(now * 0.0007 + it.home.x) * 0.06 * (1 - it.lift)",
    "it.mesh.rotation.y = toCam * (0.85 + 0.15 * it.lift) + Math.sin(now * 0.00045 + it.home.x * 0.07) * 0.42 * (1 - 0.6 * it.lift)")
rep("// Always turned toward the eye (never seen edge-on), with a slow sway as if just set down.",
    "// Turned toward the eye, and turning slowly to and fro so its depth shows (never edge-on).")
open(p, 'w', encoding='utf8').write(s); print('ok')
