p = 'src/scenes/collection/cones.ts'
s = open(p, encoding='utf8').read()
def rep(a, b):
    global s
    assert a in s, a[:70]; s = s.replace(a, b)
rep("  geos.push(coneGeo, pillowGeo, slitGeo,", """  // A soft shade where the ring goes into the velvet, so it reads as pressed in, not placed on.
  const shadeCanvas = document.createElement('canvas')
  shadeCanvas.width = shadeCanvas.height = 128
  {
    const g = shadeCanvas.getContext('2d')!
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(20,4,4,0.75)')
    grad.addColorStop(0.55, 'rgba(20,4,4,0.32)')
    grad.addColorStop(1, 'rgba(20,4,4,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
  }
  const shadeTex = new THREE.CanvasTexture(shadeCanvas)
  const shadeMat = new THREE.MeshBasicMaterial({ map: shadeTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
  const shadeGeo = new THREE.PlaneGeometry(1, 1)
  geos.push(shadeGeo, coneGeo, pillowGeo, slitGeo,""")
rep("    group.add(plinth, bead, cone, collar, pillow, slitLine)", """    const shade = new THREE.Mesh(shadeGeo, shadeMat)
    shade.rotation.x = -Math.PI / 2
    shade.scale.set(w * 0.95, 3.2, 1)
    shade.position.y = top + 0.02
    shade.renderOrder = 1
    group.add(plinth, bead, cone, collar, pillow, slitLine, shade)""")
rep("    ;[velvet, slitMat, gold, plinthMat].forEach((m) => m.dispose())", "    ;[velvet, slitMat, gold, plinthMat, shadeMat].forEach((m) => m.dispose())\n      shadeTex.dispose()")
open(p, 'w', encoding='utf8').write(s)
print('ok')
