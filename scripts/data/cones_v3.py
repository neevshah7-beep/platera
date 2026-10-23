p = 'src/scenes/collection/cones.ts'
s = open(p, encoding='utf8').read()
i = s.index('  const pillowGeo = new RoundedBoxGeometry(')
j = s.index('  const slitGeo =')
s = s[:i] + """  // A superellipsoid: square in plan, soft at every edge, the top gently domed, like a
  // stuffed velvet pillow. Smooth enough to light without facets.
  const pillowGeo = new THREE.SphereGeometry(1, phone ? 64 : 96, phone ? 32 : 48)
  {
    const pp = pillowGeo.attributes.position as THREE.BufferAttribute
    const sq = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e)
    for (let k = 0; k < pp.count; k++) {
      const x = pp.getX(k), y = pp.getY(k), z = pp.getZ(k)
      pp.setXYZ(k, sq(x, 0.32) * PILLOW.w / 2, sq(y, 0.55) * PILLOW.h / 2, sq(z, 0.42) * PILLOW.d / 2)
    }
    pillowGeo.computeVertexNormals()
  }
""" + s[j:]
s = s.replace("import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'\n", '')
s = s.replace("const slitGeo = new THREE.BoxGeometry(PILLOW.w * 0.82, 0.08, 0.16)", "const slitGeo = new THREE.BoxGeometry(PILLOW.w * 0.7, 0.12, 0.22)")
s = s.replace("const top = pillow.position.y + PILLOW.h / 2 + 0.9", "const top = pillow.position.y + PILLOW.h / 2")
s = s.replace("slitLine.position.y = top - 0.02", "slitLine.position.y = top - 0.04")
s = s.replace("pillow.position.y = 1.3 + NECK + PILLOW.h / 2 - 0.3", "pillow.position.y = 1.3 + NECK + PILLOW.h / 2 - 0.4")
open(p, 'w', encoding='utf8').write(s)
print('ok')
