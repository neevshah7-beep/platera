p = 'src/scenes/collection/cones.ts'
s = open(p, encoding='utf8').read()
def rep(a, b):
    global s
    assert a in s, a[:70]; s = s.replace(a, b)
rep("import { photoTexture,", "import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'\nimport { photoTexture,")
rep("const SPACING = 30\nconst RING = 12 // longest side of a ring's cut-out on its cone, cm\nconst NECK = 15 // height of the cone up to the cushion, cm",
    "const SPACING = 28\nconst RING = 12 // longest side of a ring's cut-out on its cone, cm\nconst NECK = 11 // height of the cone up to the pillow, cm\nconst PILLOW = { w: 14, h: 4.6, d: 6.4 } // the velvet ring pillow on top, cm\nconst SINK = 0.2 // share of the ring's height pressed into the pillow's slit")
# Velvet: deep rosewood with a strong sheen at grazing angles, the way pile catches light.
rep("const velvet = jewelMaterial({ color: new THREE.Color(0.2, 0.05, 0.055), roughness: 0.92, sheen: 1, sheenRoughness: 0.42, sheenColor: new THREE.Color(0.95, 0.55, 0.5), envMapIntensity: 0.6 })",
    "const velvet = jewelMaterial({ color: new THREE.Color(0.13, 0.026, 0.032), roughness: 1, sheen: 1, sheenRoughness: 0.32, sheenColor: new THREE.Color(1, 0.62, 0.55), envMapIntensity: 0.5 })\n  const slitMat = jewelMaterial({ color: new THREE.Color(0.05, 0.01, 0.012), roughness: 1 })")
# Cone: a slender tapered cone.
rep("    const r = 1.6 + 4.6 * Math.pow(1 - t, 2.2)", "    const r = 1.5 + 3.6 * Math.pow(1 - t, 1.6)")
rep("""  // The cushion the ring sits in: wide across, shallow front to back, a soft dome.
  const cushionGeo = new THREE.SphereGeometry(1, phone ? 40 : 64, phone ? 20 : 32)
  const collarGeo = new THREE.TorusGeometry(1.72, 0.16, 12, phone ? 40 : 64)
  const plinthGeo = new THREE.CylinderGeometry(7.4, 7.8, 1.4, phone ? 48 : 72)
  const beadGeo = new THREE.TorusGeometry(7.5, 0.12, 8, phone ? 64 : 96)
  geos.push(coneGeo, cushionGeo, collarGeo, plinthGeo, beadGeo)""",
"""  // The pillow the ring sits in: a soft rounded block, its top puffed up toward the middle
  // and pinched into a slit along its length.
  const pillowGeo = new RoundedBoxGeometry(PILLOW.w, PILLOW.h, PILLOW.d, phone ? 4 : 6, 1.9)
  {
    const pp = pillowGeo.attributes.position as THREE.BufferAttribute
    for (let k = 0; k < pp.count; k++) {
      const x = pp.getX(k) / (PILLOW.w / 2), y = pp.getY(k), z = pp.getZ(k) / (PILLOW.d / 2)
      if (y <= 0) continue
      const puff = 0.9 * (1 - x * x) * (1 - z * z) * (y / (PILLOW.h / 2))
      const slit = -0.55 * Math.exp(-(z * z) / 0.012) * (1 - Math.pow(Math.abs(x), 6)) * (y / (PILLOW.h / 2))
      pp.setY(k, y + Math.max(0, puff) + slit)
    }
    pillowGeo.computeVertexNormals()
  }
  const slitGeo = new THREE.BoxGeometry(PILLOW.w * 0.82, 0.08, 0.16)
  const collarGeo = new THREE.TorusGeometry(1.62, 0.16, 12, phone ? 40 : 64)
  const plinthGeo = new THREE.CylinderGeometry(6.2, 6.6, 1.3, phone ? 48 : 72)
  const beadGeo = new THREE.TorusGeometry(6.3, 0.12, 8, phone ? 64 : 96)
  geos.push(coneGeo, pillowGeo, slitGeo, collarGeo, plinthGeo, beadGeo)""")
rep("""    plinth.position.y = 0.7
    plinth.castShadow = plinth.receiveShadow = true
    const bead = new THREE.Mesh(beadGeo, gold)
    bead.rotation.x = Math.PI / 2
    bead.position.y = 1.4
    const cone = new THREE.Mesh(coneGeo, velvet)
    cone.position.y = 1.4
    cone.castShadow = cone.receiveShadow = true
    const collar = new THREE.Mesh(collarGeo, gold)
    collar.rotation.x = Math.PI / 2
    collar.position.y = 1.4 + NECK - 0.2
    // The cushion is a little wider than the ring, so its whole lower band sinks into velvet.
    const cw = Math.max(3.4, w * 0.5)
    const cushion = new THREE.Mesh(cushionGeo, velvet)
    cushion.scale.set(cw, Math.min(3.4, cw * 0.55), Math.max(2.6, cw * 0.48))
    cushion.position.y = 1.4 + NECK + 0.6
    cushion.castShadow = cushion.receiveShadow = true
    group.add(plinth, bead, cone, collar, cushion)""",
"""    plinth.position.y = 0.65
    plinth.castShadow = plinth.receiveShadow = true
    const bead = new THREE.Mesh(beadGeo, gold)
    bead.rotation.x = Math.PI / 2
    bead.position.y = 1.3
    const cone = new THREE.Mesh(coneGeo, velvet)
    cone.position.y = 1.3
    cone.castShadow = cone.receiveShadow = true
    const collar = new THREE.Mesh(collarGeo, gold)
    collar.rotation.x = Math.PI / 2
    collar.position.y = 1.3 + NECK - 0.15
    // The pillow is wider than any ring, so a ring's whole lower band sinks into velvet.
    const pillow = new THREE.Mesh(pillowGeo, velvet)
    pillow.position.y = 1.3 + NECK + PILLOW.h / 2 - 0.3
    pillow.castShadow = pillow.receiveShadow = true
    const top = pillow.position.y + PILLOW.h / 2 + 0.9 - 0.55
    const slitLine = new THREE.Mesh(slitGeo, slitMat)
    slitLine.position.y = top - 0.02
    group.add(plinth, bead, cone, collar, pillow, slitLine)""")
rep("""    // The lowest quarter of the ring (its lower band) sits inside the cushion's slit.
    const seat = cushion.position.y + cushion.scale.y - h * 0.3""",
"""    // The ring's lower band sits down inside the pillow's slit.
    const seat = top - h * SINK""")
rep("    ;[velvet, gold, plinthMat].forEach((m) => m.dispose())", "    ;[velvet, slitMat, gold, plinthMat].forEach((m) => m.dispose())")
# Camera: further back, so two or three cones and their rings are in view, rings the subject.
rep("""    camera.position.set(x - 6, portrait ? 40 : 30, portrait ? 74 : 60)
    look.set(x + 2, portrait ? 13 : 15, -2)""",
"""    camera.position.set(x - 6, portrait ? 44 : 32, portrait ? 96 : 74)
    look.set(x + 2, portrait ? 14 : 15, -2)""")
open(p, 'w', encoding='utf8').write(s)
print('ok')
