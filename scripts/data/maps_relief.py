p = 'src/pipeline/make-maps.py'
s = open(p, encoding='utf8').read()
def rep(a, b):
    global s
    assert a in s, a[:80]; s = s.replace(a, b)
rep("    dr = np.dstack([form * 255, rough * 255 * alpha, np.zeros_like(form)]).astype(np.uint8)",
"""    # Relief (R): the form, eased to nothing over the last few percent before every edge and
    # hole, so the displaced surface in the 3D rooms (src/scenes/relief.ts) never stands up in
    # a cliff at the outline, which would stretch the photograph across openwork.
    edt = ndimage.distance_transform_edt(mask)
    T = max(3.0, 0.035 * max(mask.shape))
    taper = np.clip(edt / T, 0, 1)
    taper = taper * taper * (3 - 2 * taper)
    relief = np.clip(ndimage.gaussian_filter(form, 1.5) * taper, 0, 1)
    dr = np.dstack([relief * 255, rough * 255 * alpha, np.zeros_like(form)]).astype(np.uint8)""")
rep("Writes public/media/products/<name>-normal.webp and <name>-dr.webp (R = depth, G = roughness,",
    "Writes public/media/products/<name>-normal.webp and <name>-dr.webp (R = relief: the depth eased\nto zero at every edge, G = roughness,")
open(p, 'w', encoding='utf8').write(s); print('ok')
