"""Hand fixes after review of the BiRefNet cut-outs (assets/oct23-bire), then installs every
ring's display cut-out as its main image, assets/prepared/<SKU>-01.png.

027 and 073: the stone's mirror image under it survived; cut below the stone's prongs.
029: a pale patch of reflection under the left of the band; cleared below the band's edge."""
import glob, os
import numpy as np
from PIL import Image

CUT_BELOW = {'PLT-RNG-027': 0.555, 'PLT-RNG-073': 0.545}


def crop(a):
    ys, xs = np.where(a[..., 3] >= 128)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    pad = int(0.03 * max(y1 - y0, x1 - x0))
    return Image.fromarray(a).crop((max(0, x0 - pad), max(0, y0 - pad), min(a.shape[1], x1 + pad), min(a.shape[0], y1 + pad)))


for f in sorted(glob.glob('assets/oct23-bire/PLT-RNG-*-0.png')):
    sku = os.path.basename(f)[:11]
    a = np.array(Image.open(f).convert('RGBA'))
    h, w = a.shape[:2]
    if sku in CUT_BELOW:
        a[int(h * CUT_BELOW[sku]):, :, 3] = 0
    if sku == 'PLT-RNG-029':
        yy, xx = np.mgrid[0:h, 0:w]
        xf, yf = xx / w, yy / h
        line = 0.67 + (xf - 0.22) * (0.20 / 0.18)
        a[..., 3] = np.where((xf < 0.40) & (yf > np.maximum(0.715, line + 0.012)), 0, a[..., 3])
    crop(a).save(f'assets/prepared/{sku}-01.png')
    print(sku, end=' ')
print()
